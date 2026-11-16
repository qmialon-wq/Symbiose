import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Bone,
  Skeleton,
  SkinnedMesh,
  Uint16BufferAttribute,
  Float32BufferAttribute,
} from "three";
import { projectAnimalBox } from "../../src/experience/world-fauna";
import { mount } from "@vue/test-utils";
import {
  initialQuality,
  renderPixelRatio,
  readQualityPreference,
  qualityStorageKey,
} from "../../src/experience/render-quality";
import { textureBitmap } from "../../src/experience/texture-bitmap";
import { PerformanceMonitor } from "../../src/experience/PerformanceMonitor";
import { createNature } from "../../src/experience/world-nature";
import LandingLoading from "../../src/experience/LandingLoading.vue";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("landing quality selection", () => {
  it.each([
    { hardwareConcurrency: 4 },
    { deviceMemory: 4 },
    { mobile: true },
    { connection: { saveData: true } },
    { connection: { effectiveType: "2g" } },
    { connection: { effectiveType: "3g" } },
    { connection: { downlink: 1.2 } },
  ])(
    "starts with a real lightweight renderer for constrained hints: %j",
    (hints) => {
      expect(initialQuality("auto", hints)).toBe("eco");
      expect(initialQuality("standard", hints)).toBe("standard");
    },
  );
  it("keeps detailed rendering on capable devices and when hints are unavailable", () => {
    expect(
      initialQuality("auto", { hardwareConcurrency: 12, deviceMemory: 8 }),
    ).toBe("standard");
    expect(initialQuality("auto", {})).toBe("standard");
    expect(initialQuality("eco", {})).toBe("eco");
    expect(initialQuality("auto", { connection: { downlink: 0 } })).toBe(
      "standard",
    );
  });
  it("caps pixel work on high-density, large screens", () => {
    for (const [width, height, dpr] of [
      [390, 844, 3],
      [1440, 900, 2],
      [3840, 2160, 2],
    ]) {
      const eco = renderPixelRatio("eco", width, height, dpr);
      expect(eco).toBeLessThanOrEqual(0.8);
      expect(width * height * eco ** 2).toBeLessThanOrEqual(900_001);
      const detailed = renderPixelRatio("standard", width, height, dpr);
      expect(width * height * detailed ** 2).toBeLessThanOrEqual(2_600_001);
      expect(detailed).toBeGreaterThan(eco);
    }
  });
  it("remembers a choice and handles unavailable storage", () => {
    localStorage.setItem(qualityStorageKey, "eco");
    expect(readQualityPreference()).toBe("eco");
    localStorage.setItem(qualityStorageKey, "unknown");
    expect(readQualityPreference()).toBe("auto");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readQualityPreference()).toBe("auto");
  });
});

describe("landing resource budgets", () => {
  it("keeps skinned bounds aligned with the rendered model on its first scaled/rotated pose", () => {
    const geometry = new BoxGeometry(1, 1, 1);
    const count = geometry.attributes.position.count;
    geometry.setAttribute(
      "skinIndex",
      new Uint16BufferAttribute(new Uint16Array(count * 4), 4),
    );
    const weights = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) weights[i * 4] = 1;
    geometry.setAttribute("skinWeight", new Float32BufferAttribute(weights, 4));
    const skin = new SkinnedMesh(geometry, new MeshBasicMaterial());
    const bone = new Bone();
    skin.add(bone);
    skin.bind(new Skeleton([bone]));
    const root = new Group();
    root.add(skin);
    root.position.set(1.5, 0, -10);
    root.rotation.y = 0.7;
    root.scale.setScalar(1.8);
    const reference = new Mesh(geometry, new MeshBasicMaterial());
    reference.position.copy(root.position);
    reference.rotation.copy(root.rotation);
    reference.scale.copy(root.scale);
    const camera = new PerspectiveCamera(60, 16 / 9, 0.1, 100);
    camera.updateMatrixWorld(true);
    const actual = projectAnimalBox(root, camera)!;
    const expected = projectAnimalBox(reference, camera)!;
    for (const key of ["x", "y", "width", "height"] as const)
      expect(actual[key]).toBeCloseTo(expected[key], 10);
    geometry.dispose();
    skin.material.dispose();
    reference.material.dispose();
    skin.skeleton.dispose();
  });
  it("projects enclosing lightweight bounds without scanning every rigid mesh vertex again", () => {
    const mesh = new Mesh(
      new BoxGeometry(1, 0.6, 0.5),
      new MeshBasicMaterial(),
    );
    const camera = new PerspectiveCamera(60, 16 / 9, 0.1, 100);
    camera.updateMatrixWorld(true);
    mesh.position.set(1.5, 0, -10);
    mesh.rotation.y = 0.5;
    const readVertex = vi.spyOn(mesh, "getVertexPosition");
    const light = projectAnimalBox(mesh, camera, false)!;
    expect(readVertex).not.toHaveBeenCalled();
    const exact = projectAnimalBox(mesh, camera)!;
    expect(readVertex).toHaveBeenCalled();
    expect(light.x).toBeLessThanOrEqual(exact.x);
    expect(light.y).toBeLessThanOrEqual(exact.y);
    expect(light.x + light.width).toBeGreaterThanOrEqual(exact.x + exact.width);
    expect(light.y + light.height).toBeGreaterThanOrEqual(
      exact.y + exact.height,
    );
    mesh.position.x += 1;
    expect(projectAnimalBox(mesh, camera, false)!.x).toBeGreaterThan(light.x);
    mesh.geometry.dispose();
    mesh.material.dispose();
  });
  it("preserves map aspect ratio and closes the large decoded source", async () => {
    const close = vi.fn(),
      small = { width: 1024, height: 384 };
    const decode = vi
      .fn()
      .mockResolvedValueOnce({ width: 2048, height: 768, close })
      .mockResolvedValueOnce(small);
    vi.stubGlobal("createImageBitmap", decode);
    expect(await textureBitmap(new Blob(), 1024)).toBe(small);
    expect(decode.mock.calls[1][1]).toMatchObject({
      resizeWidth: 1024,
      resizeHeight: 384,
    });
    expect(close).toHaveBeenCalledOnce();
  });
  it("closes the original if resizing fails", async () => {
    const close = vi.fn();
    vi.stubGlobal(
      "createImageBitmap",
      vi
        .fn()
        .mockResolvedValueOnce({ width: 2048, height: 1024, close })
        .mockRejectedValueOnce(new Error("decode")),
    );
    await expect(textureBitmap(new Blob(), 512)).rejects.toThrow("decode");
    expect(close).toHaveBeenCalledOnce();
  });
  it("loads the real baked woodland and diffuse maps without downloading the detailed GLBs or extra PBR maps", async () => {
    const fetcher = vi.fn(
      async (url: string) =>
        new Response(
          url.endsWith(".json")
            ? JSON.stringify({ aspect: 0.65 })
            : new Uint8Array([1]),
        ),
    );
    vi.stubGlobal("fetch", fetcher);
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async (_source, options) => ({
        width: options?.resizeWidth ?? 512,
        height: options?.resizeHeight ?? 512,
        close: vi.fn(),
      })),
    );
    const abort = new AbortController(),
      issue = vi.fn();
    const nature = createNature(abort.signal, () => {}, issue, true);
    try {
      await nature.load(new Group(), new Group(), new Group());
      expect(issue).not.toHaveBeenCalled();
      const urls = fetcher.mock.calls.map(([url]) => url);
      expect(urls.some((url) => url.includes("tree-atlas.webp"))).toBe(true);
      expect(urls.some((url) => url.includes("forest_ground_04-Diffuse"))).toBe(
        true,
      );
      expect(urls.some((url) => /\.glb|nor_gl|Rough/.test(url))).toBe(false);
      expect(nature.pending).toBe(false);
    } finally {
      abort.abort();
      nature.dispose();
    }
  });
});

describe("genuinely slow motion", () => {
  it("detects sub-7 FPS movement instead of treating every slow frame as idle", () => {
    vi.spyOn(document, "hidden", "get").mockReturnValue(false);
    const downgrade = vi.fn(),
      rescue = vi.fn();
    const monitor = new PerformanceMonitor(
      () => {},
      downgrade,
      "standard",
      rescue,
    );
    for (let i = 1; i < 70; i++) monitor.frame(i * 200, true);
    expect(downgrade).toHaveBeenCalledOnce();
    expect(rescue).toHaveBeenCalledOnce();
  });
  it("does not downgrade on repeated static redraws or hidden-tab time", () => {
    const downgrade = vi.fn(),
      rescue = vi.fn();
    const monitor = new PerformanceMonitor(() => {}, downgrade, "eco", rescue);
    for (let i = 1; i < 70; i++) monitor.frame(i * 200, false);
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    for (let i = 1; i < 70; i++) monitor.frame(15000 + i * 200, true);
    expect(downgrade).not.toHaveBeenCalled();
    expect(rescue).not.toHaveBeenCalled();
  });
});

describe("deer loading feedback", () => {
  it("shows the reported preparation milestone without inventing timed progress and keeps a usable escape", async () => {
    const wrapper = mount(LandingLoading, {
      props: {
        state: { progress: 0.28, label: "Création du paysage…" },
        appHref: "/connexion",
      },
    });
    expect(wrapper.find("svg.login-deer").exists()).toBe(true);
    expect(
      wrapper.get('[role="progressbar"]').attributes("aria-valuenow"),
    ).toBe("28");
    expect(wrapper.get('[role="status"]').text()).toBe("Création du paysage…");
    await wrapper.setProps({
      state: { progress: 0.9, label: "Premier affichage…" },
    });
    expect(
      wrapper.get('[role="progressbar"]').attributes("aria-valuenow"),
    ).toBe("90");
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("lightweight")).toHaveLength(1);
    expect(wrapper.get("a").attributes("href")).toBe("/connexion");
    wrapper.unmount();
  });
});
