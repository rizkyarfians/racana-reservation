import { and, desc, eq, gt } from "drizzle-orm";
import { Mail, ShieldCheck, UserRound } from "lucide-react";

import { InviteAdminForm } from "@/components/admin/invite-admin-form";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { invitations, members, users } from "@/db/schema";
import { requireOwner } from "@/lib/auth-session";

export default async function TeamPage() {
  const context = await requireOwner();
  const team = await db.select({ id: members.id, role: members.role, createdAt: members.createdAt, name: users.name, email: users.email }).from(members).innerJoin(users, eq(members.userId, users.id)).where(eq(members.organizationId, context.organizationId)).orderBy(desc(members.createdAt));
  const pendingInvites = await db.select().from(invitations).where(and(eq(invitations.organizationId, context.organizationId), eq(invitations.status, "pending"), gt(invitations.expiresAt, new Date()))).orderBy(desc(invitations.createdAt));
  return <div className="mx-auto max-w-4xl"><header><p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9b6042]">Owner controls</p><h1 className="mt-2 font-display text-5xl">Team</h1><p className="mt-2 text-muted-foreground">Invite trusted people to run reservations with you.</p></header><div className="mt-8 grid gap-6 md:grid-cols-[1fr_0.9fr]"><section className="rounded-2xl border bg-card p-5"><h2 className="font-display text-2xl">Members</h2><div className="mt-4 divide-y">{team.map((member) => <div key={member.id} className="flex items-center gap-3 py-4"><span className="grid size-10 place-items-center rounded-full bg-secondary"><UserRound className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate font-semibold">{member.name}</p><p className="truncate text-sm text-muted-foreground">{member.email}</p></div><Badge variant="outline" className="capitalize"><ShieldCheck className="size-3" />{member.role}</Badge></div>)}</div>{pendingInvites.length > 0 ? <><h3 className="mt-7 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pending invitations</h3><div className="mt-2 divide-y">{pendingInvites.map((invite) => <div key={invite.id} className="flex items-center gap-3 py-3"><Mail className="size-4 text-[#9b6042]" /><span className="min-w-0 flex-1 truncate text-sm">{invite.email}</span><Badge variant="secondary">Pending</Badge></div>)}</div></> : null}</section><InviteAdminForm /></div></div>;
}
