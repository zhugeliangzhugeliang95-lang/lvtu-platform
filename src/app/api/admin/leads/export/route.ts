import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { LeadStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifyAdminSessionCookieValue } from "@/lib/adminAuth";

const statusOptions = ["ALL", "NEW", "PENDING_CONTACT", "CONTACTED", "PLANNING", "QUOTED", "CONVERTED", "LOST", "CLOSED"] as const;

function csvCell(value: unknown) {
  const s = String(value ?? "");
  const escaped = s.replaceAll('"', '""');
  return `"${escaped}"`;
}

export async function GET(req: Request) {
  const store = await cookies();
  const ok = verifyAdminSessionCookieValue(store.get("admin_session")?.value);
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status") ?? "ALL";
  const normalizedStatus = statusOptions.includes(statusParam as (typeof statusOptions)[number])
    ? (statusParam as (typeof statusOptions)[number])
    : "ALL";
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 60);

  const whereStatus =
    normalizedStatus === "ALL"
      ? undefined
      : {
          status: normalizedStatus as LeadStatus,
        };

  const whereQuery = q
    ? {
        OR: [
          { name: { contains: q } },
          { phone: { contains: q } },
          { wechat: { contains: q } },
          { fromCity: { contains: q } },
          { toCity: { contains: q } },
          { requestTypes: { contains: q } },
          { notes: { contains: q } },
          { school: { contains: q } },
          { owner: { contains: q } },
          { user: { email: { contains: q } } },
        ],
      }
    : undefined;

  const leads = await prisma.lead.findMany({
    where:
      whereStatus && whereQuery
        ? { AND: [whereStatus, whereQuery] }
        : whereStatus
          ? whereStatus
          : whereQuery,
    orderBy: { createdAt: "desc" },
    take: 2000,
    include: { user: { select: { email: true } } },
  });

  const header = [
    "id",
    "createdAt",
    "status",
    "owner",
    "lastFollowUpAt",
    "userEmail",
    "name",
    "phone",
    "wechat",
    "fromCity",
    "toCity",
    "departDate",
    "returnDate",
    "peopleCount",
    "requestTypes",
    "notes",
    "sourceChannel",
    "school",
  ]
    .map(csvCell)
    .join(",");

  const rows = leads.map((l) =>
    [
      l.id,
      l.createdAt.toISOString(),
      l.status,
      l.owner ?? "",
      l.lastFollowUpAt ? l.lastFollowUpAt.toISOString() : "",
      l.user?.email ?? "",
      l.name,
      l.phone,
      l.wechat ?? "",
      l.fromCity,
      l.toCity,
      l.departDate.toISOString(),
      l.returnDate ? l.returnDate.toISOString() : "",
      l.peopleCount,
      l.requestTypes,
      l.notes ?? "",
      l.sourceChannel,
      l.school ?? "",
    ]
      .map(csvCell)
      .join(","),
  );

  const now = new Date();
  const stamp = now.toISOString().slice(0, 19).replaceAll(":", "-");
  const filename = `leads-${stamp}.csv`;
  const csv = "\ufeff" + [header, ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
