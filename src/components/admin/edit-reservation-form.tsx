"use client";

import { useActionState } from "react";

import { updateReservationAction } from "@/app/admin/actions";
import { ActionMessage } from "@/components/admin/action-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ReservationType } from "@/lib/reservations/types";

export function EditReservationForm({ reservation }: { reservation: { id: string; date: string; time: string; type: ReservationType; guests: number; name: string; email: string; phone: string; specialRequest: string; status: string } }) {
  const [state, action, pending] = useActionState(updateReservationAction, {});
  const readOnly = reservation.status === "rejected";
  return <form action={action} className="space-y-6"><input type="hidden" name="id" value={reservation.id} /><fieldset disabled={readOnly || pending} className="grid gap-5 sm:grid-cols-2"><Field label="Date"><Input name="date" type="date" required defaultValue={reservation.date} /></Field><Field label="Time"><Input name="time" type="time" step="1800" required defaultValue={reservation.time} /></Field><Field label="Experience"><select name="type" required defaultValue={reservation.type} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="regular_group">Regular group</option><option value="private_event">Private event</option><option value="meeting_workshop">Meeting / Workshop</option></select></Field><Field label="Guests"><Input name="guests" type="number" min={1} max={50} required defaultValue={reservation.guests} /></Field><Field label="Guest name" className="sm:col-span-2"><Input name="name" required minLength={2} maxLength={120} defaultValue={reservation.name} /></Field><Field label="Email"><Input name="email" type="email" required defaultValue={reservation.email} /></Field><Field label="Phone"><Input name="phone" type="tel" required defaultValue={reservation.phone} /></Field><Field label="Special request" className="sm:col-span-2"><Textarea name="specialRequest" maxLength={1000} defaultValue={reservation.specialRequest} className="min-h-28" /></Field></fieldset><ActionMessage state={state} />{!readOnly ? <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes & notify guest"}</Button> : <p className="text-sm text-muted-foreground">Rejected reservations are read-only.</p>}</form>;
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) { return <div className={className}><Label className="mb-2">{label}</Label>{children}</div>; }
