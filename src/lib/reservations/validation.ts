import { z } from "zod";

import { reservationStatuses, reservationTypes } from "@/db/schema";

const phoneRegex = /^\+?[0-9][0-9\s().-]{7,24}$/;

export const availabilityQuerySchema = z.object({
  date: z.iso.date(),
  type: z.enum(reservationTypes),
  guests: z.coerce.number().int().min(1).max(50),
});

export const reservationInputSchema = z.object({
  date: z.iso.date(),
  type: z.enum(reservationTypes),
  guests: z.number().int().min(1, "At least one guest is required.").max(50),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a valid time."),
  name: z.string().trim().min(2, "Enter your full name.").max(120),
  email: z.email("Enter a valid email address.").max(255),
  phone: z.string().trim().regex(phoneRegex, "Enter a valid phone number.").max(32),
  specialRequest: z.string().trim().max(1000),
  website: z.string().max(0),
});

export const adminReservationUpdateSchema = reservationInputSchema
  .omit({ website: true, guests: true })
  .extend({ id: z.string().min(1), guests: z.coerce.number().int().min(1).max(50) });

export const reservationStatusSchema = z.discriminatedUnion("status", [
  z.object({ id: z.string().min(1), status: z.literal("confirmed") }),
  z.object({
    id: z.string().min(1),
    status: z.literal("rejected"),
    rejectionReason: z.string().trim().min(3, "A rejection reason is required.").max(1000),
  }),
]);

export const reservationFilterSchema = z.object({
  query: z.string().trim().max(120).optional(),
  status: z.enum(reservationStatuses).optional(),
  date: z.iso.date().optional(),
});

export type ReservationInput = z.infer<typeof reservationInputSchema>;
export type AdminReservationUpdate = z.infer<typeof adminReservationUpdateSchema>;
