import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/auth-session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const context = await requireAdmin();
  return <div className="min-h-screen bg-[#f6f3eb]"><AdminNav userName={context.session.user.name} isOwner={context.isOwner} /><main className="min-h-screen px-5 pb-12 pt-20 sm:px-8 lg:ml-64 lg:px-10 lg:pt-10">{children}</main></div>;
}
