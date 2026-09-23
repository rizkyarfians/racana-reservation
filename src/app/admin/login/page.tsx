import type { Metadata } from "next";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { Brand } from "@/components/brand";

export const metadata: Metadata = { title: "Admin sign in" };

export default function LoginPage() {
  return <main className="grid min-h-screen lg:grid-cols-2"><section className="hidden bg-primary p-14 text-primary-foreground lg:flex lg:flex-col lg:justify-between"><Brand className="[&_span]:text-primary-foreground" /><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-foreground/60">Business side</p><h1 className="mt-5 max-w-lg font-display text-6xl leading-[1.02]">Hospitality runs on the details.</h1><p className="mt-6 max-w-md leading-7 text-primary-foreground/70">Review requests, coordinate the day, and keep every guest experience moving beautifully.</p></div><p className="text-sm text-primary-foreground/50">Racana Reservations · Asia/Jakarta</p></section><section className="flex items-center justify-center p-6"><div className="w-full max-w-md"><div className="mb-10 lg:hidden"><Brand /></div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9b6042]">Welcome back</p><h2 className="mt-3 font-display text-5xl">Sign in to Racana</h2><p className="mt-3 text-muted-foreground">Use your invited admin account to continue.</p><AdminLoginForm /></div></section></main>;
}
