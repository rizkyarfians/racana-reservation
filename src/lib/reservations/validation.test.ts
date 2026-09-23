import { describe, expect, it } from "vitest";

import { reservationInputSchema, reservationStatusSchema } from "./validation";

const valid = {
  date: "2026-09-30",
  type: "private_event",
  guests: 18,
  time: "18:00",
  name: "John Smith",
  email: "john@example.com",
  phone: "+62 812 3456 7890",
  specialRequest: "Vegetarian menu",
  website: "",
};

describe("reservation validation", () => {
  it("accepts a complete reservation", () => {
    expect(reservationInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a party above venue capacity", () => {
    expect(reservationInputSchema.safeParse({ ...valid, guests: 51 }).success).toBe(false);
  });

  it("rejects an invalid phone number", () => {
    expect(reservationInputSchema.safeParse({ ...valid, phone: "123" }).success).toBe(false);
  });

  it("requires a customer-facing rejection reason", () => {
    expect(reservationStatusSchema.safeParse({ id: "abc", status: "rejected", rejectionReason: "" }).success).toBe(false);
  });
});
