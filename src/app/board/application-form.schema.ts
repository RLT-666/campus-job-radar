// 建卡表单的 zod 校验规则（本地临时口径）。
// 字段与本地 mock Application 对齐；待 A 的投递契约 PR 合并后，
// 类型改为从契约 schema 用 z.infer 推导，表单 UI 不随之改动。
import { z } from 'zod'

import { APPLICATION_STATUSES } from '@/components/board/status'

// 投递渠道枚举：与 mock 中 channel 的中文取值保持一致
export const channelEnum = z.enum(['官网', '内推', '宣讲会', '其他'])

// 投递状态枚举：直接从看板状态机单一数据源构建，避免与 status.ts 手写重复
export const statusEnum = z.enum(APPLICATION_STATUSES)

// 建卡表单 schema：必填项校验非空与长度，可选项允许空字符串/缺省
export const applicationFormSchema = z.object({
  // 公司名称：必填，限 50 字
  company: z.string().min(1, '请填写公司名称').max(50, '公司名称不超过 50 字'),
  // 岗位名称：必填，限 50 字
  position: z.string().min(1, '请填写岗位名称').max(50, '岗位名称不超过 50 字'),
  // 渠道：必选，枚举内取值
  channel: channelEnum,
  // 状态：默认从「意向」开始创建
  status: statusEnum.default('wishlist'),
  // 薪资范围：可选文本（如 200-300/天），限 50 字
  salaryRange: z.string().max(50, '薪资范围不超过 50 字').optional(),
  // 截止时间：可选日期字符串（date 控件返回 yyyy-mm-dd）
  deadline: z.string().optional(),
  // 备注：可选，限 500 字
  notes: z.string().max(500, '备注不超过 500 字').optional(),
})

// 表单提交值类型：供表单组件取用，避免重复手写接口
export type ApplicationFormValues = z.infer<typeof applicationFormSchema>
