"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => { console.error("Lvtu global error", error); }, [error]);
  return <html lang="zh-CN"><body style={{ margin: 0, background: "#edf4fb", color: "#0d315d", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}><main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20, boxSizing: "border-box" }}><section style={{ width: "100%", maxWidth: 440, boxSizing: "border-box", borderRadius: 28, background: "white", padding: 28, textAlign: "center", boxShadow: "0 24px 70px rgba(13,49,93,.12)" }}><img src="/logo-mark.png" alt="旅途" width="56" height="56" style={{ borderRadius: 18 }} /><p style={{ margin: "20px 0 0", color: "#1769e0", fontSize: 11, fontWeight: 700, letterSpacing: ".16em" }}>LVTU SERVICE</p><title>服务暂时不可用 · 旅途</title><h1 style={{ margin: "8px 0 0", fontSize: 24 }}>服务暂时不可用</h1><p style={{ margin: "12px 0 0", color: "#667085", fontSize: 13, lineHeight: 1.8 }}>我们已经记录这个问题。请稍后重试，你的订单和需求数据不会因此丢失。</p>{error.digest?<p style={{ color: "#98a2b3", fontSize: 10 }}>问题编号：{error.digest}</p>:null}<button type="button" onClick={() => unstable_retry()} style={{ marginTop: 24, minHeight: 48, width: "100%", border: 0, borderRadius: 15, background: "#1769e0", color: "white", fontWeight: 700 }}>重新加载</button><Link href="/" style={{ display: "inline-block", marginTop: 18, color: "#1769e0", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>返回旅途首页</Link></section></main></body></html>;
}
