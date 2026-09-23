"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); const data = new FormData(event.currentTarget); await authClient.requestPasswordReset({ email: String(data.get("email")), redirectTo: `${window.location.origin}/admin/reset-password` }); setMessage("If that account exists, a reset link is on its way."); setLoading(false); }
  return <form onSubmit={submit} className="space-y-4"><div><Label htmlFor="email">Admin email</Label><Input id="email" name="email" type="email" required className="mt-2" /></div>{message ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}<Button type="submit" className="w-full rounded-full" disabled={loading}>Send reset link</Button></form>;
}
