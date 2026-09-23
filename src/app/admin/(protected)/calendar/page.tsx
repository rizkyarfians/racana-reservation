import { addMonths, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ChevronLeft, ChevronRight, Clock3, Users } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { businessConfig } from "@/lib/config";
import { formatReservationTime } from "@/lib/reservations/availability";
import { listMonthReservations } from "@/lib/reservations/repository";
import { reservationTypeLabels } from "@/lib/reservations/types";
import { cn } from "@/lib/utils";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string; day?: string }> }) {
  const params = await searchParams;
  const fallbackMonth = formatInTimeZone(new Date(), businessConfig.timezone, "yyyy-MM");
  const month = /^\d{4}-\d{2}$/.test(params.month ?? "") ? params.month! : fallbackMonth;
  const monthDate = new Date(`${month}-01T12:00:00`);
  const rows = await listMonthReservations(month);
  const defaultDay = month === fallbackMonth ? formatInTimeZone(new Date(), businessConfig.timezone, "yyyy-MM-dd") : `${month}-01`;
  const selectedDay = /^\d{4}-\d{2}-\d{2}$/.test(params.day ?? "") ? params.day! : defaultDay;
  const byDay = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = formatInTimeZone(row.startsAt, businessConfig.timezone, "yyyy-MM-dd");
    byDay.set(key, [...(byDay.get(key) ?? []), row]);
  }
  const calendarStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let cursor = calendarStart; cursor <= calendarEnd; cursor = new Date(cursor.getTime() + 86400000)) days.push(cursor);
  const selectedRows = byDay.get(selectedDay) ?? [];
  const previousMonth = format(addMonths(monthDate, -1), "yyyy-MM");
  const nextMonth = format(addMonths(monthDate, 1), "yyyy-MM");

  return <div className="mx-auto max-w-7xl"><header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9b6042]">Schedule</p><h1 className="mt-2 font-display text-5xl">Calendar</h1><p className="mt-2 text-muted-foreground">See the shape of every gathering at a glance.</p></div><Button variant="outline" render={<Link href="/admin" />}>Back to dashboard</Button></header><div className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]"><section className="overflow-hidden rounded-3xl border bg-card shadow-sm"><div className="flex items-center justify-between border-b px-5 py-4"><Button size="icon" variant="ghost" render={<Link href={`/admin/calendar?month=${previousMonth}`} />}><ChevronLeft /></Button><h2 className="font-display text-2xl">{format(monthDate, "MMMM yyyy")}</h2><Button size="icon" variant="ghost" render={<Link href={`/admin/calendar?month=${nextMonth}`} />}><ChevronRight /></Button></div><div className="grid grid-cols-7 border-b bg-secondary/50 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day} className="py-3">{day}</div>)}</div><div className="grid grid-cols-7">{days.map((day) => { const key = format(day, "yyyy-MM-dd"); const events = byDay.get(key) ?? []; const outside = format(day, "yyyy-MM") !== month; return <Link key={key} href={`/admin/calendar?month=${month}&day=${key}`} className={cn("min-h-24 border-b border-r p-2 transition-colors hover:bg-secondary/60 sm:min-h-28 sm:p-3", outside && "bg-muted/40 text-muted-foreground", selectedDay === key && "bg-[#f2e7dc] ring-2 ring-inset ring-[#9b6042]/40")}><span className={cn("grid size-7 place-items-center rounded-full text-sm", key === defaultDay && month === fallbackMonth && "bg-primary text-primary-foreground")}>{format(day, "d")}</span><div className="mt-2 flex flex-wrap gap-1">{events.slice(0, 4).map((event) => <span key={event.id} title={`${event.name} · ${event.status}`} className={cn("size-2 rounded-full", event.status === "pending" && "bg-amber-500", event.status === "confirmed" && "bg-emerald-600", event.status === "rejected" && "bg-rose-500")} />)}{events.length > 4 ? <span className="text-[10px] text-muted-foreground">+{events.length - 4}</span> : null}</div></Link>; })}</div></section><aside className="rounded-3xl border bg-card p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9b6042]">Selected day</p><h2 className="mt-2 font-display text-3xl">{format(new Date(`${selectedDay}T12:00:00`), "MMMM d")}</h2><p className="mt-1 text-sm text-muted-foreground">{selectedRows.length} {selectedRows.length === 1 ? "reservation" : "reservations"}</p><div className="mt-5 space-y-3">{selectedRows.length > 0 ? selectedRows.map((reservation) => <Link href={`/admin/reservations/${reservation.id}`} key={reservation.id} className="block rounded-2xl border p-4 transition-colors hover:bg-secondary/50"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{reservation.name}</p><p className="mt-1 text-xs text-muted-foreground">{reservationTypeLabels[reservation.type]}</p></div><StatusBadge status={reservation.status} /></div><div className="mt-3 flex gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock3 className="size-3" />{formatReservationTime(reservation.startsAt)}</span><span className="flex items-center gap-1"><Users className="size-3" />{reservation.guestCount}</span></div></Link>) : <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">No gatherings scheduled.</p>}</div></aside></div></div>;
}
