import { PlatformFrame } from "@/components/platform/Catalog";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/userAuth";
import { ProfileForm } from "./ui";

export default async function MemberProfilePage() {
  const userId = await requireUser("/member/profile");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true, nickname: true, mobile: true } });
  return <PlatformFrame title="账号信息" subtitle="管理联系资料" back="/member" active="member"><ProfileForm initial={{ email:user.email,nickname:user.nickname||"",mobile:user.mobile||"" }}/></PlatformFrame>;
}
