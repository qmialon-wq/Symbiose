import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { guideFixture } from "./client-guide-fixture";

const backgroundIds = [
  "forest",
  "sky",
  "river",
  "underwater",
  "wetland",
  "meadow",
  "coast",
  "night-forest",
] as const;

test.use({ viewport: { width: 1600, height: 900 } });

test("première connexion : le contenu garde le focus sans encadrement parasite", async ({
  page,
}, info) => {
  await guideFixture(page, null);
  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill("camille@example.test");
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("mot-de-passe-test");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page.getByTestId("login-transition")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Passer", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  const guide = page.locator("#client-guide");
  await expect(guide).toBeVisible();
  await guide.getByRole("button", { name: "Plus tard", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(guide).not.toBeVisible();
  const main = page.locator("main#main-content");
  await main.focus();
  await expect(main).toBeFocused();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Vos observations, simplement.",
  );
  await page.screenshot({ path: info.outputPath("accueil-1600x900.png") });
  await expect(main).toHaveCSS("outline-style", "none");
  await main.click({ position: { x: 10, y: 30 } });
  await expect(main).toHaveCSS("outline-style", "none");
  const navigation = page.getByRole("navigation", {
    name: "Navigation principale",
  });
  const arc = navigation.locator(".sym-wheel-arc path");
  const curve = await arc.getAttribute("d");
  await navigation
    .getByRole("link", { name: "Vidéothèque", exact: true })
    .click();
  await expect(page).toHaveURL(/\/videos$/);
  await navigation.getByRole("link", { name: "Accueil", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(main).toHaveCSS("outline-style", "none");
  await expect(arc).toBeVisible();
  await expect(arc).toHaveAttribute("d", curve!);
});

test("clavier : lien d’évitement, cartes et roue gardent leurs repères", async ({
  page,
}) => {
  await guideFixture(page);
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", {
    name: "Aller au contenu",
    exact: true,
  });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  const main = page.locator("main#main-content");
  await expect(main).toBeFocused();
  await expect(main).toHaveCSS("outline-style", "none");
  await page.keyboard.press("Tab");
  const upload = page.getByRole("link", {
    name: "Importer une vidéo",
    exact: true,
  });
  await expect(upload).toBeFocused();
  await expect(upload).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Tab");
  const card = page.locator(".journey-card").first();
  await expect(card).toBeFocused();
  await expect(card).toHaveCSS("outline-style", "solid");
  await expect(card).toHaveCSS("outline-width", "2px");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/videos$/);
  const home = page.locator('.sym-wheel-link[data-section="/"]');
  await home.focus();
  await expect(home).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/$/);
});

test("les actions s’éclaircissent au survol et la flèche respecte la réduction des animations", async ({
  page,
}) => {
  await guideFixture(page);
  await page.goto("/");
  const card = page.locator(".journey-card").first();
  const action = card.locator(".journey-action");
  const arrow = card.locator(".journey-arrow");
  const normal = await action.evaluate((el) => getComputedStyle(el).color);
  await card.hover();
  await expect
    .poll(() => action.evaluate((el) => getComputedStyle(el).color))
    .not.toBe(normal);
  await expect(arrow).toHaveCSS("transform", "matrix(1, 0, 0, 1, 3, 0)");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(arrow).toHaveCSS("transform", "none");
  await expect(arrow).toHaveCSS("transition-duration", "0s");
  await page.mouse.move(1590, 890);
  await expect(action).toHaveCSS("color", normal);
  const forestIcon = await card
    .locator(".pi")
    .evaluate((el) => getComputedStyle(el).color);
  await page.getByRole("button", { name: "Paramètres", exact: true }).click();
  await page
    .getByRole("button", { name: "Paramètres d’affichage", exact: true })
    .click();
  await page
    .getByRole("radio", { name: "Ciel et nuages", exact: true })
    .check();
  await expect(page.locator("html")).toHaveAttribute("data-environment", "sky");
  await page.getByRole("button", { name: "Fermer", exact: true }).click();
  await page.mouse.move(1590, 890);
  await expect(action).not.toHaveCSS("color", normal);
  await expect(card.locator(".pi")).not.toHaveCSS("color", forestIcon);
});

for (const theme of backgroundIds) {
  test(`lisibilité, focus et disposition dans l’environnement ${theme}`, async ({
    page,
  }, info) => {
    await page.addInitScript(
      (id) => localStorage.setItem("symbiose:wallpaper:v1", id),
      theme,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await guideFixture(page);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute(
      "data-environment",
      theme,
    );
    await expect(page.locator(".sym-forest")).toHaveAttribute(
      "data-wallpaper",
      theme,
    );
    const cards = page.locator(".journey-card");
    await expect(cards).toHaveCount(3);
    expect(
      await cards.evaluateAll((items) =>
        items.map((el) => el.getAttribute("href")),
      ),
    ).toEqual(["/videos", "/parcelles", "/parcelles"]);
    for (const viewport of [
      { width: 1600, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      const boxes = await cards.evaluateAll((items) =>
        items.map((el) => {
          const { x, y, width, height } = el.getBoundingClientRect();
          return { x, y, width, height };
        }),
      );
      if (viewport.width === 1600) {
        expect(boxes[0].y).toBe(boxes[1].y);
        expect(boxes[1].y).toBe(boxes[2].y);
        expect(boxes[0].x).toBeLessThan(boxes[1].x);
        expect(boxes[1].x).toBeLessThan(boxes[2].x);
      } else {
        expect(boxes[0].x).toBe(boxes[1].x);
        expect(boxes[1].x).toBe(boxes[2].x);
        expect(boxes[0].y + boxes[0].height).toBeLessThan(boxes[1].y);
        expect(boxes[1].y + boxes[1].height).toBeLessThan(boxes[2].y);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        (
          await new AxeBuilder({ page })
            .include(".journey-grid")
            .withRules(["color-contrast"])
            .analyze()
        ).violations,
      ).toEqual([]);
      if (theme === "forest")
        await page.screenshot({
          path: info.outputPath(
            `accueil-${viewport.width}x${viewport.height}.png`,
          ),
          fullPage: viewport.width < 1000,
        });
    }
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.mouse.move(1590, 890);
    const card = cards.first();
    const description = await card
      .locator("p")
      .evaluate((el) => getComputedStyle(el).color);
    const icon = await card
      .locator(".pi")
      .evaluate((el) => getComputedStyle(el).color);
    const link = await card
      .locator(".journey-action")
      .evaluate((el) => getComputedStyle(el).color);
    // Les anciens verts sombres ne doivent pas réapparaître dans les panneaux foncés.
    expect(description).not.toBe("rgb(80, 102, 83)");
    expect(icon).not.toBe("rgb(54, 93, 66)");
    expect(link).not.toBe("rgb(54, 93, 66)");
    await page.keyboard.press("Tab");
    await card.focus();
    await expect(card).toHaveCSS("outline-style", "solid");
    await expect(card).toHaveCSS("outline-width", "2px");
    const actualFocus = await card.evaluate((el) => {
      const sample = document.createElement("span");
      sample.style.color = "var(--sym-focus)";
      el.append(sample);
      const expected = getComputedStyle(sample).color;
      sample.remove();
      return { actual: getComputedStyle(el).outlineColor, expected };
    });
    expect(actualFocus.actual).toBe(actualFocus.expected);
    await info.attach("couleurs-des-cartes", {
      body: JSON.stringify({
        theme,
        description,
        icon,
        link,
        focus: actualFocus.actual,
      }),
      contentType: "application/json",
    });
  });
}
