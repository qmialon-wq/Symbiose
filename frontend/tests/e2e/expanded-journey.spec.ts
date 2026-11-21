import { expect, test, type Page } from "@playwright/test";
import { narrativeCues } from "../../src/experience/narrative-cues";

const root = (page: Page) => page.locator(".sx-experience");

const photoViews = [
  { id: "soil", local: 0.03, base: "soil", blend: 0, capture: "01-soil" },
  {
    id: "drone",
    local: 11 / 30,
    base: "drone-bocage",
    blend: 0,
    capture: "02-team",
  },
  {
    id: "marine",
    local: 0.2,
    base: "marine-surface",
    blend: 0,
    capture: "03-marine-surface",
  },
  {
    id: "marine",
    local: 0.5,
    base: "marine-surface",
    blend: 1,
    capture: "04-marine-underwater",
  },
] as const;

async function photoReady(page: Page, id: ExtraId) {
  const view = page.locator(`[data-excursion-fallback="${id}"]`);
  await expect(view).toHaveAttribute("data-image-state", "ready");
  await expect(view.locator("svg")).toHaveCount(0);
  const decoded = await view.locator("img").evaluateAll((images) =>
    Promise.all(
      images.map(async (node) => {
        const image = node as HTMLImageElement;
        await image.decode();
        return [image.naturalWidth, image.naturalHeight];
      }),
    ),
  );
  expect(decoded.length).toBeGreaterThan(0);
  expect(
    decoded.every(([width, height]) => width === 1664 && height === 936),
  ).toBe(true);
  return view;
}

for (const viewport of [
  { width: 1600, height: 900 },
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
]) {
  test(`les quatre décors photographiques restent lisibles dans les deux modes à ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.setViewportSize(viewport);
    const requested: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/experience-art/excursions/"))
        requested.push(request.url());
    });
    await open(page);
    for (const presentation of [true, false]) {
      const currentMode = page.getByRole("button", {
        name: presentation ? "Mode exploration" : "Mode présentation",
        exact: true,
      });
      await currentMode.click();
      for (const entry of photoViews) {
        await jump(page, entry.id, entry.local);
        const view = await photoReady(page, entry.id);
        await expect(view).toHaveAttribute("data-image-base", entry.base);
        expect(Number(await view.getAttribute("data-image-blend"))).toBeCloseTo(
          entry.blend,
          5,
        );
        const title = page.locator(".sx-excursion-copy h2");
        await expect(title).toHaveText(
          narrativeCues.find((cue) => cue.excursion === entry.id)!.title,
        );
        await expect(title).toBeInViewport({ ratio: 1 });
        const image = view.locator(".sx-excursion-photo").first();
        const box = await image.boundingBox();
        expect(box!.width).toBeCloseTo(viewport.width, 0);
        expect(box!.height).toBeCloseTo(viewport.height, 0);
        expect(
          await image.evaluate((node) => getComputedStyle(node).objectFit),
        ).toBe("cover");
        await expect(view.locator(".sx-excursion-photographs")).toHaveAttribute(
          "aria-hidden",
          "true",
        );
        if (presentation && viewport.width === 1600) {
          await page.waitForTimeout(300);
          await page.screenshot({
            path: `../output/symbiose/step22/after/${entry.capture}.png`,
          });
        }
        if (entry.id === "soil")
          await expect
            .poll(() =>
              requested.some((url) => url.endsWith("drone-bocage.webp")),
            )
            .toBe(true);
        if (entry.id === "drone")
          await expect
            .poll(() =>
              requested.some((url) => url.endsWith("marine-underwater.webp")),
            )
            .toBe(true);
      }
    }
  });
}

test("le fondu marin est plein écran, réversible et indépendant du texte exploratoire", async ({
  page,
}) => {
  await open(page);
  const title = narrativeCues.find((cue) => cue.excursion === "marine")!.title;
  const samples = [
    [0.05, 0],
    [0.2, 0],
    [0.3, 0.5],
    [0.4, 1],
    [0.6, 1],
    [0.7, 1],
    [0.8, 0.5],
    [0.9, 0],
    [0.98, 0],
  ];
  for (const [local, blend] of [...samples, ...[...samples].reverse()]) {
    await jump(page, "marine", local);
    const view = await photoReady(page, "marine");
    await expect
      .poll(async () => Number(await view.getAttribute("data-image-blend")))
      .toBeCloseTo(blend, 5);
    await expect(page.locator(".sx-excursion-copy h2")).toHaveText(title);
    const boxes = await view.locator("img").evaluateAll((nodes) =>
      nodes.map((node) => {
        const box = node.getBoundingClientRect();
        return [box.x, box.y, box.width, box.height];
      }),
    );
    expect(boxes[0]).toEqual(boxes[1]);
  }
});

test("les mouvements réduits gardent une photographie fixe sans arrêter l’horloge", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  for (const local of [0.05, 0.4, 0.8, 0.98]) {
    await jump(page, "marine", local);
    const view = await photoReady(page, "marine");
    await expect(view).toHaveAttribute("data-image-blend", "1.000000");
    expect(
      await view
        .locator(".sx-excursion-photographs")
        .evaluate((node) => getComputedStyle(node).transitionDuration),
    ).toBe("0s");
  }
  await jump(page, "marine", 0.5);
  await page
    .getByRole("button", { name: "Mode exploration", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Lire le récit", exact: true })
    .click();
  await expect
    .poll(async () => Number(await root(page).getAttribute("data-seconds")))
    .toBeGreaterThan(243.1);
  await page
    .getByRole("button", { name: "Mettre en pause", exact: true })
    .click();
  await expect(page.locator(".sx-excursion-fallback")).toHaveAttribute(
    "data-image-blend",
    "1.000000",
  );
});

test("un chargement tardif est annulé sans bloquer la navigation ni repeindre une autre scène", async ({
  page,
}) => {
  let release!: () => void;
  const delayed = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/experience-art/excursions/soil.webp", async (route) => {
    await delayed;
    await route.continue().catch(() => {});
  });
  await open(page);
  await jump(page, "soil", 0.2);
  await expect(page.locator(".sx-excursion-fallback")).toHaveAttribute(
    "data-image-state",
    "loading",
  );
  await expect(page.locator(".sx-fallback-scene img").first()).toBeVisible();
  await page
    .getByRole("button", { name: "Poursuivre le voyage", exact: true })
    .click();
  await expect(root(page)).toHaveAttribute("data-excursion", "");
  await jump(page, "drone", 0.4);
  await photoReady(page, "drone");
  release();
  await page.waitForTimeout(200);
  await expect(page.locator(".sx-excursion-fallback")).toHaveAttribute(
    "data-image-base",
    "drone-bocage",
  );
});

test("une photographie indisponible garde un paysage et les contrôles du récit", async ({
  page,
}) => {
  await page.route("**/experience-art/excursions/*.webp", (route) =>
    route.abort(),
  );
  await open(page);
  await jump(page, "marine", 0.5);
  await expect(page.locator(".sx-excursion-fallback")).toHaveAttribute(
    "data-image-state",
    "degraded",
  );
  await expect(
    page.getByRole("status").filter({ hasText: "Un décor est indisponible" }),
  ).toBeVisible();
  expect(
    await page
      .locator(".sx-fallback-scene img")
      .first()
      .evaluate((node) => (node as HTMLImageElement).naturalWidth),
  ).toBeGreaterThan(0);
  await page
    .getByRole("button", { name: "Poursuivre le voyage", exact: true })
    .click();
  await expect(root(page)).toHaveAttribute("data-excursion", "");
});

test("les quatre photos restent décodables après installation du secours hors ligne", async ({
  page,
  context,
}) => {
  test.skip(!process.env.E2E_PRODUCTION, "Nécessite le cache de production");
  test.setTimeout(120000);
  await open(page);
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
  for (const entry of photoViews) {
    await jump(page, entry.id, entry.local);
    await photoReady(page, entry.id);
  }
});

test("le parcours WebGL ne charge pas les nouvelles photographies du secours", async ({
  page,
}) => {
  test.setTimeout(120000);
  const requested: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/experience-art/excursions/"))
      requested.push(request.url());
  });
  await open(page, false);
  await expect(page.locator(".sx-canvas canvas")).toHaveCount(1);
  for (const id of ["soil", "drone", "marine"] as const)
    await gpuJump(page, id, 0.55);
  await expect(page.locator(".sx-excursion-fallback")).toHaveCount(0);
  expect(requested).toEqual([]);
});

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
  await useDiscovery(page);
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
  await expect(root(page)).toHaveAttribute("data-prologue-active", "false");
  await expect(
    page.getByRole("button", { name: "Démarrer le pitch", exact: true }),
  ).toBeVisible();
  await useDiscovery(page);
}
async function useDiscovery(page: Page) {
  const presentation = page.getByRole("button", {
    name: "Mode présentation",
    exact: true,
  });
  if (await presentation.isVisible()) await presentation.click();
  await expect(
    page.getByRole("button", { name: "Mode exploration", exact: true }),
  ).toBeVisible();
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

test("le jury offre 39 écrans hors prologue et trois explorations pédagogiques accessibles", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  const scrollScreens = await root(page).evaluate(
    (element) =>
      (element.getBoundingClientRect().height - innerHeight) / innerHeight,
  );
  expect(scrollScreens).toBeCloseTo(39, 2);
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
      await expect(copy).toContainText("Une route, une clôture, un éclairage");
      await expect(copy).toContainText("Que risquerions-nous de perturber ?");
      await expect(copy).toContainText("aucune analyse de sol exécutée");
    }
    if (scene.id === "drone") {
      await expect(copy).toContainText("une piste d’évolution");
      await expect(copy).toContainText("Arden, Romain et Quentin");
    }
    if (scene.id === "marine") {
      await expect(copy).toContainText("aucun partenariat annoncé");
      await expect(copy.getByRole("heading", { level: 2 })).toHaveText(
        "Ce qu’il reste à construire ensemble.",
      );
    }
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

test("la découverte publique conserve les 42 écrans avec son prologue", async ({
  page,
}) => {
  await page.route("**/api/**", (route) =>
    route.fulfill(
      new URL(route.request().url()).pathname.endsWith("/auth/me")
        ? { status: 401, json: { detail: "Connexion requise" } }
        : { json: { setup_required: false, registration_open: true } },
    ),
  );
  await page.goto("/?render=2d");
  await expect(page.locator(".sx-stage")).toHaveClass(/sx-stage--ready/, {
    timeout: 45000,
  });
  await expect(root(page)).toHaveAttribute("data-prologue-active", "true");
  await expect(
    page.getByRole("button", { name: "Découvrir Symbiose", exact: true }),
  ).toBeVisible();
  const scrollScreens = await root(page).evaluate(
    (element) =>
      (element.getBoundingClientRect().height - innerHeight) / innerHeight,
  );
  expect(scrollScreens).toBeCloseTo(42, 2);
  await page
    .getByRole("button", { name: "Passer l’introduction", exact: true })
    .click();
  await expect(root(page)).toHaveAttribute("data-prologue-active", "false");
  await expect(page.locator(".sx-pitch-content")).toHaveAttribute(
    "data-cue",
    "forest-opening",
  );
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
  await page
    .getByRole("button", { name: "Mode exploration", exact: true })
    .click();
  await page.locator("#main-content").focus();
  await page.keyboard.press("ArrowRight");
  await expect(root(page)).toHaveAttribute("data-excursion", "soil");
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
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".sx-pitch-content")).toHaveAttribute(
    "data-cue",
    "forest-return",
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
  await page
    .getByRole("button", { name: "Changer d’échelle", exact: true })
    .click();
  await expect(root(page)).toHaveAttribute("data-excursion", "marine");
  await page.locator("#main-content").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".sx-pitch-content")).toHaveAttribute(
    "data-cue",
    "coast-return",
  );
  await expect(page.locator(".sx-counter")).toHaveText("4:18 / 5:00");
  await page.keyboard.press("ArrowLeft");
  await expect(root(page)).toHaveAttribute("data-excursion", "marine");
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
