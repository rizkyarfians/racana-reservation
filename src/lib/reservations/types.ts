import type { reservationStatuses, reservationTypes } from "@/db/schema";

export type ReservationType = (typeof reservationTypes)[number];
export type ReservationStatus = (typeof reservationStatuses)[number];

export const reservationTypeLabels: Record<ReservationType, string> = {
  regular_group: "Regular group",
  private_event: "Private event",
  meeting_workshop: "Meeting / Workshop",
};

export const reservationTypeDescriptions: Record<ReservationType, string> = {
  regular_group: "A relaxed table reservation for lunch, dinner, or a celebration.",
  private_event: "Exclusive space for a private celebration or special occasion.",
  meeting_workshop: "A focused setting for meetings, team sessions, and workshops.",
};

export interface AvailabilitySlot {
  value: string;
  label: string;
  startsAt: string;
  endsAt: string;
  remainingCapacity: number;
}
