import { expect, test } from "@playwright/test";

test("customer can submit a reservation request", async ({ page }) => {
  await page.goto("/reservation");
  const date = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  await page.getByLabel("Reservation date").fill(date);
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: /private event/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();
  const firstTime = page.locator("button").filter({ hasText: /spots left/i }).first();
  await expect(firstTime).toBeVisible();
  await firstTime.click();
  await expect(firstTime).toHaveClass(/bg-primary/);
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByRole("heading", { name: /who is the reservation for/i })).toBeVisible();
  await page.getByLabel("Full name").fill("E2E Guest");
  await page.getByLabel("Email").fill("guest@example.com");
  await page.getByLabel("Phone").fill("+62 812 3456 7890");
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByLabel(/special request/i).fill("Automated test reservation");
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: /submit request/i }).click();
  await expect(page.getByText("Request received")).toBeVisible();
  await expect(page.getByText("Pending confirmation")).toBeVisible();
});
