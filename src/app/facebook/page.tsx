import SocialScheduler from "@/components/social/SocialScheduler";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getSocialAccountSummaries } from "@/lib/social/accounts";

export default async function FacebookPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }

  const accounts = getSocialAccountSummaries(data.user.id);
  return <SocialScheduler key="gol" account={accounts.find((account) => account.key === "gol")!} accounts={accounts} />;
}
