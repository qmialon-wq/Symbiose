import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  narrativeCues,
  narrativeEventAt,
} from "../../src/experience/narrative-cues";

// Spatial landmarks are an integration fixture; the requested editorial seconds
// come from the conductor. Use the actual slider, with no product test hook.
const landmarks = [
  0, 12, 47, 52.5, 82.5, 112.5, 140, 167.5, 200, 230, 245, 285, 300, 315,
];
const root = (page: Page) => page.locator(".sx-experience");
const seconds = async (page: Page) =>
  Number(await root(page).getAttribute("data-seconds"));

async function advanceClock(page: Page, milliseconds: number) {
  // Sample at 100 ms, below GSAP's sleep threshold. Rendering every synthetic
  // RAF is covered separately by camera tests and adds no elapsed-time coverage.
  let remaining = Math.max(0, Math.ceil(milliseconds));
  while (remaining > 0) {
    const step = Math.min(100, remaining);
    await page.clock.fastForward(step);
    remaining -= step;
  }
}

async function openJury(page: Page, fallback = true) {
  await page.goto(`/jury/${fallback ? "?render=2d" : ""}`);
  await expect(page.locator(".sx-stage")).toHaveClass(/sx-stage--ready/, {
    timeout: 60000,
  });
  await expect(page.getByTestId("landing-loading")).toHaveCount(0);
}

async function seekSeconds(page: Page, value: number) {
  const index = Math.max(
    0,
    narrativeCues.findIndex((cue) => value < cue.end),
  );
  const cue = value >= 300 ? narrativeCues.at(-1)! : narrativeCues[index];
  const part = value >= 300 ? 1 : (value - cue.start) / (cue.end - cue.start);
  const segment = value >= 300 ? narrativeCues.length - 1 : index;
  const units =
    landmarks[segment] + part * (landmarks[segment + 1] - landmarks[segment]);
  await page
    .getByRole("slider", { name: "Position dans le récit", exact: true })
    .evaluate((element: HTMLInputElement, progress) => {
      element.step = "any";
      element.value = String(progress * 100);
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }, units / 315);
  await expect.poll(() => seconds(page)).toBeCloseTo(value, 2);
}

test("le jury ouvre la forêt à zéro sans requête de vidéo ni API métier et attend le départ", async ({
  page,
}) => {
  const unexpected: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      url.pathname.startsWith("/api/") ||
      /(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/.test(
        url.hostname,
      ) ||
      url.pathname === "/experience-media/intro.mp4"
    )
      unexpected.push(request.url());
  });
  await openJury(page);
  await expect(root(page)).toHaveAttribute("data-prologue-active", "false");
  await expect(root(page)).toHaveAttribute("data-seconds", "0.000");
  await expect(page.locator(".sx-prologue-overlay, video, iframe")).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("heading", { name: /Une forêt ordinaire/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Démarrer le pitch", exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(500);
  expect(await seconds(page)).toBe(0);
  expect(unexpected).toEqual([]);
});

test("les treize scènes et les démonstrations utilisent les mêmes repères en 2D, y compris en retour arrière", async ({
  page,
}) => {
  await openJury(page);
  for (const cue of [...narrativeCues, ...[...narrativeCues].reverse()]) {
    await seekSeconds(page, cue.start);
    const panel = cue.excursion
      ? page.locator(`[data-excursion-copy="${cue.excursion}"]`)
      : page.locator(`.sx-pitch-content[data-cue="${cue.id}"]`);
    // ARQ starts with six seconds of landscape before its first skill panel.
    if (cue.id === "drone") {
      await expect(page.locator('[data-excursion-copy="drone"]')).toHaveCount(
        0,
      );
      await seekSeconds(page, cue.events[0].start);
    }
    await expect(panel).toBeVisible();
    if (cue.id !== "night-forest")
      await expect(panel.getByRole("heading", { level: 2 })).toHaveText(
        cue.title,
      );
    if (["rivers", "wetland", "meadow"].includes(cue.id)) {
      for (const event of cue.events) {
        await seekSeconds(page, event.start);
        await expect(page.locator("[data-demo-stage]")).toHaveAttribute(
          "data-demo-stage",
          event.id,
        );
        await expect(page.locator(".sx-demo-copy h3")).toHaveText(event.label);
      }
    }
  }
  await seekSeconds(page, 300);
  await expect(page.locator(".sx-final-logo")).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Commencer l’expérience Symbiose",
      exact: false,
    }),
  ).toHaveAttribute("href", /connexion/);
  await expect(page.locator(".sx-counter")).toHaveText("5:00 / 5:00");
});

test("une pause du carnet puis une reprise ne décale pas la démonstration", async ({
  page,
}) => {
  await page.clock.install();
  await openJury(page);
  await seekSeconds(page, 72.8);
  await page.clock.pauseAt(
    new Date((await page.evaluate(() => Date.now())) + 500),
  );
  await page
    .getByRole("button", { name: "Lire le récit", exact: true })
    .click();
  await page.clock.runFor(450);
  await expect(page.locator("[data-demo-stage]")).toHaveAttribute(
    "data-demo-stage",
    "river-identify",
  );
  await page
    .getByRole("button", { name: "Sources et limites", exact: false })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const paused = await seconds(page);
  await page.clock.runFor(10000);
  expect(await seconds(page)).toBe(paused);
  await page
    .getByRole("button", { name: "Fermer le projet", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Lire le récit", exact: true })
    .click();
  await page.clock.runFor(500);
  expect(await seconds(page)).toBeCloseTo(paused + 0.5, 1);
  await expect(page.locator("[data-demo-stage]")).toHaveAttribute(
    "data-demo-stage",
    "river-identify",
  );
});

test("les cinq minutes se déroulent automatiquement puis restent figées à 5:00", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.clock.install();
  await openJury(page);
  // Prewarm existing landscapes only in this accelerated-clock test, so fake
  // image timeouts cannot outrun localhost image decoding.
  await page.evaluate(async () => {
    const inventory = await (
      await fetch("/experience-art/runtime-assets.json")
    ).json();
    await Promise.all(
      Object.values(inventory.scenes).map(async (scene: any) => {
        const image = new Image();
        image.src = scene.primary.url;
        await image.decode();
      }),
    );
  });
  await page.clock.pauseAt(
    new Date((await page.evaluate(() => Date.now())) + 500),
  );
  await page
    .getByRole("button", { name: "Démarrer le pitch", exact: true })
    .click();
  for (const cue of narrativeCues) {
    const target = cue.start + Math.min(1, cue.end - cue.start);
    const elapsed = await seconds(page);
    await advanceClock(page, Math.max(0, Math.ceil((target - elapsed) * 1000)));
    expect(await seconds(page)).toBeCloseTo(target, 1);
    await expect(root(page)).toHaveAttribute(
      "data-excursion",
      cue.excursion ?? "",
    );
  }
  await advanceClock(
    page,
    Math.ceil((300 - (await seconds(page))) * 1000) + 32,
  );
  await expect(page.locator(".sx-counter")).toHaveText("5:00 / 5:00");
  await expect(
    page.getByRole("button", { name: "Lire le récit", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".sx-final-logo")).toBeVisible();
  await page.clock.runFor(10000);
  expect(await seconds(page)).toBe(300);
});

test("les mouvements réduits gardent une horloge jury utilisable et des scènes lisibles sur mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openJury(page);
  await expect(root(page)).toHaveAttribute("data-reduced-motion", "true");
  await page
    .getByRole("button", { name: "Démarrer le pitch", exact: true })
    .click();
  await expect.poll(() => seconds(page)).toBeGreaterThan(0);
  await page
    .getByRole("button", { name: "Mettre en pause", exact: true })
    .click();
  for (const target of [67, 80, 103, 135, 164, 176, 198, 240, 289, 300]) {
    await seekSeconds(page, target);
    const controls = page.getByRole("slider", {
      name: "Position dans le récit",
      exact: true,
    });
    await expect(controls).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const heading = page.locator(".sx-pitch-scene h2, .sx-excursion-copy h2");
    await expect(heading).toBeInViewport();
  }
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
});

test("la caméra WebGL reste stable pendant les démonstrations sans figer l’horloge", async ({
  page,
}) => {
  test.setTimeout(120000);
  await openJury(page, false);
  const canvas = page.locator(".sx-canvas");
  test.skip(
    (await canvas.count()) === 0,
    "La comparaison du cadrage demande WebGL matériel",
  );
  const poseAt = async (time: number) => {
    const previous = Number(await canvas.getAttribute("data-render-count"));
    await seekSeconds(page, time);
    await expect
      .poll(async () => Number(await canvas.getAttribute("data-render-count")))
      .toBeGreaterThan(previous);
    await expect(canvas).toHaveAttribute("data-progress", /.+/);
    await expect
      .poll(async () => {
        const report = await canvas.getAttribute("data-state");
        return report ? JSON.parse(report).progress : -1;
      })
      .toBeCloseTo(Number(await root(page).getAttribute("data-progress")), 4);
    const report = JSON.parse((await canvas.getAttribute("data-state"))!);
    return {
      position: report.position,
      target: report.target,
      fov: report.fov,
    };
  };
  for (const [start, end] of [
    [4, 10],
    [74, 81],
    [149, 174],
    [202, 208],
    [294, 300],
  ]) {
    const before = await poseAt(start),
      after = await poseAt(end);
    expect(after).toEqual(before);
  }
  await seekSeconds(page, 160);
  await page.screenshot({ path: "test-results/jury-bocage-webgl.png" });
  await seekSeconds(page, 300);
  await expect(page.locator(".sx-final-logo")).toBeVisible();
  await expect(page.locator(".sx-canvas canvas")).toHaveCount(1);
});

for (const viewport of [
  { width: 1600, height: 900 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
]) {
  test(`composition des démonstrations sans chevauchement à ${viewport.width}x${viewport.height}`, async ({
    page,
  }, info) => {
    await page.setViewportSize(viewport);
    await openJury(page);
    for (const time of [73, 160, 176, 202, 240, 300]) {
      await seekSeconds(page, time);
      await page.waitForTimeout(200);
      expect(await seconds(page)).toBeCloseTo(time, 2);
      if ([73, 160, 176].includes(time))
        await expect(page.locator("[data-demo-stage]")).toHaveAttribute(
          "data-demo-stage",
          narrativeEventAt(time)!.id,
        );
      const heading = page.locator(".sx-pitch-scene h2, .sx-excursion-copy h2");
      await expect(heading).toBeInViewport();
      const titleBox = await heading.boundingBox();
      const navigationBox = await page
        .locator(".sx-excursion-nav")
        .boundingBox();
      expect(titleBox!.y).toBeGreaterThanOrEqual(
        navigationBox!.y + navigationBox!.height + 4,
      );
      const eyebrow = page.locator(
        ".sx-pitch-scene .sx-eyebrow, .sx-excursion-eyebrow",
      );
      if (await eyebrow.count()) {
        const box = await eyebrow.boundingBox();
        expect(box!.y).toBeGreaterThanOrEqual(
          navigationBox!.y + navigationBox!.height + 8,
        );
      }
      const panel = page.locator(".sx-pitch-content");
      if (viewport.width <= 760 && (await panel.count())) {
        const notice = page.locator(".sx-fallback-scene > p");
        if (await notice.count()) {
          await expect(notice).toBeInViewport({ ratio: 1 });
          const noticeBox = await notice.boundingBox();
          const panelBox = await panel.boundingBox();
          expect(noticeBox!.y).toBeGreaterThanOrEqual(
            panelBox!.y + panelBox!.height + 8,
          );
        }
      }
      const stage = page.locator(".sx-demo-copy h3, .sx-excursion-phase h3");
      if (await stage.count()) await expect(stage).toBeInViewport({ ratio: 1 });
      if ([73, 160, 300].includes(time))
        await page.screenshot({ path: info.outputPath(`jury-${time}s.png`) });
    }
  });
}
