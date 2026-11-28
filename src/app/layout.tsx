import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Manrope, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

// 首页中文无衬线字体：标题与正文（自托管，按 unicode-range 分片加载）
const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

// 编辑风衬线字体：登录页大标题与卡片标题使用（自托管，按 unicode-range 分片加载）
const notoSerifSC = Noto_Serif_SC({
  variable: "--font-serif-sc",
  weight: ["600", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "校招雷达 · 别再错过任何一个截止日期",
  description: "把分散在各校就业网、公众号与企业官网的校招信息收进一张时间线，截止前 3 天自动提醒。",
  // PWA 清单与图标（W2 交付物：手机端可添加到桌面）
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "校招雷达",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // 浏览器 UI 主题色：克莱因蓝（与登录页/看板主色一致）
  themeColor: "#002fa7",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} ${notoSansSC.variable} ${notoSerifSC.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
