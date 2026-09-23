import { Suspense } from "react";

import { AuthCard } from "@/components/admin/auth-card";
import { ResetPasswordForm } from "@/components/admin/reset-password-form";

export default function ResetPasswordPage() {
  return <AuthCard eyebrow="Account recovery" title="Choose a new password" description="Use at least 8 characters for your new password."><Suspense fallback={<p className="text-sm text-muted-foreground">Preparing secure form…</p>}><ResetPasswordForm /></Suspense></AuthCard>;
}
