# Racana Reservation

A hospitality reservation MVP with a guided customer request flow and an authenticated operations dashboard.

## Stack

- Next.js App Router, React, TypeScript, Bun
- Tailwind CSS and shadcn/ui
- React Hook Form and Zod
- Drizzle ORM and MySQL
- Better Auth with organization invitations
- Resend and React Email
- Railway and GitHub Actions

## Product behavior

- Customers request a regular group, private event, or meeting/workshop reservation.
- All new requests are pending until an admin approves or rejects them.
- Pending and confirmed requests hold capacity across every overlapping 30-minute interval.
- Business hours are 10:00–22:00 in `Asia/Jakarta`, with a two-hour minimum lead and a 90-day booking window.
- An owner can invite admins. Public admin registration is blocked unless a valid invitation exists.

## Local setup

1. Install [Bun](https://bun.sh/docs/installation) and MySQL 8.4+.
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL`, auth, and optional Resend values.
3. Install packages and prepare the database:

   ```bash
   bun install
   bun run db:migrate
   ```

4. Create the initial owner. Supply the password only for this command, then remove it from the environment:

   ```bash
   BOOTSTRAP_OWNER_EMAIL=rizkyarfians27@gmail.com \
   BOOTSTRAP_OWNER_NAME="Rizky Arfians" \
   BOOTSTRAP_OWNER_PASSWORD="your-secure-password" \
   bun run admin:bootstrap
   ```

5. Start the application:

   ```bash
   bun run dev
   ```

- Customer flow: `http://localhost:3000/reservation`
- Admin sign-in: `http://localhost:3000/admin/login`

## Email sandbox

With the Resend test sender, set `EMAIL_SANDBOX_TO` to the address allowed by your Resend account. All messages are redirected there and the intended recipient is included in the subject. Before production use, verify a sending domain, update `RESEND_FROM_EMAIL`, and clear `EMAIL_SANDBOX_TO`.

## Quality checks

```bash
bun run lint
bun run typecheck
bun run test
bun run build
bun run test:e2e
```

Database integration tests run when `RUN_DB_TESTS=1`. Playwright requires its Chromium binary (`bunx playwright install chromium`).

## Railway deployment

1. Create a Railway project and add a MySQL service.
2. Deploy this GitHub repository as the application service.
3. Reference the MySQL service variable as `DATABASE_URL=${{MySQL.MYSQL_URL}}`.
4. Set `APP_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, Resend values, and the business configuration from `.env.example`.
5. Generate a Railway domain and update both URL variables to that HTTPS origin.
6. Let `railway.json` run migrations before deployment and start Next.js on `$PORT`.
7. Run `bun run admin:bootstrap` once with temporary owner credentials, then remove `BOOTSTRAP_OWNER_PASSWORD`.

The `/api/health` endpoint checks both the application and database connection.
