import { expect, test } from "@playwright/test";

for (const fixture of [true, false]) {
  test(`le film WebGL ${fixture ? "de test" : "MP4 officiel"} reste animé avec les mouvements réduits et le rendu dort après la pause`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/**", (route) =>
      route.fulfill(
        new URL(route.request().url()).pathname.endsWith("/auth/me")
          ? { status: 401, json: { detail: "Connexion requise" } }
          : { json: { setup_required: false, registration_open: true } },
      ),
    );
    await page.goto("/jury/");
    await expect(page.locator(".sx-stage")).toHaveClass(/sx-stage--ready/, {
      timeout: 45000,
    });
    const canvas = page.locator(".sx-canvas");
    test.skip(
      (await canvas.count()) === 0,
      "La vérification du rendu vidéo WebGL nécessite un GPU matériel",
    );
    const root = page.locator(".sx-experience");
    await expect(root).toHaveAttribute("data-reduced-motion", "true");
    if (fixture)
      await page
        .getByLabel("Choisir une vidéo locale pour le prologue", {
          exact: true,
        })
        .setInputFiles("tests/fixtures/media-signal.webm");
    const video = page.locator(".sx-prologue-media");
    if (!fixture) {
      test.skip(
        (await video.count()) === 0,
        "Le MP4 officiel doit être installé localement",
      );
      test.skip(
        !(await video.getAttribute("src"))?.endsWith(".mp4"),
        "La configuration du prologue doit sélectionner un MP4",
      );
    }
    // Metadata preload deliberately does not require decoding a frame yet.
    await expect
      .poll(() =>
        video.evaluate((element: HTMLVideoElement) => element.readyState),
      )
      .toBeGreaterThanOrEqual(1);
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
    await expect(root).toHaveAttribute("data-prologue-video-focus", "true");
    await expect
      .poll(() =>
        video.evaluate((element: HTMLVideoElement) => element.readyState),
      )
      .toBeGreaterThanOrEqual(2);
    const renderCount = async () =>
      Number(await canvas.getAttribute("data-render-count"));
    const initial = await renderCount();
    await expect.poll(renderCount).toBeGreaterThan(initial + 3);
    await expect
      .poll(() =>
        video.evaluate((element: HTMLVideoElement) => element.currentTime),
      )
      .toBeGreaterThan(0);
    expect(
      await video.evaluate((element: HTMLVideoElement) => element.paused),
    ).toBe(false);

    await page
      .getByRole("button", { name: "Mettre la vidéo en pause", exact: true })
      .click();
    await expect(page.locator(".sx-prologue-overlay")).toHaveAttribute(
      "data-playing",
      "false",
    );
    // Let the pause event's final screen refresh settle, then observe idle work.
    await page.waitForTimeout(500);
    const paused = await renderCount();
    await page.waitForTimeout(500);
    expect(await renderCount()).toBeLessThanOrEqual(paused + 1);
    await page
      .getByRole("button", { name: "Passer l’introduction", exact: true })
      .click();
    await expect(root).toHaveAttribute("data-prologue-active", "false");
    expect(
      await video.evaluate((element: HTMLVideoElement) => element.paused),
    ).toBe(true);
  });
}
