import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import FallbackScene from "../../src/experience/FallbackScene.vue";
import { chapterProgress } from "../../src/experience/pitch";

class PreparedImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = "";
  decode = vi.fn(async () => {});
  constructor() {
    images.push(this);
  }
}
let images: PreparedImage[], wrapper: VueWrapper;
beforeEach(() => {
  images = [];
  vi.useFakeTimers();
  vi.stubGlobal("Image", PreparedImage);
});
afterEach(() => {
  wrapper?.unmount();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
async function complete(id: string, error = false) {
  const image = images.find((item) => item.src.includes(`/${id}/`));
  expect(image, `requête de ${id}`).toBeDefined();
  (error ? image!.onerror : image!.onload)?.();
  await flushPromises();
}
function setup(progress = 0) {
  wrapper = mount(FallbackScene, { props: { progress, reducedMotion: false } });
}

it("publie l’image courante sans attendre la suivante et attend son décodage avant de fondre", async () => {
  setup();
  await complete("forest");
  expect(wrapper.emitted("ready")).toHaveLength(1);
  expect(wrapper.attributes("data-chapter")).toBe("forest");
  expect(wrapper.attributes("data-next")).toBe("forest");
  await wrapper.setProps({ progress: chapterProgress(1) * 0.94 });
  expect(wrapper.attributes("data-blend")).toBe("0.000000");
  let decode!: () => void;
  images
    .find((item) => item.src.includes("/sky/"))!
    .decode.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          decode = resolve;
        }),
    );
  await complete("sky");
  expect(wrapper.attributes("data-next")).toBe("forest");
  decode();
  await flushPromises();
  expect(wrapper.attributes("data-next")).toBe("sky");
  expect(wrapper.attributes("data-blend")).toBe("0.500000");
  expect(wrapper.findAll("img")[1].attributes("style")).not.toContain("clip");
});

it("ignore les réponses tardives après des sauts rapides et garde une image complète en attente", async () => {
  setup();
  await complete("forest");
  await wrapper.setProps({ progress: chapterProgress(1) });
  await wrapper.setProps({ progress: chapterProgress(7) });
  expect(wrapper.attributes("data-chapter")).toBe("forest");
  expect(wrapper.attributes("data-blend")).toBe("0.000000");
  await complete("night-forest");
  expect(wrapper.attributes("data-chapter")).toBe("night-forest");
  await complete("sky");
  expect(wrapper.attributes("data-chapter")).toBe("night-forest");
  expect(wrapper.findAll("img")[0].attributes("src")).toContain(
    "/night-forest/",
  );
});

it("conserve le dernier paysage valide et le message d’erreur si la destination échoue", async () => {
  setup();
  await complete("forest");
  await complete("sky");
  await wrapper.setProps({ progress: chapterProgress(6) });
  await complete("coast", true);
  expect(wrapper.attributes("data-chapter")).toBe("forest");
  expect(wrapper.attributes("data-blend")).toBe("0.000000");
  expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  await wrapper.setProps({ progress: chapterProgress(1) });
  await flushPromises();
  expect(wrapper.attributes("data-chapter")).toBe("sky");
  await wrapper.setProps({ progress: chapterProgress(6) });
  const retry = images.filter((item) => item.src.includes("/coast/")).at(-1)!;
  retry.onload?.();
  await flushPromises();
  expect(wrapper.attributes("data-chapter")).toBe("coast");
});

it("retire les fondus immédiatement lorsque les mouvements réduits sont activés", async () => {
  setup();
  await complete("forest");
  await complete("sky");
  await wrapper.setProps({ progress: chapterProgress(1) * 0.94 });
  expect(wrapper.attributes("data-blend")).toBe("0.500000");
  await wrapper.setProps({ reducedMotion: true });
  expect(wrapper.attributes("data-blend")).toBe("0.000000");
});
