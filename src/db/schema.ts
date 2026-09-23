import {
  boolean,
  check,
  datetime,
  foreignKey,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const users = mysqlTable(
  "user",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date", fsp: 3 }).notNull(),
  },
  (table) => [uniqueIndex("user_email_unique").on(table.email)],
);

export const sessions = mysqlTable(
  "session",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    expiresAt: datetime("expires_at", { mode: "date", fsp: 3 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date", fsp: 3 }).notNull(),
    ipAddress: varchar("ip_address", { length: 255 }),
    userAgent: text("user_agent"),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activeOrganizationId: varchar("active_organization_id", { length: 36 }),
  },
  (table) => [
    uniqueIndex("session_token_unique").on(table.token),
    index("session_user_idx").on(table.userId),
  ],
);

export const accounts = mysqlTable(
  "account",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    providerId: varchar("provider_id", { length: 255 }).notNull(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: datetime("access_token_expires_at", { mode: "date", fsp: 3 }),
    refreshTokenExpiresAt: datetime("refresh_token_expires_at", { mode: "date", fsp: 3 }),
    scope: text("scope"),
    password: text("password"),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date", fsp: 3 }).notNull(),
  },
  (table) => [index("account_user_idx").on(table.userId)],
);

export const verifications = mysqlTable(
  "verification",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: text("value").notNull(),
    expiresAt: datetime("expires_at", { mode: "date", fsp: 3 }).notNull(),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }),
    updatedAt: datetime("updated_at", { mode: "date", fsp: 3 }),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const organizations = mysqlTable(
  "organization",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    logo: text("logo"),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull(),
    metadata: text("metadata"),
  },
  (table) => [uniqueIndex("organization_slug_unique").on(table.slug)],
);

export const members = mysqlTable(
  "member",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    organizationId: varchar("organization_id", { length: 36 })
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 32 }).notNull().default("admin"),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull(),
  },
  (table) => [
    uniqueIndex("member_org_user_unique").on(table.organizationId, table.userId),
    index("member_user_idx").on(table.userId),
  ],
);

export const invitations = mysqlTable(
  "invitation",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    organizationId: varchar("organization_id", { length: 36 })
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    role: varchar("role", { length: 32 }),
    status: varchar("status", { length: 32 }).notNull().default("pending"),
    expiresAt: datetime("expires_at", { mode: "date", fsp: 3 }).notNull(),
    inviterId: varchar("inviter_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull(),
  },
  (table) => [
    index("invitation_email_idx").on(table.email),
    index("invitation_org_idx").on(table.organizationId),
  ],
);

export const reservationTypes = ["regular_group", "private_event", "meeting_workshop"] as const;
export const reservationStatuses = ["pending", "confirmed", "rejected"] as const;

export const reservations = mysqlTable(
  "reservations",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    reference: varchar("reference", { length: 24 }).notNull(),
    type: mysqlEnum("type", reservationTypes).notNull(),
    status: mysqlEnum("status", reservationStatuses).notNull().default("pending"),
    startsAt: datetime("starts_at", { mode: "date", fsp: 3 }).notNull(),
    endsAt: datetime("ends_at", { mode: "date", fsp: 3 }).notNull(),
    guestCount: int("guest_count").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 32 }).notNull(),
    specialRequest: text("special_request"),
    rejectionReason: text("rejection_reason"),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date", fsp: 3 }).notNull(),
  },
  (table) => [
    uniqueIndex("reservation_reference_unique").on(table.reference),
    index("reservation_starts_at_idx").on(table.startsAt),
    index("reservation_status_start_idx").on(table.status, table.startsAt),
    index("reservation_email_idx").on(table.email),
    check("reservation_guest_count_check", sql`${table.guestCount} between 1 and 50`),
    check("reservation_time_check", sql`${table.endsAt} > ${table.startsAt}`),
  ],
);

export const reservationCapacitySlots = mysqlTable(
  "reservation_capacity_slots",
  {
    slotStart: datetime("slot_start", { mode: "date", fsp: 3 }).primaryKey(),
    heldGuests: int("held_guests").notNull().default(0),
    updatedAt: datetime("updated_at", { mode: "date", fsp: 3 }).notNull(),
  },
  (table) => [
    check("capacity_held_guests_check", sql`${table.heldGuests} >= 0 and ${table.heldGuests} <= 50`),
  ],
);

export const reservationSlotAllocations = mysqlTable(
  "reservation_slot_allocations",
  {
    reservationId: varchar("reservation_id", { length: 36 })
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    slotStart: datetime("slot_start", { mode: "date", fsp: 3 }).notNull(),
    guestCount: int("guest_count").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.reservationId, table.slotStart] }),
    foreignKey({
      columns: [table.slotStart],
      foreignColumns: [reservationCapacitySlots.slotStart],
      name: "allocation_slot_start_fk",
    }).onDelete("cascade"),
    index("allocation_slot_idx").on(table.slotStart),
  ],
);

export const reservationAuditLogs = mysqlTable(
  "reservation_audit_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    reservationId: varchar("reservation_id", { length: 36 })
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    actorUserId: varchar("actor_user_id", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 64 }).notNull(),
    before: json("before"),
    after: json("after"),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull(),
  },
  (table) => [index("audit_reservation_idx").on(table.reservationId, table.createdAt)],
);

export const emailDeliveries = mysqlTable(
  "email_deliveries",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    reservationId: varchar("reservation_id", { length: 36 }).references(() => reservations.id, {
      onDelete: "cascade",
    }),
    category: varchar("category", { length: 64 }).notNull(),
    recipient: varchar("recipient", { length: 255 }).notNull(),
    providerId: varchar("provider_id", { length: 255 }),
    status: mysqlEnum("status", ["pending", "sent", "failed"]).notNull().default("pending"),
    error: text("error"),
    attempts: int("attempts").notNull().default(0),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date", fsp: 3 }).notNull(),
  },
  (table) => [index("email_reservation_idx").on(table.reservationId, table.createdAt)],
);

export const schema = {
  user: users,
  session: sessions,
  account: accounts,
  verification: verifications,
  organization: organizations,
  member: members,
  invitation: invitations,
  reservations,
  reservationCapacitySlots,
  reservationSlotAllocations,
  reservationAuditLogs,
  emailDeliveries,
};

export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
