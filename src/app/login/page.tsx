'use client'

import { Suspense, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CalendarCheck2,
  CheckCircle2,
  Database,
  Loader2,
} from 'lucide-react'

import { sendEmailCode } from '@/lib/auth/client'
import { cn } from '@/lib/utils'

// 动效仅客户端加载：three 不进入首屏关键路径，静态 CSS/SVG 始终保留作回退
const AnimatedBackdrop = dynamic(() => import('@/components/login/AnimatedBackdrop'), { ssr: false })
const Radar3D = dynamic(() => import('@/components/login/Radar3D'), { ssr: false })

/* ============================================================
   设计稿还原：浅蓝渐变 + 玻璃卡片
   底色 #f2f7ff / 主蓝 #3b6cf5 / 正文 #22314a / 辅助 #8b99ae
   构图：左侧品牌叙事（雷达插图 + 渐变标题 + 三项能力）
        右侧登录卡片（邮箱登录链接 + 三种登录方式）
   ============================================================ */

const pageCss = `
.lgc-page {
  color-scheme: light;
  font-family: "HarmonyOS Sans SC", "PingFang SC", "Microsoft YaHei", var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
}
.lgc-page ::selection { background: rgba(59, 108, 245, 0.16); }

.lgc-dots {
  background-image: radial-gradient(circle, rgba(136, 163, 205, 0.55) 1px, transparent 1.1px);
  background-size: 11px 11px;
  -webkit-mask-image: radial-gradient(ellipse at center, #000 26%, transparent 74%);
  mask-image: radial-gradient(ellipse at center, #000 26%, transparent 74%);
}
.lgc-dots-light {
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.9) 1px, transparent 1.1px);
  background-size: 10px 10px;
  -webkit-mask-image: radial-gradient(ellipse at center, #000 30%, transparent 72%);
  mask-image: radial-gradient(ellipse at center, #000 30%, transparent 72%);
}

@keyframes lgc-rise {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: none; }
}
.lgc-rise { animation: lgc-rise 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
.lgc-rise-2 { animation-delay: 0.12s; }
.lgc-rise-3 { animation-delay: 0.2s; }

@keyframes lgc-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.lgc-float { animation: lgc-float 6s ease-in-out infinite; }

@keyframes lgc-spin { to { transform: rotate(360deg); } }
.lgc-spin { animation: lgc-spin 0.9s linear infinite; }

.lgc-script {
  font-family: "Segoe Script", "Bradley Hand", "Brush Script MT", "Snell Roundhand", cursive;
}

@media (prefers-reduced-motion: reduce) {
  .lgc-rise, .lgc-rise-2, .lgc-rise-3, .lgc-float, .lgc-spin {
    animation: none !important;
  }
}
`

const FEATURES = [
  { icon: Database, title: '信息聚合', hint: '不再翻多个群' },
  { icon: Bell, title: '截止提醒', hint: '不漏不忘' },
  { icon: CalendarCheck2, title: '进度看板', hint: '一眼看清' },
] as const

export default function LoginPage() {
  return (
    <main className="lgc-page relative isolate min-h-dvh overflow-hidden bg-[#f3f7ff] text-[#22314a]">
      <style>{pageCss}</style>
      <Backdrop />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1400px] flex-col px-6 py-7 sm:px-9 lg:px-10 lg:py-9">
        <p className="flex items-center gap-3 text-[11.5px] tracking-[0.18em] text-[#7d8ba0] sm:text-[12px] xl:text-[13px]">
          让求职更有方向
          <span aria-hidden="true" className="h-px w-12 bg-[#c3d1e6]" />
        </p>

        <div className="grid flex-1 items-center gap-10 pb-4 pt-6 md:grid-cols-[1fr_1fr] md:gap-6 md:py-0">
          {/* 左：品牌叙事 */}
          <section className="lgc-rise relative flex flex-col items-center text-center md:h-full md:justify-center">
            <Radar3D />

            <h1 className="sr-only">校招雷达</h1>
            <div aria-hidden="true" className="-mt-1 w-full max-w-[360px] sm:max-w-[380px] xl:max-w-[560px]">
              <TitleArt />
            </div>

            <p className="mt-3 flex items-center justify-center gap-3 text-[12px] text-[#7d8ba0] sm:text-[13px] xl:mt-6 xl:text-[14px]">
              <span aria-hidden="true" className="h-px w-6 bg-[#c6d4e9] sm:w-8" />
              盯紧每一个截止时间，管好每一次投递
              <span aria-hidden="true" className="h-px w-6 bg-[#c6d4e9] sm:w-8" />
            </p>

            <ul className="mt-5 grid w-full max-w-[430px] grid-cols-3 gap-2 sm:mt-7 sm:gap-4 xl:mt-12 xl:max-w-[560px] xl:gap-6">
              {FEATURES.map(({ icon: Icon, title, hint }) => (
                <li key={title} className="flex flex-col items-center">
                  <span className="flex size-11 items-center justify-center rounded-full border border-[#e2ebf8] bg-white/75 text-[#6c8cbe] shadow-[0_8px_20px_-14px_rgba(80,115,185,0.55)] backdrop-blur-sm xl:size-16">
                    <Icon size={18} strokeWidth={1.6} aria-hidden="true" className="xl:size-6" />
                  </span>
                  <span className="mt-2.5 text-[12px] font-semibold text-[#56677f] xl:mt-3 xl:text-[14px]">{title}</span>
                  <span className="mt-1 text-[10.5px] text-[#9aa8ba] xl:mt-1.5 xl:text-[12px]">{hint}</span>
                </li>
              ))}
            </ul>

            <p
              aria-hidden="true"
              className="lgc-script mt-10 -rotate-6 self-start pl-2 text-[19px] leading-[1.35] text-[#7f92af] sm:mt-12 sm:text-[20px] md:mt-8 xl:mt-16 xl:pl-4 xl:text-[27px]"
            >
              Good Opportunities
              <br />
              <span className="pl-10">Ahead</span>
            </p>
          </section>

          {/* 右：登录卡片 */}
          <section className="lgc-rise lgc-rise-2 relative w-full max-w-[440px] justify-self-center md:justify-self-end xl:max-w-[560px]">
            <div
              aria-hidden="true"
              className="absolute inset-x-[-11px] bottom-0 top-[52%] rounded-[26px] border border-white/70 bg-white/70 shadow-[0_26px_60px_-34px_rgba(55,92,170,0.5)] backdrop-blur-sm"
            />
            <div className="relative overflow-hidden rounded-[22px] border border-white/90 bg-[#fdfeff] shadow-[0_34px_80px_-40px_rgba(46,84,168,0.55),0_2px_10px_rgba(70,110,190,0.06)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_42px_90px_-38px_rgba(46,84,168,0.62),0_2px_10px_rgba(70,110,190,0.08)] xl:rounded-[26px]">
              <div className="px-6 pb-6 pt-8 sm:px-9 sm:pb-7 sm:pt-10 xl:px-12 xl:pb-10 xl:pt-14">
                <Suspense
                  fallback={
                    <div className="flex h-[268px] items-center justify-center">
                      <Loader2 size={20} className="lgc-spin text-[#9aa8ba]" aria-hidden="true" />
                    </div>
                  }
                >
                  <LoginPanel />
                </Suspense>
              </div>

              <div className="px-6 pb-6 sm:px-9 xl:px-12 xl:pb-10">
                <div className="flex items-center gap-3 text-[10.5px] tracking-[0.04em] text-[#9ca9ba] xl:text-[12px]">
                  <span aria-hidden="true" className="h-px flex-1 bg-[#e9eff9]" />
                  或使用以下方式
                  <span aria-hidden="true" className="h-px flex-1 bg-[#e9eff9]" />
                </div>
                <SocialLogin />

                <p className="mt-5 text-center text-[10.5px] leading-relaxed text-[#a9b4c3] xl:mt-7 xl:text-[12px]">
                  登录即代表同意
                  <span className="cursor-default text-[#7088b2]">使用条款</span>与
                  <span className="cursor-default text-[#7088b2]">隐私政策</span>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

/* 背景：按原稿还原 —— 左下紫/青绿、右下蓝、边缘浓中间淡，叠白色丝带与点阵 */
function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#eef4fd]" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            // 左下青绿（最贴左下角、最亮）
            'radial-gradient(46% 56% at 0% 100%, rgba(110,232,200,0.95), rgba(110,232,200,0) 65%)',
            // 左下紫色团（青绿之上、略偏右上，让底部露出青绿）
            'radial-gradient(52% 62% at 10% 86%, rgba(170,125,245,0.9), rgba(170,125,245,0) 66%)',
            // 右下蓝色团（向上延伸，覆盖卡片右下）
            'radial-gradient(60% 92% at 100% 92%, rgba(100,140,245,0.95), rgba(100,140,245,0) 68%)',
            // 底部中央淡青
            'radial-gradient(42% 46% at 45% 100%, rgba(150,225,235,0.5), rgba(150,225,235,0) 70%)',
            // 右上淡蓝
            'radial-gradient(44% 54% at 100% 0%, rgba(168,203,252,0.65), rgba(168,203,252,0) 70%)',
            // 左上淡蓝
            'radial-gradient(46% 56% at 0% 0%, rgba(158,194,250,0.6), rgba(158,194,250,0) 70%)',
            // 中部淡紫
            'radial-gradient(40% 50% at 38% 45%, rgba(205,195,250,0.28), rgba(205,195,250,0) 70%)',
            // 中央留白，突出标题与卡片
            'radial-gradient(55% 65% at 45% 38%, rgba(255,255,255,0.6), rgba(255,255,255,0) 72%)',
          ].join(','),
        }}
      />

      {/* 白色丝带 */}
      <svg
        className="absolute inset-0 h-full w-full opacity-90"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <path
          d="M-80 730C260 640 470 830 830 740c330-82 520 10 720-40"
          fill="none"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="2.5"
        />
        <path
          d="M-60 790C280 700 500 890 860 800c320-80 500 0 700-46"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="1.6"
        />
        <path
          d="M-100 400C240 330 420 500 760 420c300-70 500 30 780-30"
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="1.4"
        />
        <circle cx="1180" cy="170" r="230" fill="rgba(255,255,255,0.18)" />
      </svg>

      {/* 点阵 */}
      <div className="lgc-dots absolute right-6 top-14 size-20 opacity-70 sm:right-10" />
      <div className="lgc-dots absolute right-4 top-[62%] size-16 opacity-60" />
      <div className="lgc-dots absolute bottom-16 left-[16%] size-20 opacity-45" />
      <div className="lgc-dots absolute left-6 top-16 size-14 opacity-35" />
      {/* 左下白色点阵（压在紫色团上） */}
      <div className="lgc-dots-light absolute bottom-8 left-[10%] size-24 opacity-80" />

      <AnimatedBackdrop />
    </div>
  )
}

/* 邮箱图标：按提供的图标绘制（方形信封 + 翻盖交叉线） */
function EnvelopeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3.5 5.5 20.5 18.5M20.5 5.5 3.5 18.5" />
    </svg>
  )
}

/* 渐变标题：白描边 + 淡蓝投影，贴近设计稿的立体字 */
function TitleArt() {
  return (
    <svg viewBox="0 0 420 118" className="w-full">
      <defs>
        <linearGradient id="title-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5d8bff" />
          <stop offset="52%" stopColor="#3462f0" />
          <stop offset="100%" stopColor="#2b4fd4" />
        </linearGradient>
        <filter id="title-shadow" x="-25%" y="-30%" width="150%" height="190%">
          <feDropShadow dx="0" dy="12" stdDeviation="9" floodColor="#5b86f0" floodOpacity="0.3" />
        </filter>
      </defs>
      <g
        textAnchor="middle"
        fontFamily='"HarmonyOS Sans SC","PingFang SC","Microsoft YaHei",sans-serif'
        fontWeight="800"
        fontSize="76"
        letterSpacing="4"
        transform="skewX(-7)"
      >
        <text x="216" y="88" fill="#d3e2fb">
          校招雷达
        </text>
        <text
          x="212"
          y="82"
          fill="url(#title-grad)"
          stroke="#ffffff"
          strokeWidth="2.4"
          paintOrder="stroke"
          filter="url(#title-shadow)"
        >
          校招雷达
        </text>
      </g>
    </svg>
  )
}

type Status = 'idle' | 'sending' | 'sent' | 'error'

function LoginPanel() {
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  // 登录链接回调失败时，回跳到本页并直接提示重新发送
  const linkError = searchParams.get('error') === 'link'
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>(linkError ? 'error' : 'idle')
  const [message, setMessage] = useState(linkError ? '登录链接已失效，请重新填写邮箱发送。' : '')
  const [countdown, setCountdown] = useState(0)

  // 只允许站内绝对路径，避免 //evil.com 这类开放重定向
  const nextPath = useMemo(() => {
    const raw = searchParams.get('next') ?? ''
    return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/board'
  }, [searchParams])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const sending = status === 'sending'

  async function send(emailValue: string) {
    setStatus('sending')
    setMessage('')
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
      await sendEmailCode(emailValue, true, redirectTo)
      setStatus('sent')
      setCountdown(60)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : '发送失败，请稍后重试。')
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending) return

    const value = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setStatus('error')
      setMessage('邮箱格式不对：请填写完整的邮箱地址，例如 name@example.com。')
      return
    }
    void send(value)
  }

  function handleResend() {
    if (countdown > 0 || sending) return
    const value = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setStatus('idle')
      return
    }
    void send(value)
  }

  function reset() {
    setStatus('idle')
    setMessage('')
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  if (status === 'sent') {
    return (
      <div className="flex min-h-[252px] flex-col items-center justify-center text-center" role="status" aria-live="polite">
        <span className="flex size-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6f9bff,#3b6cf5)] text-white shadow-[0_14px_30px_-12px_rgba(59,108,245,0.65)]">
          <CheckCircle2 size={26} strokeWidth={2} aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-[22px] font-bold tracking-[0.02em] text-[#25334a]">邮件已发送</h2>
        <p className="mt-2 max-w-[18em] text-[12.5px] leading-6 text-[#8b99ae]">
          登录链接已发送至
          <span className="mx-1 font-medium text-[#4a6387]">{email.trim()}</span>
          ，请在 10 分钟内点击邮件中的链接完成登录。
        </p>
        <button
          type="button"
          onClick={handleResend}
          disabled={countdown > 0 || sending}
          className="mt-5 cursor-pointer text-[12px] font-medium text-[#3b6cf5] underline-offset-4 transition-colors hover:underline disabled:cursor-not-allowed disabled:text-[#a9b4c3] disabled:no-underline"
        >
          {countdown > 0 ? `${countdown}s 后可重新发送` : '没收到？重新发送'}
        </button>
        <button
          type="button"
          onClick={reset}
          className="mt-2 cursor-pointer text-[11.5px] text-[#9ca9ba] underline-offset-4 transition-colors hover:text-[#6d84a8] hover:underline"
        >
          更换邮箱
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-center text-[23px] font-bold tracking-[0.03em] text-[#25334a] sm:text-[24px] xl:text-[32px]">
        欢迎登录
      </h2>
      <p className="mt-2 text-center text-[12.5px] text-[#96a3b6] xl:mt-3 xl:text-[14px]">
        使用邮箱发送登录链接
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 xl:mt-9">
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a6b3c5]"
          >
            <EnvelopeIcon className="size-4 xl:size-[18px]" />
          </span>
          <input
            ref={inputRef}
            id="account"
            name="account"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="name@example.com"
            value={email}
            disabled={sending}
            aria-invalid={status === 'error'}
            aria-describedby={message ? 'login-message' : undefined}
            onChange={(event) => {
              setEmail(event.target.value)
              if (status === 'error') {
                setStatus('idle')
                setMessage('')
              }
            }}
            className="h-[46px] w-full rounded-xl border border-[#e3eaf5] bg-[#fbfcff] pl-11 pr-4 text-[13.5px] text-[#22314a] outline-none transition-all duration-200 placeholder:text-[#a6b3c5] hover:border-[#cdd9ec] focus:border-[#7aa2f7] focus:bg-white focus:ring-4 focus:ring-[#3b6cf5]/10 disabled:opacity-60 xl:h-[58px] xl:rounded-[14px] xl:pl-[52px] xl:pr-5 xl:text-[15px]"
          />
        </div>

        {message && (
          <p
            id="login-message"
            role="alert"
            className="mt-3 flex items-start gap-1.5 text-[11.5px] leading-5 text-[#d2493f]"
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={sending}
          className="mt-4 flex h-[46px] w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[linear-gradient(100deg,#4f82fb_0%,#3b6cf5_52%,#2f57ea_100%)] text-[14px] font-semibold tracking-[0.02em] text-white shadow-[0_14px_28px_-12px_rgba(59,108,245,0.75)] transition-all duration-200 hover:brightness-[1.04] hover:shadow-[0_16px_32px_-12px_rgba(59,108,245,0.85)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70 xl:mt-6 xl:h-[58px] xl:text-[15.5px]"
        >
          {sending ? (
            <>
              <Loader2 size={16} className="lgc-spin" aria-hidden="true" />
              发送中…
            </>
          ) : (
            <>
              发送登录链接
              <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}

const socials = [
  { id: 'school', label: '邮箱' },
  { id: 'wecom', label: '企业微信' },
  { id: 'wechat', label: '微信' },
] as const

type SocialId = (typeof socials)[number]['id']

function SocialLogin() {
  const [notice, setNotice] = useState('')

  function handleClick(id: SocialId) {
    if (id === 'school') {
      setNotice('请在上方填写邮箱，我们会把登录链接发到你的邮箱。')
      document.getElementById('account')?.focus()
      return
    }
    setNotice(id === 'wecom' ? '企业微信登录暂未开通，请先使用邮箱登录。' : '微信登录暂未开通，请先使用邮箱登录。')
  }

  return (
    <>
      <div className="mt-4 grid grid-cols-3 gap-2 xl:mt-6">
        {socials.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleClick(id)}
            className="group flex cursor-pointer flex-col items-center gap-2 focus-visible:outline-none"
          >
            <span className="flex size-12 items-center justify-center rounded-full border border-[#e6edf9] bg-white shadow-[0_8px_18px_-12px_rgba(75,112,180,0.55)] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-[#d3e0f5] group-hover:shadow-[0_12px_22px_-12px_rgba(75,112,180,0.6)] group-focus-visible:ring-2 group-focus-visible:ring-[#3b6cf5]/40 xl:size-[58px]">
              {id === 'school' && <EnvelopeIcon className="size-5 text-[#3c5d7d] xl:size-[23px]" />}
              {id === 'wecom' && <WeComMark />}
              {id === 'wechat' && <WeChatMark />}
            </span>
            <span className="text-[10.5px] text-[#6d7d93] xl:mt-0.5 xl:text-[12px]">{label}</span>
          </button>
        ))}
      </div>

      <p
        aria-live="polite"
        className={cn(
          'mt-3 text-center text-[10.5px] leading-4 text-[#97a4b7] transition-opacity duration-200',
          notice ? 'opacity-100' : 'pointer-events-none h-0 overflow-hidden opacity-0',
        )}
      >
        {notice}
      </p>
    </>
  )
}

/* 企业微信标识（示意绘制） */
function WeComMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[21px] xl:size-[24px]" aria-hidden="true">
      <path
        d="M12 3.2c4.9 0 8.8 3.1 8.8 7 0 2.2-1.3 4.2-3.4 5.5l.8 3-3-1.4c-1 .2-2.1.3-3.2.3-4.9 0-8.8-3.1-8.8-7s3.9-7.4 8.8-7.4Z"
        fill="#2f7cf6"
      />
      <path
        d="M13.6 13.2c3.4 0 6.1 2.1 6.1 4.7 0 1.5-.9 2.8-2.3 3.7l.5 2-2-1c-.7.1-1.5.2-2.3.2-3.4 0-6.1-2.1-6.1-4.7"
        fill="#4ac7b7"
      />
      <circle cx="9.2" cy="9.6" r="1.2" fill="#ffffff" />
      <circle cx="14.8" cy="9.6" r="1.2" fill="#ffffff" />
      <circle cx="11.8" cy="16.4" r="1" fill="#ffffff" />
      <circle cx="15.6" cy="16.4" r="1" fill="#ffffff" />
    </svg>
  )
}

/* 微信标识 */
function WeChatMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px] xl:size-[25px]" aria-hidden="true">
      <path
        d="M8.69 3.2C4.44 3.2 1 6.15 1 9.78c0 1.98 1.05 3.76 2.69 4.97.16.12.23.32.19.52l-.35 1.32c-.02.06-.04.13-.04.19 0 .15.12.26.26.26a.3.3 0 0 0 .15-.05l1.7-1a.78.78 0 0 1 .64-.08c.82.24 1.69.36 2.54.36.24 0 .49-.02.72-.05-.76-2.3.14-4.45 1.73-5.77 1.52-1.26 3.47-1.77 5.24-1.64-.52-3.2-3.76-5.68-7.7-5.68Zm-2.6 3.4c.58 0 1.04.47 1.04 1.05a1.05 1.05 0 0 1-1.04 1.06 1.05 1.05 0 0 1-1.04-1.06c0-.58.47-1.05 1.04-1.05Zm5.2 0c.58 0 1.04.47 1.04 1.05a1.05 1.05 0 0 1-1.04 1.06 1.05 1.05 0 0 1-1.04-1.06c0-.58.47-1.05 1.04-1.05Zm3.35 3.4c-3.04 0-5.51 2.06-5.51 4.6 0 2.53 2.47 4.59 5.51 4.59.65 0 1.29-.1 1.88-.29a.57.57 0 0 1 .48.07l1.26.74a.22.22 0 0 0 .11.03.2.2 0 0 0 .19-.2c0-.04-.02-.09-.03-.14l-.26-.98a.39.39 0 0 1 .14-.44c1.21-.89 1.98-2.21 1.98-3.75 0-2.54-2.47-4.6-5.51-4.6Zm-1.92 2.44c.42 0 .77.35.77.78 0 .43-.35.78-.77.78a.78.78 0 0 1-.77-.78c0-.43.34-.78.77-.78Zm3.84 0c.43 0 .77.35.77.78 0 .43-.34.78-.77.78a.78.78 0 0 1-.77-.78c0-.43.34-.78.77-.78Z"
        fill="#07c160"
      />
    </svg>
  )
}
