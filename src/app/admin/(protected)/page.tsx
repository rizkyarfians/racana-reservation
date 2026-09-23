import { format } from "date-fns";
import { CalendarDays, Search, Sparkles, Users } from "lucide-react";
import Link from "next/link";

import { ReservationCard } from "@/components/admin/reservation-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth-session";
import { listReservations } from "@/lib/reservations/repository";
import type { ReservationStatus } from "@/lib/reservations/types";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ query?: string; status?: string; date?: string }> }) {
  const context = await requireAdmin();
  const params = await searchParams;
  const today = format(new Date(), "yyyy-MM-dd");
  const selectedDate = params.date || today;
  const status = ["pending", "confirmed", "rejected"].includes(params.status ?? "") ? params.status as ReservationStatus : undefined;
  const rows = await listReservations({ query: params.query, status, date: selectedDate });
  const pending = rows.filter((row) => row.status === "pending").length;
  const guestTotal = rows.filter((row) => row.status !== "rejected").reduce((total, row) => total + row.guestCount, 0);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return <div className="mx-auto max-w-6xl"><header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9b6042]">{greeting}</p><h1 className="mt-2 font-display text-5xl">Today at Racana</h1><p className="mt-2 text-muted-foreground">Welcome back, {context.session.user.name.split(" ")[0]}.</p></div><Button variant="outline" render={<Link href="/admin/calendar" />}><CalendarDays className="size-4" />Calendar view</Button></header><section className="mt-8 grid gap-3 sm:grid-cols-3"><Metric icon={<Sparkles />} label="Reservations" value={rows.length} /><Metric icon={<Users />} label="Expected guests" value={guestTotal} /><Metric icon={<CalendarDays />} label="Needs review" value={pending} /></section><form className="mt-8 grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-[1fr_180px_170px_auto]"><div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input name="query" defaultValue={params.query} placeholder="Search guest or reference" className="pl-9" /></div><select name="status" defaultValue={params.status ?? ""} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="">All statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="rejected">Rejected</option></select><Input name="date" type="date" defaultValue={selectedDate} /><Button type="submit">Filter</Button></form><div className="mt-7 flex items-center justify-between"><h2 className="font-display text-3xl">{selectedDate === today ? "Today’s reservations" : format(new Date(`${selectedDate}T12:00:00`), "MMMM d, yyyy")}</h2><span className="text-sm text-muted-foreground">{rows.length} {rows.length === 1 ? "booking" : "bookings"}</span></div><section className="mt-4 grid gap-4 xl:grid-cols-2">{rows.length > 0 ? rows.map((reservation) => <ReservationCard key={reservation.id} reservation={reservation} />) : <div className="col-span-full rounded-3xl border border-dashed bg-card/60 py-16 text-center"><CalendarDays className="mx-auto size-8 text-muted-foreground" /><h3 className="mt-4 font-semibold">A clear schedule</h3><p className="mt-1 text-sm text-muted-foreground">No reservations match these filters.</p></div>}</section></div>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <div className="rounded-2xl border bg-card p-5"><div className="flex items-center justify-between text-muted-foreground"><span className="text-sm">{label}</span><span className="[&_svg]:size-4 [&_svg]:text-[#9b6042]">{icon}</span></div><p className="mt-2 font-display text-4xl">{value}</p></div>; }
