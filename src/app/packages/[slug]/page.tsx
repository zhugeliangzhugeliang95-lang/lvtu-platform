import { redirect } from "next/navigation";
export default async function PackageDetail({params}:{params:Promise<{slug:string}>}) { void params; redirect("/inquiry?service=combo"); }
