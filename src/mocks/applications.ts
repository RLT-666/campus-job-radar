// ========== 看板页临时 mock 数据 ==========
// 用途：A 的投递契约对齐前驱动看板渲染；契约落地后删除本文件，
//       改为调用 GET /api/applications（见 components/board/board-api.ts）。
//
// 状态枚举类型已收敛到 components/board/status.ts（看板模块单一数据源），
// 此处仅重导出以兼容既有 import；新代码请直接引用 status.ts。
import type { ApplicationStatus } from '@/components/board/status'

export type { ApplicationStatus }

// ========== 单条投递记录的前端类型 ==========
// 字段与《落地方案》图 2 的 applications 表对齐（含 salary_range/deadline/source_url）；
// 接口就绪后由 A 的后端契约类型替换。
export interface Application {
  id: string;                 // 投递记录唯一标识
  company: string;            // 公司名称
  position: string;            // 岗位名称
  channel: string;             // 投递渠道：官网 / 内推 / 宣讲会 / 其他
  salaryRange?: string;       // 薪资范围（可选）
  status: ApplicationStatus;  // 当前投递状态（9 态，见 status.ts）
  sourceUrl?: string;         // 岗位原文链接（合规要求保留）
  deadline?: string;          // 网申截止时间
  notes?: string;             // 个人备注
}

// ========== 看板页用的临时 mock 数据 ==========
export const mockApplications: Application[] = [
  {
    id: 'app-001',
    company: '示例科技有限公司',
    position: '前端开发实习生',
    channel: '官网',
    salaryRange: '200-250/天',
    status: 'applied',
    sourceUrl: 'https://example.com/jobs/001',
    deadline: '2026-11-20 18:00',
    notes: '简历已投，等待笔试通知',
  },
  {
    id: 'app-002',
    company: '示例网络股份',
    position: 'Java 开发实习生',
    channel: '内推',
    status: 'interview_1',
    sourceUrl: 'https://example.com/jobs/002',
    deadline: '2026-11-18 12:00',
    notes: '一面安排在周三下午',
  },
  {
    id: 'app-003',
    company: '示例数据集团',
    position: '测试开发实习生',
    channel: '宣讲会',
    status: 'wishlist',
    sourceUrl: 'https://example.com/jobs/003',
    deadline: '2026-11-25 18:00',
  },
]
