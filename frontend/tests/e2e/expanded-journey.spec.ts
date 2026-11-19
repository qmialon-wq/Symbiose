import { expect, test, type Page } from "@playwright/test";

const root = (page: Page) => page.locator(".sx-experience");

test("les trois scènes 3D restent disponibles après installation hors ligne", async ({
  page,
  context,
}) => {
  test.skip(
    !process.env.E2E_PRODUCTION,
    "Nécessite le service worker du build de production",
  );
  test.setTimeout(120000);
  await open(page, false);
  test.skip(
    (await page.locator(".sx-canvas").count()) === 0,
    "Nécessite un GPU matériel",
  );
  await page.locator(".jury-installation summary").click();
  await page
    .getByRole("button", { name: "Installer hors ligne", exact: true })
    .click();
  await expect(page.locator(".jury-installation [role=status]")).toContainText(
    "Installation locale prête",
    { timeout: 65000 },
  );
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".sx-stage")).toHaveClass(/sx-stage--ready/, {
    timeout: 45000,
  });
  // Reload may restore the forest position saved before installation.
  await page.getByRole("button", { name: "1. Forêt", exact: true }).click();
  for (const id of ["soil", "drone", "marine"] as const) {
    const state = await gpuJump(page, id, 0.55);
    expect(state.excursion.id).toBe(id);
    expect(state.assetsPending).toBe(false);
  }
  await expect(page.locator(".sx-canvas canvas")).toHaveCount(1);
});
const scenes = [
  {
    id: "soil",
    label: "Sous nos pas",
    start: 12,
    units: 35,
    returns: "forest",
  },
  {
    id: "drone",
    label: "L’équipe ARQ",
    start: 200,
    units: 30,
    returns: "coast",
  },
  {
    id: "marine",
    label: "Changer d’échelle",
    start: 245,
    units: 40,
    returns: "coast",
  },
] as const;
type ExtraId = (typeof scenes)[number]["id"];

async function open(page: Page, fallback = true) {
  await page.goto(`/jury/${fallback ? "?render=2d" : ""}`);
  await expect(page.locator(".sx-stage")).toHaveClass(/sx-stage--ready/, {
    timeout: 60000,
  });
  await page
    .getByRole("button", { name: "Passer l’introduction", exact: true })
    .click();
  await expect(root(page)).toHaveAttribute("data-prologue-active", "false");
}
async function jump(page: Page, id: ExtraId, local: number) {
  const scene = scenes.find((item) => item.id === id)!;
  const routeProgress = (scene.start + local * scene.units) / 315;
  await page
    .getByRole("slider", { name: "Position dans le récit" })
    .evaluate((element: HTMLInputElement, progress) => {
      element.step = "any";
      element.value = String(progress * 100);
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }, routeProgress);
  await expect(root(page)).toHaveAttribute("data-excursion", id);
  await expect
    .poll(async () =>
      Number(await root(page).getAttribute("data-excursion-local")),
    )
    .toBeCloseTo(local, 5);
}
async function gpuState(page: Page) {
  return page.locator(".sx-canvas").evaluateAll((elements) => {
    const state = (elements[0] as HTMLElement | undefined)?.dataset.state;
    return state ? JSON.parse(state) : undefined;
  });
}
async function gpuJump(page: Page, id: ExtraId, local: number) {
  await jump(page, id, local);
  await expect
    .poll(
      async () => {
        const state = await gpuState(page);
        return (
          state?.excursion?.id === id &&
          Math.abs(state.excursion.local - local) < 1e-8 &&
          !state.assetsPending
        );
      },
      { timeout: 30000 },
    )
    .toBe(true);
  return gpuState(page);
}

test("le voyage offre 42 écrans de défilement et trois explorations pédagogiques accessibles", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  const scrollScreens = await root(page).evaluate(
    (element) =>
      (element.getBoundingClientRect().height - innerHeight) / innerHeight,
  );
  expect(scrollScreens).toBeCloseTo(42, 2);
  expect(scrollScreens / 24).toBeCloseTo(1.75, 2);
  for (const scene of scenes) {
    await page.getByRole("button", { name: scene.label, exact: true }).click();
    await expect(root(page)).toHaveAttribute("data-excursion", scene.id);
    const copy = page.locator(`[data-excursion-copy="${scene.id}"]`);
    await expect(copy).toBeVisible();
    await expect(
      page.locator(`[data-excursion-fallback="${scene.id}"]`),
    ).toBeVisible();
    await expect(copy).toContainText(
      /illustr|pédagogique|Mise en scène|Évocation artistique/i,
    );
    if (scene.id === "soil") {
      await expect(copy).toContainText("un annélide, pas un insecte");
      await expect(copy).toContainText("Un projet d’aménagement prévu ici");
      await expect(copy).toContainText("aucune analyse de sol exécutée");
    }
    if (scene.id === "drone") {
      await expect(copy).toContainText("une piste d’évolution");
      await expect(copy).toContainText("Arden, Romain et Quentin");
    }
    if (scene.id === "marine")
      await expect(copy).toContainText("aucun partenariat annoncé");
    await copy
      .getByRole("button", { name: "Poursuivre le voyage", exact: false })
      .click();
    await expect(root(page)).toHaveAttribute("data-excursion", "");
    await expect(page.locator(".sx-pitch-content")).toHaveAttribute(
      "data-chapter",
      scene.returns,
    );
  }
});

test("le curseur permet de parcourir les nouveaux passages dans les deux sens", async ({
  page,
}) => {
  await open(page);
  for (const [id, local] of [
    ["soil", 0.4],
    ["drone", 0.5],
    ["marine", 0.55],
    ["marine", 0.85],
    ["drone", 0.5],
    ["soil", 0.4],
  ] as const) {
    await jump(page, id, local);
    await expect(page.locator(`[data-excursion-copy="${id}"]`)).toBeVisible();
  }
  await page.getByRole("button", { name: "1. Forêt", exact: true }).click();
  await expect(root(page)).toHaveAttribute("data-route-progress", "0.000000");
  await expect(root(page)).toHaveAttribute("data-excursion", "");
});

test("la navigation clavier inclut le sol entre forêt et ciel sans perdre les huit chapitres", async ({
  page,
}) => {
  await open(page);
  await page.locator("#main-content").focus();
  await page.keyboard.press("ArrowRight");
  await expect(root(page)).toHaveAttribute("data-excursion", "soil");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".sx-pitch-content")).toHaveAttribute(
    "data-chapter",
    "sky",
  );
  await page.keyboard.press("ArrowLeft");
  await expect(root(page)).toHaveAttribute("data-excursion", "soil");
  const originals = [
    ["1. Forêt", "forest"],
    ["2. Ciel et nuages", "sky"],
    ["3. Rivières", "rivers"],
    ["4. Monde sous-marin", "underwater"],
    ["5. Zone humide", "wetland"],
    ["6. Prairie et bocage", "meadow"],
    ["7. Littoral — Étretat", "coast"],
    ["8. Forêt nocturne", "night-forest"],
  ];
  for (const [label, id] of originals) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(page.locator(".sx-pitch-content")).toHaveAttribute(
      "data-chapter",
      id,
    );
    await expect(root(page)).toHaveAttribute("data-excursion", "");
  }
  await page.locator("#main-content").focus();
  await page.keyboard.press("End");
  await expect(page.locator(".sx-counter")).toHaveText("5:00 / 5:00");
  const href = await page
    .getByRole("link", { name: "Accéder à l’application" })
    .getAttribute("href");
  await expect(
    page.getByRole("link", { name: "Commencer l’expérience Symbiose" }),
  ).toHaveAttribute("href", href!);
});

test("les nouvelles explorations restent lisibles sur mobile avec mouvements réduits", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  await expect(root(page)).toHaveAttribute("data-reduced-motion", "true");
  for (const scene of scenes) {
    await page.getByRole("button", { name: scene.label, exact: true }).click();
    const copy = page.locator(`[data-excursion-copy="${scene.id}"]`);
    await expect(copy.getByRole("heading", { level: 2 })).toBeVisible();
    const leave = copy.getByRole("button", {
      name: "Poursuivre le voyage",
      exact: false,
    });
    await leave.scrollIntoViewIfNeeded();
    await expect(leave).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await leave.click();
    await expect(root(page)).toHaveAttribute("data-excursion", "");
  }
});

test("les excursions GPU plongent sous la mer, traversent le sol et survolent la plaine avec un seul canvas", async ({
  page,
}) => {
  test.setTimeout(120000);
  await open(page, false);
  test.skip(
    (await page.locator(".sx-canvas").count()) === 0,
    "Les contrôles de caméra nécessitent un GPU matériel",
  );
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const soil = await gpuJump(page, "soil", 0.55);
  expect(soil.position[1]).toBeLessThan(0);
  const drone = await gpuJump(page, "drone", 0.5);
  expect(drone.position[1]).toBeGreaterThan(0);
  const submerged = await gpuJump(page, "marine", 0.55);
  expect(submerged.immersion).toBeGreaterThan(0.8);
  expect(submerged.postProcessing).toBe(true);
  expect(submerged.position[1]).toBeLessThan(0);
  const emerged = await gpuJump(page, "marine", 0.85);
  expect(emerged.immersion).toBe(0);
  expect(emerged.postProcessing).toBe(false);
  expect(emerged.position[1]).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(root(page)).toHaveAttribute("data-reduced-motion", "true");
  const fixedA = await gpuJump(page, "soil", 0.3);
  const fixedB = await gpuJump(page, "soil", 0.7);
  expect(fixedA.position).toEqual(fixedB.position);
  expect(fixedA.target).toEqual(fixedB.target);
  await page.getByRole("button", { name: "1. Forêt", exact: true }).click();
  await expect(page.locator(".sx-canvas canvas")).toHaveCount(1);
  await expect(root(page)).toHaveAttribute("data-excursion", "");
  expect(errors).toEqual([]);
});
