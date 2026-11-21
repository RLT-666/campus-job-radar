'use client'

import { Suspense, useMemo, useState, type FormEvent, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  Lock,
  User,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type Status = 'idle' | 'sending' | 'sent' | 'error'
type AuthMode = 'login' | 'register'
type LoginMethod = 'phone-password' | 'email-password' | 'phone-code'


const styles = `
.radar-login {
  position: relative;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(24px, 5vw, 64px);
  overflow: hidden;
  background: #060913;
  color: #e8ecf7;
}
.radar-bg { position: absolute; inset: 0; pointer-events: none; }
.radar-grid {
  position: absolute; inset: -25%;
  background-image:
    linear-gradient(to right, rgba(148, 163, 184, 0.07) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148, 163, 184, 0.07) 1px, transparent 1px);
  background-size: 64px 64px;
  -webkit-mask-image: radial-gradient(ellipse at 50% 42%, #000 18%, transparent 72%);
  mask-image: radial-gradient(ellipse at 50% 42%, #000 18%, transparent 72%);
}
.radar-glow { position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.55; }
.radar-glow-a { top: -180px; left: -140px; width: 540px; height: 540px; background: radial-gradient(circle, #615fff, transparent 70%); }
.radar-glow-b { right: -120px; bottom: -160px; width: 460px; height: 460px; background: radial-gradient(circle, #4f4dd8, transparent 70%); }
.radar-sweep {
  position: absolute; top: -320px; right: -380px; width: 980px; height: 980px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, rgba(97, 95, 255, 0.22), transparent 30%);
  animation: radar-sweep 18s linear infinite;
}
@keyframes radar-sweep { to { transform: rotate(360deg); } }

.radar-shell {
  position: relative; z-index: 1;
  width: 100%; max-width: 1120px;
  display: grid; grid-template-columns: 1.05fr 0.95fr;
  gap: clamp(32px, 5vw, 80px);
  align-items: center;
}
.radar-wordmark { display: inline-flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 600; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.radar-wordmark:hover { transform: translateY(-2px); }
.radar-mark {
  display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border-radius: 11px;
  color: #a5a4ff;
  background: rgba(97, 95, 255, 0.16);
  border: 1px solid rgba(97, 95, 255, 0.35);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.radar-wordmark:hover .radar-mark {
  box-shadow: 0 0 20px rgba(97, 95, 255, 0.4);
  border-color: rgba(97, 95, 255, 0.6);
}
.radar-eyebrow {
  margin: 28px 0 14px;
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.22em;
  color: #615fff;
}
.radar-title {
  margin: 0;
  font-size: clamp(34px, 4.4vw, 54px);
  line-height: 1.1;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #f8fafc;
}
.radar-title em { font-style: normal; color: #a5a4ff; }
.radar-lede { margin: 20px 0 0; max-width: 30em; font-size: 15px; line-height: 1.75; color: #94a3b8; }
.radar-points { display: grid; gap: 12px; margin: 32px 0 0; padding: 0; list-style: none; }
.radar-points li { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #cbd5e1; transition: transform 0.2s ease; }
.radar-points li:hover { transform: translateX(4px); }
.radar-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #615fff;
  box-shadow: 0 0 0 4px rgba(97, 95, 255, 0.16);
  transition: all 0.3s ease;
}
.radar-points li:hover .radar-dot {
  box-shadow: 0 0 0 6px rgba(97, 95, 255, 0.25), 0 0 12px rgba(97, 95, 255, 0.4);
}

.radar-panel { display: flex; flex-direction: column; gap: 14px; }
.radar-card {
  position: relative;
  padding: clamp(24px, 3vw, 36px);
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 40px 90px -40px rgba(2, 6, 23, 0.95),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
  -webkit-backdrop-filter: blur(18px);
  backdrop-filter: blur(18px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.radar-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 50px 100px -40px rgba(2, 6, 23, 0.95),
    0 0 40px -10px rgba(97, 95, 255, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
  border-color: rgba(97, 95, 255, 0.25);
}

.radar-mode-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 20px;
}
.radar-mode-tab {
  flex: 1;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.radar-mode-tab:hover {
  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.05);
}
.radar-mode-tab.active {
  background: #615fff;
  color: white;
  box-shadow: 0 4px 12px rgba(97, 95, 255, 0.3);
}

.radar-method-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 0;
}
.radar-method-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.radar-method-btn:hover {
  border-color: rgba(97, 95, 255, 0.4);
  background: rgba(97, 95, 255, 0.08);
}
.radar-method-btn.active {
  border-color: #615fff;
  background: rgba(97, 95, 255, 0.1);
  box-shadow: 0 0 0 1px rgba(97, 95, 255, 0.2);
}
.radar-method-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.radar-method-icon {
  width: 20px;
  height: 20px;
  color: #94a3b8;
  transition: color 0.3s ease;
}
.radar-method-btn.active .radar-method-icon {
  color: #615fff;
}
.radar-method-text {
  font-size: 14px;
  font-weight: 500;
  color: #cbd5e1;
}
.radar-method-arrow {
  width: 16px;
  height: 16px;
  color: #64748b;
  transition: transform 0.3s ease, color 0.3s ease;
}
.radar-method-btn.active .radar-method-arrow {
  transform: rotate(180deg);
  color: #615fff;
}

.radar-method { display: flex; flex-direction: column; }
.radar-method-btn { width: 100%; text-align: left; font-family: inherit; }
.radar-method-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 0 2px;
  animation: radar-panel-open 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes radar-panel-open {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: none; }
}


.radar-form { display: flex; flex-direction: column; gap: 14px; }
.radar-label { font-size: 13px; font-weight: 500; color: #cbd5e1; }
.radar-field { position: relative; }
.radar-field-icon {
  position: absolute; left: 14px; top: 50%;
  transform: translateY(-50%);
  color: #64748b; pointer-events: none;
  transition: color 0.3s ease;
}
.radar-field:focus-within .radar-field-icon {
  color: #615fff;
}
.radar-msg {
  display: flex; align-items: center; gap: 6px;
  margin: 0; font-size: 12.5px; line-height: 1.5;
  color: #94a3b8;
}
.radar-msg.is-error { color: #fca5a5; }
.radar-legal { margin: 18px 0 0; font-size: 11.5px; line-height: 1.7; color: #64748b; }
.radar-note { display: flex; align-items: center; gap: 6px; margin: 0; font-size: 12px; color: #64748b; transition: color 0.3s ease; }
.radar-note:hover { color: #615fff; }

.radar-code-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  padding: 8px 14px;
  border: none;
  background: rgba(97, 95, 255, 0.15);
  color: #a5a4ff;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.radar-code-btn:hover:not(:disabled) {
  background: rgba(97, 95, 255, 0.25);
}
.radar-code-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.radar-done h2 { margin: 16px 0 8px; font-size: 20px; font-weight: 600; color: #f8fafc; }
.radar-done p { margin: 0 0 20px; font-size: 13.5px; line-height: 1.7; color: #94a3b8; }
.radar-done-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 44px; height: 44px; border-radius: 14px;
  color: #615fff;
  background: rgba(97, 95, 255, 0.12);
  border: 1px solid rgba(97, 95, 255, 0.3);
  animation: radar-icon-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}
@keyframes radar-icon-pop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
.radar-done-actions { display: flex; gap: 10px; }

.radar-rise { animation: radar-rise 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
.radar-rise-2 { animation-delay: 0.15s; }
@keyframes radar-rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
.radar-spin { animation: radar-spin 0.9s linear infinite; }
@keyframes radar-spin { to { transform: rotate(360deg); } }

.radar-input-glow {
  position: absolute; inset: -2px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(97, 95, 255, 0.4), transparent 50%);
  opacity: 0;
  filter: blur(8px);
  transition: opacity 0.3s ease;
  z-index: -1;
    pointer-events: none;
}
.radar-field:focus-within .radar-input-glow {
  opacity: 1;
}

.radar-form-slide {
  animation: radar-form-slide 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes radar-form-slide {
  from { opacity: 0; transform: translateX(16px); }
  to { opacity: 1; transform: none; }
}

@media (max-width: 900px) {
  .radar-login { align-items: flex-start; padding: 24px 16px 36px; }
  .radar-shell { grid-template-columns: 1fr; gap: 24px; }
  .radar-sweep { opacity: 0.6; }
  .radar-eyebrow { margin-top: 20px; }
  .radar-lede { font-size: 14px; }
  .radar-points { display: none; }
  .radar-card { padding: clamp(20px, 4vw, 28px); border-radius: 16px; }
//   .radar-card-overlay { border-radius: 16px; }
}
@media (max-width: 480px) {
  .radar-done-actions { flex-direction: column; }
}
@media (prefers-reduced-motion: reduce) {
  .radar-sweep, .radar-rise, .radar-spin, .radar-wordmark, .radar-mark, .radar-points li, .radar-dot, .radar-card, .radar-card-overlay, .radar-note, .radar-done-icon, .radar-input-glow, .radar-form-slide { animation: none !important; transition: none !important; }
}
`

const loginMethods = [
  { id: 'phone-password' as LoginMethod, label: '手机号/账号 + 密码', icon: User },
  { id: 'email-password' as LoginMethod, label: '邮箱 + 密码', icon: Mail },
  { id: 'phone-code' as LoginMethod, label: '手机号 + 验证码', icon: Phone },
]

export default function LoginPage() {
  return (
    <main className="radar-login">
      <style>{styles}</style>

      <div className="radar-bg" aria-hidden="true">
        <div className="radar-grid" />
        <div className="radar-glow radar-glow-a" />
        <div className="radar-glow radar-glow-b" />
        <div className="radar-sweep" />
      </div>

      <div className="radar-shell">
        <section className="radar-rise">
          <div className="radar-wordmark">
            <span className="radar-mark">
              <GraduationCap size={18} strokeWidth={2} />
            </span>
            <span>校招雷达</span>
          </div>

          <p className="radar-eyebrow">CAMPUS JOB RADAR</p>
          <h1 className="radar-title">
            别再错过
            <br />
            任何一个<em>截止日期</em>
          </h1>
          <p className="radar-lede">
            把分散在各校就业网、公众号和企业官网的校招信息收进一张时间线。
            截止前3天，我们提醒您。
          </p>

          <ul className="radar-points">
            <li>
              <span className="radar-dot" />
              一次收藏，自动盯住截止时间
            </li>
            <li>
              <span className="radar-dot" />
              投递看板，随时知道卡在哪一轮
            </li>
            <li>
              <span className="radar-dot" />
              简历对比 JD，先补短板再投
            </li>
          </ul>
        </section>

        <section className="radar-panel radar-rise radar-rise-2">
          <div className="radar-card">
            <Suspense
              fallback={
                <div className="flex h-80 items-center justify-center">
                  <Loader2 className="radar-spin text-slate-500" size={20} />
                </div>
              }
            >
              <LoginForm />
            </Suspense>
            
          </div>

          <p className="radar-note">
            <ShieldCheck size={14} />
            仅用于登录与截止提醒，不向第三方共享信息
          </p>
        </section>
      </div>
    </main>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('phone-password')
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [codeCountdown, setCodeCountdown] = useState(0)

  // 只允许站内绝对路径，避免 //evil.com 这类开放重定向
  const nextPath = useMemo(() => {
    const raw = searchParams.get('next') ?? ''
    return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/timeline'
  }, [searchParams])

  const sending = status === 'sending'

  useEffect(() => {
    if (codeCountdown > 0) {
      const timer = setTimeout(() => setCodeCountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [codeCountdown])

    async function handleSubmit() {
    setStatus('sending')
    setMessage('')

    try {
      const supabase = createClient()

      if (authMode === 'login') {
        // 真实的登录请求
        const { error } = await supabase.auth.signInWithPassword({
          email: account,
          password: password,
        })
        if (error) throw new Error(error.message)
      } else {
        // 真实的注册请求
        const { error } = await supabase.auth.signUp({
          email: account,
          password: password,
        })
        if (error) throw new Error(error.message)
      }

      setStatus('sent')
      setMessage(`操作成功！欢迎${authMode === 'login' ? '登录' : '注册'}校招雷达。`)
      
      // 登录成功，延迟 1.5 秒后自动跳转页面
      setTimeout(() => {
        window.location.href = nextPath
      }, 1500)

    } catch (error: unknown) {
      setStatus('error')
      
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      
      if (errorMessage.includes('Invalid login credentials')) {
        setMessage('邮箱或密码错误，请重试或去注册。')
      } else if (errorMessage.includes('at least 6 characters')) {
        setMessage('密码长度必须大于 6 位。')
      } else {
        setMessage('操作失败：' + errorMessage)
      }
    }
  }

  const handleSendCode = () => {
    if (!account || account.length < 11) {
      setStatus('error')
      setMessage('请输入有效的手机号')
      return
    }
    setCodeCountdown(60)
  }

  
  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending) return
    void handleSubmit()
  }

  if (status === 'sent') {
    return (
      <div className="radar-done radar-form-slide" role="status" aria-live="polite">
        <span className="radar-done-icon">
          <CheckCircle2 size={22} />
        </span>
        <h2>{authMode === 'login' ? '登录成功' : '注册成功'}</h2>
        <p>{message}</p>
        <div className="radar-done-actions">
          <Button
            type="button"
            onClick={() => {
              setStatus('idle')
              setMessage('')
              setAccount('')
              setPassword('')
              setCode('')
            }}
            className="h-11 rounded-xl bg-[#615fff] px-4 text-sm font-medium text-white hover:bg-[#4f4dd8] transition-all duration-300 hover:shadow-[0_0_30px_rgba(97,95,255,0.4)]"
          >
            {authMode === 'login' ? '继续使用' : '去登录'}
          </Button>
        </div>
      </div>
    )
  }

  const getPlaceholder = () => {
    switch (loginMethod) {
      case 'phone-password': return '请输入手机号或账号'
      case 'email-password': return '请输入邮箱地址'
      case 'phone-code': return '请输入手机号'
    }
  }

  const getAccountIcon = () => {
    switch (loginMethod) {
      case 'phone-password': return <User size={18} aria-hidden="true" />
      case 'email-password': return <Mail size={18} aria-hidden="true" />
      case 'phone-code': return <Phone size={18} aria-hidden="true" />
    }
  }

  return (
    <div className="radar-form-slide">
      <div className="radar-mode-tabs">
        <button
          className={`radar-mode-tab ${authMode === 'login' ? 'active' : ''}`}
          onClick={() => {
            setAuthMode('login')
            setMessage('')
          }}
        >
          登录
        </button>
        <button
          className={`radar-mode-tab ${authMode === 'register' ? 'active' : ''}`}
          onClick={() => {
            setAuthMode('register')
            setMessage('')
          }}
        >
          注册
        </button>
      </div>

            <form className="radar-form" onSubmit={handleFormSubmit} noValidate>
        <div className="radar-method-selector">
          {loginMethods.map((method) => {
            const Icon = method.icon
            const active = loginMethod === method.id

            return (
              <div key={method.id} className={`radar-method ${active ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className={`radar-method-btn ${active ? 'active' : ''}`}
                  aria-expanded={active}
                  aria-controls={`method-panel-${method.id}`}
                  onClick={() => {
                    setLoginMethod(method.id)
                    setMessage('')
                    setStatus('idle')
                    setAccount('')
                    setPassword('')
                    setCode('')
                  }}
                >
                  <span className="radar-method-left">
                    <Icon className="radar-method-icon" />
                    <span className="radar-method-text">{method.label}</span>
                  </span>
                  <ChevronDown className="radar-method-arrow" />
                </button>

                {active && (
                  <div id={`method-panel-${method.id}`} className="radar-method-panel">
                    <div className="radar-field">
                      <div className="radar-input-glow" />
                      <div className="radar-field-icon">{getAccountIcon()}</div>
                      <Input
                        id="account"
                        name="account"
                        type={method.id === 'email-password' ? 'email' : 'text'}
                        inputMode={method.id === 'phone-code' ? 'tel' : 'text'}
                        autoComplete="username"
                        placeholder={getPlaceholder()}
                        value={account}
                        disabled={sending}
                        aria-invalid={status === 'error'}
                        aria-describedby={message ? 'login-message' : undefined}
                        onChange={(event) => {
                          setAccount(event.target.value)
                          if (status === 'error') {
                            setStatus('idle')
                            setMessage('')
                          }
                        }}
                        className="h-12 rounded-xl border-white/10 bg-white/[0.04] pl-11 text-base text-white placeholder:text-slate-500 focus-visible:border-[#615fff]/60 focus-visible:ring-[#615fff]/25 transition-all duration-300"
                      />
                    </div>

                    {(method.id === 'phone-password' || method.id === 'email-password') && (
                      <div className="radar-field">
                        <div className="radar-input-glow" />
                        <Lock className="radar-field-icon" size={18} aria-hidden="true" />
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                          placeholder={authMode === 'login' ? '请输入密码' : '请设置密码（至少6位）'}
                          value={password}
                          disabled={sending}
                          onChange={(event) => {
                            setPassword(event.target.value)
                            if (status === 'error') {
                              setStatus('idle')
                              setMessage('')
                            }
                          }}
                          className="h-12 rounded-xl border-white/10 bg-white/[0.04] pl-11 text-base text-white placeholder:text-slate-500 focus-visible:border-[#615fff]/60 focus-visible:ring-[#615fff]/25 transition-all duration-300"
                        />
                      </div>
                    )}

                    {method.id === 'phone-code' && (
                      <div className="radar-field">
                        <div className="radar-input-glow" />
                        <ShieldCheck className="radar-field-icon" size={18} aria-hidden="true" />
                        <Input
                          id="code"
                          name="code"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          placeholder="请输入6位验证码"
                          value={code}
                          disabled={sending}
                          maxLength={6}
                          onChange={(event) => {
                            setCode(event.target.value)
                            if (status === 'error') {
                              setStatus('idle')
                              setMessage('')
                            }
                          }}
                          className="h-12 rounded-xl border-white/10 bg-white/[0.04] pl-11 pr-24 text-base text-white placeholder:text-slate-500 focus-visible:border-[#615fff]/60 focus-visible:ring-[#615fff]/25 transition-all duration-300"
                        />
                        <button
                          type="button"
                          className="radar-code-btn"
                          onClick={handleSendCode}
                          disabled={codeCountdown > 0}
                        >
                          {codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {message && (
          <p
            id="login-message"
            className={status === 'error' ? 'radar-msg is-error' : 'radar-msg'}
            role="status"
            aria-live="polite"
          >
            {status === 'error' && <AlertCircle size={14} aria-hidden="true" />}
            {message}
          </p>
        )}

        <Button
          type="submit"
          disabled={sending}
          className="h-12 w-full gap-2 rounded-xl bg-[#615fff] text-[15px] font-medium text-white shadow-[0_16px_40px_-16px_rgba(97,95,255,0.9)] transition-all duration-300 hover:bg-[#4f4dd8] hover:shadow-[0_20px_50px_-16px_rgba(97,95,255,0.9),0_0_30px_rgba(97,95,255,0.3)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-[0_16px_40px_-16px_rgba(97,95,255,0.9)]"
        >
          {sending ? (
            <>
              <Loader2 className="radar-spin" size={18} />
              处理中...
            </>
          ) : (
            <>
              {authMode === 'login' ? '登录' : '注册'}
              <ArrowRight size={18} />
            </>
          )}
        </Button>
      </form>

      <p className="radar-legal">
        继续即表示你同意《服务条款》与《隐私政策》。我们只把这个信息用于登录和截止提醒。
      </p>
    </div>
  )
}