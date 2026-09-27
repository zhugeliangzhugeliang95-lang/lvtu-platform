"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, User, Phone, MapPin, Calendar, Users,
  Wallet, CheckCircle2, Loader2, AlertCircle,
} from "lucide-react";

interface OrderSummary {
  id: string;
  destination: string;
  checkInDate: string | null;
  checkOutDate: string | null;
  nights: number | null;
  roomCount: number;
  guestCount: number;
  budget: string | null;
  hotelPreference: string | null;
  breakfastIncluded: boolean | null;
  cancellable: boolean | null;
  notes: string | null;
  aiFollowUpQuestion: string | null;
}

function formatDate(s: string | null) {
  if (!s) return "-";
  return new Date(s).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
}

export default function ConfirmPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/inquiry/${id}`)
      .then((r) => r.json())
      .then((d) => setOrder(d.order ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  function validate() {
    let ok = true;
    if (!name.trim()) {
      setNameError("请填写姓名");
      ok = false;
    } else setNameError("");
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setPhoneError("请输入正确的手机号");
      ok = false;
    } else setPhoneError("");
    return ok;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/inquiry/${id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactName: name.trim(), contactPhone: phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "提交失败");
      router.push(`/inquiry/${id}/success`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "提交失败";
      setPhoneError(msg);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f4ff] flex items-center justify-center">
        <Loader2 size={28} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f0f4ff] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={32} className="text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">询价单不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4ff]">
      {/* 顶部 */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button type="button" onClick={() => router.back()} className="p-1 -ml-1 text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-semibold text-gray-800 flex-1">确认信息</h1>
      </div>

      <div className="px-4 pb-32 pt-4 space-y-4">
        {/* 需求确认卡 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-800 mb-4">您的出行需求</p>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <MapPin size={13} className="text-blue-500" />
              </div>
              <div className="flex-1">
                <span className="text-gray-500 text-xs">目的地</span>
                <p className="text-gray-800 font-medium">{order.destination || "-"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Calendar size={13} className="text-blue-500" />
              </div>
              <div className="flex-1">
                <span className="text-gray-500 text-xs">入住 / 离店</span>
                <p className="text-gray-800 font-medium">
                  {formatDate(order.checkInDate)} — {formatDate(order.checkOutDate)}
                  {order.nights ? `（${order.nights}晚）` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Users size={13} className="text-blue-500" />
              </div>
              <div className="flex-1">
                <span className="text-gray-500 text-xs">人数 / 房间</span>
                <p className="text-gray-800 font-medium">{order.guestCount}人 / {order.roomCount}间</p>
              </div>
            </div>

            {order.budget && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Wallet size={13} className="text-blue-500" />
                </div>
                <div className="flex-1">
                  <span className="text-gray-500 text-xs">预算</span>
                  <p className="text-gray-800 font-medium">{order.budget}</p>
                </div>
              </div>
            )}

            {/* 偏好标签 */}
            <div className="flex flex-wrap gap-2 pt-1">
              {order.hotelPreference && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg">{order.hotelPreference}</span>
              )}
              {order.breakfastIncluded === true && (
                <span className="text-xs bg-green-50 text-green-600 px-2.5 py-1 rounded-lg">含早餐</span>
              )}
              {order.cancellable === true && (
                <span className="text-xs bg-teal-50 text-teal-600 px-2.5 py-1 rounded-lg">可取消</span>
              )}
            </div>

            {order.notes && (
              <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">备注：{order.notes}</p>
            )}
          </div>
        </div>

        {/* 联系方式填写 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-800 mb-1">填写联系方式</p>
          <p className="text-xs text-gray-400 mb-4">顾问将通过手机联系您确认报价，不会泄露给第三方</p>

          <div className="space-y-4">
            {/* 姓名 */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <User size={14} className="text-gray-400" />
                <label className="text-sm text-gray-600">您的姓名</label>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError("");
                }}
                placeholder="请输入姓名"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
                  nameError ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-blue-400"
                }`}
              />
              {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
            </div>

            {/* 手机号 */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Phone size={14} className="text-gray-400" />
                <label className="text-sm text-gray-600">手机号码</label>
              </div>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 11));
                  setPhoneError("");
                }}
                placeholder="请输入手机号"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
                  phoneError ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-blue-400"
                }`}
              />
              {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
            </div>
          </div>
        </div>

        {/* 承诺说明 */}
        <div className="space-y-2">
          {[
            "提交后顾问在 30 分钟内联系您",
            "服务完全免费，无需预付",
            "您的信息仅用于本次询价服务",
          ].map((text) => (
            <div key={text} className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 底部 CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3 pb-6 shadow-lg">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-2xl text-base shadow-md active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              提交中...
            </>
          ) : (
            "确认提交需求"
          )}
        </button>
      </div>
    </div>
  );
}
