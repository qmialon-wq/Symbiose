import { expect, type Page } from "@playwright/test";

/** Public discovery is separate from the prologue-free /jury/ presentation. */
export async function openPublicLanding(page: Page, fallback = true) {
  await page.route("**/api/**", (route) =>
    route.fulfill(
      new URL(route.request().url()).pathname.endsWith("/auth/me")
        ? { status: 401, json: { detail: "Connexion requise" } }
        : { json: { setup_required: false, registration_open: true } },
    ),
  );
  await page.goto(`/${fallback ? "?render=2d" : ""}`);
  await expect(page.locator(".sx-stage")).toHaveClass(/sx-stage--ready/, {
    timeout: 45000,
  });
  await expect(page.locator(".sx-experience")).toHaveAttribute(
    "data-prologue-active",
    "true",
  );
  await expect(page.locator(".sx-experience")).toHaveAttribute(
    "data-mode",
    "exploration",
  );
}
