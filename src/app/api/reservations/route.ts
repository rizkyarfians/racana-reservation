import { NextResponse } from "next/server";

import { sendReservationEmail } from "@/lib/email";
import { createReservation, ReservationConflictError } from "@/lib/reservations/repository";
import { reservationInputSchema } from "@/lib/reservations/validation";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = reservationInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please review the highlighted details.", issues: parsed.error.flatten() }, { status: 422 });
  }
  if (parsed.data.website) return NextResponse.json({ error: "Unable to submit request." }, { status: 400 });

  try {
    const reservation = await createReservation(parsed.data);
    const email = await sendReservationEmail(reservation, "received");
    return NextResponse.json(
      {
        reservation: {
          reference: reservation.reference,
          status: reservation.status,
          type: reservation.type,
          startsAt: reservation.startsAt.toISOString(),
          endsAt: reservation.endsAt.toISOString(),
          guests: reservation.guestCount,
          name: reservation.name,
        },
        emailSent: email.ok,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ReservationConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Reservation submission failed", error);
    return NextResponse.json({ error: "We could not save your request. Please try again." }, { status: 500 });
  }
}
