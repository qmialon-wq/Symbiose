import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import PrologueOverlay from "../../src/experience/prologue/PrologueOverlay.vue";

const wrappers: VueWrapper[] = [];
let play: ReturnType<typeof vi.spyOn>;
let pause: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  const paused = new WeakMap<HTMLMediaElement, boolean>();
  vi.spyOn(HTMLMediaElement.prototype, "paused", "get").mockImplementation(
    function () {
      return paused.get(this) ?? true;
    },
  );
  play = vi
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockImplementation(function () {
      paused.set(this, false);
      this.dispatchEvent(new Event("play"));
      return Promise.resolve();
    });
  pause = vi
    .spyOn(HTMLMediaElement.prototype, "pause")
    .mockImplementation(function () {
      paused.set(this, true);
      this.dispatchEvent(new Event("pause"));
    });
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:local-prologue-test");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
});
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  vi.restoreAllMocks();
});
function setup() {
  const wrapper = mount(PrologueOverlay, {
    props: { local: 0, active: true, reducedMotion: false, suspended: false },
  });
  wrappers.push(wrapper);
  return wrapper;
}
async function file(
  wrapper: VueWrapper,
  name = "symbiose.webm",
  type = "video/webm",
) {
  const input = wrapper.get('input[type="file"]');
  Object.defineProperty(input.element, "files", {
    value: [new File(["test media"], name, { type })],
    configurable: true,
  });
  await input.trigger("change");
  await flushPromises();
}

it("présente le film YouTube provisoire sans charger le lecteur avant l’approche", async () => {
  const wrapper = setup();
  expect(wrapper.text()).toContain(
    "Vidéo provisoire · YouTube · lecture manuelle",
  );
  expect(wrapper.find("video").exists()).toBe(false);
  expect(play).not.toHaveBeenCalled();
  expect(wrapper.find("iframe").exists()).toBe(false);
  await wrapper.get('[aria-label="Découvrir Symbiose"]').trigger("click");
  expect(wrapper.emitted("focus")).toHaveLength(1);
  expect(wrapper.find("iframe").exists()).toBe(false);
  await wrapper.get(".sx-prologue-skip").trigger("click");
  expect(wrapper.emitted("skip")).toHaveLength(1);
});

it("ouvre un fichier local sans téléversement puis lit, met en pause et signale la fin", async () => {
  const wrapper = setup();
  await file(wrapper);
  const element = wrapper.get("video").element as HTMLVideoElement;
  expect(element.hasAttribute("autoplay")).toBe(false);
  expect(element.muted).toBe(false);
  expect(wrapper.emitted("video")?.at(-1)?.[0]).toBe(element);
  expect(play).not.toHaveBeenCalled();
  await wrapper.get('[aria-label="Découvrir Symbiose"]').trigger("click");
  expect(play).toHaveBeenCalledTimes(1);
  expect(wrapper.emitted("playing")?.at(-1)).toEqual([true]);
  await wrapper.get('[aria-label="Mettre la vidéo en pause"]').trigger("click");
  expect(pause).toHaveBeenCalled();
  expect(wrapper.emitted("playing")?.at(-1)).toEqual([false]);
  await wrapper.get("video").trigger("ended");
  expect(wrapper.text()).toContain("La découverte continue");
  await wrapper.get(".sx-prologue-enter").trigger("click");
  expect(wrapper.emitted("enter")).toHaveLength(1);
  expect(wrapper.emitted("playing")?.at(-1)).toEqual([false]);
});

it("suspend le film avec le récit, lors de la sortie du bureau et à la destruction", async () => {
  const wrapper = setup();
  await file(wrapper);
  await wrapper.get('[aria-label="Découvrir Symbiose"]').trigger("click");
  await wrapper.setProps({ suspended: true });
  expect(wrapper.emitted("playing")?.at(-1)).toEqual([false]);
  await wrapper.setProps({ suspended: false });
  await wrapper.get('[aria-label="Découvrir Symbiose"]').trigger("click");
  await wrapper.setProps({ local: 0.3 });
  expect(wrapper.emitted("playing")?.at(-1)).toEqual([false]);
  expect(wrapper.get(".sx-prologue-copy").attributes("inert")).toBeDefined();
  wrapper.unmount();
  wrappers.splice(wrappers.indexOf(wrapper), 1);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:local-prologue-test");
  expect(wrapper.emitted("video")?.at(-1)).toEqual([null]);
});

it("refuse un fichier non vidéo et garde un état utilisable après une erreur média", async () => {
  const wrapper = setup();
  await file(wrapper, "notes.txt", "text/plain");
  expect(wrapper.text()).toContain("Choisissez une vidéo MP4 ou WebM");
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  await file(wrapper);
  await wrapper.get("video").trigger("error");
  await flushPromises();
  expect(wrapper.find("video").exists()).toBe(false);
  expect(wrapper.text()).toContain("La vidéo est absente ou illisible");
  expect(wrapper.emitted("playing")?.at(-1)).toEqual([false]);
  expect(wrapper.get(".sx-prologue-skip").exists()).toBe(true);
});

it("conserve une seule vidéo visible avec ses contrôles dans le repli sans WebGL", async () => {
  const wrapper = setup();
  await file(wrapper);
  await wrapper.setProps({ fallback: true });
  expect(wrapper.findAll("video")).toHaveLength(1);
  expect(wrapper.get("video").classes()).toContain(
    "sx-prologue-media--visible",
  );
  expect(wrapper.get("video").attributes("aria-hidden")).toBe("false");
  expect((wrapper.get("video").element as HTMLVideoElement).controls).toBe(
    true,
  );
  await wrapper.setProps({ local: 0.4 });
  expect(wrapper.get("video").classes()).not.toContain(
    "sx-prologue-media--visible",
  );
  expect(wrapper.get("video").attributes("aria-hidden")).toBe("true");
});

it("garde les contrôles compacts lorsque la caméra reste sur l’écran après une pause", async () => {
  const wrapper = setup();
  await file(wrapper);
  await wrapper.setProps({ focused: true });
  await wrapper.get('[aria-label="Découvrir Symbiose"]').trigger("click");
  await wrapper.get('[aria-label="Mettre la vidéo en pause"]').trigger("click");
  expect(wrapper.emitted("playing")?.at(-1)).toEqual([false]);
  expect(
    wrapper.get(".sx-prologue-overlay").attributes("data-video-focused"),
  ).toBe("true");
  expect(wrapper.get('[aria-label="Découvrir Symbiose"]').exists()).toBe(true);
});
