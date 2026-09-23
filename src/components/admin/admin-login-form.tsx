"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function AdminLoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({ email: String(data.get("email")), password: String(data.get("password")), rememberMe: true });
    if (result.error) { setError(result.error.message ?? "Sign in failed."); setLoading(false); return; }
    router.push("/admin");
    router.refresh();
  }

  return <form onSubmit={submit} className="mt-8 space-y-5"><div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" required className="mt-2 h-12 bg-card" placeholder="you@company.com" /></div><div><div className="flex items-center justify-between"><Label htmlFor="password">Password</Label><Link href="/admin/forgot-password" className="text-xs font-semibold text-[#9b6042] hover:underline">Forgot password?</Link></div><Input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} className="mt-2 h-12 bg-card" /></div>{error ? <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}<Button type="submit" className="h-12 w-full rounded-full" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : null}Sign in</Button></form>;
}
