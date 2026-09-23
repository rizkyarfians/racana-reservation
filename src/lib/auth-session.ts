import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { members, organizations } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function getAdminContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const [membership] = await db
    .select({
      role: members.role,
      organizationId: members.organizationId,
      organizationName: organizations.name,
    })
    .from(members)
    .innerJoin(organizations, eq(members.organizationId, organizations.id))
    .where(eq(members.userId, session.user.id))
    .limit(1);
  if (!membership) return null;
  return { session, ...membership, isOwner: membership.role === "owner" };
}

export async function requireAdmin() {
  const context = await getAdminContext();
  if (!context) redirect("/admin/login");
  return context;
}

export async function requireOwner() {
  const context = await requireAdmin();
  if (!context.isOwner) redirect("/admin");
  return context;
}
