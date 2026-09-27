import Link from "next/link";

import { Container } from "@/components/Container";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/userAuth";

export default async function MemberFeedbackPage() {
  const userId = await requireUser("/member/feedback");
  const items = await prisma.feedback.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <Container>
      <div className="py-10">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">My Feedback</div>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <h1 className="text-3xl font-semibold text-white">我的反馈</h1>
            <div className="flex items-center gap-3">
              <Link
                href="/member/feedback/new"
                className="inline-flex h-10 items-center justify-center rounded-full bg-cyan-400 px-4 text-sm font-semibold text-slate-950"
              >
                提交反馈
              </Link>
              <Link href="/member" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
                返回用户中心 →
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          {items.map((f) => (
            <Link
              key={f.id}
              href={`/member/feedback/${f.id}`}
              className="rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:border-cyan-300/30"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-white">{f.title}</div>
                  <div className="mt-1 text-sm text-white/62">{f.feedbackType}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/46">状态</div>
                  <div className="mt-1 text-sm font-semibold text-cyan-200">{f.status}</div>
                </div>
              </div>
              <div className="mt-3 text-sm text-white/62 line-clamp-2">{f.content}</div>
              <div className="mt-3 text-xs text-white/42">{new Date(f.createdAt).toLocaleString("zh-CN", { hour12: false })}</div>
            </Link>
          ))}

          {!items.length ? (
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 text-sm leading-7 text-white/66">
              暂无反馈记录。
              <div className="mt-4">
                <Link
                  href="/member/feedback/new"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-cyan-400 px-5 text-sm font-semibold text-slate-950"
                >
                  提交反馈
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Container>
  );
}

