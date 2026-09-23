import { defineRailway, github, preserve, project, service } from "railway/iac";

// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "web";

export default defineRailway(() => {
  const web = service("web", {
    source: github("rizkyarfians/racana-reservation", { branch: "main" }),
    build: "bun run build",
    start: "bun run start -- --port $PORT",
    healthcheck: "/api/health",
    healthcheckTimeout: 120,
    preDeploy: "bun run db:migrate",
    variables: {
      DATABASE_URL: preserve(),
      APP_URL: "https://web-production-80bfbb.up.railway.app",
      BETTER_AUTH_URL: "https://web-production-80bfbb.up.railway.app",
      BETTER_AUTH_SECRET: preserve(),
      RESEND_API_KEY: preserve(),
      RESEND_FROM_EMAIL: "Racana Reservations <onboarding@resend.dev>",
      EMAIL_SANDBOX_TO: "rizkyarfians27@gmail.com",
      BOOTSTRAP_OWNER_EMAIL: "rizkyarfians27@gmail.com",
      BOOTSTRAP_OWNER_NAME: "Rizky Arfians",
      BOOTSTRAP_OWNER_PASSWORD: preserve(),
      BUSINESS_TIMEZONE: "Asia/Jakarta",
      BUSINESS_OPEN_TIME: "10:00",
      BUSINESS_CLOSE_TIME: "22:00",
      SLOT_INTERVAL_MINUTES: "30",
      MAX_CAPACITY: "50",
      MIN_BOOKING_LEAD_HOURS: "2",
      MAX_BOOKING_DAYS: "90",
    },
    // builder from CaC: "RAILPACK"
  });
  return project("racana-reservation", {
    resources: [web],
  });
});
