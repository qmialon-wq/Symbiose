// @vitest-environment node
import { afterEach, expect, it } from "vitest";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { juryBuild } from "../../scripts/jury-build.mjs";

const directories: string[] = [];
afterEach(async () => {
  for (const directory of directories.splice(0)) {
    if (
      path.dirname(directory) !== path.resolve(tmpdir()) ||
      !path.basename(directory).startsWith("symbiose-jury-test-")
    )
      throw new Error("Unexpected temporary directory");
    await rm(directory, { recursive: true, force: true });
  }
});

async function build(
  media: Record<string, string>,
  env: Record<string, string> = {},
) {
  const root = await mkdtemp(path.join(tmpdir(), "symbiose-jury-test-"));
  directories.push(root);
  const files: Record<string, string> = {
    ".vite/manifest.json": JSON.stringify({
      "jury/index.html": { file: "assets/jury.js" },
    }),
    "experience-art/runtime-assets.json": JSON.stringify({
      poster: { url: "/poster.webp" },
      scenes: {},
    }),
    "experience-models/inventory.json": JSON.stringify({ assets: {} }),
    "jury/index.html": "<html></html>",
    "assets/jury.js": "// build fixture",
    "favicon.ico": "icon fixture",
    "experience-art/shared/symbiose-logo.png": "logo fixture",
    "poster.webp": "poster fixture",
    ...media,
  };
  await mkdir(path.join(root, "experience-media"), { recursive: true });
  for (const [file, contents] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), contents);
  }
  const plugin = juryBuild();
  plugin.configResolved({ root, build: { outDir: "." }, env });
  return {
    run: () => plugin.closeBundle(),
    manifest: async () =>
      JSON.parse(
        await readFile(path.join(root, "jury/offline-manifest.json"), "utf8"),
      ),
    worker: () => readFile(path.join(root, "jury/sw.js"), "utf8"),
  };
}

it("includes intro in the offline package without presenting it as the product demo", async () => {
  const output = await build({
    "experience-media/intro.mp4": "intro bytes fixture",
  });
  await output.run();
  const manifest = await output.manifest();
  expect(manifest.intro).toEqual({
    available: true,
    files: ["/experience-media/intro.mp4"],
  });
  expect(manifest.demo).toEqual({ available: false, files: [] });
  expect(manifest.files).toContainEqual(
    expect.objectContaining({
      url: "/experience-media/intro.mp4",
      bytes: 19,
    }),
  );
  expect(await output.worker()).toContain('"/experience-media/intro.mp4"');
});

it("packages configured intro and captions separately from the 90 second demo", async () => {
  const output = await build(
    {
      "experience-media/official.mp4": "intro bytes fixture",
      "experience-media/intro.fr.vtt": "WEBVTT\n",
      "experience-media/demo.mp4": "demo bytes fixture",
      "experience-media/demo.fr.vtt": "WEBVTT\n",
    },
    {
      VITE_SYMBIOSE_INTRO_VIDEO_URL: "/experience-media/official.mp4",
      VITE_SYMBIOSE_INTRO_CAPTIONS_URL: "/experience-media/intro.fr.vtt",
      VITE_SYMBIOSE_DEMO_URL: "/experience-media/demo.mp4",
      VITE_SYMBIOSE_DEMO_CAPTIONS_URL: "/experience-media/demo.fr.vtt",
    },
  );
  await output.run();
  const manifest = await output.manifest();
  expect(manifest.intro.files).toEqual(["/experience-media/official.mp4"]);
  expect(manifest.demo.files).toEqual(["/experience-media/demo.mp4"]);
  expect(manifest.files.map((file: { url: string }) => file.url)).toEqual(
    expect.arrayContaining([
      "/experience-media/intro.fr.vtt",
      "/experience-media/demo.fr.vtt",
    ]),
  );
});

it("does not cache an intro explicitly disabled in configuration", async () => {
  const output = await build(
    { "experience-media/intro.mp4": "unused bytes fixture" },
    {
      VITE_SYMBIOSE_INTRO_VIDEO_URL: "",
    },
  );
  await output.run();
  expect((await output.manifest()).intro.available).toBe(false);
  expect(await output.worker()).not.toContain('"/experience-media/intro.mp4"');
});

it("rejects a configured missing intro instead of shipping an incomplete offline package", async () => {
  const output = await build(
    {},
    {
      VITE_SYMBIOSE_INTRO_VIDEO_URL: "/experience-media/missing.mp4",
    },
  );
  await expect(output.run()).rejects.toThrow(/ENOENT/);
});
