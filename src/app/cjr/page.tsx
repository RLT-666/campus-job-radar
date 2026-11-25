import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";

import { GlassLink } from "@/components/hero/GlassLink";

export const metadata: Metadata = {
  title: "岗位发现 · 校招雷达",
  description:
    "校招雷达的岗位发现页：公开浏览岗位与截止时间，登录后可收藏、投递并在看板中跟踪进度。",
};

// 分工说明：把“公开发现 → 登录后操作 → 看板跟踪”三段职责写在页面上，
// 避免访客把 /cjr 与需要登录的 /board 混为一谈。
const ACCESS_STEPS = [
  {
    index: "01",
    title: "公开浏览",
    description: "无需登录即可查看岗位、公司与截止时间。",
  },
  {
    index: "02",
    title: "登录后操作",
    description: "收藏与投递绑定成员账号，换设备也能同步。",
  },
  {
    index: "03",
    title: "看板跟踪",
    description: "在投递看板中跟进笔试、面试与 Offer 进度。",
  },
] as const;

export default function CjrPage() {
  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-hero-ink font-hero text-hero-primary">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_28%,rgba(117,230,237,0.16),transparent_46%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_88%,rgba(156,140,255,0.12),transparent_42%)]"
      />

      <div className="relative mx-auto flex min-h-svh w-full max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-12 lg:py-10">
        <header className="flex items-center justify-between gap-4 font-mono text-[10px] tracking-[0.16em] sm:text-[11px]">
          <Link
            href="/"
            className="rounded-full text-hero-primary transition-colors hover:text-[var(--hero-cyan)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--hero-cyan)]"
          >
            ← SIGNAL / 01
          </Link>
          <span className="hidden text-hero-secondary sm:inline">
            CAMPUS JOB RADAR / PUBLIC
          </span>
        </header>

        <section
          aria-labelledby="cjr-title"
          className="flex flex-1 flex-col justify-center py-14 sm:py-16"
        >
          <p className="flex items-center gap-3 font-mono text-[10px] tracking-[0.15em] text-hero-secondary sm:text-[11px]">
            <span className="hero-eyebrow-line" aria-hidden="true" />
            JOB DISCOVERY / OPEN TO EVERYONE
          </p>

          <h1
            id="cjr-title"
            className="mt-6 max-w-[22ch] text-4xl font-medium leading-[1.05] tracking-[-0.04em] sm:mt-8 sm:text-5xl lg:text-6xl"
          >
            岗位信号，正在接入。
          </h1>

          <p className="mt-6 max-w-[40rem] text-[15px] leading-7 text-hero-secondary sm:text-base sm:leading-8">
            这里是校招雷达的岗位发现页。公开浏览不需要登录；收藏、投递与进度跟踪需要成员账号。
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {ACCESS_STEPS.map((step) => (
              <section
                key={step.index}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              >
                <span className="font-mono text-[10px] tracking-[0.16em] text-hero-muted">
                  {step.index}
                </span>
                <h2 className="mt-3 text-base font-medium">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-hero-secondary">
                  {step.description}
                </p>
              </section>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <GlassLink href="/login?next=/cjr" intent="primary">
              登录以收藏与投递
            </GlassLink>
            <GlassLink href="/board" intent="secondary">
              打开投递看板
            </GlassLink>
            <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-hero-muted sm:ml-2">
              <Lock aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
              看板需要登录
            </p>
          </div>

          <p className="mt-12 max-w-[42rem] border-t border-white/10 pt-5 font-mono text-[10px] leading-5 tracking-[0.13em] text-hero-muted sm:text-[11px]">
            当前为占位页：岗位数据、搜索与筛选将在后续版本补齐；入口已开放，避免访问 404。
          </p>
        </section>
      </div>
    </main>
  );
}
