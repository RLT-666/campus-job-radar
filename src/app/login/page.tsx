'use client'

import { Suspense, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  Lock,
  Mail,
  Radar,
  ShieldCheck,
} from 'lucide-react'


import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  sendEmailCode,
  signInWithPassword,
  signUpWithPassword,
  verifyEmailCode,
} from '@/lib/auth/client'
import { cn } from '@/lib/utils'

/* ============================================================
   设计系统「截止时刻表 · Editorial」
   纸面 #faf9f6 / 墨色 #1a1a17 / 克莱因蓝 #002fa7 / 琥珀（仅临近截止）
   字体：Noto Serif SC（标题，--font-serif-sc）+ Geist（UI）
   规则：单一强调色、细分隔线、动效仅一次入场 + 倒计时跳动
   ============================================================ */

const pageCss = `
/* 浏览器原生面跟随纸面世界 */
.lp-page { color-scheme: light; }
.lp-page ::selection { background: rgba(0, 47, 167, 0.14); }

/* 入场：整页唯一的一组 reveal，指数缓出 */
@keyframes lp-reveal {
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: none; }
}
.lp-reveal  { animation: lp-reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
.lp-reveal-2 { animation-delay: 0.08s; }
.lp-reveal-3 { animation-delay: 0.18s; }
.lp-reveal-4 { animation-delay: 0.28s; }

/* 时刻表行：错峰浮现 */
@keyframes lp-row {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: none; }
}
.lp-row { animation: lp-row 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }

/* 表单面板切换 */
@keyframes lp-panel {
  from { opacity: 0; transform: translateX(10px); }
  to   { opacity: 1; transform: none; }
}
.lp-panel { animation: lp-panel 0.32s cubic-bezier(0.16, 1, 0.3, 1) both; }

/* 图标加载指示 */
@keyframes lp-spin { to { transform: rotate(360deg); } }
.lp-spin { animation: lp-spin 0.9s linear infinite; }

/* 动效敏感用户：全部静止 */
@media (prefers-reduced-motion: reduce) {
  .lp-reveal, .lp-reveal-2, .lp-reveal-3, .lp-reveal-4, .lp-row, .lp-panel, .lp-spin {
    animation: none !important;
  }
}
`

/* 示意时刻表数据：琥珀色行 = 临近截止（唯一暖色信号） */
const timetable = [
  { company: '腾讯 · 前端实习', batch: '2027 届暑期', days: 12 },
  { company: '美团 · 后端开发工程师', batch: '2027 届秋招', days: 21 },
  { company: '字节跳动 · 产品培训生', batch: '2026 届补录', days: 34 },
  { company: '网易 · 游戏策划', batch: '2027 届校招正式批', days: 46 },
]

/* 临近截止行：登录页唯一“活着”的细节 */
const lateInitialSeconds = 3 * 86400 + 2 * 3600 + 41 * 60 + 9

type Status = 'idle' | 'sending' | 'sent' | 'error'
type AuthMode = 'login' | 'register'
type LoginMethod = 'password' | 'code'

export default function LoginPage() {
  return (
    <main
      className={cn(
        'lp-page relative min-h-dvh bg-[#faf9f6] px-5 py-8 text-[#1a1a17] sm:px-10 lg:py-0',
      )}
    >
      <style>{pageCss}</style>

      {/* 背景层：编辑排版的竖向栏线，纯环境层 */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
        <div className="mx-auto grid h-full max-w-6xl grid-cols-4 px-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-l border-[#ece8de] first:border-l-0" />
          ))}
        </div>
      </div>

      <div className="relative mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-10 px-2 py-6 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-10">
        {/* 左列：品牌叙事 + 截止时刻表 */}
        <section>
          <div className="lp-reveal flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#002fa7] text-white">
              <Radar size={20} strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="text-[16px] font-semibold tracking-[0.02em]">校招雷达</span>
            <span className="ml-auto hidden text-[11px] font-medium tracking-[0.22em] text-[#7d786d] sm:block">
              CAMPUS JOB RADAR
            </span>
          </div>

          <h1
            className="lp-reveal lp-reveal-2 mt-14 text-[clamp(38px,4.6vw,60px)] font-black leading-[1.18] tracking-[-0.01em]"
            style={{ fontFamily: 'var(--font-serif-sc), serif' }}
          >
            别再错过
            <br />
            任何一个<span className="text-[#002fa7]">截止日期</span>。
          </h1>
          <p className="lp-reveal lp-reveal-3 mt-5 max-w-[32em] text-[15px] leading-[1.85] text-[#5f5b52]">
            把分散在各校就业网、公众号与企业官网的校招信息收进一张时间线；截止前 3 天，准时提醒你。
          </p>

          {/* 截止时刻表：产品事实即艺术 */}
          <div className="mt-12 hidden max-w-[560px] md:block">
            <div className="flex items-baseline justify-between border-b border-[#1a1a17] pb-2.5">
              <span className="text-[12.5px] font-semibold tracking-[0.08em]">近期截止</span>
              <span className="text-[11.5px] text-[#7d786d]">登录后同步你的收藏</span>
            </div>
            <Timetable />
          </div>
        </section>

        {/* 右列：登录任务面板 */}
        <section className="lp-reveal lp-reveal-4 w-full">
          <div className="rounded-2xl border border-[#e7e3d9] bg-white p-7 shadow-[0_1px_2px_rgba(26,26,23,0.04),0_20px_48px_-28px_rgba(26,26,23,0.18)] sm:p-9">
            <Suspense
              fallback={
                <div className="flex h-80 items-center justify-center">
                  <Loader2 size={20} className={cn('lp-spin text-[#7d786d]')} aria-hidden="true" />
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>

          <p className="mt-4 flex items-center gap-1.5 pl-1 text-xs text-[#7d786d]">
            <ShieldCheck size={14} className="shrink-0 text-[#002fa7]" aria-hidden="true" />
            仅用于登录与截止提醒，不向第三方共享信息
          </p>
        </section>
      </div>
    </main>
  )
}

/* 时刻表：引导点线 + 倒计时，行悬浮回应指针 */
function Timetable() {
  const [lateSeconds, setLateSeconds] = useState(lateInitialSeconds)

  useEffect(() => {
    const timer = setInterval(() => setLateSeconds((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(timer)
  }, [])

  const clock = useMemo(() => {
    const h = Math.floor(lateSeconds / 3600)
    const m = Math.floor((lateSeconds % 3600) / 60)
    const s = lateSeconds % 60
    return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
  }, [lateSeconds])

  return (
    <ul role="table" aria-label="近期校招截止倒计时（示意数据）">
      <li
        className="lp-row flex items-center gap-3 border-b border-[#ece8de] py-3.5 transition-colors duration-200 hover:bg-[#f3f1ea]"
        style={{ animationDelay: '0.36s' }}
      >
        <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-[#b45309]" />
        <div className="min-w-0">
          <p className="truncate text-[14.5px] font-semibold leading-tight">腾讯 · 前端实习</p>
          <p className="mt-0.5 text-[11.5px] text-[#7d786d]">2027 届暑期</p>
        </div>
        <span aria-hidden="true" className="mx-1 flex-1 -translate-y-1 border-b border-dotted border-[#d8d3c6]" />
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#f2d9b6] bg-[#fdf6ec] px-2.5 py-1 text-[12.5px] font-semibold tabular-nums text-[#b45309]">
          <Clock3 size={13} aria-hidden="true" />
          还剩 {clock}
        </span>
      </li>

      {timetable.map((row, i) => (
        <li
          key={row.company}
          className="lp-row flex items-center gap-3 border-b border-[#ece8de] py-3.5 transition-colors duration-200 last:border-b-0 hover:bg-[#f3f1ea]"
          style={{ animationDelay: `${0.44 + i * 0.06}s` }}
        >
          <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-[#002fa7]/70" />
          <div className="min-w-0">
            <p className="truncate text-[14.5px] font-semibold leading-tight">{row.company}</p>
            <p className="mt-0.5 text-[11.5px] text-[#7d786d]">{row.batch}</p>
          </div>
          <span aria-hidden="true" className="mx-1 flex-1 -translate-y-1 border-b border-dotted border-[#d8d3c6]" />
          <span className="shrink-0 text-[12.5px] font-medium tabular-nums text-[#7d786d]">
            D-{row.days}
          </span>
        </li>
      ))}
    </ul>
  )
}

/* 两种登录方式：邮箱密码、邮箱验证码（均为 Supabase Auth 原生能力） */
const loginMethods: {
  id: LoginMethod
  label: string
  accountLabel: string
  accountIcon: typeof Mail
  accountPlaceholder: string
}[] = [
  {
    id: 'password',
    label: '密码登录',
    accountLabel: '邮箱',
    accountIcon: Mail,
    accountPlaceholder: 'you@example.com',
  },
  {
    id: 'code',
    label: '邮箱验证码',
    accountLabel: '邮箱',
    accountIcon: Mail,
    accountPlaceholder: 'you@example.com',
  },
]

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password')
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [codeCountdown, setCodeCountdown] = useState(0)

  // 只允许站内绝对路径，避免 //evil.com 这类开放重定向
  const nextPath = useMemo(() => {
    const raw = searchParams.get('next') ?? ''
    return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/board'
  }, [searchParams])

  const sending = status === 'sending'

  useEffect(() => {
    if (codeCountdown > 0) {
      const timer = setTimeout(() => setCodeCountdown((c) => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [codeCountdown])

  function clearMessage() {
    if (status === 'error') {
      setStatus('idle')
      setMessage('')
    }
  }

  function validate(): string | null {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.trim())) {
      return '邮箱格式不对：请填写完整的邮箱地址，例如 you@example.com。'
    }
    if (loginMethod === 'code') {
      if (code.length !== 6) {
        return '验证码应为 6 位数字，请核对邮件后再提交。'
      }
      return null
    }
    if (!password) {
      return '请输入密码后再提交。'
    }
    if (authMode === 'register' && password.length < 6) {
      return '密码至少需要 6 位，请调整后再提交。'
    }
    return null
  }

  const handleSendCode = async () => {
    const email = account.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error')
      setMessage('邮箱格式不对：请填写完整的邮箱地址后再获取验证码。')
      return
    }
    setStatus('sending')
    setMessage('')
    try {
      await sendEmailCode(email, authMode === 'register')
      setCodeCountdown(60)
      setStatus('idle')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : '验证码发送失败，请稍后重试。')
    }
  }

  async function handleSubmit() {
    const problem = validate()
    if (problem) {
      setStatus('error')
      setMessage(problem)
      return
    }

    setStatus('sending')
    setMessage('')

    try {
      if (loginMethod === 'code') {
        await verifyEmailCode(account.trim(), code)
      } else if (authMode === 'register') {
        const { needsEmailConfirm } = await signUpWithPassword(account.trim(), password)
        if (needsEmailConfirm) {
          setStatus('sent')
          setMessage('注册成功：请到邮箱点击确认链接，或改用“邮箱验证码”直接登录。')
          return
        }
      } else {
        await signInWithPassword(account.trim(), password)
      }

      // 会话已写入 Cookie，回跳原目标路径；refresh 让服务端重新判定守卫
      router.replace(nextPath)
      router.refresh()
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : '提交失败：网络未连通或服务暂不可用，请稍后重试。')
    }
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending) return
    void handleSubmit()
  }

  if (status === 'sent') {
    return (
      <div className="lp-panel py-2" role="status" aria-live="polite">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#002fa7]/10 text-[#002fa7]">
          <CheckCircle2 size={22} aria-hidden="true" />
        </span>
        <h2
          className="mt-4 text-[22px] font-bold"
          style={{ fontFamily: 'var(--font-serif-sc), serif' }}
        >
          查收邮件。
        </h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#5f5b52]">{message}</p>
        <Button
          type="button"
          onClick={() => {
            setAuthMode('login')
            setLoginMethod('code')
            setStatus('idle')
            setMessage('')
            setPassword('')
            setCode('')
          }}
          className="mt-6 h-11 w-full cursor-pointer gap-2 rounded-xl bg-[#002fa7] text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-[#00267f]"
        >
          用邮箱验证码登录
          <ArrowRight size={16} aria-hidden="true" />
        </Button>
      </div>
    )
  }

  const method = loginMethods.find((m) => m.id === loginMethod)!
  const AccountIcon = method.accountIcon

  const fieldClass =
    'h-12 rounded-xl border-[#e0dcd2] bg-[#faf9f6] text-[15px] text-[#1a1a17] caret-[#002fa7] placeholder:text-[#7d786d] focus-visible:border-[#002fa7]/70 focus-visible:ring-[#002fa7]/15'

  return (
    <div className="lp-panel">
      <h2
        className="text-[26px] font-bold leading-tight"
        style={{ fontFamily: 'var(--font-serif-sc), serif' }}
      >
        {authMode === 'login' ? '欢迎回来。' : '创建你的雷达。'}
      </h2>
      <p className="mt-1.5 text-[13.5px] text-[#5f5b52]">
        {authMode === 'login' ? '登录后同步你的收藏与提醒。' : '注册后立即开始追踪所有截止时间。'}
      </p>

      <form onSubmit={handleFormSubmit} noValidate className="mt-7">
        {/* 登录方式：编辑风下划线标签页 */}
        <div className="flex gap-6 border-b border-[#ece8de]" role="group" aria-label="登录方式">
          {loginMethods.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={loginMethod === m.id}
              onClick={() => {
                setLoginMethod(m.id)
                clearMessage()
              }}
              className={cn(
                'relative -mb-px flex h-10 cursor-pointer items-center border-b-2 text-[13.5px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002fa7]/40',
                loginMethod === m.id
                  ? 'border-[#002fa7] text-[#002fa7]'
                  : 'border-transparent text-[#7d786d] hover:text-[#1a1a17]',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          {/* 账号字段 */}
          <div>
            <label htmlFor="account" className="mb-1.5 block text-[13px] font-medium text-[#5f5b52]">
              {method.accountLabel}
            </label>
            <div className="relative">
              <span
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a09a8c]"
                aria-hidden="true"
              >
                <AccountIcon size={16} />
              </span>
              <Input
                id="account"
                name="account"
                type="email"
                autoComplete="email"
                placeholder={method.accountPlaceholder}
                value={account}
                disabled={sending}
                aria-invalid={status === 'error'}
                aria-describedby={message ? 'login-message' : undefined}
                onChange={(event) => {
                  setAccount(event.target.value)
                  clearMessage()
                }}
                className={cn(fieldClass, 'pl-10')}
              />
            </div>
          </div>

          {/* 密码字段（密码 / 邮箱两种方式） */}
          {loginMethod !== 'code' && (
            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-[#5f5b52]">
                密码
              </label>
              <div className="relative">
                <span
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a09a8c]"
                  aria-hidden="true"
                >
                  <Lock size={16} />
                </span>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  placeholder={authMode === 'login' ? '请输入密码' : '至少 6 位'}
                  value={password}
                  disabled={sending}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    clearMessage()
                  }}
                  className={cn(fieldClass, 'pl-10')}
                />
              </div>
            </div>
          )}

          {/* 验证码字段（验证码方式） */}
          {loginMethod === 'code' && (
            <div>
              <label htmlFor="code" className="mb-1.5 block text-[13px] font-medium text-[#5f5b52]">
                验证码
              </label>
              <div className="relative">
                <span
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a09a8c]"
                  aria-hidden="true"
                >
                  <ShieldCheck size={16} />
                </span>
                <Input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6 位数字"
                  value={code}
                  disabled={sending}
                  maxLength={6}
                  onChange={(event) => {
                    setCode(event.target.value)
                    clearMessage()
                  }}
                  className={cn(fieldClass, 'pl-10 pr-28')}
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={codeCountdown > 0 || sending}
                  className="absolute right-1.5 top-1/2 flex h-10 -translate-y-1/2 cursor-pointer items-center rounded-lg bg-[#002fa7]/8 px-3 text-[13px] font-medium text-[#002fa7] transition-colors duration-200 hover:bg-[#002fa7]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002fa7]/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {codeCountdown > 0 ? `${codeCountdown}s 后重发` : '获取验证码'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 反馈信息：就近展示，点名问题与恢复方式 */}
        {message && (
          <p
            id="login-message"
            role="status"
            aria-live="polite"
            className="mt-4 flex items-start gap-1.5 text-[13px] leading-relaxed text-[#b42318]"
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            {message}
          </p>
        )}

        <Button
          type="submit"
          disabled={sending}
          className="mt-6 h-12 w-full cursor-pointer gap-2 rounded-xl bg-[#002fa7] text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#00267f]"
        >
          {sending ? (
            <>
              <Loader2 size={17} className="lp-spin" aria-hidden="true" />
              处理中…
            </>
          ) : (
            <>
              {authMode === 'login' ? '登录' : '创建账号'}
              <ArrowRight size={17} aria-hidden="true" />
            </>
          )}
        </Button>
      </form>

      {/* 登录 / 注册切换 */}
      <p className="mt-5 text-[13.5px] text-[#5f5b52]">
        {authMode === 'login' ? '还没有账号？' : '已有账号？'}
        <button
          type="button"
          onClick={() => {
            setAuthMode(authMode === 'login' ? 'register' : 'login')
            clearMessage()
          }}
          className="ml-1 cursor-pointer font-semibold text-[#002fa7] underline-offset-4 transition-colors duration-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002fa7]/40"
        >
          {authMode === 'login' ? '立即注册' : '直接登录'}
        </button>
      </p>

      <p className="mt-4 border-t border-[#ece8de] pt-4 text-[11.5px] leading-[1.7] text-[#7d786d]">
        继续即表示你同意《服务条款》与《隐私政策》。我们只把你的信息用于登录和截止提醒。
      </p>
    </div>
  )
}
