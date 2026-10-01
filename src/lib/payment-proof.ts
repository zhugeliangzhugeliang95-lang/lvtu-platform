import fs from "node:fs/promises";
import path from "node:path";

export type PaymentProofAiStatus = "MATCH" | "MISMATCH" | "UNREADABLE" | "SKIPPED";

export type PaymentProofAnalysis = {
  status: PaymentProofAiStatus;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  amount: number | null;
  transactionTime: string | null;
  recipient: string | null;
  summary: string;
  rawText?: string;
};

function uploadPath(proofImage: string) {
  const match = proofImage.match(/^\/api\/uploads\/(payment-[a-f0-9]{32}\.webp)$/);
  if (!match) return null;
  return path.join(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"), match[1]);
}

function parseJson(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value !== "string") return null;
  const match = value.replace(/,/g, "").match(/\d+(?:\.\d{1,2})?/);
  return match ? Math.round(Number(match[0])) : null;
}

export async function analyzePaymentProof(params: { proofImage: string; expectedAmount?: number | null; paymentNo?: string }): Promise<PaymentProofAnalysis> {
  const filePath = uploadPath(params.proofImage);
  const apiKey = process.env.VOLCENGINE_API_KEY?.trim();
  const model = process.env.VOLCENGINE_VISION_MODEL?.trim();
  if (!filePath || !apiKey || !model || (process.env.PAYMENT_VISION_PROVIDER || "volcengine") !== "volcengine") {
    return { status: "SKIPPED", confidence: "LOW", amount: null, transactionTime: null, recipient: null, summary: "未配置付款截图视觉模型，等待人工核对微信实际到账。" };
  }

  try {
    const image = (await fs.readFile(filePath)).toString("base64");
    const response = await fetch("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 500,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: `这是旅途的付款截图。请只返回 JSON，不要添加 Markdown。识别收款金额、交易时间、收款方，并判断图片是否清晰。expectedAmount=${params.expectedAmount ?? "未知"}，paymentNo=${params.paymentNo ?? "未知"}。格式：{"amount":number|null,"transactionTime":string|null,"recipient":string|null,"readable":boolean,"confidence":"HIGH"|"MEDIUM"|"LOW"}` },
            { type: "image_url", image_url: { url: `data:image/webp;base64,${image}`, detail: "high" } },
          ],
        }],
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`vision ${response.status}`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const rawText = payload.choices?.[0]?.message?.content?.trim() || "";
    const parsed = parseJson(rawText);
    if (!parsed) return { status: "UNREADABLE", confidence: "LOW", amount: null, transactionTime: null, recipient: null, summary: "AI 未能可靠读取截图，需人工查看。", rawText: rawText.slice(0, 2000) };
    const amount = numberValue(parsed.amount);
    const readable = parsed.readable !== false;
    const confidence = parsed.confidence === "HIGH" || parsed.confidence === "MEDIUM" ? parsed.confidence : "LOW";
    const status: PaymentProofAiStatus = !readable || amount === null ? "UNREADABLE" : params.expectedAmount != null && amount !== params.expectedAmount ? "MISMATCH" : "MATCH";
    const summary = status === "MATCH" ? `AI识别金额 ¥${amount} 与订单金额一致，仍需人工确认微信到账。` : status === "MISMATCH" ? `AI识别金额 ¥${amount} 与应付金额 ¥${params.expectedAmount} 不一致，请人工复核。` : "AI 未能可靠识别完整付款信息，请人工查看截图。";
    return { status, confidence, amount, transactionTime: typeof parsed.transactionTime === "string" ? parsed.transactionTime.slice(0, 80) : null, recipient: typeof parsed.recipient === "string" ? parsed.recipient.slice(0, 120) : null, summary, rawText: rawText.slice(0, 2000) };
  } catch (error) {
    return { status: "SKIPPED", confidence: "LOW", amount: null, transactionTime: null, recipient: null, summary: `AI识别暂时不可用，等待人工核对${error instanceof Error ? `（${error.message.slice(0, 80)}）` : ""}。` };
  }
}
