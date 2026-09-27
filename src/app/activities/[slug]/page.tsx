import { redirect } from "next/navigation";
export default async function ActivityDetail({ params }: { params: Promise<{slug:string}> }) { void params; redirect("/inquiry?service=ticket"); }
