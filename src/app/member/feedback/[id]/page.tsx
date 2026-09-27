import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/Container";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/userAuth";

function parseImages(value: string | null) {
  if (!value) return [];
  try {
    const arr = JSON.parse(value);
    if (Array.isArray(arr)) return arr.filter((x) => typeof x === "string");
  } catch {}
  return [];
}

export default async function MemberFeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser("/member/feedback");
  const { id } = await params;
  const fb = await prisma.feedback.findFirst({ where: { id, userId } });
  if (!fb) notFound();

  const images = parseImages(fb.images);

  return (
    <Container>
      <div className="py-10">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">Feedback Detail</div>
              <h1 className="mt-2 text-2xl font-semibold text-white">{fb.title}</h1>
              <div className="mt-2 text-sm text-white/62">
                {fb.feedbackType} · {fb.status} · {new Date(fb.createdAt).toLocaleString("zh-CN", { hour12: false })}
              </div>
            </div>
            <Link href="/member/feedback" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
              返回反馈列表 →
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-semibold text-white">内容</div>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/66">{fb.content}</div>
            </div>

            {images.length ? (
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <div className="text-sm font-semibold text-white">图片</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {images.slice(0, 6).map((src) => (
                    <a key={src} href={src} target="_blank" rel="noreferrer" className="block">
                      <img src={src} alt="" className="w-full rounded-2xl border border-white/10" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-semibold text-white">处理进度</div>
              <div className="mt-3 text-sm text-white/66">当前状态：{fb.status}</div>
              <div className="mt-2 text-xs text-white/46">所有反馈都必须有状态：未处理 / 处理中 / 已回复 / 已关闭。</div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-semibold text-white">回复</div>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/66">{fb.replyContent || "暂未回复"}</div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

