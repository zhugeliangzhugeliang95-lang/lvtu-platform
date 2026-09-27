import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/adminAuth";

/** GET /api/admin/me — 当前登录用户信息 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "未登录" },
      { status: 401 }
    );
  }

  // env-admin 降级账号：没有数据库记录
  if (session.adminId === "env-admin") {
    return NextResponse.json({
      id: "env-admin",
      username: process.env.ADMIN_USER || "admin",
      realName: "环境变量管理员",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      mobile: null,
      lastLoginAt: null,
    });
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: session.adminId },
    select: {
      id: true,
      username: true,
      realName: true,
      role: true,
      status: true,
      mobile: true,
      lastLoginAt: true,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "账号已禁用或不存在" },
      { status: 403 }
    );
  }

  return NextResponse.json(user);
}
