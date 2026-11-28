"use client";

import {
  BarChart3,
  Bell,
  BellRing,
  Bookmark,
  Briefcase,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Clock3,
  Crosshair,
  FileSearch,
  FileText,
  LayoutDashboard,
  Layers,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { cn } from "@/lib/utils";

const sidebarItems = [
  { label: "仪表盘", icon: LayoutDashboard, active: true },
  { label: "岗位收藏", icon: Bookmark, active: false },
  { label: "投递看板", icon: ClipboardList, active: false },
  { label: "简历诊断", icon: FileSearch, active: false },
  { label: "数据统计", icon: BarChart3, active: false },
];

const overview = [
  { label: "岗位来源", value: "128", icon: Layers, color: "#2563eb", bg: "#e8f0ff" },
  { label: "在招岗位", value: "2400+", icon: Briefcase, color: "#4f46e5", bg: "#eeebff" },
  { label: "提醒准时", value: "98%", icon: BellRing, color: "#0d9488", bg: "#e5f8f4" },
  { label: "本周投递", value: "12", icon: TrendingUp, color: "#ea8a1f", bg: "#fdf3e3" },
];

const funnel = [
  { label: "已投递", value: "100%", width: "100%", background: "linear-gradient(90deg,#6b7cff,#4338ca)" },
  { label: "笔试", value: "56%", width: "78%", background: "linear-gradient(90deg,#3b82f6,#1d4ed8)" },
  { label: "面试", value: "28%", width: "54%", background: "linear-gradient(90deg,#22d3ee,#0284c7)" },
  { label: "Offer", value: "12%", width: "30%", background: "linear-gradient(90deg,#34d399,#0d9488)" },
];

const recent = [
  { role: "产品经理", company: "腾讯", initial: "腾", color: "#2563eb", status: "已投递", badge: "bg-[#e8f0ff] text-[#2563eb]" },
  { role: "视觉设计师", company: "字节跳动", initial: "字", color: "#4f46e5", status: "面试中", badge: "bg-[#e7f8ef] text-[#0f9f6e]" },
  { role: "数据分析", company: "美团", initial: "美", color: "#f0a11a", status: "已截止", badge: "bg-[#f1f4f9] text-[#8e9aad]" },
];

const calendarCells = Array.from({ length: 35 }, (_, index) => {
  const day = index - 3;
  return day >= 1 && day <= 31 ? day : null;
});

export function DashboardPreview() {
  const tiltRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    // 仅桌面鼠标响应；触屏与“减少动态”偏好保持静态
    if (event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const tilt = tiltRef.current;
      if (!tilt) return;
      tilt.style.setProperty("--tilt-x", `${(-y * 5).toFixed(2)}deg`);
      tilt.style.setProperty("--tilt-y", `${(x * 8).toFixed(2)}deg`);
      tilt.style.setProperty("--shift-x", `${(x * 10).toFixed(2)}px`);
      tilt.style.setProperty("--shift-y", `${(y * 8).toFixed(2)}px`);
    });
  };

  const resetTilt = () => {
    const tilt = tiltRef.current;
    if (!tilt) return;
    tilt.style.setProperty("--tilt-x", "0deg");
    tilt.style.setProperty("--tilt-y", "0deg");
    tilt.style.setProperty("--shift-x", "0px");
    tilt.style.setProperty("--shift-y", "0px");
  };

  return (
    <div
      role="img"
      aria-label="校招雷达投递看板界面预览：岗位统计、投递漏斗、趋势图、最近投递与面试日历"
      className="dash-stage landing-reveal-dash relative w-full max-w-[660px]"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
    >
      <div aria-hidden="true" className="dash-halo" />
      <div aria-hidden="true" className="dash-floor" />
      <div aria-hidden="true" className="dash-underlight" />

      <div className="dash-float relative">
        <div ref={tiltRef} className="dash-tilt relative">
          <div className="dash-card-shell relative">
            <div className="dash-card overflow-hidden rounded-[16px] border border-white/30 bg-[#f3f6fc] ring-1 ring-black/5">
              <div className="flex min-h-[340px]">
              {/* 深色侧边栏 */}
              <aside className="flex w-[86px] shrink-0 flex-col gap-4 bg-[#0a1526] px-2 py-3 text-white">
                <div className="flex items-center gap-1">
                  <span className="grid size-[15px] place-items-center rounded-full border border-white/35">
                    <Crosshair size={8} strokeWidth={2} />
                  </span>
                  <span className="text-[7.5px] font-semibold tracking-[0.02em]">校招雷达</span>
                </div>

                <nav className="flex flex-col gap-[3px]">
                  {sidebarItems.map(({ label, icon: Icon, active }) => (
                    <span
                      key={label}
                      className={cn(
                        "flex items-center gap-1 rounded-[4px] px-1.5 py-[5px] text-[6.5px]",
                        active
                          ? "bg-[#2563eb] font-medium text-white shadow-[0_4px_10px_-2px_rgba(37,99,235,0.6)]"
                          : "text-white/55",
                      )}
                    >
                      <Icon size={7} strokeWidth={1.8} />
                      {label}
                    </span>
                  ))}
                </nav>

                <div className="mt-auto rounded-[5px] border border-white/10 bg-white/[0.06] px-1.5 py-1.5">
                  <p className="text-[5.5px] text-white/45">秋招冲刺</p>
                  <p className="mt-0.5 text-[6.5px] font-medium leading-[1.5] text-white/85">
                    今天有 3 个截止
                  </p>
                </div>
              </aside>

              {/* 主区域 */}
              <div className="flex min-w-0 flex-1 flex-col gap-2 bg-[#f3f6fc] p-2.5">
                {/* 顶栏 */}
                <div className="flex items-center justify-between gap-2 rounded-[5px] border border-[#e4eaf5] bg-white px-2 py-1.5">
                  <span className="flex items-center gap-0.5 text-[7.5px] font-semibold text-[#0f172a]">
                    仪表盘
                    <ChevronDown size={6} className="text-[#9aa8bd]" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-4 w-[88px] items-center gap-1 rounded-full bg-[#f1f5fc] px-1.5 text-[5.5px] text-[#9aa8bd]">
                      <Search size={5} />
                      搜索岗位、公司
                    </span>
                    <Bell size={6.5} className="text-[#9aa8bd]" />
                    <span className="size-[15px] rounded-full bg-[linear-gradient(135deg,#93c5fd,#2563eb)] ring-1 ring-white" />
                  </div>
                </div>

                {/* 四张指标卡 */}
                <div className="grid grid-cols-4 gap-1.5">
                  {overview.map(({ label, value, icon: Icon, color, bg }) => (
                    <div
                      key={label}
                      className="rounded-[5px] border border-[#e4eaf5] bg-white px-1.5 py-1.5"
                    >
                      <div className="flex items-center gap-1">
                        <span
                          className="grid size-[13px] place-items-center rounded-[3px]"
                          style={{ backgroundColor: bg, color }}
                        >
                          <Icon size={7} strokeWidth={2} />
                        </span>
                        <span className="truncate text-[5.5px] text-[#8a97ab]">{label}</span>
                      </div>
                      <p className="mt-1 text-[10.5px] font-bold leading-none text-[#0f172a]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* 图表 */}
                <div className="grid grid-cols-[1.06fr_1fr] gap-1.5">
                  <div className="rounded-[5px] border border-[#e4eaf5] bg-white p-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[6.5px] font-semibold text-[#0f172a]">投递转化漏斗</p>
                      <span className="text-[5.5px] text-[#9aa8bd]">近 30 天</span>
                    </div>
                    <div className="mt-2 flex flex-col gap-[3px]">
                      {funnel.map((item) => (
                        <span
                          key={item.label}
                          className="mx-auto flex h-[15px] items-center justify-between px-1.5 text-[5.5px] font-medium text-white"
                          style={{
                            width: item.width,
                            background: item.background,
                            clipPath: "polygon(0 0, 100% 0, 96% 100%, 4% 100%)",
                          }}
                        >
                          {item.label}
                          <span className="opacity-90">{item.value}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[5px] border border-[#e4eaf5] bg-white p-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[6.5px] font-semibold text-[#0f172a]">投递趋势</p>
                      <span className="text-[5.5px] text-[#9aa8bd]">近 30 天</span>
                    </div>
                    <svg viewBox="0 0 200 78" className="mt-1.5 w-full" aria-hidden="true">
                      <defs>
                        <linearGradient id="trend-area" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {[18, 38, 58].map((y) => (
                        <line
                          key={y}
                          x1="0"
                          y1={y}
                          x2="200"
                          y2={y}
                          stroke="#eef2f9"
                          strokeDasharray="2 3"
                        />
                      ))}
                      <path
                        d="M0 60 L25 48 L50 54 L75 36 L100 42 L125 24 L150 30 L175 16 L200 22 L200 78 L0 78 Z"
                        fill="url(#trend-area)"
                      />
                      <path
                        d="M0 60 L25 48 L50 54 L75 36 L100 42 L125 24 L150 30 L175 16 L200 22"
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="175" cy="16" r="2" fill="#ffffff" stroke="#2563eb" strokeWidth="1.2" />
                    </svg>
                  </div>
                </div>

                {/* 最近投递 + 面试日历 */}
                <div className="grid grid-cols-[1fr_1.04fr] gap-1.5">
                  <div className="rounded-[5px] border border-[#e4eaf5] bg-white p-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[6.5px] font-semibold text-[#0f172a]">最近投递</p>
                      <span className="text-[5.5px] text-[#2563eb]">查看全部</span>
                    </div>
                    <div className="mt-1">
                      {recent.map((item) => (
                        <div
                          key={item.role}
                          className="flex items-center gap-1.5 border-t border-[#f1f4fa] py-[5px] first:border-t-0 first:pt-0.5"
                        >
                          <span
                            className="grid size-[15px] shrink-0 place-items-center rounded-[4px] text-[6px] font-semibold text-white"
                            style={{ backgroundColor: item.color }}
                          >
                            {item.initial}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[6px] font-medium leading-tight text-[#1c2739]">
                              {item.role}
                            </p>
                            <p className="text-[5.5px] leading-tight text-[#98a5b8]">
                              {item.company}
                            </p>
                          </div>
                          <span className={cn("rounded-full px-1.5 py-[1px] text-[5px]", item.badge)}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[5px] border border-[#e4eaf5] bg-white p-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[6.5px] font-semibold text-[#0f172a]">面试日历</p>
                      <span className="text-[5.5px] text-[#9aa8bd]">2026年10月 ›</span>
                    </div>
                    <div className="mt-1 grid grid-cols-7 place-items-center gap-y-[1px]">
                      {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
                        <span key={day} className="text-[5px] text-[#a3afc1]">
                          {day}
                        </span>
                      ))}
                      {calendarCells.map((day, index) => (
                        <span
                          key={index}
                          className={cn(
                            "flex size-[11px] items-center justify-center rounded-full text-[5.5px]",
                            day === 17
                              ? "bg-[#2563eb] font-semibold text-white"
                              : "text-[#59677c]",
                          )}
                        >
                          {day ?? ""}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1 flex items-center gap-1 rounded-[3px] bg-[#eef4ff] px-1 py-[3px] text-[5.5px] text-[#2563eb]">
                      <Clock3 size={5.5} />
                      下午 3:00 产品经理面试
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* 浮动提示卡 */}
          <div className="dash-chip pointer-events-none absolute -left-2 -top-5 z-20 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[linear-gradient(120deg,#5ea2ff,#2f6bff_58%,#2563eb)] px-2.5 py-1.5 text-[9px] font-medium text-white shadow-[0_10px_28px_-6px_rgba(37,99,235,0.85)] sm:-left-6 sm:-top-8 sm:text-[10px]">
            <span className="grid size-4 place-items-center rounded-full bg-white/25">
              <Bell size={8} strokeWidth={2} />
            </span>
            截止前 3 天提醒
            <X size={7} strokeWidth={2} className="ml-0.5 opacity-70" />
          </div>

          <div className="dash-chip pointer-events-none absolute -right-2 top-[27%] z-20 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/95 px-2.5 py-1.5 text-[9px] font-medium text-[#0f172a] shadow-[0_10px_28px_-8px_rgba(2,10,32,0.75)] backdrop-blur sm:-right-5 sm:text-[10px]">
            <span className="grid size-4 place-items-center rounded-[4px] bg-[#e8f0ff] text-[#2563eb]">
              <CalendarDays size={8} strokeWidth={2} />
            </span>
            面试日历已同步
          </div>

          <div className="dash-chip pointer-events-none absolute -bottom-4 -right-1 z-20 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/95 px-2.5 py-1.5 text-[9px] font-medium text-[#0f172a] shadow-[0_10px_28px_-8px_rgba(2,10,32,0.75)] backdrop-blur sm:-right-5 sm:text-[10px]">
            <span className="grid size-4 place-items-center rounded-[4px] bg-[#e8f0ff] text-[#2563eb]">
              <FileText size={8} strokeWidth={2} />
            </span>
            简历匹配 <span className="font-semibold text-[#2563eb]">82</span> 分
          </div>
        </div>
      </div>
    </div>
  );
}
