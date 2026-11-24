// ============================================================
// 看板视觉映射：状态/列 → 强调色（「深空雷达」暗色版视觉层单一数据源）
// ============================================================
// 仅视觉层（列头光带、卡片左缘色条、Offer 辉光）引用本文件；
// 状态语义与流转规则一律以 status.ts 为准，本文件不做任何业务判断。
// 色板约定：中性灰蓝 → 电光蓝 → 浅蓝 → 品牌青 → 翡翠(Offer) → 珊瑚红(未通过)。
// ============================================================

/** 列（按列 key）→ 强调色：列头下划线光带与空列占位共用 */
export const COLUMN_ACCENTS: Record<string, string> = {
  wishlist: '#8a93a8',
  applied: '#3d6bff',
  written: '#75a6ff',
  interview: '#75e6ed',
  offer: '#34d399',
  rejected: '#ff6b6b',
}

/** 投递状态（9 态）→ 卡片左缘光带颜色：与所属列保持同色系 */
export const STATUS_ACCENTS: Record<string, string> = {
  wishlist: '#8a93a8',
  applied: '#3d6bff',
  written: '#75a6ff',
  interview_1: '#75e6ed',
  interview_2: '#75e6ed',
  interview_3: '#75e6ed',
  hr: '#75e6ed',
  offer: '#34d399',
  rejected: '#ff6b6b',
}
