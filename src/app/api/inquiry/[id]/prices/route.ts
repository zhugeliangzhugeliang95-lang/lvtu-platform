import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inquiryAccessWhere, inquiryNotFound } from "@/lib/security/inquiryAccess";

type Params = { params: Promise<{ id: string }> };

/** GET /api/inquiry/[id]/prices — 获取价格参考列表 */
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const order = await prisma.inquiryOrder.findFirst({
      where: inquiryAccessWhere(req, id),
      select: {
        id: true,
        status: true,
        destination: true,
        checkInDate: true,
        checkOutDate: true,
        nights: true,
        roomCount: true,
        guestCount: true,
        priceReferences: {
          where: {
            isMock: false,
            sourceUrl: { not: null },
          },
          orderBy: { pricePerNight: "asc" },
        },
      },
    });
    if (!order) return NextResponse.json(inquiryNotFound, { status: 404 });
    return NextResponse.json({ success: true, ...order });
  } catch (e) {
    console.error("[GET /api/inquiry/[id]/prices]", e);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
