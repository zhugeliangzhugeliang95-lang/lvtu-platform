"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, ExternalLink, Coffee, RotateCcw,
  TrendingDown, Info, ChevronRight, Loader2, AlertCircle,
} from "lucide-react";

interface PriceRef {
  id: string;
  platform: string;
  hotelName: string;
  roomType: string | null;
  pricePerNight: number;
  totalPrice: number | null;
  breakfastIncluded: boolean;
  cancellable: boolean;
  sourceUrl: string | null;
  isMock: boolean;
  source?: string;
}

interface OrderDetail {
  id: string;
  status: string;
  destination: string;
  checkInDate: string | null;
  checkOutDate: string | null;
  nights: number | null;
  roomCount: number | null;
  guestCount: number | null;
  priceReferences: PriceRef[];
}

const PLATFORM_COLORS: Record<string, string> = {
  美团: "bg-yellow-50 text-yellow-700 border-yellow-200",
  携程: "bg-blue-50 text-blue-700 border-blue-200",
  飞猪: "bg-orange-50 text-orange-700 border-orange-200",
  同程: "bg-green-50 text-green-700 border-green-200",
};

const PLATFORM_ICONS: Record<string, string> = {
  美团: "🟡",
  携程: "🔵",
  飞猪: "🟠",
  同程: "🟢",
};

function yuan(fen: number) {
  return Math.round(fen / 100);
}

function formatDate(s: string | null) {
  if (!s) return "";
  return new Date(s).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
}

export default function PricesPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadOrder() {
    try {
      const res = await fetch(`/api/inquiry/${id}/prices`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrder(data);

      // 如果价格还没生成（状态不对），轮询等待
      if (data.priceReferences.length === 0) {
        setPolling(true);
        pollForPrices();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function pollForPrices() {
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/inquiry/${id}/prices`);
        const data = await res.json();
        if (data.priceReferences?.length > 0) {
          setOrder(data);
          setPolling(false);
          clearInterval(timer);
        } else if (attempts >= 10) {
          setPolling(false);
          clearInterval(timer);
        }
      } catch {
        if (attempts >= 10) {
          setPolling(false);
          clearInterval(timer);
        }
      }
    }, 1500);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f4ff] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-blue-500 animate-spin" />
          <p className="text-sm text-gray-500">正在获取价格...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f0f4ff] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle size={32} className="text-gray-400" />
          <p className="text-sm text-gray-500">询价单不存在</p>
        </div>
      </div>
    );
  }

  const prices = order.priceReferences ?? [];
  const minPrice = prices.length > 0 ? Math.min(...prices.map((p) => p.pricePerNight)) : null;
  const avgPrice = prices.length > 0
    ? Math.round(prices.reduce((s, p) => s + p.pricePerNight, 0) / prices.length)
    : null;

  return (
    <div className="min-h-screen bg-[#f0f4ff]">
      {/* 顶部导航 */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button type="button" onClick={() => router.back()} className="p-1 -ml-1 text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-semibold text-gray-800 flex-1">参考价格</h1>
        <span className="text-xs text-gray-400">{order.destination}</span>
      </div>

      <div className="px-4 pb-32 pt-4 space-y-4">
        {/* 行程摘要 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
            <span className="font-semibold text-gray-800">{order.destination}</span>
            {order.checkInDate && order.checkOutDate && (
              <>
                <span className="text-gray-300">·</span>
                <span>{formatDate(order.checkInDate)} — {formatDate(order.checkOutDate)}</span>
                {order.nights && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span>{order.nights}晚</span>
                  </>
                )}
              </>
            )}
          </div>
          {(order.roomCount || order.guestCount) && (
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              {order.roomCount && (
                <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                  🛏 {order.roomCount} 间客房
                </span>
              )}
              {order.guestCount && (
                <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                  👤 {order.guestCount} 位旅客
                </span>
              )}
            </div>
          )}
        </div>

        {/* 说明横幅 */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">价格来源说明</p>
              <p className="text-xs text-blue-600 leading-relaxed">
                这里只展示带明确来源链接的公开平台价格；没有来源的估算价不会展示。旅途顾问会继续确认实际可订价格。
              </p>
            </div>
          </div>
        </div>

        {/* 价格汇总 */}
        {avgPrice && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-xs text-gray-500 mb-1">平台均价</p>
              <p className="text-2xl font-bold text-gray-800">¥{yuan(avgPrice)}</p>
              <p className="text-xs text-gray-400">/晚</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 shadow-sm text-center text-white">
              <p className="text-xs text-blue-100 mb-1">平台最低价</p>
              <p className="text-2xl font-bold">¥{yuan(minPrice!)}</p>
              <p className="text-xs text-blue-200">/晚</p>
            </div>
          </div>
        )}

        {/* 价格列表 */}
        {polling ? (
          <div className="flex items-center gap-3 bg-white rounded-2xl p-5 shadow-sm">
            <Loader2 size={20} className="text-blue-500 animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">正在查询各平台价格</p>
              <p className="text-xs text-gray-400 mt-1">美团 · 携程 · 飞猪 · 同程</p>
            </div>
          </div>
        ) : prices.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 font-medium px-1">可核验平台价格</p>
            {prices.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs px-2 py-1 rounded-lg border font-medium ${
                        PLATFORM_COLORS[p.platform] ?? "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      {PLATFORM_ICONS[p.platform] ?? "⚪"} {p.platform}
                    </span>
                    {p.source ? (
                      <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">可核验来源</span>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">¥{yuan(p.pricePerNight)}</p>
                    <p className="text-xs text-gray-400">/晚</p>
                  </div>
                </div>

                <p className="text-sm text-gray-700 font-medium mb-1">{p.hotelName}</p>
                {p.roomType && <p className="text-xs text-gray-500 mb-2">{p.roomType}</p>}

                <div className="flex items-center gap-3 text-xs">
                  <span className={`flex items-center gap-1 ${p.breakfastIncluded ? "text-green-600" : "text-gray-400"}`}>
                    <Coffee size={11} />
                    {p.breakfastIncluded ? "含早" : "不含早"}
                  </span>
                  <span className={`flex items-center gap-1 ${p.cancellable ? "text-green-600" : "text-gray-400"}`}>
                    <RotateCcw size={11} />
                    {p.cancellable ? "可取消" : "不可取消"}
                  </span>
                  {order.nights && p.totalPrice && (
                    <span className="text-gray-400 ml-auto">
                      共 {order.nights} 晚约 ¥{yuan(p.totalPrice)}
                    </span>
                  )}
                </div>
                {p.sourceUrl && (
                  <a
                    href={p.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-1 text-xs text-blue-500 bg-blue-50 rounded-xl py-2 active:bg-blue-100"
                  >
                    <ExternalLink size={11} />
                    去 {p.platform} 查看
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <p className="text-sm text-gray-500">暂未拿到可核验的平台价格</p>
            <p className="mt-1 text-xs text-gray-400">没有明确来源的估算价不会展示，可继续等待旅途顾问确认报价。</p>
          </div>
        )}

        {/* 旅途优势说明 */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={18} />
            <p className="font-semibold">旅途能帮您做什么？</p>
          </div>
          <ul className="space-y-2 text-sm text-blue-100">
            <li>· 对接协议酒店和集采渠道，寻找低于公开售价的报价</li>
            <li>· 专业顾问 1 对 1 跟进，确认最终价格和房型</li>
            <li>· 无隐藏费用，确认后锁定价格</li>
            <li>· 出行全程有顾问保障</li>
          </ul>
          <p className="text-xs text-blue-200 mt-3 italic">
            * 最终价格以顾问确认为准，不作绝对保证
          </p>
        </div>

        {/* 平台声明 */}
        <div className="flex items-start gap-2 text-xs text-gray-400 px-1">
          <ExternalLink size={12} className="flex-shrink-0 mt-0.5" />
          <p>价格只展示带明确来源链接的公开平台信息，实际售价、库存和退改规则以最终确认方案为准。</p>
        </div>
      </div>

      {/* 底部 CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3 pb-6 shadow-lg">
        <p className="text-center text-xs text-gray-400 mb-3">
          已了解参考价格，让我们帮您找更低价的方案
        </p>
        <button
          type="button"
          onClick={() => router.push(`/inquiry/${id}/service`)}
          className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-2xl text-base shadow-md active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          让旅途帮我找低价
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
