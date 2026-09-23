import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("mysql://root:password@127.0.0.1:3306/racana_reservation"),
  APP_URL: z.url().default("http://localhost:3000"),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  BETTER_AUTH_SECRET: z.string().min(32).default("local-development-secret-change-me-123456789"),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().default("Racana Reservations <onboarding@resend.dev>"),
  EMAIL_SANDBOX_TO: z.email().optional().or(z.literal("")),
  BUSINESS_TIMEZONE: z.string().default("Asia/Jakarta"),
  BUSINESS_OPEN_TIME: z.string().regex(/^\d{2}:\d{2}$/).default("10:00"),
  BUSINESS_CLOSE_TIME: z.string().regex(/^\d{2}:\d{2}$/).default("22:00"),
  SLOT_INTERVAL_MINUTES: z.coerce.number().int().positive().default(30),
  MAX_CAPACITY: z.coerce.number().int().positive().default(50),
  MIN_BOOKING_LEAD_HOURS: z.coerce.number().nonnegative().default(2),
  MAX_BOOKING_DAYS: z.coerce.number().int().positive().default(90),
});

export const env = envSchema.parse(process.env);

export const businessConfig = {
  name: "Racana",
  timezone: env.BUSINESS_TIMEZONE,
  openTime: env.BUSINESS_OPEN_TIME,
  closeTime: env.BUSINESS_CLOSE_TIME,
  slotMinutes: env.SLOT_INTERVAL_MINUTES,
  capacity: env.MAX_CAPACITY,
  minLeadHours: env.MIN_BOOKING_LEAD_HOURS,
  maxBookingDays: env.MAX_BOOKING_DAYS,
  durations: {
    regular_group: 120,
    private_event: 240,
    meeting_workshop: 180,
  } as const,
} as const;
