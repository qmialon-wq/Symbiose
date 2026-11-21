import { expect, test, type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { openPublicLanding } from "./public-landing";

async function open(page: Page, fixture = true, fallback = true) {
  // Test signal only: this does not replace the supplied official MP4.
  if (fixture) {
    const media = readFileSync("tests/fixtures/media-signal.webm");
    await page.route("**/experience-media/intro.mp4", (route) => {
      const range = route
        .request()
        .headers()
        .range?.match(/^bytes=(\d+)-(\d*)$/);
      const start = Number(range?.[1] ?? 0);
      const end = Math.min(
        Number(range?.[2] || media.length - 1),
        media.length - 1,
      );
      return route.fulfill({
        status: range ? 206 : 200,
        contentType: "video/webm",
        headers: {
          "Accept-Ranges": "bytes",
          ...(range
            ? { "Content-Range": `bytes ${start}-${end}/${media.length}` }
            : {}),
        },
        body: media.subarray(start, end + 1),
      });
    });
  }
  await openPublicLanding(page, fallback);
}
const root = (page: Page) => page.locator(".sx-experience");
const chapter = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });

test("le paquet jury conserve le MP4 en cache sans monter le prologue", async ({
  page,
  context,
}) => {
  test.skip(
    !process.env.E2E_PRODUCTION,
    "Nécessite le service worker du build de production",
  );
  test.setTimeout(90000);
  await page.goto("/jury/?render=2d");
  await expect(page.locator(".sx-stage")).toHaveClass(/sx-stage--ready/, {
    timeout: 45000,
  });
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
  await expect(
    page.getByRole("heading", { name: /Une forêt ordinaire/ }),
  ).toBeVisible();
  await expect(root(page)).toHaveAttribute("data-prologue-active", "false");
  await expect(root(page)).toHaveAttribute("data-progress", "0.000000");
  await expect(page.locator(".sx-prologue-overlay")).toHaveCount(0);
  await expect(page.locator("video, .sx-youtube-screen iframe")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Démarrer le pitch", exact: true }),
  ).toBeVisible();
  const range = await page.evaluate(async () => {
    const response = await fetch("/experience-media/intro.mp4", {
      headers: { Range: "bytes=0-31" },
    });
    return {
      controlled: !!navigator.serviceWorker.controller,
      status: response.status,
      bytes: (await response.arrayBuffer()).byteLength,
      contentRange: response.headers.get("Content-Range"),
    };
  });
  expect(range.controlled).toBe(true);
  expect(range.status).toBe(206);
  expect(range.bytes).toBe(32);
  expect(range.contentRange).toMatch(/^bytes 0-31\/\d+$/);
});

test("le bureau ouvre le récit, peut être passé et reste accessible depuis 00", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await open(page);
  await expect(
    page.getByRole("heading", { name: "Du bureau au vivant." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Découvrir Symbiose", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Vidéo provisoire", { exact: false }),
  ).toHaveCount(0);
  await expect(page.locator(".sx-prologue-poster")).toBeVisible();
  await expect(page.locator(".sx-prologue-media")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Passer l’introduction", exact: true })
    .click();
  await expect(root(page)).toHaveAttribute("data-prologue-active", "false");
  await expect(root(page)).toHaveAttribute("data-progress", "0.000000");
  await expect(page.locator(".sx-pitch-content")).toHaveAttribute(
    "data-chapter",
    "forest",
  );
  await chapter(page, "0. Bureau d’études — Prologue").click();
  await expect(root(page)).toHaveAttribute("data-prologue", "0.000000");
  await expect(root(page)).toHaveAttribute("data-prologue-active", "true");
  await expect(chapter(page, "0. Bureau d’études — Prologue")).toHaveAttribute(
    "aria-current",
    "step",
  );
  expect(errors).toEqual([]);
});

test("le MP4 principal reste manuel et conserve volume, progression et retour au récit en 2D", async ({
  page,
}) => {
  const youtubeRequests: string[] = [];
  page.on("request", (request) => {
    if (/youtube\.com|youtu\.be/.test(request.url()))
      youtubeRequests.push(request.url());
  });
  await open(page);
  const video = page.locator(".sx-prologue-media");
  await expect(video).toHaveAttribute("src", "/experience-media/intro.mp4");
  await expect(video).toHaveAttribute("preload", "metadata");
  expect(await video.getAttribute("autoplay")).toBeNull();
  await expect
    .poll(() =>
      video.evaluate((element: HTMLVideoElement) => element.readyState),
    )
    .toBeGreaterThanOrEqual(1);
  expect(
    await video.evaluate((element: HTMLVideoElement) => element.paused),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Couper le son de la vidéo", exact: true })
    .click();
  expect(
    await video.evaluate((element: HTMLVideoElement) => element.muted),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Activer le son de la vidéo", exact: true })
    .click();
  await page
    .getByRole("slider", { name: "Volume de la vidéo", exact: true })
    .fill("0.35");
  expect(
    await video.evaluate((element: HTMLVideoElement) => element.volume),
  ).toBeCloseTo(0.35);
  await video.evaluate((element: HTMLVideoElement) => {
    element.loop = true;
  });
  await page
    .getByRole("button", { name: "Découvrir Symbiose", exact: true })
    .click();
  await expect(page.locator(".sx-prologue-overlay")).toHaveAttribute(
    "data-playing",
    "true",
  );
  await expect
    .poll(() =>
      video.evaluate((element: HTMLVideoElement) => element.currentTime),
    )
    .toBeGreaterThan(0.05);
  await expect
    .poll(() =>
      video.evaluate((element: HTMLVideoElement) =>
        element.seekable.length ? element.seekable.end(0) : 0,
      ),
    )
    .toBeGreaterThan(0.2);
  await page
    .getByRole("button", { name: "Mettre la vidéo en pause", exact: true })
    .click();
  expect(
    await video.evaluate((element: HTMLVideoElement) => element.paused),
  ).toBe(true);
  await page
    .getByRole("slider", {
      name: "Position dans la vidéo de présentation",
      exact: true,
    })
    .fill("0.2");
  await expect
    .poll(() =>
      video.evaluate((element: HTMLVideoElement) => element.currentTime),
    )
    .toBeCloseTo(0.2, 1);
  await page
    .getByRole("button", { name: "Découvrir Symbiose", exact: true })
    .click();
  await expect(page.locator(".sx-prologue-overlay")).toHaveAttribute(
    "data-playing",
    "true",
  );
  await page
    .getByRole("button", { name: "Mettre la vidéo en pause", exact: true })
    .click();
  expect(
    await video.evaluate((element: HTMLVideoElement) => element.paused),
  ).toBe(true);
  expect(youtubeRequests).toEqual([]);
  await page
    .getByRole("button", { name: "Passer l’introduction", exact: true })
    .click();
  await expect(root(page)).toHaveAttribute("data-prologue-active", "false");
  expect(
    await video.evaluate((element: HTMLVideoElement) => element.paused),
  ).toBe(true);
  await expect(page.locator(".sx-pitch-content")).toHaveAttribute(
    "data-chapter",
    "forest",
  );
});

test("le vrai MP4 officiel installé est décodable sans lecture automatique", async ({
  page,
}) => {
  test.skip(
    !existsSync("public/experience-media/intro.mp4"),
    "Le MP4 officiel doit être installé hors Git pour cette vérification réelle",
  );
  await open(page, false);
  const video = page.locator(".sx-prologue-media");
  await expect(video).toHaveAttribute("src", "/experience-media/intro.mp4");
  await expect
    .poll(() =>
      video.evaluate((element: HTMLVideoElement) => element.readyState),
    )
    .toBeGreaterThanOrEqual(1);
  expect(
    await video.evaluate((element: HTMLVideoElement) => element.duration),
  ).toBeGreaterThan(0);
  expect(
    await video.evaluate((element: HTMLVideoElement) => element.paused),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Découvrir Symbiose", exact: true })
    .click();
  await expect(page.locator(".sx-prologue-overlay")).toHaveAttribute(
    "data-playing",
    "true",
  );
  await expect
    .poll(() =>
      video.evaluate((element: HTMLVideoElement) => element.currentTime),
    )
    .toBeGreaterThan(0);
  await page
    .getByRole("button", { name: "Mettre la vidéo en pause", exact: true })
    .click();
  expect(
    await video.evaluate((element: HTMLVideoElement) => element.paused),
  ).toBe(true);
});

test("le travelling public rejoint la forêt arrêtée et le scroll natif permet de revenir au bureau", async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole("button", { name: "Entrer dans le vivant", exact: false })
    .click();
  await expect
    .poll(async () => Number(await root(page).getAttribute("data-prologue")))
    .toBeGreaterThan(0.1);
  await expect(root(page)).toHaveAttribute("data-prologue-active", "false", {
    timeout: 20000,
  });
  await expect(page.locator(".sx-pitch-content")).toHaveAttribute(
    "data-chapter",
    "forest",
  );
  await expect(root(page)).toHaveAttribute("data-mode", "exploration");
  await page.waitForTimeout(400);
  await expect(root(page)).toHaveAttribute("data-progress", "0.000000");
  await page.mouse.move(700, 500);
  await page.mouse.wheel(0, -600);
  await expect(root(page)).toHaveAttribute("data-prologue-active", "true");
  await expect
    .poll(async () => Number(await root(page).getAttribute("data-prologue")))
    .toBeLessThan(0.95);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect
    .poll(async () => Number(await root(page).getAttribute("data-prologue")))
    .toBeLessThan(0.001);
  await expect(
    page.getByRole("button", { name: "Entrer dans le vivant", exact: false }),
  ).toBeVisible();
});

test("les mouvements réduits rejoignent immédiatement les huit chapitres préservés et le lien final", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  await page
    .getByRole("button", { name: "Entrer dans le vivant", exact: false })
    .click();
  await expect(root(page)).toHaveAttribute("data-prologue-active", "false");
  await expect(root(page)).toHaveAttribute("data-progress", "0.000000");
  const chapters = [
    ["1. Forêt", "forest"],
    ["2. Ciel et nuages", "sky"],
    ["3. Rivières", "rivers"],
    ["4. Monde sous-marin", "underwater"],
    ["5. Zone humide", "wetland"],
    ["6. Prairie et bocage", "meadow"],
    ["7. Littoral — Étretat", "coast"],
    ["8. Forêt nocturne", "night-forest"],
  ];
  for (const [name, id] of chapters) {
    await chapter(page, name).click();
    await expect(page.locator(".sx-pitch-content")).toHaveAttribute(
      "data-chapter",
      id,
    );
    await expect(chapter(page, name)).toHaveAttribute("aria-current", "step");
  }
  await page
    .getByRole("slider", { name: "Position dans le récit", exact: true })
    .fill("100");
  await expect(root(page)).toHaveAttribute("data-progress", "1.000000");
  const applicationHref = await page
    .locator(".sx-app-link")
    .getAttribute("href");
  expect(applicationHref).toBeTruthy();
  await expect(
    page.getByRole("link", {
      name: "Commencer l’expérience Symbiose",
      exact: true,
    }),
  ).toHaveAttribute("href", applicationHref!);
  await page
    .getByRole("button", { name: "Mode exploration", exact: false })
    .click();
  await chapter(page, "0. Bureau d’études — Prologue").click();
  await root(page).focus();
  await page.keyboard.press("ArrowRight");
  await expect(root(page)).toHaveAttribute("data-prologue-active", "false");
  await page.keyboard.press("ArrowLeft");
  await expect(root(page)).toHaveAttribute("data-prologue-active", "true");
  await expect(
    page.getByRole("link", { name: "Accéder à l’application", exact: false }),
  ).toHaveAttribute("href", applicationHref!);
  await page.route("**/connexion", (route) =>
    route.fulfill({ contentType: "text/html", body: "<h1>Connexion</h1>" }),
  );
  await page
    .getByRole("link", { name: "Accéder à l’application", exact: false })
    .click();
  await expect(page).toHaveURL(/\/connexion$/);
});

test("le fichier de test est lu manuellement, verrouille le scroll, se met en pause et libère la suite à sa fin", async ({
  page,
}) => {
  await open(page);
  await page.locator(".sx-prologue-file summary").click();
  await page
    .getByLabel("Choisir une vidéo locale pour le prologue", { exact: true })
    .setInputFiles("tests/fixtures/media-signal.webm");
  const video = page.locator(".sx-prologue-media");
  await expect(video).toBeVisible();
  await expect
    .poll(() =>
      video.evaluate((element: HTMLVideoElement) => element.readyState),
    )
    .toBeGreaterThanOrEqual(1);
  expect(
    await video.evaluate((element: HTMLVideoElement) => element.paused),
  ).toBe(true);
  expect(await video.getAttribute("autoplay")).toBeNull();
  await video.evaluate((element: HTMLVideoElement) => {
    element.loop = true;
  });
  await page
    .getByRole("button", { name: "Découvrir Symbiose", exact: true })
    .click();
  await expect(page.locator(".sx-prologue-overlay")).toHaveAttribute(
    "data-playing",
    "true",
  );
  await page.mouse.move(700, 500);
  await page.mouse.wheel(0, 1600);
  await expect(root(page)).toHaveAttribute("data-prologue", "0.000000");
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page
    .getByRole("button", { name: "Mettre la vidéo en pause", exact: true })
    .click();
  await expect(page.locator(".sx-prologue-overlay")).toHaveAttribute(
    "data-playing",
    "false",
  );
  expect(
    await video.evaluate((element: HTMLVideoElement) => element.paused),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Découvrir Symbiose", exact: true })
    .click();
  await page.getByRole("button", { name: "Le projet", exact: false }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".sx-prologue-overlay")).toHaveAttribute(
    "data-playing",
    "false",
  );
  await page
    .getByRole("button", { name: "Fermer le projet", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Découvrir Symbiose", exact: true })
    .click();
  await video.evaluate((element: HTMLVideoElement) => {
    element.loop = false;
    element.currentTime = Math.max(0, element.duration - 0.02);
  });
  await expect(page.locator(".sx-prologue-ended")).toBeVisible();
  await expect(page.locator(".sx-prologue-overlay")).toHaveAttribute(
    "data-playing",
    "false",
  );
  await page
    .getByRole("button", { name: "Passer l’introduction", exact: true })
    .click();
  await expect(root(page)).toHaveAttribute("data-prologue-active", "false");
  await expect(root(page)).toHaveAttribute("data-progress", "0.000000");
});
