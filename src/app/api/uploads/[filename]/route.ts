import fs from "fs/promises";
import path from "path";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { getUserIdFromCookie } from "@/lib/userAuth";

function getUploadDir() {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}

export async function GET(_req: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  if (!/^(?:payment-)?[a-f0-9]{32}\.webp$/.test(filename)) return new Response("not found", { status: 404 });

  const isPaymentProof = filename.startsWith("payment-");
  if (isPaymentProof) {
    const [admin, userId] = await Promise.all([getAdminSession(), getUserIdFromCookie()]);
    if (!admin && !userId) return new Response("unauthorized", { status: 401 });
    if (!admin) {
      const proof = await prisma.payment.findFirst({
        where: { proofImage: `/api/uploads/${filename}`, order: { userId: userId! } },
        select: { id: true },
      });
      if (!proof) return new Response("not found", { status: 404 });
    }
  }

  try {
    const buffer = await fs.readFile(path.join(getUploadDir(), filename));
    return new Response(buffer, {
      headers: {
        "Content-Type": "image/webp",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Cache-Control": isPaymentProof ? "private, no-store" : "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("not found", { status: 404 });
  }
}
