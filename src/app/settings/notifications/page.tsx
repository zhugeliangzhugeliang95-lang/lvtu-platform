import { PlatformFrame } from "@/components/platform/Catalog";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/userAuth";
import { NotificationSettings } from "./ui";

export default async function NotificationSettingsPage() {
  const userId = await requireUser("/settings/notifications");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { serviceNotifications: true, marketingNotifications: true } });
  return <PlatformFrame title="通知设置" subtitle="选择希望接收的消息" back="/settings" active="member"><NotificationSettings initial={user}/></PlatformFrame>;
}
