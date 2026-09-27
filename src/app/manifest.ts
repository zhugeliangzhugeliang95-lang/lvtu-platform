import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "旅途旅行服务平台",
    short_name: "旅途",
    description: "去更远的地方，见更大的世界。",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f8fc",
    theme_color: "#1769e0",
    lang: "zh-CN",
    icons: [{ src: "/logo.png", sizes: "1024x1024", type: "image/png", purpose: "any" }],
  };
}
