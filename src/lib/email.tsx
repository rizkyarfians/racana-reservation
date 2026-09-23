import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { Resend } from "resend";

import { db } from "@/db";
import { emailDeliveries, reservations, type Reservation } from "@/db/schema";
import { AuthEmail } from "@/emails/auth-email";
import { ReservationEmail, type ReservationEmailKind } from "@/emails/reservation-email";
import { env } from "@/lib/config";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const reservationSubjects: Record<ReservationEmailKind, string> = {
  received: "We received your reservation request",
  updated: "Your reservation details were updated",
  confirmed: "Your Racana reservation is confirmed",
  rejected: "An update to your Racana reservation request",
};

function deliveryRecipient(intendedRecipient: string) {
  return env.EMAIL_SANDBOX_TO || intendedRecipient;
}

export async function sendReservationEmail(reservation: Reservation, kind: ReservationEmailKind) {
  const now = new Date();
  const deliveryId = randomUUID();
  const to = deliveryRecipient(reservation.email);
  await db.insert(emailDeliveries).values({
    id: deliveryId,
    reservationId: reservation.id,
    category: kind,
    recipient: reservation.email,
    status: "pending",
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  });

  if (!resend) {
    await markDeliveryFailed(deliveryId, "RESEND_API_KEY is not configured.");
    return { ok: false as const, deliveryId };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to,
      subject: `${env.EMAIL_SANDBOX_TO ? `[Sandbox for ${reservation.email}] ` : ""}${reservationSubjects[kind]}`,
      react: <ReservationEmail reservation={reservation} kind={kind} />,
      headers: { "X-Entity-Ref-ID": `${reservation.id}:${kind}:${deliveryId}` },
    });
    if (error) throw new Error(error.message);
    await db
      .update(emailDeliveries)
      .set({ status: "sent", providerId: data?.id ?? null, attempts: 1, updatedAt: new Date() })
      .where(eq(emailDeliveries.id, deliveryId));
    return { ok: true as const, deliveryId };
  } catch (error) {
    await markDeliveryFailed(deliveryId, error instanceof Error ? error.message : "Unknown email error");
    return { ok: false as const, deliveryId };
  }
}

export async function sendAuthEmail({
  to: intendedRecipient,
  subject,
  heading,
  message,
  actionLabel,
  actionUrl,
  category,
}: {
  to: string;
  subject: string;
  heading: string;
  message: string;
  actionLabel: string;
  actionUrl: string;
  category: string;
}) {
  if (!resend) return { ok: false as const, error: "RESEND_API_KEY is not configured." };
  const to = deliveryRecipient(intendedRecipient);
  const { data, error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: `${env.EMAIL_SANDBOX_TO ? `[Sandbox for ${intendedRecipient}] ` : ""}${subject}`,
    react: (
      <AuthEmail
        heading={heading}
        preview={subject}
        message={message}
        actionLabel={actionLabel}
        actionUrl={actionUrl}
      />
    ),
    tags: [{ name: "category", value: category.replace(/[^a-zA-Z0-9_-]/g, "_") }],
  });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, id: data?.id };
}

export async function retryReservationEmail(deliveryId: string) {
  const [row] = await db
    .select({ delivery: emailDeliveries, reservation: reservations })
    .from(emailDeliveries)
    .innerJoin(reservations, eq(emailDeliveries.reservationId, reservations.id))
    .where(eq(emailDeliveries.id, deliveryId))
    .limit(1);
  if (!row) throw new Error("Email delivery record not found.");
  if (!(["received", "updated", "confirmed", "rejected"] as string[]).includes(row.delivery.category)) {
    throw new Error("This email type cannot be retried from the reservation.");
  }
  return sendReservationEmail(row.reservation, row.delivery.category as ReservationEmailKind);
}

async function markDeliveryFailed(id: string, error: string) {
  await db
    .update(emailDeliveries)
    .set({ status: "failed", error: error.slice(0, 2000), attempts: 1, updatedAt: new Date() })
    .where(eq(emailDeliveries.id, id));
}
