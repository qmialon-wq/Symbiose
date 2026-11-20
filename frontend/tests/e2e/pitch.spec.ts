import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

function routeAtOriginal(progress: number) {
  const units = progress * 210;
  const inserted = [
    [12, 35],
    [165, 30],
    [180, 40],
  ].reduce((sum, [anchor, length]) => sum + (units >= anchor ? length : 0), 0);
  return (units + inserted) / 315;
}

async function openPitch(page: Page, fallback = true) {
  await page.route("**/api/**", (route) =>
    route.fulfill(
      new URL(route.request().url()).pathname.endsWith("/auth/me")
        ? { status: 401, json: { detail: "Connexion requise" } }
        : { json: { setup_required: false, registration_open: true } },
    ),
  );
  if (fallback)
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        type: any,
        ...args: any[]
      ) {
        if (type === "webgl2") return null;
        return original.call(this, type, ...args);
      } as typeof original;
    });
  await page.goto("/");
  await expect(page.locator(".sx-stage")).toHaveClass(/sx-stage--ready/, {
    timeout: 45000,
  });
  await page
    .getByRole("button", { name: "Passer l’introduction", exact: true })
    .click();
}
async function chapter(page: Page, name: string, id: string) {
  await page.getByRole("button", { name }).click();
  await expect(page.locator(".sx-pitch-content")).toHaveAttribute(
    "data-chapter",
    id,
  );
  await expect(page.locator(".sx-pitch-scene")).toHaveAttribute(
    "aria-label",
    /.+/,
  );
}

test("eight sourced scenes, archived observations, jury coverage and final application link", async ({
  page,
}) => {
  const external: string[] = [],
    errors: string[] = [];
  page.on("request", (request) => {
    if (
      !/^(localhost|127\.0\.0\.1)$/.test(new URL(request.url()).hostname) &&
      !request.url().startsWith("blob:")
    )
      external.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openPitch(page);
  await expect(
    page.getByRole("heading", { name: /Une forêt ordinaire/ }),
  ).toBeVisible();
  await expect(
    page.getByText("Qui habite ici ?", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/pitch-01-probleme.png" });
  await chapter(page, "3. Rivières", "rivers");
  await page.getByRole("button", { name: "03 Reconnaissance" }).click();
  await expect(page.locator(".sx-pipeline-detail")).toContainText(
    "MegaDetector localise",
  );
  await expect(page.locator(".sx-pipeline-detail")).toContainText(
    "SpeciesNet en piste",
  );
  await expect(page.locator(".sx-pipeline-detail")).toContainText(
    "Le suivi relie",
  );
  await page.screenshot({ path: "test-results/pitch-03-moteur.png" });
  await chapter(page, "4. Monde sous-marin", "underwater");
  await expect(
    page.getByRole("heading", { name: /Reconnaître un animal/ }),
  ).toBeVisible();
  await expect(page.locator(".sx-evidence-status")).toHaveCount(0);
  await chapter(page, "5. Zone humide", "wetland");
  await page
    .getByText("Résultats vérifiés · deux points normands", { exact: true })
    .click();
  await expect(page.getByText("250008148", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Caen", exact: true }).click();
  await expect(
    page.getByText("Aucun objet renvoyé", { exact: true }),
  ).toHaveCount(4);
  await expect(page.getByText(/ARCHIVES IGN/)).toBeVisible();
  await page.screenshot({ path: "test-results/pitch-05-donnees.png" });
  await chapter(page, "6. Prairie et bocage", "meadow");
  await expect(
    page.getByText("alternatives documentées", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Bénéfice attendu · non mesuré", { exact: true }),
  ).toBeVisible();
  await page
    .getByText("Explorer les 12 alternatives et leurs conditions", {
      exact: true,
    })
    .click();
  await expect(page.locator(".sx-design-catalogue section li")).toHaveCount(12);
  await expect(page.locator(".sx-design-references a")).toHaveCount(3);
  await expect(page.locator(".sx-design-catalogue")).toContainText(
    "Réduire la durée de fonctionnement",
  );
  // The 90-second demo slot is gone: no player, no shortcut.
  await expect(page.locator(".sx-pitch-content video")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Démonstration", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({ path: "test-results/pitch-06-decision.png" });
  await chapter(page, "7. Littoral — Étretat", "coast");
  await expect(page.getByText(/aucun partenariat annoncé/)).toBeVisible();
  await chapter(page, "8. Forêt nocturne", "night-forest");
  await expect(
    page.getByRole("heading", { level: 2, name: /Comprendre le vivant/ }),
  ).toBeVisible();
  const cta = page.getByRole("link", {
    name: "Commencer l’expérience Symbiose",
  });
  await expect(cta).toHaveAttribute("href", "/connexion");
  await page.screenshot({ path: "test-results/pitch-08-conclusion.png" });
  await page.getByRole("button", { name: "Sources et texte oral" }).click();
  await expect(
    page.getByRole("heading", { name: /Les preuves, les mots/ }),
  ).toBeVisible();
  await expect(page.getByText(/Attendus vérifiés/)).toBeVisible();
  await page
    .getByRole("button", { name: "Attendus du jury", exact: true })
    .click();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(13);
  await page.getByRole("button", { name: "Pitch chronométré" }).click();
  // Thirteen timed cues include the forest and coast return passages.
  await expect(page.locator(".sx-speaker-chapter")).toHaveCount(13);
  await expect(page.locator(".sx-speaker-chapter h3")).toHaveText([
    "Ce que l’on ne voit pas",
    "Sous nos pas",
    "Des données à relier",
    "L’idée Symbiose",
    "De la vidéo à l’observation validée",
    "Comprendre le milieu",
    "Croiser les données",
    "Un projet d’éclairage à examiner",
    "L’équipe ARQ",
    "Du démonstrateur au terrain",
    "Ce qu’il reste à construire ensemble",
    "L’expertise au bon moment",
    "La même forêt, un autre regard",
  ]);
  await expect(
    page.locator(".sx-speaker-chapter").last().locator(".sx-eyebrow"),
  ).toContainText("4:30–5:00");
  await page.getByRole("button", { name: "Fermer le projet" }).click();
  await cta.click();
  await expect(page).toHaveURL(/\/connexion$/);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test("presentation keyboard, continuous narrative, reverse navigation and reduced motion", async ({
  page,
}) => {
  await openPitch(page);
  await page.getByRole("button", { name: "Mode exploration" }).click();
  await page.locator("#main-content").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".sx-experience")).toHaveAttribute(
    "data-excursion",
    "soil",
  );
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".sx-pitch-content")).toHaveAttribute(
    "data-cue",
    "forest-return",
  );
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".sx-pitch-content")).toHaveAttribute(
    "data-chapter",
    "sky",
  );
  await expect(page.locator(".sx-counter")).toHaveText("0:50 / 5:00");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".sx-pitch-content")).toHaveAttribute(
    "data-cue",
    "forest-return",
  );
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".sx-experience")).toHaveAttribute(
    "data-excursion",
    "soil",
  );
  await expect
    .poll(async () =>
      Number(
        await page
          .locator(".sx-experience")
          .getAttribute("data-route-progress"),
      ),
    )
    .toBeCloseTo(12 / 315, 5);
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".sx-pitch-content")).toHaveAttribute(
    "data-chapter",
    "forest",
  );
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Mettre en pause", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Lire le récit", exact: true }),
  ).toBeVisible();
  // The extended clock continues across the preserved chapter boundaries.
  await page.getByRole("slider").evaluate((input: HTMLInputElement, value) => {
    input.step = "any";
    input.value = String(value * 100);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, routeAtOriginal(0.082));
  await expect
    .poll(async () =>
      Number(
        await page.locator(".sx-experience").getAttribute("data-progress"),
      ),
    )
    .toBeCloseTo(0.082, 4);
  await page
    .getByRole("button", { name: "Lire le récit", exact: true })
    .click();
  await expect(page.locator(".sx-pitch-content")).toHaveAttribute(
    "data-chapter",
    "sky",
  );
  await expect(
    page.getByRole("button", { name: "Mettre en pause", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Mettre en pause", exact: true })
    .click();
  await page.getByRole("button", { name: "6. Prairie et bocage" }).click();
  await expect(page.locator(".sx-counter")).toHaveText("2:15 / 5:00");
  await expect(
    page.getByRole("button", { name: "Lire le récit" }),
  ).toBeEnabled();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByRole("button", { name: "Lire le récit" })).toHaveCount(
    0,
  );
  await page.locator("#main-content").focus();
  await page.keyboard.press("End");
  await expect(page.locator(".sx-counter")).toHaveText("5:00 / 5:00");
  await page.keyboard.press("Home");
  await expect(page.locator(".sx-counter")).toHaveText("00 / 08");
  await expect(page.locator(".sx-experience")).toHaveAttribute(
    "data-prologue-active",
    "true",
  );
});

test("mobile scenes and source book remain readable and accessible", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await openPitch(page);
  for (const [name, id] of [
    ["1. Forêt", "forest"],
    ["5. Zone humide", "wetland"],
    ["6. Prairie et bocage", "meadow"],
    ["8. Forêt nocturne", "night-forest"],
  ]) {
    await chapter(page, name, id);
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
        .violations,
    ).toEqual([]);
  }
  const finalAction = await page
    .getByRole("link", { name: "Commencer l’expérience Symbiose" })
    .boundingBox();
  const content = await page.locator(".sx-pitch-content").boundingBox();
  expect(finalAction!.y).toBeGreaterThanOrEqual(content!.y);
  expect(finalAction!.y + finalAction!.height).toBeLessThanOrEqual(
    content!.y + content!.height,
  );
  await page.screenshot({
    path: "test-results/pitch-mobile-conclusion.png",
  });
  await page.getByRole("button", { name: "Le projet", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /Les preuves, les mots/ }),
  ).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
});

test("unavailable fullscreen has an explicit fallback", async ({ page }) => {
  await openPitch(page);
  await page.evaluate(() => {
    Object.defineProperty(document.documentElement, "requestFullscreen", {
      value: undefined,
      configurable: true,
    });
  });
  await page.getByRole("button", { name: "Plein écran", exact: true }).click();
  await expect(
    page.getByText("Le plein écran n’est pas disponible dans ce navigateur.", {
      exact: true,
    }),
  ).toBeVisible();
});
