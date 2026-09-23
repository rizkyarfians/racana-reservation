import { describe, expect, it } from "vitest";

import { generateCandidateSlots, getAllocationStarts, getReservationWindow } from "./availability";

const now = new Date("2026-09-20T00:00:00.000Z");

describe("reservation availability", () => {
  it("keeps a regular group inside business hours", () => {
    const slots = generateCandidateSlots("2026-09-30", "regular_group", 2, new Map(), now);
    expect(slots[0]?.value).toBe("10:00");
    expect(slots.at(-1)?.value).toBe("20:00");
  });

  it("uses the longer private-event duration", () => {
    const slots = generateCandidateSlots("2026-09-30", "private_event", 2, new Map(), now);
    expect(slots.at(-1)?.value).toBe("18:00");
  });

  it("removes a candidate when any overlapping interval lacks capacity", () => {
    const { startsAt, endsAt } = getReservationWindow("2026-09-30", "18:00", "regular_group");
    const held = new Map(getAllocationStarts(startsAt, endsAt).map((slot) => [slot.getTime(), 49]));
    const slots = generateCandidateSlots("2026-09-30", "regular_group", 2, held, now);
    expect(slots.some((slot) => slot.value === "18:00")).toBe(false);
  });

  it("allows capacity exactly at the limit", () => {
    const { startsAt, endsAt } = getReservationWindow("2026-09-30", "18:00", "regular_group");
    const held = new Map(getAllocationStarts(startsAt, endsAt).map((slot) => [slot.getTime(), 48]));
    const slots = generateCandidateSlots("2026-09-30", "regular_group", 2, held, now);
    expect(slots.find((slot) => slot.value === "18:00")?.remainingCapacity).toBe(2);
  });

  it("creates one capacity allocation for each 30-minute interval", () => {
    const { startsAt, endsAt } = getReservationWindow("2026-09-30", "18:00", "meeting_workshop");
    expect(getAllocationStarts(startsAt, endsAt)).toHaveLength(6);
  });
});
