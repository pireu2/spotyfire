import { getCurrentUserRole } from "../actions/user";
import ClientLayout from "./ClientLayout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getCurrentUserRole();

  return <ClientLayout role={role}>{children}</ClientLayout>;
}
