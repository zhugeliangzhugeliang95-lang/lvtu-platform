import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi, isAdminRole } from "@/lib/adminAuth";
import { hashPassword } from "@/lib/password";
import { staffUpdateSchema, formatZodError } from "@/lib/validations";
import { readLimitedJson, requireTrustedOrigin } from "@/lib/security/request";

/* =============================================================================
 * PATCH /api/admin/staff/:id
 *  - 仅管理员可修改
 *  - 可更新：realName / mobile / role / status(ACTIVE|DISABLED) / password
 *  - 防御：禁止把最后一个 SUPER_ADMIN 禁用或降级
 * ============================================================================*/

type RouteContext = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: RouteContext) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  if (!isAdminRole(auth.session)) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "仅管理员可修改账号" },
      { status: 403 }
    );
  }

  const { id } = await ctx.params;
  const body = await readLimitedJson(req, 8 * 1024);
  if (!body.ok) return body.response;
  const parsed = staffUpdateSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }

  const target = await prisma.adminUser.findUnique({
    where: { id },
    select: { id: true, role: true, status: true },
  });
  if (!target) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "账号不存在" },
      { status: 404 }
    );
  }

  // 若要把一个 SUPER_ADMIN 降级或禁用，要求还存在其他 active 的 SUPER_ADMIN
  if (target.role === "SUPER_ADMIN") {
    const willDemote =
      (parsed.data.role && parsed.data.role !== "SUPER_ADMIN") ||
      parsed.data.status === "DISABLED";
    if (willDemote) {
      const otherSuper = await prisma.adminUser.count({
        where: {
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          NOT: { id },
        },
      });
      if (otherSuper === 0) {
        return NextResponse.json(
          {
            error: "LAST_SUPER_ADMIN",
            message: "至少需要保留一个可用的超级管理员",
          },
          { status: 400 }
        );
      }
    }
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.realName !== undefined) data.realName = parsed.data.realName;
  if (parsed.data.mobile !== undefined) data.mobile = parsed.data.mobile || null;
  if (parsed.data.role !== undefined) data.role = parsed.data.role;
  if (parsed.data.status !== undefined) data.status = parsed.data.status;
  if (parsed.data.password) data.passwordHash = hashPassword(parsed.data.password);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  const updated = await prisma.adminUser.update({
    where: { id },
    data,
    select: {
      id: true,
      username: true,
      realName: true,
      role: true,
      status: true,
      mobile: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({ ok: true, user: updated });
}
