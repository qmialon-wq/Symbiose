import { expect, test, type Page } from "@playwright/test";

// This API fixture exercises the integration contract without pretending to be
// a presentation film. A separate manual audit uses the real supplied video.
const youtubeAPI = String.raw`
(() => {
  const fixture = window.__youtubeFixture = { players: [], calls: [] };
  class Player {
    constructor(host, options) {
      this.options = options;
      this.iframe = document.createElement('iframe');
      this.iframe.src = 'https://www.youtube.com/embed/' + options.videoId + '?enablejsapi=1';
      this.iframe.width = options.width;
      this.iframe.height = options.height;
      (typeof host === 'string' ? document.getElementById(host) : host).replaceWith(this.iframe);
      fixture.players.push(this);
      queueMicrotask(() => options.events.onReady({ target: this }));
    }
    playVideo() { fixture.calls.push('play'); this.emit(1); }
    pauseVideo() { fixture.calls.push('pause'); this.emit(2); }
    getIframe() { return this.iframe; }
    destroy() { fixture.calls.push('destroy'); this.destroyed = true; this.iframe.remove(); }
    emit(state) { if (!this.destroyed) this.options.events.onStateChange({ target: this, data: state }); }
  }
  fixture.state = state => fixture.players.at(-1).emit(state);
  fixture.error = code => fixture.players.at(-1).options.events.onError({ target: fixture.players.at(-1), data: code });
  window.YT = { Player };
  window.onYouTubeIframeAPIReady?.();
})();`;

async function setup(page: Page, fallback = true) {
  const apiRequests: string[] = [];
  await page.route("https://www.youtube.com/iframe_api", (route) => {
    apiRequests.push(route.request().url());
    return route.fulfill({
      contentType: "application/javascript",
      body: youtubeAPI,
    });
  });
  await page.route("https://www.youtube.com/embed/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<html lang='fr'><body>Lecteur API de test</body></html>",
    }),
  );
  await page.goto(`/jury/${fallback ? "?render=2d" : ""}`);
  await expect(page.locator(".sx-stage")).toHaveClass(/sx-stage--ready/, {
    timeout: 45000,
  });
  return apiRequests;
}
const root = (page: Page) => page.locator(".sx-experience");
const fixtureState = (page: Page, state: number) =>
  page.evaluate(
    (value) => (window as any).__youtubeFixture.state(value),
    state,
  );

test("YouTube est chargé seulement après le choix du visiteur et suit les états du lecteur", async ({
  page,
}) => {
  const requests = await setup(page);
  expect(requests).toEqual([]);
  await expect(page.locator(".sx-youtube-screen iframe")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Découvrir Symbiose", exact: true })
    .click();
  await expect(root(page)).toHaveAttribute("data-prologue-video-focus", "true");
  await expect(page.locator(".sx-youtube-screen iframe")).toBeVisible();
  expect(requests).toHaveLength(1);
  const configuration = await page.evaluate(() => {
    const options = (window as any).__youtubeFixture.players[0].options;
    return {
      id: options.videoId,
      autoplay: options.playerVars.autoplay,
      origin: options.playerVars.origin,
    };
  });
  expect(configuration).toEqual({
    id: "J-cDr27eVC0",
    autoplay: 0,
    origin: new URL(page.url()).origin,
  });
  await fixtureState(page, 3);
  await expect(page.locator(".sx-prologue-overlay")).toHaveAttribute(
    "data-playing",
    "true",
  );
  await page.mouse.move(700, 500);
  await page.mouse.wheel(0, 1500);
  await expect(root(page)).toHaveAttribute("data-prologue", "0.000000");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await fixtureState(page, 1);
  await page.getByRole("button", { name: "Le projet", exact: false }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".sx-prologue-overlay")).toHaveAttribute(
    "data-playing",
    "false",
  );
  expect(
    await page.evaluate(() => (window as any).__youtubeFixture.calls),
  ).toContain("pause");
  await page
    .getByRole("button", { name: "Fermer le projet", exact: true })
    .click();
  await fixtureState(page, 2);
  await expect(page.locator(".sx-prologue-overlay")).toHaveAttribute(
    "data-playing",
    "false",
  );
  await fixtureState(page, 0);
  await expect(page.locator(".sx-prologue-overlay")).toHaveAttribute(
    "data-playing",
    "false",
  );
  await expect(
    page.getByRole("button", { name: "Entrer dans le vivant", exact: false }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Passer l’introduction", exact: true })
    .click();
  await expect(root(page)).toHaveAttribute("data-prologue-active", "false");
  await expect(page.locator(".sx-youtube-screen")).toHaveCount(0);
  await page
    .getByRole("button", { name: "0. Bureau d’études — Prologue", exact: true })
    .click();
  await expect(root(page)).toHaveAttribute(
    "data-prologue-video-focus",
    "false",
  );
  await expect(page.locator(".sx-youtube-screen")).toHaveCount(0);
});

test("le lecteur est projeté dans l’écran après l’approche et reste cadré en portrait", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const requests = await setup(page, false);
  test.skip(
    (await page.locator(".sx-canvas").count()) === 0,
    "Le contrôle du cadrage 3D nécessite un GPU matériel",
  );
  expect(requests).toEqual([]);
  await page
    .getByRole("button", {
      name: "Découvrir la vidéo sur l’écran",
      exact: true,
    })
    .click();
  await expect(root(page)).toHaveAttribute("data-prologue-video-focus", "true");
  const screen = page.locator(".sx-youtube-screen");
  await expect(screen.locator("iframe")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page
        .locator(".sx-prologue-screen-surface")
        .evaluate((element) => getComputedStyle(element).transform),
    )
    .toMatch(/^matrix3d\(/);
  await expect
    .poll(async () => {
      const box = await screen.boundingBox();
      return box ? box.x + box.width : Infinity;
    })
    .toBeLessThanOrEqual(391);
  const box = await screen.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.y).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(391);
  expect(box!.y + box!.height).toBeLessThanOrEqual(845);
  expect(box!.width).toBeGreaterThan(300);
  const state = await page
    .locator(".sx-canvas")
    .evaluate((element) => JSON.parse((element as HTMLElement).dataset.state!));
  expect(state.position[2]).toBeLessThan(44);
  await page
    .getByRole("button", { name: "Entrer dans le vivant", exact: false })
    .click();
  await expect(screen).toHaveCount(0);
  await expect(root(page)).toHaveAttribute("data-prologue-active", "false", {
    timeout: 20000,
  });
  await expect(root(page)).toHaveAttribute("data-progress", "0.000000");
});

test("une intégration YouTube refusée garde le passage et le lien vers la vidéo utilisables", async ({
  page,
}) => {
  await setup(page);
  await page
    .getByRole("button", { name: "Découvrir Symbiose", exact: true })
    .click();
  await expect(page.locator(".sx-youtube-screen iframe")).toBeVisible();
  await page.evaluate(() => (window as any).__youtubeFixture.error(101));
  await expect(
    page.getByText("Cette vidéo YouTube ne peut pas être lue ici", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /YouTube/ })).toHaveAttribute(
    "href",
    /youtube\.com\/embed\/J-cDr27eVC0/,
  );
  await expect(
    page.getByRole("button", { name: "Passer l’introduction", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Passer l’introduction", exact: true })
    .click();
  await expect(root(page)).toHaveAttribute("data-prologue-active", "false");
});

test("mettre la vidéo YouTube en pause rend le défilement au visiteur", async ({
  page,
}) => {
  await setup(page);
  await page
    .getByRole("button", { name: "Découvrir Symbiose", exact: true })
    .click();
  await expect(page.locator(".sx-youtube-screen iframe")).toBeVisible();
  await fixtureState(page, 1);
  await expect(page.locator(".sx-prologue-overlay")).toHaveAttribute(
    "data-playing",
    "true",
  );
  await fixtureState(page, 2);
  await expect(page.locator(".sx-prologue-overlay")).toHaveAttribute(
    "data-playing",
    "false",
  );
  await page.mouse.move(25, 420);
  await page.mouse.wheel(0, 200);
  await expect
    .poll(async () => Number(await root(page).getAttribute("data-prologue")))
    .toBeGreaterThan(0.01);
});
