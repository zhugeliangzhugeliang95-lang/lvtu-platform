import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/adminAuth";

// GET /api/robot/leads — 获取所有线索列表
export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const leads = await prisma.robotLead.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tasks: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  return NextResponse.json({ leads });
}
