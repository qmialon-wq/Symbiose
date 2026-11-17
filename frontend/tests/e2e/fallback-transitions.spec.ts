import { expect, test, type Page } from "@playwright/test";

const chapters = [
  ["1. Forêt", "forest", 0],
  ["2. Ciel et nuages", "sky", 17.5],
  ["3. Rivières", "rivers", 47.5],
  ["4. Monde sous-marin", "underwater", 77.5],
  ["5. Zone humide", "wetland", 105],
  ["6. Prairie et bocage", "meadow", 132.5],
  ["7. Littoral — Étretat", "coast", 165],
  ["8. Forêt nocturne", "night-forest", 195],
] as const;
const scene = (page: Page) => page.locator(".sx-fallback-scene");
const route = (units: number) =>
  (units +
    [
      [12, 35],
      [165, 30],
      [180, 40],
    ].reduce((n, [anchor, size]) => n + (units >= anchor ? size : 0), 0)) /
  315;

async function open(page: Page, publicLanding = false) {
  if (publicLanding)
    await page.route("**/api/**", (request) =>
      request.fulfill(
        new URL(request.request().url()).pathname.endsWith("/auth/me")
          ? { status: 401, json: {} }
          : { json: { setup_required: false } },
      ),
    );
  await page.goto(`${publicLanding ? "/" : "/jury/"}?render=2d`);
  await expect(page.locator(".sx-stage")).toHaveClass(/sx-stage--ready/);
  await page
    .getByRole("button", { name: "Passer l’introduction", exact: true })
    .click();
  await fullChapter(page, 0);
}
async function fullChapter(page: Page, index: number) {
  const [label, id] = chapters[index];
  await expect(page.locator(".sx-pitch-content")).toHaveAttribute(
    "data-chapter",
    id,
  );
  await expect(
    page.getByRole("button", { name: label, exact: true }),
  ).toHaveAttribute("aria-current", "step");
  await expect(scene(page)).toHaveAttribute("data-chapter", id);
  await expect(scene(page)).toHaveAttribute("data-blend", "0.000000");
  const images = scene(page).locator("img");
  await expect(images.first()).toHaveAttribute(
    "src",
    new RegExp(`/experience-art/${id}/primary-runtime\\.webp`),
  );
  await images.first().evaluate((image: HTMLImageElement) => image.decode());
  await expect(images.first()).toHaveCSS("opacity", "1");
  await expect(images.nth(1)).toHaveCSS("opacity", "0");
  for (const image of await images.all()) {
    await expect(image).toHaveCSS("clip-path", "none");
    await expect(image).toHaveCSS("object-fit", "cover");
    const bounds = await image.boundingBox();
    const viewport = page.viewportSize()!;
    expect(bounds).toMatchObject({
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height,
    });
  }
}
async function select(page: Page, index: number) {
  await page
    .getByRole("button", { name: chapters[index][0], exact: true })
    .click();
  await fullChapter(page, index);
}
async function seek(page: Page, units: number) {
  await page
    .getByRole("slider", { name: "Position dans le récit", exact: true })
    .evaluate((input: HTMLInputElement, position) => {
      input.step = "any";
      input.value = String(position * 100);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, route(units));
}

for (const viewport of [
  { width: 1600, height: 900 },
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
]) {
  test(`huit photographies complètes, retours et sauts directs à ${viewport.width} × ${viewport.height}`, async ({
    page,
  }, info) => {
    await page.setViewportSize(viewport);
    await open(page);
    for (let index = 0; index < chapters.length; index++) {
      await select(page, index);
      if (viewport.width > 1000 || index === 3)
        await page.screenshot({
          path: info.outputPath(
            `chapitre-0${index + 1}-${viewport.width}x${viewport.height}.png`,
          ),
        });
    }
    for (const index of [3, 2, 1, 0, 6, 2, 7]) await select(page, index);
    for (const index of [3, 0, 6, 2, 7]) {
      await seek(page, chapters[index][2]);
      await fullChapter(page, index);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("les sauts de la landing publique n’affichent aucun chapitre intermédiaire", async ({
  page,
}) => {
  await open(page, true);
  // Chauffer les mêmes ressources pour que le test détecte aussi une interpolation indue.
  for (let index = 0; index < chapters.length; index++)
    await select(page, index);
  await select(page, 0);
  await scene(page).evaluate((element) => {
    const seen = ((window as any).__fallbackSeen = [] as string[]);
    new MutationObserver(() =>
      seen.push(element.getAttribute("data-chapter")!),
    ).observe(element, { attributes: true, attributeFilter: ["data-chapter"] });
  });
  await select(page, 6);
  const seen = await page.evaluate(
    () => (window as any).__fallbackSeen as string[],
  );
  expect(seen).toContain("coast");
  expect(seen.every((id) => ["forest", "coast"].includes(id))).toBe(true);
});

test("curseur, molette et lecture de présentation partagent un fondu court et réversible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await open(page);
  await select(page, 1);
  await expect(scene(page).locator('[role="status"]')).toHaveCount(0);
  await seek(page, 17.5 + 30 * 0.94);
  await expect
    .poll(async () => Number(await scene(page).getAttribute("data-blend")))
    .toBeCloseTo(0.5, 4);
  await expect(scene(page).locator("img").first()).toHaveCSS("opacity", "1");
  for (const image of await scene(page).locator("img").all())
    await expect(image).toHaveCSS("clip-path", "none");
  await page
    .getByRole("button", { name: "Mode présentation", exact: true })
    .click();
  await page.mouse.move(5, 420);
  await page.mouse.wheel(0, -200);
  await expect
    .poll(async () => Number(await scene(page).getAttribute("data-blend")))
    .toBeLessThan(0.01);
  await page.mouse.wheel(0, 200);
  await expect
    .poll(async () => Number(await scene(page).getAttribute("data-blend")))
    .toBeCloseTo(0.5, 2);
  await seek(page, 47.5);
  await fullChapter(page, 2);
  await page
    .getByRole("button", { name: "Mode exploration", exact: true })
    .click();
  await seek(page, 45.5);
  const before = Number(await scene(page).getAttribute("data-blend"));
  await page
    .getByRole("button", { name: "Lire le récit", exact: true })
    .click();
  await expect
    .poll(async () => Number(await scene(page).getAttribute("data-blend")))
    .toBeGreaterThan(before + 0.1);
  await expect(scene(page)).toHaveAttribute("data-chapter", "rivers", {
    timeout: 10000,
  });
  await page
    .getByRole("button", { name: "Mettre en pause", exact: true })
    .click();
  await select(page, 2);
});

for (const preference of ["système", "interface"] as const) {
  test(`mouvements réduits par ${preference} : huit images fixes cohérentes`, async ({
    page,
  }) => {
    if (preference === "système")
      await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page);
    if (preference === "interface") {
      await page
        .getByRole("button", { name: "Le projet", exact: false })
        .click();
      await page
        .getByRole("button", { name: "Réduire les mouvements", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Fermer le projet", exact: true })
        .click();
    }
    for (let index = 0; index < chapters.length; index++)
      await select(page, index);
    await seek(page, 17.5 + 30 * 0.94);
    await fullChapter(page, 1);
    await seek(page, 47.5);
    await fullChapter(page, 2);
  });
}

test("un chargement lent conserve une image entière et les clics rapides ignorent les anciennes réponses", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    "**/experience-art/coast/primary-runtime.webp",
    async (request) => {
      await gate;
      await request.continue();
    },
  );
  try {
    await open(page);
    await page
      .getByRole("button", { name: chapters[6][0], exact: true })
      .click();
    await expect(scene(page)).toHaveAttribute(
      "data-requested-chapter",
      "coast",
    );
    await expect(scene(page)).toHaveAttribute("data-chapter", "forest");
    await expect(scene(page)).toHaveAttribute("data-blend", "0.000000");
    await select(page, 2);
    release();
    await expect
      .poll(() =>
        page.evaluate(() =>
          performance
            .getEntriesByType("resource")
            .some((entry) =>
              entry.name.includes("/coast/primary-runtime.webp"),
            ),
        ),
      )
      .toBe(true);
    await fullChapter(page, 2);
    await select(page, 7);
  } finally {
    release();
  }
});

test("une image indisponible garde le dernier paysage valide et permet de revenir à la destination", async ({
  page,
}) => {
  let unavailable = true;
  await page.route(
    "**/experience-art/underwater/primary-runtime.webp",
    (request) => (unavailable ? request.abort() : request.continue()),
  );
  await open(page);
  await page.getByRole("button", { name: chapters[3][0], exact: true }).click();
  await expect(scene(page).locator('[role="alert"]')).toContainText(
    "Un paysage est indisponible",
  );
  await expect(scene(page)).toHaveAttribute("data-chapter", "forest");
  await expect(scene(page).locator("img").nth(1)).toHaveCSS("opacity", "0");
  unavailable = false;
  await select(page, 0);
  await select(page, 3);
  await expect(scene(page).locator('[role="alert"]')).toHaveCount(0);
});
