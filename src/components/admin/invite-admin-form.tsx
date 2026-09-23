"use client";

import { useActionState } from "react";
import { MailPlus } from "lucide-react";

import { inviteAdminAction } from "@/app/admin/actions";
import { ActionMessage } from "@/components/admin/action-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteAdminForm() {
  const [state, action, pending] = useActionState(inviteAdminAction, {});
  return <form action={action} className="rounded-2xl border bg-card p-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-secondary text-[#9b6042]"><MailPlus className="size-4" /></span><div><h2 className="font-semibold">Invite an admin</h2><p className="text-sm text-muted-foreground">They can manage reservations, but not team access.</p></div></div><div className="mt-5"><Label htmlFor="invite-email">Email address</Label><div className="mt-2 flex gap-2"><Input id="invite-email" name="email" type="email" required placeholder="teammate@example.com" /><Button type="submit" disabled={pending}>{pending ? "Sending…" : "Send invite"}</Button></div></div><div className="mt-4"><ActionMessage state={state} /></div></form>;
}
