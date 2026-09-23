import { and, eq, gt } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";

import { db } from "@/db";
import { invitations, schema as databaseSchema } from "@/db/schema";
import { env } from "@/lib/config";
import { sendAuthEmail } from "@/lib/email";

export const auth = betterAuth({
  appName: "Racana Reservations",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.APP_URL],
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema: databaseSchema,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail({
        to: user.email,
        subject: "Reset your Racana admin password",
        heading: "Reset your password",
        message: "Use the secure link below to choose a new password. If you did not request this, you can ignore this email.",
        actionLabel: "Reset password",
        actionUrl: url,
        category: "password_reset",
      });
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const bootstrapEmail = process.env.BOOTSTRAP_OWNER_EMAIL?.toLowerCase();
          if (bootstrapEmail && user.email.toLowerCase() === bootstrapEmail) return { data: user };
          const [invite] = await db
            .select({ id: invitations.id })
            .from(invitations)
            .where(
              and(
                eq(invitations.email, user.email.toLowerCase()),
                eq(invitations.status, "pending"),
                gt(invitations.expiresAt, new Date()),
              ),
            )
            .limit(1);
          if (!invite) {
            throw new APIError("FORBIDDEN", { message: "An active invitation is required." });
          }
          return { data: user };
        },
      },
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: false,
      invitationExpiresIn: 60 * 60 * 48,
      async sendInvitationEmail(data) {
        const inviteLink = `${env.APP_URL}/admin/invitations/accept?id=${encodeURIComponent(data.id)}`;
        await sendAuthEmail({
          to: data.email,
          subject: "You are invited to Racana Reservations",
          heading: "Join the Racana team",
          message: `${data.inviter.user.name} invited you to help manage reservations for ${data.organization.name}.`,
          actionLabel: "Accept invitation",
          actionUrl: inviteLink,
          category: "admin_invitation",
        });
      },
    }),
    nextCookies(),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
