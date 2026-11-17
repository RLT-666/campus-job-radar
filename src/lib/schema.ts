import { z } from 'zod';
export const loginSchema = z.object({
  studentId: z.string().min(1, '学号不能为空'),
  password: z.string().min(6, '密码至少6位'),
});
//  简历投递状态枚举
export const applicationStatusEnum = z.enum([
  'todo',
  'applied',
  'interview',
  'offer',
  'rejected'
]);

//  新建投递记录的校验规则
export const createApplicationSchema = z.object({
  company: z.string().min(1, '公司名称不能为空'),
  position: z.string().min(1, '岗位名称不能为空'),
  channel: z.string().min(1, '投递渠道不能为空'),
  status: applicationStatusEnum.default('todo'),
  note: z.string().max(500, '备注最多500字').optional(),
});

//  更新投递记录的校验规则（status / sort_order 至少更新一个）
export const updateApplicationSchema = z
  .object({
    status: applicationStatusEnum.optional(),
    sort_order: z.number().int('排序值必须是整数').optional(),
  })
  .refine((data) => data.status !== undefined || data.sort_order !== undefined, {
    message: '至少要提供一个要更新的字段',
  });