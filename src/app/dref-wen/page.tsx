import SocialScheduler from "@/components/social/SocialScheduler";
import { createClient } from "@/utils/supabase/server";
import { getSocialAccountSummaries } from "@/lib/social/accounts";
import { notFound, redirect } from "next/navigation";

export default async function DrefWenSchedulerPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const accounts = getSocialAccountSummaries(user.id);
  const account = accounts.find((candidate) => candidate.key === "dref-wen");
  if (!account) notFound();

  return <SocialScheduler key="dref-wen" account={account} accounts={accounts} />;
}
