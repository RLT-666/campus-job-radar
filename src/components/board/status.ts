// ============================================================
// 投递状态机与看板列配置（看板模块的单一数据源）
// ============================================================
// 依据《分工执行计划》图 1 契约与《落地方案》：
//   状态流转：wishlist → applied → written → interview_1/2/3 → hr → offer / rejected
// 看板展示时把 4 个面试态归并到「面试中」一列，共 6 列。
//
// 契约状态说明（重要）：
//   A 在 src/lib/schema.ts 中的枚举暂为 5 态（todo/applied/interview/offer/rejected），
//   与文档契约的 9 态不一致。本文件按文档契约 9 态先行实现 UI，
//   该差异已列入「契约对齐清单」交 A 确认；A 的 shared schema 落地后，
//   本文件应从 A 的 zod schema 用 z.infer 推导类型与枚举值，替换手写定义。
//
// 使用约束：看板相关组件（列、卡片、表单、抽屉、拖拽）一律引用本文件，
// 不允许各自硬编码状态文案或列配置，避免口径分裂。
// ============================================================

// ---------- 9 态枚举（临时本地定义，最终以 A 的 shared schema 为准） ----------
export const APPLICATION_STATUSES = [
  'wishlist',    // 意向收藏，尚未投递
  'applied',     // 已投递
  'written',     // 笔试 / 测评
  'interview_1', // 一面
  'interview_2', // 二面
  'interview_3', // 三面
  'hr',          // HR 面
  'offer',       // 已发 Offer
  'rejected',    // 未通过
] as const

/** 投递状态枚举类型：从常量数组推导，避免手写联合类型 */
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

// ---------- 状态 → 中文标签 ----------
export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  wishlist: '意向',
  applied: '已投递',
  written: '笔试/测评',
  interview_1: '一面',
  interview_2: '二面',
  interview_3: '三面',
  hr: 'HR 面',
  offer: 'Offer',
  rejected: '未通过',
}

// ---------- 状态机：每个状态的合法下一状态 ----------
// 用途：拖拽落列时校验流转是否合法（非法落点给出提示，不静默放行）。
// 规则：正常链路只允许向后流转；offer / rejected 为终态，不可再转出；
//       rejected 允许「复活」回 wishlist（投递被拒后可重新评估，常见真实场景）。
export const NEXT_STATUSES: Record<ApplicationStatus, ApplicationStatus[]> = {
  wishlist: ['applied', 'rejected'],
  applied: ['written', 'interview_1', 'rejected', 'wishlist'],
  written: ['interview_1', 'interview_2', 'rejected', 'wishlist'],
  interview_1: ['interview_2', 'hr', 'offer', 'rejected', 'wishlist'],
  interview_2: ['interview_3', 'hr', 'offer', 'rejected', 'wishlist'],
  interview_3: ['hr', 'offer', 'rejected', 'wishlist'],
  hr: ['offer', 'rejected', 'wishlist'],
  offer: [],   // 终态
  rejected: ['wishlist'], // 终态，仅允许复活回意向
}

// ---------- 看板列配置（6 列，面试态归并） ----------
export interface BoardColumnConfig {
  /** 列唯一标识，列表渲染与拖拽落点使用 */
  key: string
  /** 列头展示文案 */
  title: string
  /** 该列收录的状态集合 */
  statuses: ApplicationStatus[]
}

export const BOARD_COLUMNS: BoardColumnConfig[] = [
  { key: 'wishlist', title: '意向', statuses: ['wishlist'] },
  { key: 'applied', title: '已投递', statuses: ['applied'] },
  { key: 'written', title: '笔试/测评', statuses: ['written'] },
  {
    key: 'interview',
    title: '面试中',
    statuses: ['interview_1', 'interview_2', 'interview_3', 'hr'],
  },
  { key: 'offer', title: 'Offer', statuses: ['offer'] },
  { key: 'rejected', title: '未通过', statuses: ['rejected'] },
]

/** 根据状态查所属列：卡片跨列移动、列分组统计等场景共用 */
export function getColumnByStatus(status: ApplicationStatus): BoardColumnConfig {
  const column = BOARD_COLUMNS.find((col) => col.statuses.includes(status))
  if (!column) {
    // 理论上不可达：状态枚举与列配置在编译期对齐，防御性兜底避免渲染崩溃
    throw new Error(`未知投递状态：${status}`)
  }
  return column
}

/**
 * 解析拖拽落点对应的目标状态：
 *   - 单状态列 → 该列状态；
 *   - 「面试中」列（多状态）→ 卡片已在面试环节时返回 null（同列移动=无变化），
 *     否则进入一面（interview_1，作为进入面试环节的默认入口）；
 *   - 返回 null 表示落点无效或无状态变化。
 */
export function resolveTargetStatus(
  current: ApplicationStatus,
  column: BoardColumnConfig,
): ApplicationStatus | null {
  if (column.statuses.length === 1) {
    return column.statuses[0]
  }
  // 多状态列（面试中）：已在列内则无变化，否则默认进一面
  return column.statuses.includes(current) ? null : 'interview_1'
}

/** 校验状态流转是否被状态机允许（拖拽落点合法性判断的单一入口） */
export function canTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
): boolean {
  return NEXT_STATUSES[from].includes(to)
}

// ---------- 截止时间解析 ----------
// 本地数据截止时间存在多种格式（date 控件 yyyy-mm-dd、mock 的 yyyy-mm-dd HH:mm、
// 后端 timestamptz 的 ISO 串），统一在此解析，返回 null 表示无效。
export function parseDeadline(deadline: string | undefined | null): Date | null {
  if (!deadline) return null
  // ISO 与「yyyy-mm-dd HH:mm」均可被 Date 解析（现代 V8），直接尝试
  const date = new Date(deadline)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * 截止剩余天数（向下取整）。
 * 返回值语义：null = 无截止时间；负数 = 已过期（如 -1 表示昨天截止）；
 * 0 = 今天截止；1~N = 剩余 N 天。调用方据此决定标签文案与颜色。
 */
export function daysUntilDeadline(deadline: string | undefined | null): number | null {
  const date = parseDeadline(deadline)
  if (!date) return null
  const diffMs = date.getTime() - Date.now()
  return Math.floor(diffMs / 86_400_000)
}
