import { addDays, addHours, addMinutes, isAfter, isBefore, isEqual } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import { businessConfig } from "@/lib/config";
import type { AvailabilitySlot, ReservationType } from "./types";

function minutesFromClock(clock: string) {
  const [hours, minutes] = clock.split(":").map(Number);
  return hours * 60 + minutes;
}

export function zonedDateTime(date: string, time: string) {
  return fromZonedTime(`${date}T${time}:00`, businessConfig.timezone);
}

export function getReservationWindow(date: string, time: string, type: ReservationType) {
  const startsAt = zonedDateTime(date, time);
  const endsAt = addMinutes(startsAt, businessConfig.durations[type]);
  return { startsAt, endsAt };
}

export function getAllocationStarts(startsAt: Date, endsAt: Date) {
  const slots: Date[] = [];
  for (let cursor = startsAt; isBefore(cursor, endsAt); cursor = addMinutes(cursor, businessConfig.slotMinutes)) {
    slots.push(cursor);
  }
  return slots;
}

export function generateCandidateSlots(
  date: string,
  type: ReservationType,
  guests: number,
  heldBySlot: Map<number, number> = new Map(),
  now = new Date(),
): AvailabilitySlot[] {
  if (guests < 1 || guests > businessConfig.capacity) return [];

  const openMinutes = minutesFromClock(businessConfig.openTime);
  const closeMinutes = minutesFromClock(businessConfig.closeTime);
  const duration = businessConfig.durations[type];
  const earliest = addHours(now, businessConfig.minLeadHours);
  const latest = addDays(now, businessConfig.maxBookingDays);
  const results: AvailabilitySlot[] = [];

  for (let minute = openMinutes; minute + duration <= closeMinutes; minute += businessConfig.slotMinutes) {
    const time = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
    const { startsAt, endsAt } = getReservationWindow(date, time, type);
    if (isBefore(startsAt, earliest) || isAfter(startsAt, latest)) continue;

    const allocationStarts = getAllocationStarts(startsAt, endsAt);
    const remainingCapacity = Math.min(
      ...allocationStarts.map((slotStart) => businessConfig.capacity - (heldBySlot.get(slotStart.getTime()) ?? 0)),
    );
    if (remainingCapacity < guests) continue;

    results.push({
      value: time,
      label: formatInTimeZone(startsAt, businessConfig.timezone, "h:mm a"),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      remainingCapacity,
    });
  }

  return results;
}

export function isSlotCandidateValid(
  date: string,
  time: string,
  type: ReservationType,
  guests: number,
  now = new Date(),
) {
  return generateCandidateSlots(date, type, guests, new Map(), now).some((slot) => slot.value === time);
}

export function getBusinessDate(date = new Date()) {
  return formatInTimeZone(date, businessConfig.timezone, "yyyy-MM-dd");
}

export function getMonthRange(month: string) {
  const start = zonedDateTime(`${month}-01`, "00:00");
  const nextMonth = addMonthsUtcSafe(start);
  return { start, end: nextMonth };
}

function addMonthsUtcSafe(date: Date) {
  const localYear = Number(formatInTimeZone(date, businessConfig.timezone, "yyyy"));
  const localMonth = Number(formatInTimeZone(date, businessConfig.timezone, "M"));
  const nextYear = localMonth === 12 ? localYear + 1 : localYear;
  const nextMonth = localMonth === 12 ? 1 : localMonth + 1;
  return fromZonedTime(
    `${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00`,
    businessConfig.timezone,
  );
}

export function formatReservationDate(date: Date, pattern = "MMMM d, yyyy") {
  return formatInTimeZone(date, businessConfig.timezone, pattern);
}

export function formatReservationTime(date: Date) {
  return formatInTimeZone(date, businessConfig.timezone, "h:mm a");
}

export function isSameInstant(left: Date, right: Date) {
  return isEqual(left, right);
}
