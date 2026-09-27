import { SignupForm } from "@/app/signup/ui";
import { AuthShell } from "@/components/auth/AuthShell";
import { getUserIdFromCookie, safeReturnPath } from "@/lib/userAuth";
import { redirect } from "next/navigation";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string; reason?: string }> }) {
  const { next, reason } = await searchParams;
  const nextPath = safeReturnPath(next, "/member");
  if (await getUserIdFromCookie()) redirect(nextPath);
  return <AuthShell mode="signup" nextPath={nextPath} reason={reason}><SignupForm nextPath={nextPath}/></AuthShell>;
}
