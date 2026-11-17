// ========== 投递记录状态枚举（前端临时定义） ==========
// 完整流转链路：意向 → 已投递 → 笔试/测评 → 一面/二面/三面 → HR 面 → Offer / 未通过
// 注意：最终枚举以 A 在 shared/schema 中维护的 zod schema 为准，届时替换本处定义
export type ApplicationStatus =
  | "wishlist"        // 意向收藏，尚未投递
  | "applied"         // 已投递
  | "written"         // 笔试 / 测评
  | "interview_1"     // 一面
  | "interview_2"     // 二面
  | "interview_3"     // 三面
  | "hr"              // HR 面
  | "offer"           // 已发 Offer
  | "rejected";       // 未通过

// ========== 单条投递记录的前端类型 ==========
// 字段与数据库 applications 表对齐；接口就绪后由后端契约类型替换
export interface Application {
  id: string;                 // 投递记录唯一标识
  company: string;            // 公司名称
  position: string;            // 岗位名称
  channel: string;             // 投递渠道：官网 / 内推 / 宣讲会 / 其他
  salaryRange?: string;       // 薪资范围（可选）
  status: ApplicationStatus;  // 当前投递状态
  sourceUrl?: string;         // 岗位原文链接（合规要求保留）
  deadline?: string;          // 网申截止时间
  notes?: string;             // 个人备注
}

// ========== 看板页用的临时 mock 数据 ==========
// 用途：接口未就绪前驱动看板渲染；后续删除本文件，改为调用 GET /api/applications
export const mockApplications: Application[] = [
  {
    id: "app-001",
    company: "示例科技有限公司",
    position: "前端开发实习生",
    channel: "官网",
    salaryRange: "200-250/天",
    status: "applied",
    sourceUrl: "https://example.com/jobs/001",
    deadline: "2026-11-20 18:00",
    notes: "简历已投，等待笔试通知",
  },
  {
    id: "app-002",
    company: "示例网络股份",
    position: "Java 开发实习生",
    channel: "内推",
    status: "interview_1",
    sourceUrl: "https://example.com/jobs/002",
    deadline: "2026-11-18 12:00",
    notes: "一面安排在周三下午",
  },
  {
    id: "app-003",
    company: "示例数据集团",
    position: "测试开发实习生",
    channel: "宣讲会",
    status: "wishlist",
    sourceUrl: "https://example.com/jobs/003",
    deadline: "2026-11-25 18:00",
  },
];
