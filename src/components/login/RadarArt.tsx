// 静态雷达插图：3D 版加载前 / WebGL 不可用 / reduced-motion 时的回退
export default function RadarArt() {
  return (
    <svg
      viewBox="0 0 320 172"
      role="img"
      aria-label="校招雷达插图"
      className="h-auto w-[236px] sm:w-[280px] md:w-[232px] xl:w-[360px]"
    >
      <defs>
        <linearGradient id="radar-wedge" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b6cf5" />
          <stop offset="100%" stopColor="#9cc6ff" />
        </linearGradient>
        <filter id="radar-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#6d97ef" floodOpacity="0.26" />
        </filter>
      </defs>

      <g filter="url(#radar-shadow)">
        <circle cx="146" cy="96" r="66" fill="none" stroke="#d5e4fa" strokeWidth="1.6" />
        <circle cx="146" cy="96" r="52" fill="none" stroke="#c2d7f8" strokeWidth="1.6" />
        <circle cx="146" cy="96" r="38" fill="none" stroke="#a9c7f7" strokeWidth="1.6" />
        <path d="M146 30v132M80 96h132" stroke="#dbe8fc" strokeWidth="1" />
        <path
          d="M146 58l-24 22M146 58l24 22M146 134l-24-22M146 134l24-22"
          stroke="#e3eefc"
          strokeWidth="1"
        />
        <path d="M146 96L204 62a66 66 0 0 1 8 34Z" fill="url(#radar-wedge)" opacity="0.82" />
        <circle cx="146" cy="96" r="7" fill="#ffffff" stroke="#3b6cf5" strokeWidth="3" />
        <circle cx="146" cy="96" r="2.2" fill="#3b6cf5" />
      </g>

      <g filter="url(#radar-shadow)">
        <circle cx="240" cy="42" r="24" fill="#ffffff" stroke="#e2ebfa" />
        <rect x="228" y="32" width="24" height="19" rx="4" fill="#eef5ff" stroke="#4f7df6" strokeWidth="2" />
        <path
          d="M229 35l11 8 11-8"
          fill="none"
          stroke="#4f7df6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      <path
        d="M212 122c20-10 36-6 46-24"
        fill="none"
        stroke="#aac7f7"
        strokeWidth="1.5"
        strokeDasharray="3 5"
        strokeLinecap="round"
      />
      <g transform="translate(258 84) rotate(12)" filter="url(#radar-shadow)">
        <path d="M0 9L27 0L17 21L11 12Z" fill="#ffffff" stroke="#6f97ef" strokeWidth="1.6" strokeLinejoin="round" />
      </g>
    </svg>
  )
}
