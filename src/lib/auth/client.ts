// 认证调用的唯一入口：页面只依赖本模块，不直接触碰 Supabase。
// 口径依据 docx/auth-contract.md —— 邮箱密码 + 邮箱验证码（魔法链接），
// 会话由 @supabase/ssr 写入 Cookie，proxy 路由守卫据此判定登录态。

import { createClient } from '@/lib/supabase/client'

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

let client: ReturnType<typeof createClient> | null = null
function getClient() {
  client ??= createClient()
  return client
}

function mapAuthError(error: { code?: string; message: string }): string {
  switch (error.code) {
    case 'invalid_credentials':
      return '邮箱或密码不正确，请检查后重试。'
    case 'email_not_confirmed':
      return '邮箱尚未验证：请到邮箱点击确认链接，或改用“邮箱验证码”登录。'
    case 'user_already_exists':
    case 'email_exists':
      return '该邮箱已注册，请直接登录或改用邮箱验证码。'
    case 'weak_password':
      return '密码强度不足，请至少输入 6 位密码。'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return '发送过于频繁，请稍等片刻后再试。'
    case 'otp_expired':
      return '验证码已过期，请重新获取。'
    case 'invalid_otp':
      return '验证码不正确，请核对邮件中的 6 位数字。'
    default:
      return error.message || '认证服务暂不可用，请稍后重试。'
  }
}

/** 邮箱 + 密码登录 */
export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await getClient().auth.signInWithPassword({ email, password })
  if (error) throw new AuthError(mapAuthError(error))
}

/**
 * 邮箱 + 密码注册。
 * needsEmailConfirm 为 true 时表示邮箱确认未关闭，会话尚未建立，需先确认邮件。
 */
export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<{ needsEmailConfirm: boolean }> {
  const { data, error } = await getClient().auth.signUp({ email, password })
  if (error) throw new AuthError(mapAuthError(error))
  return { needsEmailConfirm: !data.session }
}

/** 发送邮箱验证码（createUser 为 true 时允许顺带注册） */
export async function sendEmailCode(email: string, createUser = false): Promise<void> {
  const { error } = await getClient().auth.signInWithOtp({
    email,
    options: { shouldCreateUser: createUser },
  })
  if (error) throw new AuthError(mapAuthError(error))
}

/** 校验邮箱验证码，成功后会话写入 Cookie */
export async function verifyEmailCode(email: string, token: string): Promise<void> {
  const { error } = await getClient().auth.verifyOtp({ email, token, type: 'email' })
  if (error) throw new AuthError(mapAuthError(error))
}
