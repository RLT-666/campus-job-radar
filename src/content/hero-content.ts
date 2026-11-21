export const heroContent = {
  brand: {
    name: "SIGNAL / 01",
    descriptor: "GLOBAL CAREER INTELLIGENCE",
    field: "FIELD — 001",
  },
  eyebrow: "CAREER INTELLIGENCE / FOR WHAT COMES NEXT",
  titleLines: ["Before the title,", "there is a signal."],
  description:
    "Discover roles, research paths, and early teams aligned with where you want to go—not just the keywords you already know.",
  actions: [
    { label: "Find your signal", href: "/cjr", intent: "primary" as const },
    { label: "Member access", href: "/login", intent: "secondary" as const },
  ],
  meta: {
    audience: "STUDENTS + NEW GRADUATES · GLOBAL BY DESIGN",
    disciplines: "ROLES / RESEARCH / EARLY TEAMS",
  },
  media: {
    video: "/media/aurora-signal.mp4",
    poster: "/media/aurora-signal-poster.webp",
  },
} as const;
