import Link from "next/link";

import { AdminLoginForm } from "@/app/admin/login/ui";

export const metadata = { title: "后台登录 · 旅途" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = next && next.startsWith("/") ? next : "/admin/hotel";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f8ff]">
      {/* 品牌背景装饰 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg,#eaf1ff 0%,#f5f8ff 55%,#fff3e8 100%)",
          }}
        />
        <div className="absolute -top-40 -right-32 h-[520px] w-[520px] rounded-full bg-[#0b4fd8]/10 blur-3xl" />
        <div className="absolute top-40 -left-32 h-[420px] w-[420px] rounded-full bg-[#ff7a1a]/12 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-[1240px] flex-col px-6 py-8">
        {/* 顶栏 */}
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-[#0b1f4a]">
            <div
              className="shrink-0 overflow-hidden"
              style={{ width: 40, height: 40 }}
            >
              <img
                src="/logo.png"
                alt="旅途"
                width={40}
                height={40}
                draggable={false}
                className="select-none"
                style={{
                  width: 40,
                  height: 40,
                  objectFit: "contain",
                }}
              />
            </div>
            <span className="text-[18px] font-semibold tracking-tight">
              旅途
            </span>
            <span className="ml-1 rounded-md bg-white/70 px-2 py-0.5 text-[11px] font-medium text-[#0b4fd8] ring-1 ring-[#0b4fd8]/15">
              线索后台
            </span>
          </Link>
          <Link
            href="/"
            className="text-[13px] text-[#475467] transition hover:text-[#0b4fd8]"
          >
            ← 返回前台
          </Link>
        </header>

        {/* 主体 */}
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[420px] rounded-[28px] border border-white bg-white p-8 shadow-[0_30px_60px_-24px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.03]">
            <h2 className="text-[20px] font-semibold text-[#0b1f4a]">
              后台登录
            </h2>
            <p className="mt-1 text-[13px] text-[#667085]">
              输入账号密码进入旅途酒店线索后台。
            </p>
            <div className="mt-6">
              <AdminLoginForm nextPath={nextPath} />
            </div>
          </div>
        </div>

        <footer className="text-center text-[12px] text-[#98a2b3]">
          旅途 · 酒店代订询价获客平台
        </footer>
      </div>
    </div>
  );
}
