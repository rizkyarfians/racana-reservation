import { AuthCard } from "@/components/admin/auth-card";
import { ForgotPasswordForm } from "@/components/admin/forgot-password-form";

export default function ForgotPasswordPage() {
  return <AuthCard eyebrow="Account recovery" title="Reset your password" description="Enter your admin email and we’ll send a secure reset link."><ForgotPasswordForm /></AuthCard>;
}
