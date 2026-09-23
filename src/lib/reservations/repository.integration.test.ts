import { randomUUID } from "node:crypto";

import { addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db, pool } from "@/db";
import { emailDeliveries, reservationAuditLogs, reservationCapacitySlots, reservations, reservationSlotAllocations, users } from "@/db/schema";
import { businessConfig } from "@/lib/config";
import { changeReservationStatus, createReservation, getAvailability, ReservationConflictError, updateReservation } from "./repository";

const run = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;
const date = formatInTimeZone(addDays(new Date(), 7), businessConfig.timezone, "yyyy-MM-dd");

run("reservation repository with MySQL", () => {
  let actorId = "";

  beforeAll(async () => {
    await db.delete(emailDeliveries);
    await db.delete(reservationAuditLogs);
    await db.delete(reservationSlotAllocations);
    await db.delete(reservations);
    await db.delete(reservationCapacitySlots);
    const [owner] = await db.select().from(users).limit(1);
    actorId = owner?.id ?? randomUUID();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("does not allow concurrent requests to overbook capacity", async () => {
    const base = { date, type: "regular_group" as const, guests: 30, time: "18:00", email: "capacity@example.com", phone: "+6281234567890", specialRequest: "", website: "" };
    const results = await Promise.allSettled([
      createReservation({ ...base, name: "Capacity One" }),
      createReservation({ ...base, name: "Capacity Two" }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected && rejected.status === "rejected" ? rejected.reason : null).toBeInstanceOf(ReservationConflictError);
  });

  it("releases every interval after rejection", async () => {
    const [existing] = await db.select().from(reservations).where(eq(reservations.startsAt, new Date(`${date}T11:00:00.000Z`))).limit(1);
    const row = existing ?? (await db.select().from(reservations).limit(1))[0];
    expect(row).toBeDefined();
    await changeReservationStatus(row!.id, "rejected", actorId, "Test capacity release");
    const slots = await getAvailability(date, "regular_group", 50);
    expect(slots.some((slot) => slot.value === "18:00")).toBe(true);
  });

  it("moves capacity atomically when an active reservation is edited", async () => {
    const created = await createReservation({ date, type: "regular_group", guests: 20, time: "12:00", name: "Move Test", email: "move@example.com", phone: "+6281234567890", specialRequest: "", website: "" });
    const updated = await updateReservation({ id: created.id, date, type: "meeting_workshop", guests: 20, time: "14:00", name: "Move Test", email: "move@example.com", phone: "+6281234567890", specialRequest: "Moved" }, actorId);
    expect(updated.startsAt.getTime()).not.toBe(created.startsAt.getTime());
    expect((await getAvailability(date, "regular_group", 50)).some((slot) => slot.value === "12:00")).toBe(true);
  });
});
