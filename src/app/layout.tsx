import type { Metadata } from "next";
import { JikedaoMiniProgramBridge } from "@/components/JikedaoMiniProgramBridge";
import { getSiteUrl } from "@/lib/siteUrl";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "旅途 - 一站式高性价比旅行服务平台",
    template: "%s · 旅途",
  },
  description:
    "旅途提供酒店、机票、火车、门票、用车、旅行团与定制旅行服务。先查看旅途预估，再由旅行顾问人工确认实际可订方案。",
  applicationName: "旅途",
  keywords: ["旅行", "酒店", "机票", "旅行团", "定制旅行", "旅行服务"],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "旅途",
    title: "旅途 - 去更远的地方，见更大的世界",
    description: "住得更好，花得更少，旅行更省心。",
    images: [{ url: "/logo.png", width: 1024, height: 1024, alt: "旅途" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "旅途 - 去更远的地方，见更大的世界",
    description: "一站式高性价比旅行服务平台。",
    images: ["/logo.png"],
  },
  icons: [
    { rel: "icon", url: "/logo.png", type: "image/png" },
    { rel: "apple-touch-icon", url: "/logo.png" },
  ],
  alternates: { canonical: "/" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full bg-[#f0f4f8] text-[#0f172a]">
        <JikedaoMiniProgramBridge />
        {children}
      </body>
    </html>
  );
}
