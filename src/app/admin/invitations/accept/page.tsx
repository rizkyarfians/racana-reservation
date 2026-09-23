import { Suspense } from "react";

import { AuthCard } from "@/components/admin/auth-card";
import { AcceptInvitationForm } from "@/components/admin/accept-invitation-form";

export default function AcceptInvitationPage() {
  return <AuthCard eyebrow="Team invitation" title="Join Racana" description="Create your invited admin account. Use the same email address that received the invitation."><Suspense fallback={<p className="text-sm text-muted-foreground">Checking invitation…</p>}><AcceptInvitationForm /></Suspense></AuthCard>;
}
