import { NextResponse } from "next/server";

import { getAvailability } from "@/lib/reservations/repository";
import { availabilityQuerySchema } from "@/lib/reservations/validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = availabilityQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid availability request.", issues: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const slots = await getAvailability(parsed.data.date, parsed.data.type, parsed.data.guests);
    return NextResponse.json({ slots }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Availability lookup failed", error);
    return NextResponse.json({ error: "Availability is temporarily unavailable." }, { status: 503 });
  }
}
