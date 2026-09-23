"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { requireAdmin, requireOwner } from "@/lib/auth-session";
import { retryReservationEmail, sendReservationEmail } from "@/lib/email";
import { changeReservationStatus, updateReservation } from "@/lib/reservations/repository";
import { adminReservationUpdateSchema, reservationStatusSchema } from "@/lib/reservations/validation";

export type ActionState = { success?: string; error?: string };

export async function updateReservationAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requireAdmin();
  const parsed = adminReservationUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid reservation details." };
  try {
    const reservation = await updateReservation(parsed.data, context.session.user.id);
    await sendReservationEmail(reservation, "updated");
    revalidatePath("/admin");
    revalidatePath("/admin/calendar");
    revalidatePath(`/admin/reservations/${reservation.id}`);
    return { success: "Reservation updated and customer notified." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update reservation." };
  }
}

export async function changeStatusAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requireAdmin();
  const parsed = reservationStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid status change." };
  try {
    const reservation = await changeReservationStatus(
      parsed.data.id,
      parsed.data.status,
      context.session.user.id,
      parsed.data.status === "rejected" ? parsed.data.rejectionReason : undefined,
    );
    await sendReservationEmail(reservation, parsed.data.status === "confirmed" ? "confirmed" : "rejected");
    revalidatePath("/admin");
    revalidatePath("/admin/calendar");
    revalidatePath(`/admin/reservations/${reservation.id}`);
    return { success: parsed.data.status === "confirmed" ? "Reservation confirmed." : "Reservation rejected." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to change status." };
  }
}

const inviteSchema = z.object({ email: z.email().transform((value) => value.toLowerCase()) });

export async function inviteAdminAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requireOwner();
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid email address." };
  try {
    await auth.api.createInvitation({
      body: { email: parsed.data.email, role: "admin", organizationId: context.organizationId, resend: true },
      headers: await headers(),
    });
    revalidatePath("/admin/team");
    return { success: `Invitation sent to ${parsed.data.email}.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to send invitation." };
  }
}

export async function retryEmailAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const deliveryId = z.string().min(1).safeParse(formData.get("deliveryId"));
  const reservationId = z.string().min(1).safeParse(formData.get("reservationId"));
  if (!deliveryId.success || !reservationId.success) return { error: "Invalid delivery record." };
  try {
    const result = await retryReservationEmail(deliveryId.data);
    revalidatePath(`/admin/reservations/${reservationId.data}`);
    return result.ok ? { success: "Email sent successfully." } : { error: "Email failed again. Check Resend configuration." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to retry email." };
  }
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/admin/login");
}
