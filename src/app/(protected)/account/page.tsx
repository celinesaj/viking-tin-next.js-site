import AccountHomeContent from "@/components/account/AccountHomeContent";
import { ensureValidAuthSession } from "@/lib/authServer";

export default async function AccountPage() {
  await ensureValidAuthSession();

  return <AccountHomeContent />;
}
