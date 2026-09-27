import { describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { MAX_UPLOAD_BYTES, sanitizePublicImage } from "@/lib/security/imageUpload";
import { GET as serveUpload } from "@/app/api/uploads/[filename]/route";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

function upload(buffer: Buffer, type: string, reportedSize = buffer.length) {
  return { type, size: reportedSize, arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer };
}

describe("public display image sanitizing", () => {
  it.each([
    ["jpeg", "image/jpeg"],
    ["png", "image/png"],
    ["webp", "image/webp"],
  ] as const)("decodes and re-encodes a valid %s", async (format, mime) => {
    const source = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#336699" } }).toFormat(format).toBuffer();
    const result = await sanitizePublicImage(upload(source, mime));
    expect(result.ok).toBe(true);
    if (result.ok) expect((await sharp(result.buffer).metadata()).format).toBe("webp");
  });

  it("rejects SVG, oversized files, fake images and forged MIME", async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    expect((await sanitizePublicImage(upload(svg, "image/svg+xml"))).ok).toBe(false);
    expect((await sanitizePublicImage(upload(Buffer.from("x"), "image/png", MAX_UPLOAD_BYTES + 1))).ok).toBe(false);
    expect((await sanitizePublicImage(upload(Buffer.from("not a png"), "image/png"))).ok).toBe(false);
    const jpeg = await sharp({ create: { width: 2, height: 2, channels: 3, background: "white" } }).jpeg().toBuffer();
    expect((await sanitizePublicImage(upload(jpeg, "image/png"))).ok).toBe(false);
  });

  it("blocks path traversal and arbitrary filenames", async () => {
    const response = await serveUpload(new Request("http://localhost"), { params: Promise.resolve({ filename: "../secret.env" }) });
    expect(response.status).toBe(404);
  });

  it("does not expose payment proofs to unauthenticated visitors", async () => {
    const response = await serveUpload(new Request("http://localhost"), { params: Promise.resolve({ filename: `payment-${"a".repeat(32)}.webp` }) });
    expect(response.status).toBe(401);
  });
});
