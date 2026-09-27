import { Suspense } from "react";
import { QuoteWizard } from "@/components/QuoteWizard";

export default function InquiryPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#f5f7fb]" />}><QuoteWizard /></Suspense>;
}
