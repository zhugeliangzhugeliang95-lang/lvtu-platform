import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi, isAdminRole } from "@/lib/adminAuth";
import { hashPassword } from "@/lib/password";
import { staffCreateSchema, formatZodError } from "@/lib/validations";
import { readLimitedJson, requireTrustedOrigin } from "@/lib/security/request";

/* =============================================================================
 * 客服账号管理
 *  GET  /api/admin/staff          管理员看全部；客服看基础列表（用于分配下拉）
 *  POST /api/admin/staff          仅管理员可新建
 * ============================================================================*/

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const { session } = auth;

  const users = await prisma.adminUser.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      username: true,
      realName: true,
      role: true,
      status: true,
      mobile: isAdminRole(session),
      lastLoginAt: isAdminRole(session),
      createdAt: isAdminRole(session),
    },
  });

  // 管理员额外带上 followUp / deal 统计
  if (isAdminRole(session)) {
    const [followUp, deals] = await Promise.all([
      prisma.hotelLead.groupBy({
        by: ["assignedToId"],
        where: { assignedToId: { not: null } },
        _count: { _all: true },
      }),
      prisma.hotelLead.groupBy({
        by: ["assignedToId"],
        where: { assignedToId: { not: null }, status: "DEAL" },
        _count: { _all: true },
      }),
    ]);
    const followMap = new Map(followUp.map((f) => [f.assignedToId!, f._count._all]));
    const dealMap = new Map(deals.map((d) => [d.assignedToId!, d._count._all]));
    return NextResponse.json({
      items: users.map((u) => ({
        ...u,
        followUpCount: followMap.get(u.id) || 0,
        dealCount: dealMap.get(u.id) || 0,
      })),
    });
  }

  return NextResponse.json({ items: users });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  if (!isAdminRole(auth.session)) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "仅管理员可以新建账号" },
      { status: 403 }
    );
  }

  const body = await readLimitedJson(req, 8 * 1024);
  if (!body.ok) return body.response;
  const parsed = staffCreateSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }
  const input = parsed.data;

  const exists = await prisma.adminUser.findUnique({
    where: { username: input.username },
    select: { id: true },
  });
  if (exists) {
    return NextResponse.json(
      { error: "USERNAME_TAKEN", message: "账号已被占用" },
      { status: 409 }
    );
  }

  const created = await prisma.adminUser.create({
    data: {
      username: input.username,
      passwordHash: hashPassword(input.password),
      realName: input.realName,
      mobile: input.mobile || null,
      role: input.role,
      status: "ACTIVE",
    },
    select: {
      id: true,
      username: true,
      realName: true,
      role: true,
      status: true,
      mobile: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ ok: true, user: created }, { status: 201 });
}
