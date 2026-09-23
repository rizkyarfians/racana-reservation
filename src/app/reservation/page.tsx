import type { Metadata } from "next";

import { ReservationExperience } from "@/components/reservation/reservation-experience";

export const metadata: Metadata = {
  title: "Reserve",
  description: "Request a table, private event, or workshop at Racana.",
};

export default function ReservationPage() {
  return <ReservationExperience />;
}
