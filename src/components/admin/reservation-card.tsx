import { CalendarDays, Clock3, Mail, Phone, Users } from "lucide-react";
import Link from "next/link";

import { ReservationActions } from "@/components/admin/reservation-actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import type { Reservation } from "@/db/schema";
import { formatReservationDate, formatReservationTime } from "@/lib/reservations/availability";
import { reservationTypeLabels } from "@/lib/reservations/types";

export function ReservationCard({ reservation }: { reservation: Reservation }) {
  return <article className="rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><div className="flex flex-wrap items-center gap-2"><p className="font-display text-3xl">{formatReservationTime(reservation.startsAt)}</p><StatusBadge status={reservation.status} /></div><p className="mt-1 text-sm text-muted-foreground">{formatReservationDate(reservation.startsAt, "EEEE, MMMM d")}</p></div><p className="font-mono text-xs text-muted-foreground">{reservation.reference}</p></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><div><h3 className="text-lg font-semibold">{reservation.name}</h3><p className="mt-1 text-sm text-muted-foreground">{reservationTypeLabels[reservation.type]}</p></div><div className="grid gap-2 text-sm text-muted-foreground"><span className="flex items-center gap-2"><Users className="size-4 text-[#9b6042]" />{reservation.guestCount} guests</span><span className="flex items-center gap-2"><Mail className="size-4 text-[#9b6042]" />{reservation.email}</span><span className="flex items-center gap-2"><Phone className="size-4 text-[#9b6042]" />{reservation.phone}</span></div></div><div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><Button variant="ghost" size="sm" render={<Link href={`/admin/reservations/${reservation.id}`} />}>View details</Button>{reservation.status === "pending" ? <ReservationActions id={reservation.id} compact /> : <span className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="size-3.5" /><Clock3 className="size-3.5" />Updated {formatReservationDate(reservation.updatedAt, "MMM d")}</span>}</div></article>;
}
