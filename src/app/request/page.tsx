import { PlatformFrame } from "@/components/platform/Catalog";
import { requireUser } from "@/lib/userAuth";
import { RequestForm } from "./RequestForm";

export default async function RequestPage({ searchParams }: { searchParams: Promise<{ notes?: string; type?: string; fromEstimate?: string }> }) {
  const params = await searchParams;
  const nextPath = params.fromEstimate === "1" ? "/request?fromEstimate=1" : "/request";
  await requireUser(nextPath);
  const { notes, type } = params;
  return <PlatformFrame title="确认旅行需求" subtitle="补充联系方式后交由顾问人工确认" back="/inquiry" active="discover"><RequestForm initialNotes={typeof notes === "string" ? notes.slice(0, 800) : ""} initialType={typeof type === "string" ? type.toUpperCase() : "OTHER"} restoreEstimate={params.fromEstimate === "1"}/></PlatformFrame>;
}
