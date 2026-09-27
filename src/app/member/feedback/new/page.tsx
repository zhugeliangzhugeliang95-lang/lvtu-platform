import Link from "next/link";

import { Container } from "@/components/Container";
import { FeedbackForm } from "@/app/member/feedback/new/ui";
import { requireUser } from "@/lib/userAuth";

export default async function NewFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; leadId?: string }>;
}) {
  await requireUser("/member/feedback/new");
  const { orderId, leadId } = await searchParams;

  return (
    <Container>
      <div className="py-10">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">Submit Feedback</div>
              <h1 className="mt-2 text-3xl font-semibold text-white">提交反馈</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/66">
                反馈默认进入待处理池，后台会更新状态并回复你。
              </p>
            </div>
            <Link href="/member/feedback" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
              返回反馈列表 →
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <FeedbackForm orderId={orderId} leadId={leadId} />
          </div>
          <div className="lg:col-span-2">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-semibold text-white">状态说明</div>
              <div className="mt-3 text-sm leading-7 text-white/66">
                未处理 → 处理中 → 已回复 → 已关闭。你可以在“我的反馈”里查看进度。
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

