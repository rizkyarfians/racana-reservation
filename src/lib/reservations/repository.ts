import { randomUUID } from "node:crypto";

import { and, asc, desc, eq, gte, inArray, like, lt, or, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  emailDeliveries,
  reservationAuditLogs,
  reservationCapacitySlots,
  reservations,
  reservationSlotAllocations,
  type Reservation,
} from "@/db/schema";
import { businessConfig } from "@/lib/config";
import {
  generateCandidateSlots,
  getAllocationStarts,
  getBusinessDate,
  getReservationWindow,
  zonedDateTime,
} from "./availability";
import { createReservationReference } from "./reference";
import type { ReservationStatus, ReservationType } from "./types";
import type { AdminReservationUpdate, ReservationInput } from "./validation";

export class ReservationConflictError extends Error {
  constructor(message = "This time no longer has enough capacity.") {
    super(message);
    this.name = "ReservationConflictError";
  }
}

export async function getAvailability(date: string, type: ReservationType, guests: number) {
  const dayStart = zonedDateTime(date, "00:00");
  const nextDay = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const rows = await db
    .select()
    .from(reservationCapacitySlots)
    .where(
      and(
        gte(reservationCapacitySlots.slotStart, dayStart),
        lt(reservationCapacitySlots.slotStart, nextDay),
      ),
    );
  const held = new Map(rows.map((row) => [row.slotStart.getTime(), row.heldGuests]));
  return generateCandidateSlots(date, type, guests, held);
}

export async function createReservation(input: ReservationInput) {
  const { startsAt, endsAt } = getReservationWindow(input.date, input.time, input.type);
  const slotStarts = getAllocationStarts(startsAt, endsAt).sort((a, b) => a.getTime() - b.getTime());
  const now = new Date();
  const id = randomUUID();
  const reference = createReservationReference(input.date);

  const created = await db.transaction(async (tx) => {
    await tx
      .insert(reservationCapacitySlots)
      .values(slotStarts.map((slotStart) => ({ slotStart, heldGuests: 0, updatedAt: now })))
      .onDuplicateKeyUpdate({ set: { updatedAt: sql`${reservationCapacitySlots.updatedAt}` } });

    const lockedSlots = await tx
      .select()
      .from(reservationCapacitySlots)
      .where(inArray(reservationCapacitySlots.slotStart, slotStarts))
      .orderBy(asc(reservationCapacitySlots.slotStart))
      .for("update");

    if (
      lockedSlots.length !== slotStarts.length ||
      lockedSlots.some((slot) => slot.heldGuests + input.guests > businessConfig.capacity)
    ) {
      throw new ReservationConflictError();
    }

    const row = {
      id,
      reference,
      type: input.type,
      status: "pending" as const,
      startsAt,
      endsAt,
      guestCount: input.guests,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: normalizePhone(input.phone),
      specialRequest: input.specialRequest?.trim() || null,
      rejectionReason: null,
      createdAt: now,
      updatedAt: now,
    };

    await tx.insert(reservations).values(row);
    await tx
      .update(reservationCapacitySlots)
      .set({
        heldGuests: sql`${reservationCapacitySlots.heldGuests} + ${input.guests}`,
        updatedAt: now,
      })
      .where(inArray(reservationCapacitySlots.slotStart, slotStarts));
    await tx.insert(reservationSlotAllocations).values(
      slotStarts.map((slotStart) => ({ reservationId: id, slotStart, guestCount: input.guests })),
    );
    await tx.insert(reservationAuditLogs).values({
      id: randomUUID(),
      reservationId: id,
      actorUserId: null,
      action: "created",
      before: null,
      after: row,
      createdAt: now,
    });

    return row;
  });

  return created;
}

export async function updateReservation(input: AdminReservationUpdate, actorUserId: string) {
  const { startsAt, endsAt } = getReservationWindow(input.date, input.time, input.type);
  const newSlotStarts = getAllocationStarts(startsAt, endsAt).sort((a, b) => a.getTime() - b.getTime());
  const now = new Date();

  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(reservations)
      .where(eq(reservations.id, input.id))
      .limit(1)
      .for("update");
    if (!current) throw new Error("Reservation not found.");
    if (current.status === "rejected") throw new Error("Rejected reservations are read-only.");

    const oldAllocations = await tx
      .select()
      .from(reservationSlotAllocations)
      .where(eq(reservationSlotAllocations.reservationId, current.id));
    const allStartsByTime = new Map<number, Date>();
    for (const allocation of oldAllocations) allStartsByTime.set(allocation.slotStart.getTime(), allocation.slotStart);
    for (const slotStart of newSlotStarts) allStartsByTime.set(slotStart.getTime(), slotStart);
    const allStarts = [...allStartsByTime.values()].sort((a, b) => a.getTime() - b.getTime());

    await tx
      .insert(reservationCapacitySlots)
      .values(newSlotStarts.map((slotStart) => ({ slotStart, heldGuests: 0, updatedAt: now })))
      .onDuplicateKeyUpdate({ set: { updatedAt: sql`${reservationCapacitySlots.updatedAt}` } });
    const locked = await tx
      .select()
      .from(reservationCapacitySlots)
      .where(inArray(reservationCapacitySlots.slotStart, allStarts))
      .orderBy(asc(reservationCapacitySlots.slotStart))
      .for("update");
    const oldSlotTimes = new Set(oldAllocations.map((allocation) => allocation.slotStart.getTime()));
    const lockedByTime = new Map(locked.map((slot) => [slot.slotStart.getTime(), slot]));
    const capacityExceeded = newSlotStarts.some((slotStart) => {
      const lockedSlot = lockedByTime.get(slotStart.getTime());
      if (!lockedSlot) return true;
      const releasedGuests = oldSlotTimes.has(slotStart.getTime()) ? current.guestCount : 0;
      return lockedSlot.heldGuests - releasedGuests + input.guests > businessConfig.capacity;
    });
    if (capacityExceeded) throw new ReservationConflictError();

    if (oldAllocations.length > 0) {
      for (const allocation of oldAllocations) {
        await tx
          .update(reservationCapacitySlots)
          .set({
            heldGuests: sql`GREATEST(0, ${reservationCapacitySlots.heldGuests} - ${allocation.guestCount})`,
            updatedAt: now,
          })
          .where(eq(reservationCapacitySlots.slotStart, allocation.slotStart));
      }
      await tx
        .delete(reservationSlotAllocations)
        .where(eq(reservationSlotAllocations.reservationId, current.id));
    }

    await tx
      .update(reservationCapacitySlots)
      .set({ heldGuests: sql`${reservationCapacitySlots.heldGuests} + ${input.guests}`, updatedAt: now })
      .where(inArray(reservationCapacitySlots.slotStart, newSlotStarts));
    await tx.insert(reservationSlotAllocations).values(
      newSlotStarts.map((slotStart) => ({
        reservationId: current.id,
        slotStart,
        guestCount: input.guests,
      })),
    );

    const changes = {
      type: input.type,
      startsAt,
      endsAt,
      guestCount: input.guests,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: normalizePhone(input.phone),
      specialRequest: input.specialRequest?.trim() || null,
      updatedAt: now,
    };
    await tx.update(reservations).set(changes).where(eq(reservations.id, current.id));
    await tx.insert(reservationAuditLogs).values({
      id: randomUUID(),
      reservationId: current.id,
      actorUserId,
      action: "updated",
      before: current,
      after: { ...current, ...changes },
      createdAt: now,
    });
    return { ...current, ...changes };
  });
}

export async function changeReservationStatus(
  id: string,
  status: "confirmed" | "rejected",
  actorUserId: string,
  rejectionReason?: string,
) {
  const now = new Date();
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(reservations)
      .where(eq(reservations.id, id))
      .limit(1)
      .for("update");
    if (!current) throw new Error("Reservation not found.");
    if (current.status !== "pending") throw new Error("Only pending reservations can change status.");

    if (status === "rejected") {
      const allocations = await tx
        .select()
        .from(reservationSlotAllocations)
        .where(eq(reservationSlotAllocations.reservationId, id));
      const starts = allocations.map((allocation) => allocation.slotStart).sort((a, b) => a.getTime() - b.getTime());
      if (starts.length > 0) {
        await tx
          .select()
          .from(reservationCapacitySlots)
          .where(inArray(reservationCapacitySlots.slotStart, starts))
          .orderBy(asc(reservationCapacitySlots.slotStart))
          .for("update");
        for (const allocation of allocations) {
          await tx
            .update(reservationCapacitySlots)
            .set({
              heldGuests: sql`GREATEST(0, ${reservationCapacitySlots.heldGuests} - ${allocation.guestCount})`,
              updatedAt: now,
            })
            .where(eq(reservationCapacitySlots.slotStart, allocation.slotStart));
        }
        await tx
          .delete(reservationSlotAllocations)
          .where(eq(reservationSlotAllocations.reservationId, id));
      }
    }

    const changes = {
      status,
      rejectionReason: status === "rejected" ? rejectionReason?.trim() ?? null : null,
      updatedAt: now,
    };
    await tx.update(reservations).set(changes).where(eq(reservations.id, id));
    await tx.insert(reservationAuditLogs).values({
      id: randomUUID(),
      reservationId: id,
      actorUserId,
      action: status === "confirmed" ? "confirmed" : "rejected",
      before: current,
      after: { ...current, ...changes },
      createdAt: now,
    });
    return { ...current, ...changes };
  });
}

export async function listReservations(filters: {
  query?: string;
  status?: ReservationStatus;
  date?: string;
} = {}) {
  const conditions = [];
  if (filters.status) conditions.push(eq(reservations.status, filters.status));
  if (filters.query) {
    const search = `%${filters.query}%`;
    conditions.push(
      or(
        like(reservations.reference, search),
        like(reservations.name, search),
        like(reservations.email, search),
        like(reservations.phone, search),
      )!,
    );
  }
  if (filters.date) {
    const start = zonedDateTime(filters.date, "00:00");
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    conditions.push(gte(reservations.startsAt, start), lt(reservations.startsAt, end));
  }
  return db
    .select()
    .from(reservations)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(reservations.startsAt));
}

export async function listTodayReservations() {
  return listReservations({ date: getBusinessDate() });
}

export async function getReservationById(id: string) {
  const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id)).limit(1);
  return reservation ?? null;
}

export async function getReservationAudit(id: string) {
  return db
    .select()
    .from(reservationAuditLogs)
    .where(eq(reservationAuditLogs.reservationId, id))
    .orderBy(desc(reservationAuditLogs.createdAt));
}

export async function getReservationEmailDeliveries(id: string) {
  return db
    .select()
    .from(emailDeliveries)
    .where(eq(emailDeliveries.reservationId, id))
    .orderBy(desc(emailDeliveries.createdAt));
}

export async function listMonthReservations(month: string) {
  const start = zonedDateTime(`${month}-01`, "00:00");
  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(5, 7));
  const nextYear = monthNumber === 12 ? year + 1 : year;
  const nextMonth = monthNumber === 12 ? 1 : monthNumber + 1;
  const end = zonedDateTime(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01`, "00:00");
  return db
    .select()
    .from(reservations)
    .where(and(gte(reservations.startsAt, start), lt(reservations.startsAt, end)))
    .orderBy(asc(reservations.startsAt));
}

function normalizePhone(value: string) {
  const trimmed = value.trim();
  const prefix = trimmed.startsWith("+") ? "+" : "";
  return `${prefix}${trimmed.replace(/\D/g, "")}`;
}

export function serializeReservation(reservation: Reservation) {
  return {
    ...reservation,
    startsAt: reservation.startsAt.toISOString(),
    endsAt: reservation.endsAt.toISOString(),
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
  };
}
