"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function AcceptInvitationForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const invitationId = params.get("id");
    if (!invitationId) { setError("This invitation link is invalid."); setLoading(false); return; }
    const data = new FormData(event.currentTarget);
    const result = await authClient.signUp.email({ name: String(data.get("name")), email: String(data.get("email")), password: String(data.get("password")) });
    if (result.error) { setError(result.error.message ?? "Unable to create account. If you already have one, sign in first."); setLoading(false); return; }
    const accepted = await authClient.organization.acceptInvitation({ invitationId });
    if (accepted.error) { setError(accepted.error.message ?? "Unable to accept invitation."); setLoading(false); return; }
    router.push("/admin"); router.refresh();
  }
  return <form onSubmit={submit} className="space-y-4"><div><Label htmlFor="name">Full name</Label><Input id="name" name="name" required minLength={2} className="mt-2" /></div><div><Label htmlFor="email">Invited email</Label><Input id="email" name="email" type="email" required className="mt-2" /></div><div><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" required minLength={10} className="mt-2" /></div>{error ? <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}<Button className="w-full rounded-full" disabled={loading}>{loading ? "Joining…" : "Create account & join"}</Button></form>;
}
