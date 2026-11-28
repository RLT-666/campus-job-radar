import {
  ArrowRight,
  BellRing,
  Briefcase,
  Crosshair,
  FileText,
  Play,
} from "lucide-react";
import Link from "next/link";

import { landingContent } from "@/content/landing-content";

import { DashboardPreview } from "./DashboardPreview";

const statIcons = {
  sources: FileText,
  openings: Briefcase,
  reminders: BellRing,
} as const;

const landingCss = `
.landing-page { color-scheme: dark; }

.landing-shell {
  background-color: #04070f;
  background-image:
    radial-gradient(ellipse 52% 58% at 74% 38%, rgba(37, 99, 235, 0.28), transparent 62%),
    radial-gradient(ellipse 40% 44% at 2% -6%, rgba(30, 64, 175, 0.2), transparent 60%),
    radial-gradient(ellipse 80% 55% at 50% 118%, rgba(16, 48, 128, 0.34), transparent 70%),
    linear-gradient(180deg, #050b17 0%, #04070f 58%, #02050b 100%);
}

.landing-h1 {
  font-size: clamp(2.15rem, 3.9vw, 3.4rem);
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: -0.008em;
}

.landing-reveal { animation: landing-rise 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
.landing-reveal-2 { animation-delay: 0.06s; }
.landing-reveal-3 { animation-delay: 0.12s; }
.landing-reveal-4 { animation-delay: 0.2s; }
.landing-reveal-5 { animation-delay: 0.28s; }
.landing-reveal-6 { animation-delay: 0.36s; }
.landing-reveal-7 { animation-delay: 0.44s; }
.landing-reveal-dash { animation: landing-rise 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.22s both; }

.dash-stage {
  perspective: 1500px;
  perspective-origin: 55% 42%;
}

.dash-halo {
  position: absolute;
  left: 50%;
  top: 44%;
  width: 108%;
  height: 104%;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    ellipse at center,
    rgba(59, 130, 246, 0.5) 0%,
    rgba(37, 99, 235, 0.2) 42%,
    transparent 70%
  );
  filter: blur(38px);
  pointer-events: none;
  animation: dash-halo 8s ease-in-out infinite;
  transition: filter 400ms ease;
}

.dash-floor {
  position: absolute;
  left: 50%;
  bottom: -40%;
  width: 104%;
  height: 58%;
  transform: translateX(-50%);
  background:
    radial-gradient(
      ellipse 36% 58% at 50% 42%,
      rgba(239, 246, 255, 0.95) 0%,
      rgba(147, 197, 253, 0.6) 40%,
      transparent 74%
    ),
    radial-gradient(
      ellipse 64% 100% at 50% 44%,
      rgba(59, 130, 246, 0.58) 0%,
      rgba(29, 78, 216, 0.18) 58%,
      transparent 78%
    );
  filter: blur(32px);
  pointer-events: none;
  animation: dash-floor 6.5s ease-in-out infinite;
}

.dash-floor::after {
  content: "";
  position: absolute;
  left: 8%;
  right: 6%;
  top: 14%;
  height: 3px;
  transform: rotate(-3.5deg);
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(147, 197, 253, 0.9) 26%,
    rgba(255, 255, 255, 1) 50%,
    rgba(147, 197, 253, 0.9) 74%,
    transparent 100%
  );
  filter: blur(3px);
}

.dash-underlight {
  position: absolute;
  left: 50%;
  bottom: -7%;
  width: 106%;
  height: 5px;
  transform: translateX(-50%) rotate(-4deg);
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(147, 197, 253, 0.7) 16%,
    rgba(255, 255, 255, 0.95) 50%,
    rgba(147, 197, 253, 0.7) 84%,
    transparent 100%
  );
  filter: blur(5px);
  box-shadow: 0 0 44px 14px rgba(59, 130, 246, 0.45);
  pointer-events: none;
  animation: dash-underlight 6.5s ease-in-out infinite;
}

.dash-float {
  transform-style: preserve-3d;
  animation: dash-float 9s ease-in-out infinite;
}

.dash-tilt {
  transform-style: preserve-3d;
  transform-origin: 50% 55%;
  transform:
    rotateX(calc(8deg + var(--tilt-x, 0deg)))
    rotateY(calc(-16deg + var(--tilt-y, 0deg)))
    rotateZ(-5deg)
    translate3d(var(--shift-x, 0px), var(--shift-y, 0px), 0);
  transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}

.dash-card-shell {
  transform-style: preserve-3d;
}

.dash-card-shell::before {
  content: "";
  position: absolute;
  inset: 16px 20px -34px -30px;
  border-radius: 20px;
  background: linear-gradient(160deg, #1b3a78 0%, #0a1834 58%, #040b1a 100%);
  border: 1px solid rgba(96, 165, 250, 0.2);
  transform: translateZ(-24px);
  box-shadow: 0 30px 70px -20px rgba(2, 8, 26, 0.95);
}

.dash-card {
  position: relative;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 42px 90px -28px rgba(2, 10, 32, 0.95),
    0 0 70px -14px rgba(37, 99, 235, 0.45);
  transition: box-shadow 400ms ease;
}

.dash-card::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: linear-gradient(
    105deg,
    transparent 34%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 66%
  );
  transform: translateX(-130%);
  transition: transform 900ms cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
}

.dash-chip {
  transform: translateZ(64px);
  transition: transform 450ms cubic-bezier(0.16, 1, 0.3, 1);
}

.landing-cta {
  position: relative;
  transition:
    translate 300ms cubic-bezier(0.16, 1, 0.3, 1),
    scale 200ms cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 300ms ease,
    border-color 200ms ease,
    background-color 200ms ease,
    filter 200ms ease;
}

.landing-cta-primary {
  overflow: hidden;
}

.landing-cta-primary::after {
  content: "";
  position: absolute;
  top: -25%;
  bottom: -25%;
  left: -60%;
  width: 45%;
  transform: skewX(-20deg);
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.45),
    transparent
  );
  pointer-events: none;
  transition: left 700ms cubic-bezier(0.16, 1, 0.3, 1);
}

.landing-nav-link {
  position: relative;
  transition: color 200ms ease;
}

.landing-nav-link::after {
  content: "";
  position: absolute;
  left: 0;
  right: 100%;
  bottom: -7px;
  height: 1px;
  background: linear-gradient(90deg, #93c5fd, rgba(147, 197, 253, 0));
  transition: right 320ms cubic-bezier(0.16, 1, 0.3, 1);
}

.landing-stat {
  transition: transform 350ms cubic-bezier(0.16, 1, 0.3, 1);
}

.landing-stat-icon {
  transition:
    box-shadow 300ms ease,
    background-color 300ms ease,
    border-color 300ms ease,
    color 300ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .dash-stage:hover .dash-card {
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.75),
      0 50px 110px -30px rgba(2, 10, 32, 0.98),
      0 0 100px -8px rgba(59, 130, 246, 0.65);
  }

  .dash-stage:hover .dash-card::after {
    transform: translateX(130%);
  }

  .dash-stage:hover .dash-chip {
    transform: translateZ(86px);
  }

  .dash-stage:hover .dash-halo {
    filter: blur(38px) brightness(1.3);
  }

  .landing-cta:hover {
    translate: 0 -2px;
  }

  .landing-cta:active {
    translate: 0 0;
    scale: 0.98;
  }

  .landing-cta-primary:hover::after {
    left: 120%;
  }

  .landing-nav-link:hover::after {
    right: 0;
  }

  .landing-stat:hover {
    transform: translateY(-3px);
  }

  .landing-stat:hover .landing-stat-icon {
    border-color: rgba(96, 165, 250, 0.55);
    background-color: rgba(37, 99, 235, 0.35);
    color: #c7ddff;
    box-shadow: 0 0 26px -4px rgba(59, 130, 246, 0.7);
  }
}

.landing-beam {
  position: relative;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(96, 140, 255, 0.22) 14%,
    rgba(147, 197, 253, 0.55) 50%,
    rgba(96, 140, 255, 0.22) 86%,
    transparent 100%
  );
}

.landing-beam::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 420px;
  height: 96px;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    ellipse at center,
    rgba(147, 197, 253, 0.55) 0%,
    rgba(59, 130, 246, 0.22) 36%,
    transparent 70%
  );
  filter: blur(10px);
  pointer-events: none;
}

.landing-diamond {
  width: 4px;
  height: 4px;
  flex: none;
  background: #3d5a8c;
  transform: rotate(45deg);
}

@keyframes landing-rise {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: none; }
}

@keyframes dash-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

@keyframes dash-halo {
  0%, 100% { opacity: 0.82; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.06); }
}

@keyframes dash-floor {
  0%, 100% { opacity: 0.78; transform: translateX(-50%) scaleX(0.96); }
  50% { opacity: 1; transform: translateX(-50%) scaleX(1.05); }
}

@keyframes dash-underlight {
  0%, 100% { opacity: 0.7; transform: translateX(-50%) rotate(-4deg) scaleX(0.94); }
  50% { opacity: 1; transform: translateX(-50%) rotate(-4deg) scaleX(1.03); }
}

@media (max-width: 1023px) {
  .dash-stage {
    perspective: 1300px;
  }

  .dash-tilt {
    transform: rotateX(5deg) rotateY(-10deg) rotateZ(-2.5deg);
  }
}

@media (min-width: 1024px) {
  .dash-stage {
    margin-bottom: 2.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-reveal,
  .landing-reveal-dash,
  .dash-float,
  .dash-tilt,
  .dash-halo,
  .dash-floor,
  .dash-underlight {
    animation: none !important;
  }

  .dash-tilt,
  .dash-chip,
  .dash-card,
  .dash-card::after,
  .landing-cta,
  .landing-cta-primary::after,
  .landing-nav-link,
  .landing-nav-link::after,
  .landing-stat {
    transition: none !important;
  }
}
`;

const orbits = [520, 700, 880, 1060];

export function LandingPage() {
  const {
    brand,
    nav,
    login,
    signup,
    badge,
    titleLines,
    description,
    primaryCta,
    secondaryCta,
    stats,
    sources,
  } = landingContent;

  return (
    <div className="landing-page landing-shell relative flex min-h-svh flex-col overflow-x-clip font-landing text-white">
      <style>{landingCss}</style>

      {/* 顶部导航 */}
      <header className="relative z-30 mx-auto flex h-[72px] w-full max-w-[1240px] shrink-0 items-center justify-between gap-6 px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-full border border-white/20 bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            <Crosshair size={18} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <span className="text-[19px] font-bold tracking-[0.01em]">{brand}</span>
        </Link>

        <nav
          aria-label="主导航"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex"
        >
          {nav.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="landing-nav-link text-[13.5px] text-[#c3cfe4] hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href={login.href}
            className="landing-cta inline-flex h-9 items-center justify-center rounded-[9px] border border-white/18 bg-[#0b1324]/80 px-5 text-[13.5px] text-white hover:border-white/30 hover:bg-[#132140]"
          >
            {login.label}
          </Link>
          <Link
            href={signup.href}
            className="landing-cta inline-flex h-9 items-center justify-center rounded-[9px] bg-white px-5 text-[13.5px] font-semibold text-[#0a1020] hover:bg-[#e9eefb]"
          >
            {signup.label}
          </Link>
        </div>
      </header>

      {/* 首屏主体 */}
      <main
        id="product"
        className="relative z-10 mx-auto grid w-full max-w-[1240px] flex-1 items-center gap-14 px-6 pb-12 pt-8 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] lg:gap-4 lg:px-8 lg:py-4"
      >
        <section aria-labelledby="landing-title" className="relative z-10 max-w-[560px]">
          <p className="landing-reveal inline-flex items-center gap-2 rounded-full border border-[#3f7bff]/35 bg-[#101d34]/70 px-3.5 py-2 text-[12.5px] text-[#c9d6ef] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md">
            <span className="grid size-[18px] place-items-center rounded-full bg-[#2563eb]/30 text-[#9ec3ff]">
              <Crosshair size={11} strokeWidth={2} aria-hidden="true" />
            </span>
            {badge[0]}
            <span aria-hidden="true" className="size-[3px] rounded-full bg-[#5a6d8c]" />
            {badge[1]}
          </p>

          <h1 id="landing-title" className="landing-h1 mt-7 text-[#f7faff]">
            <span className="landing-reveal landing-reveal-2 block md:whitespace-nowrap">
              {titleLines[0]}
            </span>
            <span className="landing-reveal landing-reveal-3 block md:whitespace-nowrap">
              {titleLines[1]}
            </span>
          </h1>

          <p className="landing-reveal landing-reveal-4 mt-6 max-w-[27rem] text-[15.5px] leading-[1.9] text-[#93a4bf]">
            {description}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href={primaryCta.href}
              className="landing-reveal landing-reveal-5 landing-cta landing-cta-primary group inline-flex h-[52px] items-center gap-3 rounded-full bg-[linear-gradient(135deg,#4b8dff_0%,#2563eb_48%,#1d4ed8_100%)] pl-6 pr-2 text-[15px] font-semibold text-white shadow-[0_12px_34px_-8px_rgba(37,99,235,0.75),inset_0_1px_0_rgba(255,255,255,0.28)] hover:brightness-110"
            >
              {primaryCta.label}
              <span className="grid size-9 place-items-center rounded-full bg-white/20 transition-transform duration-200 group-hover:translate-x-0.5">
                <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
              </span>
            </Link>

            <a
              href={secondaryCta.href}
              className="landing-reveal landing-reveal-5 landing-cta inline-flex h-[52px] items-center gap-3 rounded-full border border-white/16 bg-white/[0.03] px-6 text-[15px] text-[#e6edfb] hover:border-white/30 hover:bg-white/[0.07]"
            >
              <span className="grid size-7 place-items-center rounded-full border border-white/30">
                <Play size={10} strokeWidth={1.5} className="fill-white" aria-hidden="true" />
              </span>
              {secondaryCta.label}
            </a>
          </div>

          <div
            id="scenarios"
            className="landing-reveal landing-reveal-6 mt-12 flex flex-wrap items-center gap-x-7 gap-y-5"
          >
            {stats.map((stat, index) => {
              const Icon = statIcons[stat.key];
              return (
                <div
                  key={stat.key}
                  className={
                    index === 0
                      ? "landing-stat flex items-center gap-3"
                      : "landing-stat flex items-center gap-3 border-l border-white/10 pl-7"
                  }
                >
                  <span className="landing-stat-icon grid size-9 place-items-center rounded-[10px] border border-[#3f7bff]/25 bg-[#12275a]/50 text-[#9dc0ff]">
                    <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[20px] font-semibold leading-none text-white">
                      {stat.value}
                      {stat.unit && (
                        <span className="ml-1 text-[11px] font-normal text-[#a6b6d0]">
                          {stat.unit}
                        </span>
                      )}
                    </p>
                    <p className="mt-1.5 text-[11.5px] text-[#7f90ac]">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 右侧产品预览 */}
        <section
          id="features"
          aria-label="产品界面预览"
          className="relative flex items-center justify-center"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 scale-[0.6] sm:scale-75 lg:scale-90 xl:scale-100"
          >
            {orbits.map((size) => (
              <span
                key={size}
                className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#3f7bff]/[0.16]"
                style={{ width: size, height: size }}
              />
            ))}
            <span className="absolute left-0 top-0 size-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.3),transparent_66%)] blur-2xl" />
          </div>

          <DashboardPreview />
        </section>
      </main>

      {/* 底部来源条 */}
      <footer id="faq" className="relative z-10 mt-auto shrink-0">
        <div className="landing-beam" aria-hidden="true" />
        <div className="mx-auto flex max-w-[1240px] items-center justify-center gap-4 px-6 py-6">
          <span className="landing-diamond" aria-hidden="true" />
          <p className="text-center text-[11.5px] tracking-[0.02em] text-[#71819b]">
            岗位来源：
            <span className="text-[#9dabc4]">{sources.join(" · ")}</span>
          </p>
          <span className="landing-diamond" aria-hidden="true" />
        </div>
      </footer>
    </div>
  );
}
