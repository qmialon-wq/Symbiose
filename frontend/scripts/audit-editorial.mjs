import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import ts from "typescript";

// Read-only DOM inventory. Run against an explicitly chosen serving version,
// before or after an edit; collapsed panels and every manual choice are visited.
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
};
const destination = option("--output");
if (!destination) throw new Error("Provide --output <path-to-json>");
const baseURL = option("--base-url", "http://127.0.0.1:8080");
const compiled = ts.transpileModule(
  readFileSync(
    new URL("../src/experience/narrative-cues.ts", import.meta.url),
    "utf8",
  ),
  { compilerOptions: { module: ts.ModuleKind.ES2022 } },
).outputText;
const { narrativeCues } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);
const routeSource = readFileSync(
  new URL("../src/experience/excursions/route.ts", import.meta.url),
  "utf8",
);
const landmarks = JSON.parse(
  routeSource
    .match(/narrativeRouteLandmarks = (\[[\s\S]*?\])/)[1]
    .replace(/,\s*]/, "]"),
);
const browser = await chromium.launch(
  process.platform === "win32"
    ? { args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"] }
    : {},
);
const inventory = {
  baseURL,
  scenes: [],
  notebooks: [],
  prologues: [],
  errors: [],
};
const clean = (value) => value.replace(/\s+/g, " ").trim();
try {
  for (const render of ["2d", "webgl"]) {
    for (const mode of ["jury", "exploration"]) {
      const context = await browser.newContext({
        viewport: { width: 1600, height: 1000 },
      });
      const page = await context.newPage();
      page.on("pageerror", (error) =>
        inventory.errors.push({ render, mode, message: error.message }),
      );
      await page.route("**/api/**", (route) =>
        route.fulfill(
          new URL(route.request().url()).pathname.endsWith("/auth/me")
            ? { status: 401, json: { detail: "Connexion requise" } }
            : { json: { setup_required: false, registration_open: true } },
        ),
      );
      await page.goto(
        `${baseURL}/${mode === "jury" ? "jury/" : ""}${render === "2d" ? "?render=2d" : ""}`,
      );
      await page.locator(".sx-stage--ready").waitFor({ timeout: 60000 });
      await page
        .getByTestId("landing-loading")
        .waitFor({ state: "detached", timeout: 60000 });
      if (mode === "exploration") {
        inventory.prologues.push({
          render,
          text: clean(await page.locator(".sx-prologue-overlay").innerText()),
        });
        await page
          .getByRole("button", { name: "Passer l’introduction", exact: true })
          .click();
      }
      const actualRender = (await page.locator(".sx-canvas canvas").count())
        ? "webgl"
        : "2d";
      for (const [index, cue] of narrativeCues.entries()) {
        const samples =
          mode === "jury"
            ? [
                ...new Set([
                  cue.start + 0.25,
                  ...cue.events.map((event) => event.start + 0.25),
                  ...(cue.end === 300 ? [300] : []),
                ]),
              ]
            : [cue.start + 0.25, ...(cue.end === 300 ? [300] : [])];
        for (const seconds of samples) {
          const units =
            landmarks[index] +
            ((seconds - cue.start) / (cue.end - cue.start)) *
              (landmarks[index + 1] - landmarks[index]);
          await page
            .getByRole("slider", {
              name: "Position dans le récit",
              exact: true,
            })
            .evaluate((input, progress) => {
              input.step = "any";
              input.value = String(progress * 100);
              input.dispatchEvent(new Event("input", { bubbles: true }));
            }, units / 315);
          await page.waitForFunction(
            (target) =>
              Math.abs(
                Number(
                  document.querySelector(".sx-experience").dataset.seconds,
                ) - target,
              ) < 0.001,
            seconds,
          );
          await page.waitForTimeout(60);
          const panel = page.locator(".sx-pitch-scene, .sx-excursion-copy");
          const record = {
            render,
            actualRender,
            mode,
            cue: cue.id,
            seconds,
            title: (await panel.locator("h2").count())
              ? clean(await panel.locator("h2").innerText())
              : null,
            text: (await panel.count()) ? clean(await panel.innerText()) : "",
            panels: [],
            renderNotes: await page
              .locator(
                ".sx-fauna-note, .sx-fallback-scene > p, .sx-excursion-fallback-label",
              )
              .allTextContents(),
          };
          if (await panel.count()) {
            await panel
              .locator("details")
              .evaluateAll((details) =>
                details.forEach((detail) => (detail.open = true)),
              );
            record.expanded = clean(await panel.innerText());
            for (const selector of [
              ".sx-living-pipeline li button",
              ".sx-case-steps button",
              ".sx-place-choice button",
            ]) {
              const buttons = panel.locator(selector);
              for (let choice = 0; choice < (await buttons.count()); choice++) {
                const button = buttons.nth(choice);
                const label = clean(await button.innerText());
                await button.click();
                record.panels.push({
                  label,
                  text: clean(await panel.innerText()),
                });
              }
            }
          }
          inventory.scenes.push(record);
        }
      }
      await page
        .getByRole("button", { name: "Le projet", exact: true })
        .click();
      for (const tab of [
        "Sources et technique",
        "Pitch chronométré",
        "Attendus du jury",
      ]) {
        await page.getByRole("button", { name: tab, exact: true }).click();
        await page
          .locator(".sx-source-book details")
          .evaluateAll((details) =>
            details.forEach((detail) => (detail.open = true)),
          );
        // Archive bodies remain verbatim in their source files. Record their
        // provenance separately so historic wording is not confused with UI copy.
        const record = await page
          .locator(".sx-source-book")
          .evaluate((book) => {
            const clone = book.cloneNode(true);
            clone
              .querySelectorAll(".sx-source-original")
              .forEach((node) => node.remove());
            return {
              text: clone.textContent.replace(/\s+/g, " ").trim(),
              archives: [
                ...book.querySelectorAll(".sx-source-original pre"),
              ].map((node) => ({
                words: node.textContent.trim().split(/\s+/).length,
                speciesNet: /SpeciesNet/i.test(node.textContent),
              })),
            };
          });
        inventory.notebooks.push({ render, mode, tab, ...record });
      }
      await context.close();
      console.log(`${mode} / ${render}: DOM and interactive panels captured`);
    }
  }
} finally {
  await browser.close();
  const path = resolve(destination);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(inventory, null, 2)}\n`);
  console.log(
    `${inventory.scenes.length} scene states, ${inventory.notebooks.length} notebook tabs -> ${path}`,
  );
}
