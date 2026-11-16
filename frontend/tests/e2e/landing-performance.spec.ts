import { expect, test, type Page } from "@playwright/test";

const state = (page: Page) =>
  page
    .locator(".sx-canvas")
    .evaluate((element: HTMLElement) => JSON.parse(element.dataset.state!));
async function ready(page: Page) {
  await expect(page.locator(".sx-stage")).toHaveClass(/sx-stage--ready/, {
    timeout: 45000,
  });
  await expect(page.getByTestId("landing-loading")).toHaveCount(0);
}
async function settled(page: Page) {
  await expect
    .poll(async () => !(await state(page)).assetsPending, { timeout: 45000 })
    .toBe(true);
}

test("le chevreuil apparaît aussi pendant le téléchargement initial de la landing publique", async ({
  page,
}) => {
  await page.route("**/api/**", (route) =>
    route.fulfill(
      new URL(route.request().url()).pathname.endsWith("/auth/me")
        ? { status: 401, json: { detail: "Connexion requise" } }
        : { json: { setup_required: false, registration_open: true } },
    ),
  );
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    /\/(?:src\/pages\/LandingPage\.vue|assets\/LandingPage-[^/?]+\.js)(?:\?|$)/,
    async (route) => {
      await gate;
      await route.continue().catch(() => {});
    },
  );
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const loader = page.getByTestId("landing-loading");
    await expect(loader).toBeVisible();
    await expect(loader.locator("svg.login-deer")).toBeVisible();
    await expect(loader.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "2",
    );
    await expect(
      loader.getByRole("link", { name: "Accéder à l’application" }),
    ).toHaveAttribute("href", "/connexion");
    release();
    await ready(page);
  } finally {
    release();
  }
});

test("le chevreuil et sa progression restent lisibles si le moteur tarde, avec une sortie légère immédiate", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    /\/(?:src\/experience\/ExperienceCanvas\.vue|assets\/ExperienceCanvas-[^/?]+\.js)(?:\?|$)/,
    async (route) => {
      await gate;
      await route.continue().catch(() => {});
    },
  );
  try {
    await page.goto("/jury/", { waitUntil: "domcontentloaded" });
    const loader = page.getByTestId("landing-loading");
    await expect(loader).toBeVisible();
    await expect(loader.locator("svg.login-deer")).toBeVisible();
    expect(
      await loader
        .locator(".deer-body")
        .evaluate((element) => getComputedStyle(element).animationName),
    ).toBe("none");
    await expect(loader.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "4",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await loader
      .getByRole("button", { name: "Continuer en version légère sans 3D" })
      .click();
    await ready(page);
    await expect(page.locator(".sx-prologue-fallback img")).toBeVisible();
    await expect(page.locator(".sx-canvas")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Passer l’introduction", exact: true })
      .click();
    await expect(page.locator(".sx-pitch-content")).toHaveAttribute(
      "data-chapter",
      "forest",
    );
  } finally {
    release();
  }
});

test("le bureau s’ouvre sans attendre les modèles extérieurs sur une connexion lente", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let held = 0;
  await page.route("**/experience-models/**", async (route) => {
    held++;
    await gate;
    await route.continue().catch(() => {});
  });
  try {
    await page.goto("/jury/");
    await ready(page);
    test.skip(
      (await page.locator(".sx-canvas").count()) === 0,
      "Nécessite un GPU matériel",
    );
    await expect(
      page.getByRole("heading", { name: "Du bureau au vivant.", exact: true }),
    ).toBeVisible();
    await expect.poll(() => held).toBeGreaterThan(0);
    await page
      .getByRole("button", { name: "Passer l’introduction", exact: true })
      .click();
    await expect(page.locator(".sx-canvas")).toHaveAttribute(
      "data-prologue",
      "",
    );
    expect((await state(page)).assetsPending).toBe(true);
    release();
    await settled(page);
    await expect(
      page.locator(".sx-animal-label").filter({ hasText: "Chevreuil" }),
    ).toBeVisible();
    const before = (await state(page)).renderCount;
    await page.waitForTimeout(500); // Observe actual idle rendering after network/decoding settles.
    expect((await state(page)).renderCount).toBeLessThanOrEqual(before + 1);
  } finally {
    release();
  }
});

test("le mode automatique réduit réellement les téléchargements et conserve les trois détours sur un appareil modeste", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 4 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 4 });
    Object.defineProperty(navigator, "connection", {
      get: () => ({ saveData: true, effectiveType: "3g", downlink: 1 }),
    });
  });
  const requests: string[] = [],
    errors: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/experience-models/"))
      requests.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/jury/");
  await ready(page);
  test.skip(
    (await page.locator(".sx-canvas").count()) === 0,
    "Nécessite un GPU matériel",
  );
  expect((await state(page)).quality).toBe("eco");
  expect((await state(page)).pixelRatio).toBeLessThanOrEqual(0.8);
  await page.waitForTimeout(500); // Data-saving mode must not prefetch outdoor GLBs at idle.
  expect(requests.filter((url) => url.endsWith(".glb"))).toEqual([]);
  const before = (await state(page)).renderCount;
  await page.waitForTimeout(500);
  expect((await state(page)).renderCount).toBeLessThanOrEqual(before + 1);
  await page
    .getByRole("button", { name: "Passer l’introduction", exact: true })
    .click();
  await expect(page.locator(".sx-canvas")).toHaveAttribute("data-prologue", "");
  await settled(page);
  expect((await state(page)).triangles).toBeLessThan(800_000);
  expect(
    requests.some((url) =>
      /tree-near|grass-medium|fern_02|rock_moss_set|tree_stump|nor_gl|Rough/.test(
        url,
      ),
    ),
  ).toBe(false);
  expect(requests.some((url) => url.includes("tree-atlas.webp"))).toBe(true);
  for (const { id, start, units } of [
    { id: "soil", start: 12, units: 35 },
    { id: "drone", start: 200, units: 30 },
    { id: "marine", start: 245, units: 40 },
  ]) {
    await page.getByRole("slider", { name: "Position dans le récit" }).evaluate(
      (element: HTMLInputElement, progress) => {
        element.step = "any";
        element.value = String(progress * 100);
        element.dispatchEvent(new Event("input", { bubbles: true }));
      },
      (start + units * 0.5) / 315,
    );
    await expect(page.locator(".sx-canvas")).toHaveAttribute(
      "data-excursion",
      id,
    );
    await expect
      .poll(async () => Math.abs((await state(page)).excursion.local - 0.5))
      .toBeLessThan(1e-8);
    await settled(page);
    expect((await state(page)).quality).toBe("eco");
    await expect(page.locator(".sx-canvas")).toHaveAttribute(
      "data-render-scene",
      "journey-world",
    );
    if (id === "marine") {
      expect((await state(page)).immersion).toBe(1);
      expect((await state(page)).animals.length).toBeGreaterThan(0);
      for (const label of ["Maquereau", "Lieu jaune", "Plie"])
        await expect(
          page.locator(".sx-animal-label").filter({ hasText: label }).first(),
        ).toBeVisible();
    }
  }
  expect(errors).toEqual([]);
});

test("la qualité peut être choisie et mémorisée sans perdre sa place dans le récit", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 12 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
  });
  await page.goto("/jury/");
  await ready(page);
  test.skip(
    (await page.locator(".sx-canvas").count()) === 0,
    "Nécessite un GPU matériel",
  );
  await page
    .getByRole("button", { name: "7. Littoral — Étretat", exact: true })
    .click();
  await expect(page.locator(".sx-canvas")).toHaveAttribute("data-prologue", "");
  await settled(page);
  const progress = await page
    .locator(".sx-experience")
    .getAttribute("data-route-progress");
  await page.locator(".sx-recovery-tools summary").click();
  await page.getByLabel("Qualité visuelle").selectOption("eco");
  await ready(page);
  await settled(page);
  await expect(page.locator(".sx-experience")).toHaveAttribute(
    "data-route-progress",
    progress!,
  );
  expect((await state(page)).quality).toBe("eco");
  expect(
    await page.evaluate(() =>
      localStorage.getItem("symbiose:landing-quality:v1"),
    ),
  ).toBe("eco");
  await page.reload();
  await ready(page);
  expect((await state(page)).quality).toBe("eco");
});
