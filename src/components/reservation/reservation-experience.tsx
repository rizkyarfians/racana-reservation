"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, format } from "date-fns";
import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, Clock3, Loader2, Mail, Minus, Plus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AvailabilitySlot, ReservationType } from "@/lib/reservations/types";
import { reservationTypeDescriptions, reservationTypeLabels } from "@/lib/reservations/types";
import { reservationInputSchema, type ReservationInput } from "@/lib/reservations/validation";
import { cn } from "@/lib/utils";

const steps = ["Date", "Experience", "Guests", "Time", "Contact", "Requests", "Review"] as const;

type Receipt = {
  reference: string;
  status: string;
  type: ReservationType;
  startsAt: string;
  endsAt: string;
  guests: number;
  name: string;
};

export function ReservationExperience() {
  const [step, setStep] = useState(0);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [emailSent, setEmailSent] = useState(true);
  const today = useMemo(() => new Date(), []);

  const form = useForm<ReservationInput>({
    resolver: zodResolver(reservationInputSchema),
    mode: "onTouched",
    defaultValues: {
      date: format(addDays(today, 1), "yyyy-MM-dd"),
      type: "regular_group",
      guests: 2,
      time: "",
      name: "",
      email: "",
      phone: "",
      specialRequest: "",
      website: "",
    },
  });
  useEffect(() => {
    form.register("date");
    form.register("type");
    form.register("guests");
    form.register("time");
  }, [form]);
  // React Hook Form intentionally exposes a subscription-based watch API.
  // eslint-disable-next-line react-hooks/incompatible-library
  const values = form.watch();

  useEffect(() => {
    if (step !== 3 || !values.date || !values.type || !values.guests) return;
    const controller = new AbortController();
    setLoadingSlots(true);
    setAvailabilityError("");
    const params = new URLSearchParams({ date: values.date, type: values.type, guests: String(values.guests) });
    fetch(`/api/availability?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Could not load times.");
        return body as { slots: AvailabilitySlot[] };
      })
      .then((body) => {
        setSlots(body.slots);
        if (!body.slots.some((slot) => slot.value === form.getValues("time"))) form.setValue("time", "");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setAvailabilityError(error instanceof Error ? error.message : "Could not load times.");
      })
      .finally(() => setLoadingSlots(false));
    return () => controller.abort();
  }, [step, values.date, values.type, values.guests, form]);

  async function next() {
    const fieldsByStep: Array<Array<keyof ReservationInput>> = [
      ["date"], ["type"], ["guests"], ["time"], ["name", "email", "phone"], ["specialRequest"], [],
    ];
    if (await form.trigger(fieldsByStep[step])) setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function submit(input: ReservationInput) {
    setSubmitError("");
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to submit your request.");
      setReceipt(body.reservation);
      setEmailSent(Boolean(body.emailSent));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to submit your request.");
    }
  }

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-12">
        <Brand />
        <a href="mailto:hello@racana.example" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block">
          Need help? <span className="font-semibold text-foreground">Contact us</span>
        </a>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-96px)] w-full max-w-7xl lg:grid-cols-[0.85fr_1.15fr]">
        <section className="relative hidden overflow-hidden border-r border-border/70 px-12 py-16 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 paper-grid opacity-70" />
          <div className="relative max-w-md">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-[#9b6042]">Your table awaits</p>
            <h1 className="font-display text-6xl leading-[0.98] text-primary">
              Good food.<br />Great company.<br /><em className="font-normal text-[#9b6042]">Your moment.</em>
            </h1>
            <p className="mt-8 max-w-sm text-base leading-7 text-muted-foreground">
              From quiet dinners to landmark celebrations, tell us what you have in mind. We will take care of the details.
            </p>
          </div>
          <div className="relative grid grid-cols-3 gap-3 text-sm">
            <Feature icon={<Clock3 className="size-4" />} title="Daily" detail="10 am – 10 pm" />
            <Feature icon={<Users className="size-4" />} title="Groups" detail="Up to 50 guests" />
            <Feature icon={<CalendarDays className="size-4" />} title="Flexible" detail="Plan 90 days ahead" />
          </div>
        </section>

        <section className="flex items-start justify-center px-5 py-8 sm:px-10 lg:px-16 lg:py-14">
          {receipt ? <ReceiptView receipt={receipt} emailSent={emailSent} /> : (
            <form onSubmit={form.handleSubmit(submit)} className="w-full max-w-2xl">
              <div className="mb-10">
                <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <span>Step {step + 1} of {steps.length}</span><span>{steps[step]}</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-[#9b6042] transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
                </div>
              </div>

              <div className="min-h-[430px]">
                {step === 0 && <DateStep value={values.date} onChange={(value) => form.setValue("date", value, { shouldDirty: true })} error={form.formState.errors.date?.message} today={today} />}
                {step === 1 && <TypeStep value={values.type} onChange={(value) => form.setValue("type", value, { shouldDirty: true })} />}
                {step === 2 && <GuestsStep value={values.guests} onChange={(value) => form.setValue("guests", value, { shouldDirty: true })} />}
                {step === 3 && <TimeStep value={values.time} slots={slots} loading={loadingSlots} error={availabilityError || form.formState.errors.time?.message} onChange={(value) => form.setValue("time", value, { shouldDirty: true })} />}
                {step === 4 && <ContactStep form={form} />}
                {step === 5 && <RequestStep form={form} />}
                {step === 6 && <ReviewStep values={values} />}
              </div>

              {submitError ? <p role="alert" className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{submitError}</p> : null}
              <div className="flex items-center justify-between border-t border-border pt-6">
                <Button type="button" variant="ghost" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || form.formState.isSubmitting}>
                  <ArrowLeft className="size-4" /> Back
                </Button>
                {step < steps.length - 1 ? (
                  <Button key={`continue-${step}`} type="button" size="lg" className="rounded-full px-7" onClick={(event) => { event.preventDefault(); void next(); }}>Continue <ArrowRight className="size-4" /></Button>
                ) : (
                  <Button key="submit" type="submit" size="lg" className="rounded-full px-7" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Submit request
                  </Button>
                )}
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

function StepHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="mb-8"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#9b6042]">{eyebrow}</p><h2 className="font-display text-4xl leading-tight sm:text-5xl">{title}</h2><p className="mt-3 max-w-lg leading-7 text-muted-foreground">{description}</p></div>;
}

function DateStep({ value, onChange, error, today }: { value: string; onChange: (value: string) => void; error?: string; today: Date }) {
  return <><StepHeading eyebrow="Choose a day" title="When shall we welcome you?" description="Reservations are available daily, up to 90 days in advance." /><div className="max-w-md"><Label htmlFor="date">Reservation date</Label><Input id="date" type="date" className="mt-2 h-14 bg-card text-base" value={value} min={format(today, "yyyy-MM-dd")} max={format(addDays(today, 90), "yyyy-MM-dd")} onChange={(event) => onChange(event.target.value)} />{error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}</div></>;
}

function TypeStep({ value, onChange }: { value: ReservationType; onChange: (value: ReservationType) => void }) {
  const numbers = { regular_group: "01", private_event: "02", meeting_workshop: "03" } as const;
  return <><StepHeading eyebrow="Choose an experience" title="What are we planning?" description="The experience determines how much time we reserve for your gathering." /><div className="grid gap-3">{(Object.keys(reservationTypeLabels) as ReservationType[]).map((type) => <button type="button" key={type} onClick={() => onChange(type)} className={cn("flex items-center gap-5 rounded-2xl border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md", value === type ? "border-primary ring-2 ring-primary/10" : "border-border")}><span className="font-display text-2xl text-[#9b6042]">{numbers[type]}</span><span className="flex-1"><span className="block font-semibold">{reservationTypeLabels[type]}</span><span className="mt-1 block text-sm text-muted-foreground">{reservationTypeDescriptions[type]}</span></span>{value === type ? <CheckCircle2 className="size-5 text-primary" /> : null}</button>)}</div></>;
}

function GuestsStep({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <><StepHeading eyebrow="Your party" title="How many are joining?" description="We can welcome gatherings of up to 50 guests." /><div className="mx-auto flex max-w-sm items-center justify-between rounded-3xl border bg-card p-6 shadow-sm"><Button type="button" size="icon" variant="outline" className="size-12 rounded-full" onClick={() => onChange(Math.max(1, value - 1))} disabled={value <= 1}><Minus /></Button><div className="text-center"><p className="font-display text-7xl tabular-nums">{value}</p><p className="mt-1 text-sm uppercase tracking-[0.2em] text-muted-foreground">{value === 1 ? "Guest" : "Guests"}</p></div><Button type="button" size="icon" variant="outline" className="size-12 rounded-full" onClick={() => onChange(Math.min(50, value + 1))} disabled={value >= 50}><Plus /></Button></div></>;
}

function TimeStep({ value, slots, loading, error, onChange }: { value: string; slots: AvailabilitySlot[]; loading: boolean; error?: string; onChange: (value: string) => void }) {
  return <><StepHeading eyebrow="Choose a time" title="What time feels right?" description="Times shown already account for your group size and experience duration." />{loading ? <div className="flex items-center gap-3 rounded-2xl border bg-card p-6 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> Checking the room…</div> : slots.length > 0 ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{slots.map((slot) => <button type="button" key={slot.value} onClick={() => onChange(slot.value)} className={cn("rounded-2xl border bg-card p-4 text-center transition-all hover:border-primary", value === slot.value && "border-primary bg-primary text-primary-foreground ring-2 ring-primary/15")}><span className="block text-base font-semibold">{slot.label}</span><span className={cn("mt-1 block text-xs", value === slot.value ? "text-primary-foreground/70" : "text-muted-foreground")}>{slot.remainingCapacity} spots left</span></button>)}</div> : <div className="rounded-2xl border border-dashed bg-card/60 p-8 text-center text-muted-foreground">No times can accommodate this request. Try another date or a smaller group.</div>}{error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}</>;
}

function ContactStep({ form }: { form: UseFormReturn<ReservationInput> }) {
  return <><StepHeading eyebrow="Stay in touch" title="Who is the reservation for?" description="We will use these details for reservation updates only." /><div className="grid gap-5 sm:grid-cols-2"><Field label="Full name" htmlFor="reservation-name" error={form.formState.errors.name?.message} className="sm:col-span-2"><Input id="reservation-name" autoComplete="name" placeholder="John Smith" {...form.register("name")} /></Field><Field label="Email" htmlFor="reservation-email" error={form.formState.errors.email?.message}><Input id="reservation-email" type="email" autoComplete="email" placeholder="john@example.com" {...form.register("email")} /></Field><Field label="Phone" htmlFor="reservation-phone" error={form.formState.errors.phone?.message}><Input id="reservation-phone" type="tel" autoComplete="tel" placeholder="+62 812 3456 7890" {...form.register("phone")} /></Field></div><Input tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" {...form.register("website")} /></>;
}

function RequestStep({ form }: { form: UseFormReturn<ReservationInput> }) {
  const value = form.watch("specialRequest") ?? "";
  return <><StepHeading eyebrow="The finishing touches" title="Anything we should know?" description="Dietary needs, accessibility, celebrations, room setup—share anything that helps us prepare." /><Label htmlFor="specialRequest">Special request <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id="specialRequest" className="mt-2 min-h-40 resize-none bg-card" placeholder="Tell us how we can make your gathering special…" {...form.register("specialRequest")} /><p className="mt-2 text-right text-xs text-muted-foreground">{value.length}/1000</p></>;
}

function ReviewStep({ values }: { values: ReservationInput }) {
  const formattedDate = values.date ? format(new Date(`${values.date}T12:00:00`), "EEEE, MMMM d, yyyy") : "—";
  const rows = [["Date", formattedDate], ["Experience", reservationTypeLabels[values.type]], ["Time", formatClock(values.time)], ["Party", `${values.guests} ${values.guests === 1 ? "guest" : "guests"}`], ["Name", values.name], ["Contact", `${values.email} · ${values.phone}`]];
  return <><StepHeading eyebrow="One last look" title="Ready to gather?" description="Review your details. Your request will remain pending until our team confirms it." /><div className="overflow-hidden rounded-2xl border bg-card">{rows.map(([label, detail], index) => <div key={label} className={cn("grid gap-1 px-5 py-4 sm:grid-cols-[130px_1fr]", index > 0 && "border-t")}><span className="text-sm text-muted-foreground">{label}</span><span className="font-medium">{detail}</span></div>)}{values.specialRequest ? <div className="border-t px-5 py-4"><span className="text-sm text-muted-foreground">Special request</span><p className="mt-1 leading-6">{values.specialRequest}</p></div> : null}</div></>;
}

function ReceiptView({ receipt, emailSent }: { receipt: Receipt; emailSent: boolean }) {
  const startsAt = new Date(receipt.startsAt);
  return <div className="w-full max-w-xl py-8 text-center"><div className="mx-auto grid size-16 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-7" /></div><p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-[#9b6042]">Request received</p><h1 className="mt-3 font-display text-5xl leading-tight">We’ll be in touch soon.</h1><p className="mx-auto mt-4 max-w-md leading-7 text-muted-foreground">Thanks, {receipt.name}. Our team will review your request and confirm it by email.</p><div className="mt-9 overflow-hidden rounded-3xl border bg-card text-left shadow-sm"><div className="bg-primary px-6 py-5 text-primary-foreground"><p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/70">Reservation reference</p><p className="mt-1 font-mono text-xl font-semibold tracking-wide">{receipt.reference}</p></div><div className="grid gap-5 p-6 sm:grid-cols-2"><ReceiptItem icon={<CalendarDays />} label="Date" value={format(startsAt, "MMMM d, yyyy")} /><ReceiptItem icon={<Clock3 />} label="Time" value={format(startsAt, "h:mm a")} /><ReceiptItem icon={<Users />} label="Party" value={`${receipt.guests} guests`} /><ReceiptItem icon={<CheckCircle2 />} label="Status" value="Pending confirmation" /></div></div>{!emailSent ? <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900"><Mail className="mt-0.5 size-4 shrink-0" /><span>Your request is safely recorded, but the confirmation email could not be sent. Keep your reference number for support.</span></div> : null}<p className="mt-7 text-sm text-muted-foreground">You may now close this page.</p></div>;
}

function Field({ label, htmlFor, error, children, className }: { label: string; htmlFor: string; error?: string; children: React.ReactNode; className?: string }) { return <div className={className}><Label htmlFor={htmlFor}>{label}</Label><div className="mt-2">{children}</div>{error ? <p className="mt-1.5 text-sm text-destructive">{error}</p> : null}</div>; }
function Feature({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) { return <div><div className="mb-2 flex items-center gap-2 text-[#9b6042]">{icon}<span className="font-semibold text-foreground">{title}</span></div><p className="text-xs leading-5 text-muted-foreground">{detail}</p></div>; }
function ReceiptItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex items-start gap-3 [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:text-[#9b6042]"><span>{icon}</span><span><span className="block text-xs uppercase tracking-wider text-muted-foreground">{label}</span><span className="mt-1 block font-semibold">{value}</span></span></div>; }
function formatClock(time: string) { if (!time) return "—"; const [hour, minute] = time.split(":").map(Number); return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`; }
