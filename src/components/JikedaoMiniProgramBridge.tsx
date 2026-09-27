"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    wx?: {
      miniProgram?: {
        getEnv?: (callback: (result: { miniprogram: boolean }) => void) => void;
        navigateBack?: (options?: { delta?: number }) => void;
      };
    };
  }
}

function loadWechatBridge() {
  if (document.querySelector('script[data-jikedao-weixin-bridge]')) return;
  const script = document.createElement("script");
  script.src = "https://res.wx.qq.com/open/js/jweixin-1.6.0.js";
  script.async = true;
  script.dataset.jikedaoWeixinBridge = "true";
  document.head.appendChild(script);
}

export function JikedaoMiniProgramBridge() {
  const [visible, setVisible] = useState(false);
  const [inMiniProgram, setInMiniProgram] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("source") !== "jikedao") return;
    const visibilityTimer = window.setTimeout(() => setVisible(true), 0);
    loadWechatBridge();

    const detect = () => {
      window.wx?.miniProgram?.getEnv?.((result) => setInMiniProgram(Boolean(result.miniprogram)));
    };
    detect();
    document.addEventListener("WeixinJSBridgeReady", detect);
    const timer = window.setTimeout(detect, 500);
    return () => {
      window.clearTimeout(visibilityTimer);
      window.clearTimeout(timer);
      document.removeEventListener("WeixinJSBridgeReady", detect);
    };
  }, []);

  if (!visible) return null;

  const goBack = () => {
    if (inMiniProgram && window.wx?.miniProgram?.navigateBack) {
      window.wx.miniProgram.navigateBack({ delta: 1 });
      return;
    }
    if (new URLSearchParams(window.location.search).get("returnMode") === "back") {
      window.history.back();
    }
  };

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="返回即刻岛"
      className="fixed left-3 top-[max(12px,env(safe-area-inset-top))] z-[70] flex min-h-11 items-center gap-2 rounded-xl border border-white/60 bg-white/94 px-3 text-sm font-semibold text-[#075949] shadow-[0_8px_26px_rgba(7,26,51,0.16)] backdrop-blur-xl active:scale-95"
    >
      <span aria-hidden="true" className="text-lg leading-none">‹</span>
      <span>返回即刻岛</span>
    </button>
  );
}
