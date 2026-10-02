import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

import { Container } from "@/components/Container";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/userAuth";

const STATUS_LABEL: Record<string, string> = {
  NEW: "已提交",
  AI_COLLECTING: "补充信息",
  PRICE_REFERENCE_READY: "参考价已出",
  WAITING_USER_CONFIRM: "待确认",
  WAITING_CONTACT_INFO: "待留联系方式",
  WAITING_PAYMENT: "待付款",
  PAID: "已支付",
  WAITING_PROCUREMENT: "供应商询价中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
  ABNORMAL: "需人工处理",
};

export default async function MemberInquiriesPage() {
  const userId = await requireUser("/member/inquiries");
  const inquiries = await prisma.inquiryOrder.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 80,
    include: {
      priceReferences: {
        orderBy: { totalPrice: "asc" },
        take: 1,
      },
      xianYuTasks: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return (
    <Container>
      <main className="pb-24 pt-6">
        <header className="flex items-center gap-3">
          <Link href="/member" className="grid size-10 place-items-center rounded-full bg-white shadow-sm ring-1 ring-black/[0.04]">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-950">我的报价进度</h1>
            <p className="text-xs text-gray-500">查看顾问确认、最终报价和订单处理状态</p>
          </div>
        </header>

        <section className="mt-5 grid gap-3">
          {inquiries.map((item) => {
            const minPrice = item.priceReferences[0]?.totalPrice;
            const xianyuTask = item.xianYuTasks[0];
            const href = xianyuTask
              ? `/inquiry/${item.id}/supplier-quote?taskId=${xianyuTask.id}`
              : `/inquiry/${item.id}/prices`;

            return (
              <Link key={item.id} href={href} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-gray-950">{item.destination}</div>
                    <div className="mt-1 text-xs leading-5 text-gray-500">
                      {item.checkInDate ? new Date(item.checkInDate).toLocaleDateString("zh-CN") : "未填日期"}
                      {item.nights ? ` · ${item.nights}晚` : ""}
                      {item.roomCount ? ` · ${item.roomCount}间` : ""}
                    </div>
                    <div className="mt-1 text-xs text-gray-400">订单号：{item.orderNo}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600">
                      {STATUS_LABEL[item.status] || item.status}
                    </span>
                    <div className="mt-2 text-sm font-semibold text-orange-600">
                      {minPrice ? `¥${Math.round(minPrice / 100)}` : ""}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {!inquiries.length ? (
            <div className="rounded-[28px] bg-white p-6 text-center shadow-sm ring-1 ring-black/[0.04]">
              <FileText className="mx-auto text-blue-600" size={28} />
              <div className="mt-3 font-semibold text-gray-950">还没有报价进度</div>
              <p className="mt-2 text-sm text-gray-500">让旅途帮你报价后，会在这里看到处理状态。</p>
              <Link
                href="/inquiry"
                className="mt-4 inline-flex rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white"
              >
                去提交问价
              </Link>
            </div>
          ) : null}
        </section>
      </main>
    </Container>
  );
}
