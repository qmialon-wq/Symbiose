import { expect, test, type Page } from "@playwright/test";

const passages = [
  {
    id: "soil",
    start: 12,
    units: 35,
    position: [1, 10, 0],
    target: [0, 34, -38],
    fov: 59,
  },
  {
    id: "drone",
    start: 200,
    units: 30,
    position: [-8, 94, -622],
    target: [2, 6, -730],
    fov: 57,
  },
  {
    id: "marine",
    start: 245,
    units: 40,
    position: [58, 55, -648],
    target: [-44, 18, -753],
    fov: 57,
  },
] as const;

async function open(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/jury/");
  await expect(page.locator(".sx-stage")).toHaveClass(/sx-stage--ready/, {
    timeout: 60000,
  });
  test.skip(
    (await page.locator(".sx-canvas").count()) === 0,
    "Nécessite un GPU matériel",
  );
  await expect(page.locator(".sx-experience")).toHaveAttribute(
    "data-prologue-active",
    "false",
  );
  // Geometry assertions exercise the reversible discovery path, without jury holds.
  await page
    .getByRole("button", { name: "Mode présentation", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Mode exploration", exact: true }),
  ).toBeVisible();
}

async function state(page: Page) {
  return page
    .locator(".sx-canvas")
    .evaluate((element: HTMLElement) => JSON.parse(element.dataset.state!));
}

async function jump(
  page: Page,
  passage: (typeof passages)[number],
  local: number,
) {
  await page.getByRole("slider", { name: "Position dans le récit" }).evaluate(
    (element: HTMLInputElement, progress) => {
      element.step = "any";
      element.value = String(progress * 100);
      element.dispatchEvent(new Event("input", { bubbles: true }));
    },
    (passage.start + passage.units * local) / 315,
  );
  await expect
    .poll(
      async () => {
        const frame = await state(page);
        const inPassage =
          frame.excursion?.id === passage.id &&
          Math.abs(frame.excursion.local - local) < 1e-8;
        const atOriginalJoin =
          (local === 0 || local === 1) &&
          !frame.excursion &&
          Math.abs(frame.position[0] - passage.position[0]) < 1e-8 &&
          Math.abs(frame.position[2] - passage.position[2]) < 1e-8;
        return !frame.assetsPending && (inPassage || atOriginalJoin);
      },
      { timeout: 30000 },
    )
    .toBe(true);
  return state(page);
}

test("les détours raccordent exactement la caméra initiale et se rejouent à l'envers sans fondu", async ({
  page,
}) => {
  test.setTimeout(120000);
  await open(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /WebGL|shader|THREE/.test(message.text()))
      errors.push(message.text());
  });
  const canvas = await page.locator(".sx-canvas canvas").elementHandle();
  for (const passage of passages) {
    for (const local of [0, 1]) {
      const frame = await jump(page, passage, local);
      for (const field of ["position", "target"] as const)
        passage[field].forEach((value, index) =>
          expect(frame[field][index]).toBeCloseTo(value, 8),
        );
      expect(frame.fov).toBeCloseTo(passage.fov, 8);
    }
    const snapshots = [];
    for (const local of [0.001, 0.01, 0.1, 0.35, 0.5, 0.85, 0.99, 0.999]) {
      const frame = await jump(page, passage, local);
      expect(frame.excursion.connected).toBe(true);
      await expect(page.locator(".sx-canvas")).toHaveAttribute(
        "data-render-scene",
        "journey-world",
      );
      await expect(page.locator(".sx-canvas")).toHaveAttribute(
        "data-camera-mode",
        "connected",
      );
      expect(
        await canvas!.evaluate(
          (element) => element === document.querySelector(".sx-canvas canvas"),
        ),
      ).toBe(true);
      expect(
        await canvas!.evaluate((element) => {
          let node: Element | null = element;
          while (node) {
            if (getComputedStyle(node).opacity !== "1") return false;
            node = node.parentElement;
          }
          return true;
        }),
      ).toBe(true);
      snapshots.push({ local, position: frame.position, target: frame.target });
    }
    for (const snapshot of snapshots.reverse()) {
      const reverse = await jump(page, passage, snapshot.local);
      expect(reverse.position).toEqual(snapshot.position);
      expect(reverse.target).toEqual(snapshot.target);
    }
  }
  expect(errors).toEqual([]);
});

test("la caméra entre dans le sol, regarde le drone à droite et traverse la surface marine", async ({
  page,
}) => {
  test.setTimeout(120000);
  await open(page);
  expect((await jump(page, passages[0], 0.55)).position[1]).toBeLessThan(0);
  expect((await jump(page, passages[0], 0.85)).position[1]).toBeGreaterThan(0);
  const turned = await jump(page, passages[1], 0.18);
  expect(turned.target[0] - turned.position[0]).toBeGreaterThan(40);
  const underwater = await jump(page, passages[2], 0.5);
  expect(underwater.position[1]).toBeLessThan(0);
  expect(underwater.immersion).toBe(1);
  expect(underwater.animals.length).toBeGreaterThanOrEqual(3);
  expect(underwater.animals.length).toBeLessThanOrEqual(5);
  const labels = page.locator(".sx-animal-label");
  for (const name of ["Maquereau", "Lieu jaune", "Plie"])
    await expect(labels.filter({ hasText: name }).first()).toBeVisible();
  for (const fish of underwater.animals) {
    expect(fish.label).toContain("illustration");
    const box = page.locator(`[data-animal="${fish.id}"]`);
    const position = await box.evaluate((element: HTMLElement) =>
      [
        element.style.left,
        element.style.top,
        element.style.width,
        element.style.height,
      ].map(parseFloat),
    );
    // Chromium serializes inline percentages with about six significant digits.
    [fish.x, fish.y, fish.width, fish.height].forEach((value, index) =>
      expect(position[index]).toBeCloseTo(value * 100, 3),
    );
  }
  const emerged = await jump(page, passages[2], 0.85);
  expect(emerged.position[1]).toBeGreaterThan(0);
  expect(emerged.immersion).toBe(0);
  await expect(page.locator(".sx-animal-box")).toHaveCount(0);
});
