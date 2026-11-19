import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function open(page: Page) {
  await page.goto("/jury/?render=2d");
  await expect(page.locator(".sx-stage")).toHaveClass(/sx-stage--ready/, {
    timeout: 45000,
  });
  await expect(page.getByTestId("landing-loading")).toHaveCount(0);
  await page
    .locator(".sx-prologue-poster")
    .evaluate((image: HTMLImageElement) => image.decode());
}

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 1600, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`prologue photographique 2D et référence 01 à ${viewport.width} × ${viewport.height}`, async ({
    page,
  }, info) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page);
    await expect(page.locator(".sx-canvas")).toHaveCount(0);
    const poster = page.locator(".sx-prologue-poster");
    expect(
      await poster.evaluate((image: HTMLImageElement) => [
        image.naturalWidth,
        image.naturalHeight,
      ]),
    ).toEqual([2560, 1440]);
    await expect(poster).toHaveCSS("object-fit", "cover");
    const bounds = await poster.boundingBox();
    expect(bounds).toMatchObject({
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height,
    });
    const title = page.getByRole("heading", {
      name: "Du bureau au vivant.",
      exact: true,
    });
    await expect(title).toBeInViewport();
    const compactPlayer =
      viewport.width <= 760 &&
      (await page.locator(".sx-prologue-media").count()) > 0;
    if (compactPlayer) {
      // The existing mobile composition reserves this space for the local player.
      await expect(page.locator(".sx-prologue-intro")).toBeHidden();
      await expect(page.locator(".sx-prologue-media")).toBeInViewport();
    } else {
      await expect(page.locator(".sx-prologue-intro")).toBeInViewport();
    }
    await expect(page.locator(".sx-prologue-copy .sx-eyebrow")).toHaveText(
      "00 / BUREAU D’ÉTUDES LE PROLOGUE",
    );
    for (const action of [
      "Découvrir Symbiose",
      "Entrer dans le vivant",
      "Passer l’introduction",
    ])
      await expect(
        page.getByRole("button", { name: action, exact: false }),
      ).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .include(".sx-prologue-copy")
          .withTags(["wcag2a", "wcag2aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    const typography = await title.evaluate((el) => {
      const style = getComputedStyle(el);
      return [
        style.fontFamily,
        style.fontSize,
        style.color,
        style.letterSpacing,
      ];
    });
    await page.screenshot({
      path: info.outputPath(
        `00-prologue-${viewport.width}x${viewport.height}.png`,
      ),
    });
    await page
      .getByRole("button", { name: "Passer l’introduction", exact: true })
      .click();
    await expect(page.locator(".sx-pitch-content")).toHaveAttribute(
      "data-chapter",
      "forest",
    );
    await page
      .locator(".sx-fallback-scene img")
      .first()
      .evaluate((image: HTMLImageElement) => image.decode());
    const reference = page.locator(".sx-pitch-scene h2");
    const referenceTypography = await reference.evaluate((el) => {
      const style = getComputedStyle(el);
      return [
        style.fontFamily,
        style.fontSize,
        style.color,
        style.letterSpacing,
      ];
    });
    if (compactPlayer) {
      expect(typography[1]).toBe("32px");
      expect([referenceTypography[0], referenceTypography[2]]).toEqual([
        typography[0],
        typography[2],
      ]);
      // Letter spacing uses em and scales with the compact mobile title.
      expect(
        parseFloat(referenceTypography[3]) / parseFloat(referenceTypography[1]),
      ).toBeCloseTo(parseFloat(typography[3]) / parseFloat(typography[1]), 3);
      expect(parseFloat(referenceTypography[1])).toBeGreaterThanOrEqual(35);
    } else {
      expect(referenceTypography).toEqual(typography);
    }
    await page.screenshot({
      path: info.outputPath(
        `01-probleme-${viewport.width}x${viewport.height}.png`,
      ),
    });
  });
}

test("le fondu 00 → 01 révèle le paysage préchargé et reste réversible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await open(page);
  await page
    .getByRole("button", { name: "Mode présentation", exact: false })
    .click();
  await expect(
    page.getByRole("button", { name: "Mode exploration", exact: false }),
  ).toBeVisible();
  const forest = page.locator(".sx-prologue-forest");
  await forest.evaluate((image: HTMLImageElement) => image.decode());
  const forestUrl = await forest.getAttribute("src");
  await page.mouse.move(5, 420);
  await page.mouse.wheel(0, 900 * 3 * 0.95);
  await expect
    .poll(async () =>
      Number(
        await page.locator(".sx-experience").getAttribute("data-prologue"),
      ),
    )
    .toBeCloseTo(0.95, 4);
  await expect
    .poll(() =>
      page
        .locator(".sx-prologue-photograph")
        .evaluate((el) => Number(getComputedStyle(el).opacity)),
    )
    .toBeCloseTo(0.5, 3);
  await expect(forest).toBeVisible();
  // Un pixel supplémentaire franchit la frontière malgré l’arrondi du scroll natif.
  await page.mouse.wheel(0, 900 * 3 * 0.05 + 1);
  await expect(page.locator(".sx-experience")).toHaveAttribute(
    "data-prologue-active",
    "false",
  );
  await expect(page.locator(".sx-fallback-scene img").first()).toHaveAttribute(
    "src",
    forestUrl!,
  );
  await page
    .getByRole("button", { name: "0. Bureau d’études — Prologue", exact: true })
    .click();
  await expect(page.locator(".sx-prologue-poster")).toBeVisible();
  await expect(page.locator(".sx-prologue-photograph")).toHaveCSS(
    "opacity",
    "1",
  );
});
