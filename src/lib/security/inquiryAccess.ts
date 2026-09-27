import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { guestInquiryCookie, parseGuestInquiryIds, userCookie, verifyUserSessionCookieValue } from "@/lib/userAuth";

export function inquiryAccessWhere(req: NextRequest, id: string): Prisma.InquiryOrderWhereInput {
  return { AND: [{ id }, inquiryOwnerWhere(req)] };
}

export function inquiryOwnerWhere(req: NextRequest): Prisma.InquiryOrderWhereInput {
  const userId = verifyUserSessionCookieValue(req.cookies.get(userCookie.name)?.value);
  if (userId) return { userId };

  const guestIds = parseGuestInquiryIds(req.cookies.get(guestInquiryCookie.name)?.value);
  if (guestIds.length) return { id: { in: guestIds }, userId: null };

  return { id: "__not_accessible__" };
}

export const inquiryNotFound = { error: "NOT_FOUND", message: "询价单不存在" };
