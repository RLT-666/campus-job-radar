import { z } from 'zod';
export const loginSchema = z.object({
  studentId: z.string().min(1, '学号不能为空'),
  password: z.string().min(6, '密码至少6位'),
});
//  简历投递状态枚举
export const applicationStatusEnum = z.enum([
  'wishlist',   
  'applied',    
  'written',    
  'interview',  
  'offer',      
  'rejected'   
]);

//  新建投递记录的校验规则
export const createApplicationSchema = z.object({
  companyName: z.string().min(1, '公司名称不能为空'),
  jobTitle: z.string().min(1, '岗位名称不能为空'),
  status: applicationStatusEnum.default('applied'), // 默认状态为已投递
  note: z.string().max(500, '备注最多500字').optional(),
});