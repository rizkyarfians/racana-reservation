"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const token = params.get("token"); if (!token) { setError("This reset link is invalid."); return; } const data = new FormData(event.currentTarget); const result = await authClient.resetPassword({ token, newPassword: String(data.get("password")) }); if (result.error) setError(result.error.message ?? "Unable to reset password."); else setMessage("Password updated. You can now sign in."); }
  return <form onSubmit={submit} className="space-y-4"><div><Label htmlFor="password">New password</Label><Input id="password" name="password" type="password" minLength={10} required className="mt-2" /></div>{error ? <p className="text-sm text-destructive">{error}</p> : null}{message ? <p className="text-sm text-emerald-800">{message}</p> : null}<Button className="w-full rounded-full">Update password</Button></form>;
}
