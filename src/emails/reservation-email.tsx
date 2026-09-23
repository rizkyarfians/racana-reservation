import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import type { Reservation } from "@/db/schema";
import { formatReservationDate, formatReservationTime } from "@/lib/reservations/availability";
import { reservationTypeLabels } from "@/lib/reservations/types";

export type ReservationEmailKind = "received" | "updated" | "confirmed" | "rejected";

const copy: Record<ReservationEmailKind, { heading: string; preview: string }> = {
  received: {
    heading: "Reservation request received",
    preview: "We received your reservation request.",
  },
  updated: {
    heading: "Reservation details updated",
    preview: "Your reservation details have been updated.",
  },
  confirmed: {
    heading: "Reservation confirmed",
    preview: "Your reservation has been confirmed.",
  },
  rejected: {
    heading: "Reservation request update",
    preview: "There is an update to your reservation request.",
  },
};

export function ReservationEmail({ reservation, kind }: { reservation: Reservation; kind: ReservationEmailKind }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{copy[kind].preview}</Preview>
      <Body style={{ backgroundColor: "#f4f1e9", fontFamily: "Arial, sans-serif", padding: "32px 12px" }}>
        <Container style={{ backgroundColor: "#fffdf8", border: "1px solid #ded7c8", borderRadius: 18, padding: 32, maxWidth: 560 }}>
          <Text style={{ color: "#9b5f3f", fontSize: 12, fontWeight: 700, letterSpacing: 2, margin: 0 }}>RACANA</Text>
          <Heading style={{ color: "#17382d", fontSize: 30, lineHeight: 1.2, margin: "16px 0 8px" }}>{copy[kind].heading}</Heading>
          <Text style={{ color: "#5f665f", fontSize: 16, lineHeight: 1.6 }}>Hi {reservation.name}, here are the latest details for your reservation.</Text>
          <Section style={{ backgroundColor: "#f7f3e9", borderRadius: 14, padding: "18px 22px", margin: "24px 0" }}>
            <Text style={lineStyle}><strong>{formatReservationDate(reservation.startsAt)}</strong></Text>
            <Text style={lineStyle}>{formatReservationTime(reservation.startsAt)} · {reservation.guestCount} guests</Text>
            <Text style={lineStyle}>{reservationTypeLabels[reservation.type]}</Text>
            <Text style={lineStyle}>Reference: {reservation.reference}</Text>
            <Text style={{ ...lineStyle, color: "#9b5f3f", textTransform: "capitalize" }}>Status: {reservation.status}</Text>
          </Section>
          {kind === "rejected" && reservation.rejectionReason ? (
            <Section style={{ borderLeft: "3px solid #9b5f3f", paddingLeft: 16 }}>
              <Text style={{ ...lineStyle, fontWeight: 700 }}>Reason</Text>
              <Text style={lineStyle}>{reservation.rejectionReason}</Text>
            </Section>
          ) : null}
          <Hr style={{ borderColor: "#ded7c8", margin: "28px 0" }} />
          <Text style={{ color: "#7a7d77", fontSize: 13, lineHeight: 1.6 }}>If you need help, reply to this email and mention your reservation reference.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const lineStyle = { color: "#263c34", fontSize: 15, lineHeight: 1.5, margin: "4px 0" };
