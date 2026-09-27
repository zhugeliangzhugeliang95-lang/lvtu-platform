import { LoginForm } from "@/app/login/ui";
import { AuthShell } from "@/components/auth/AuthShell";
import { getUserIdFromCookie, safeReturnPath } from "@/lib/userAuth";
import { redirect } from "next/navigation";

function contextFor(reason: string | undefined, nextPath: string) {
  if (reason === "报价进度" || nextPath.includes("inquiries")) return { title: "继续查看你的报价进度", body: "登录后保留询价记录，查看参考价和顾问的最新处理状态。" };
  if (reason === "我的订单" || nextPath.includes("orders")) return { title: "登录后查看订单与行程", body: "登录后可以继续确认服务、查看付款状态和后续安排。" };
  if (reason === "我的需求" || nextPath.includes("inquiry")) return { title: "登录后保存你的旅行需求", body: "刚才填写的需求会保留，登录后可以接收报价并继续沟通。" };
  if (reason === "收藏与资料") return { title: "登录后管理收藏与资料", body: "登录后可以同步收藏内容和常用出行信息。" };
  return { title: "登录后管理你的旅行服务", body: "查看需求、顾问报价和服务进度，重要更新会及时通知你。" };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reason?: string }> }) {
  const { next, reason } = await searchParams;
  const nextPath = safeReturnPath(next, "/member");
  if (await getUserIdFromCookie()) redirect(nextPath);
  const context = contextFor(reason, nextPath);
  return <AuthShell mode="login" nextPath={nextPath} reason={reason} title={context.title} body={context.body}><LoginForm nextPath={nextPath}/></AuthShell>;
}
