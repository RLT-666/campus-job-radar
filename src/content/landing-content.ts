export const landingContent = {
  brand: "校招雷达",
  nav: [
    { label: "产品", href: "#product" },
    { label: "功能", href: "#features" },
    { label: "使用场景", href: "#scenarios" },
    { label: "常见问题", href: "#faq" },
  ],
  login: { label: "登录", href: "/login" },
  signup: { label: "免费开始", href: "/login" },
  badge: ["校园求职一站式工具", "已服务 1.2 万同学"],
  titleLines: ["校招季不迷路", "一个页面管好整季投递"],
  description:
    "岗位聚合、截止提醒、投递看板、简历诊断，把散落的秋招信息收进一条时间线",
  primaryCta: { label: "免费开始使用", href: "/login" },
  secondaryCta: { label: "看 2 分钟演示", href: "#product" },
  stats: [
    { key: "sources", value: "128", unit: "个", label: "岗位来源" },
    { key: "openings", value: "2400+", unit: "", label: "在招岗位" },
    { key: "reminders", value: "98%", unit: "", label: "提醒准时" },
  ],
  sources: ["腾讯", "字节跳动", "华为", "中建集团", "某银行", "招商证券"],
} as const;
