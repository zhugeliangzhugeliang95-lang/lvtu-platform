"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
export function CopyWechat({value}:{value:string}){const [copied,setCopied]=useState(false);return <button type="button" onClick={async()=>{await navigator.clipboard.writeText(value);setCopied(true);window.setTimeout(()=>setCopied(false),1800)}} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0b4fd8] px-4 text-[12px] font-semibold text-white">{copied?<Check size={15}/>:<Copy size={15}/>} {copied?"已复制":"复制微信号"}</button>}
