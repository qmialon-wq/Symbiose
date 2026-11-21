import { expect, test, type Page } from "@playwright/test";
import { narrativeCues } from "../../src/experience/narrative-cues";
import { editorialFacts } from "../../src/experience/editorial-content";
import { openPublicLanding } from "./public-landing";

// Use the real range control, including the public prologue's separate scroll prefix.
const landmarks = [
  0, 12, 47, 52.5, 82.5, 112.5, 140, 167.5, 200, 230, 245, 285, 300, 315,
];
const normalized = (value: string) => value.replace(/\s+/g, " ").trim();
async function seek(page: Page, seconds: number) {
  const index =
    seconds === 300 ? 12 : narrativeCues.findIndex((cue) => seconds < cue.end);
  const cue = narrativeCues[index];
  const units =
    landmarks[index] +
    ((seconds - cue.start) / (cue.end - cue.start)) *
      (landmarks[index + 1] - landmarks[index]);
  await page
    .getByRole("slider", { name: "Position dans le récit", exact: true })
    .evaluate((input: HTMLInputElement, progress) => {
      input.step = "any";
      input.value = String(progress * 100);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, units / 315);
  await expect
    .poll(async () =>
      Number(await page.locator(".sx-experience").getAttribute("data-seconds")),
    )
    .toBeCloseTo(seconds, 2);
}
for (const fallback of [true, false]) {
  test(`les treize titres et les réserves restent cohérents dans les deux modes en ${fallback ? "2D" : "WebGL"}`, async ({
    page,
  }) => {
    test.setTimeout(150000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const mode of ["jury", "exploration"]) {
      if (mode === "jury")
        await page.goto(`/jury/${fallback ? "?render=2d" : ""}`);
      else {
        await openPublicLanding(page, fallback);
        await page
          .getByRole("button", { name: "Passer l’introduction", exact: true })
          .click();
      }
      await expect(page.locator(".sx-stage")).toHaveClass(/sx-stage--ready/, {
        timeout: 60000,
      });
      await expect(page.getByTestId("landing-loading")).toHaveCount(0);
      if (!fallback)
        await expect(page.locator(".sx-canvas canvas")).toHaveCount(1);
      for (const cue of narrativeCues) {
        await seek(page, cue.events[0].start + 0.5);
        const heading = page.locator(
          ".sx-pitch-scene h2, .sx-excursion-copy h2",
        );
        await expect
          .poll(async () => normalized(await heading.innerText()))
          .toBe(normalized(cue.title));
        const label = page.locator(
          ".sx-pitch-scene .sx-eyebrow, .sx-excursion-eyebrow",
        );
        if (await label.count()) {
          const box = await label.boundingBox();
          const navigation = await page
            .locator(".sx-excursion-nav")
            .boundingBox();
          expect(box!.y).toBeGreaterThanOrEqual(
            navigation!.y + navigation!.height + 8,
          );
        }
        if (mode === "exploration")
          await expect(page.locator(".sx-exploration-detail")).toContainText(
            /.{60}/,
          );
        if (cue.id === "wetland")
          await expect(page.locator(".sx-territory-limit")).toHaveText(
            editorialFacts.territory,
          );
      }
      for (const time of [270, 280, 289, 300]) {
        await seek(page, time);
        await expect(page.locator(".sx-pitch-scene h2")).toHaveText(
          narrativeCues.at(-1)!.title,
        );
      }
      await expect(
        page.getByRole("link", {
          name: editorialFacts.application,
          exact: true,
        }),
      ).toHaveAttribute("href", /connexion/);
      await page
        .getByRole("button", { name: "Le projet", exact: true })
        .click();
      await expect(page.locator(".sx-source-book")).toContainText(
        editorialFacts.classifier,
      );
      await page
        .getByRole("button", { name: "Pitch chronométré", exact: true })
        .click();
      await expect(page.locator(".sx-source-book")).toContainText(
        "Démarrer le pitch",
      );
      const titles = await page
        .locator(".sx-speaker-chapter h3")
        .allInnerTexts();
      expect(titles.map(normalized)).toEqual(
        narrativeCues.map((cue) => normalized(cue.title)),
      );
    }
    expect(errors).toEqual([]);
  });
}

test("la découverte conserve les six étapes et propose le même cas d’éclairage sous contrôle manuel", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPublicLanding(page);
  await page
    .getByRole("button", { name: "Passer l’introduction", exact: true })
    .click();
  await seek(page, 67);
  await expect(page.locator(".sx-living-pipeline li button")).toHaveCount(6);
  await page
    .getByRole("button", { name: "03 Reconnaissance", exact: true })
    .click();
  await expect(page.locator(".sx-living-pipeline")).toContainText(
    editorialFacts.classifier,
  );
  await seek(page, 135);
  await page.waitForTimeout(400);
  const labelBox = await page
    .locator(".sx-pitch-scene .sx-eyebrow")
    .boundingBox();
  const navigationBox = await page.locator(".sx-excursion-nav").boundingBox();
  expect(labelBox!.y).toBeGreaterThanOrEqual(
    navigationBox!.y + navigationBox!.height + 8,
  );
  for (const phase of narrativeCues.find((cue) => cue.id === "meadow")!
    .events) {
    await page.getByRole("button", { name: phase.label, exact: true }).click();
    await expect(page.locator("[data-demo-stage]")).toHaveAttribute(
      "data-demo-stage",
      phase.id,
    );
    await expect(page.locator(".sx-jury-demo")).toContainText(
      editorialFacts.lighting,
    );
    expect(
      Number(await page.locator(".sx-experience").getAttribute("data-seconds")),
    ).toBe(135);
  }
  await page.locator(".sx-design-catalogue summary").click();
  await expect(page.locator(".sx-design-catalogue section li")).toHaveCount(12);
  await expect(page.locator(".sx-design-catalogue")).toContainText(
    editorialFacts.alternatives,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
