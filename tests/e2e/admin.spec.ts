import { expect, test } from "@playwright/test";

test("owner can sign in and access admin views", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(process.env.BOOTSTRAP_OWNER_EMAIL ?? "rizkyarfians27@gmail.com");
  await page.getByLabel("Password").fill(process.env.BOOTSTRAP_OWNER_PASSWORD ?? "RacanaTestPassword123!");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText(/today at racana/i)).toBeVisible();
  await page.getByRole("link", { name: /calendar/i }).first().click();
  await expect(page.getByRole("heading", { name: "Calendar" })).toBeVisible();
  await page.getByRole("link", { name: /team/i }).click();
  await expect(page.getByRole("heading", { name: "Team" })).toBeVisible();
});
