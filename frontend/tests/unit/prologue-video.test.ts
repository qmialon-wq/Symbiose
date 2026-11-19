import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import PrologueOverlay from "../../src/experience/prologue/PrologueOverlay.vue";

const wrappers: VueWrapper[] = [];
let play: ReturnType<typeof vi.spyOn>;
let pause: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.stubEnv("VITE_SYMBIOSE_INTRO_VIDEO_URL", "");
  vi.stubEnv("VITE_SYMBIOSE_INTRO_CAPTIONS_URL", "");
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
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
function setup() {
  const wrapper = mount(PrologueOverlay, {
    props: { local: 0, active: true, reducedMotion: false, suspended: false },
    global: {
      stubs: {
        YouTubeScreen: {
          template: '<div class="youtube-screen-stub" />',
          methods: { pause() {}, play() {} },
        },
      },
    },
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

it("propose le film officiel sur YouTube sans charger le lecteur avant l’approche si le MP4 est désactivé", async () => {
  const wrapper = setup();
  expect(wrapper.text()).toContain("YouTube · lecture manuelle");
  expect(wrapper.text()).not.toContain("provisoire");
  expect(wrapper.find("video").exists()).toBe(false);
  expect(play).not.toHaveBeenCalled();
  expect(wrapper.find("iframe").exists()).toBe(false);
  await wrapper.get('[aria-label="Découvrir Symbiose"]').trigger("click");
  expect(wrapper.emitted("focus")).toHaveLength(1);
  expect(wrapper.find("iframe").exists()).toBe(false);
  await wrapper.get(".sx-prologue-skip").trigger("click");
  expect(wrapper.emitted("skip")).toHaveLength(1);
});

it("privilégie le MP4 et ses sous-titres propres sans charger YouTube ni imposer 90 secondes", async () => {
  vi.stubEnv("VITE_SYMBIOSE_INTRO_VIDEO_URL", "/experience-media/intro.mp4");
  vi.stubEnv(
    "VITE_SYMBIOSE_INTRO_CAPTIONS_URL",
    "/experience-media/intro.fr.vtt",
  );
  vi.stubEnv("VITE_SYMBIOSE_DEMO_URL", "/experience-media/demo.mp4");
  vi.stubEnv(
    "VITE_SYMBIOSE_DEMO_CAPTIONS_URL",
    "/experience-media/demo.fr.vtt",
  );
  const wrapper = setup();
  const element = wrapper.get("video").element as HTMLVideoElement;
  expect(wrapper.get("video").attributes("src")).toBe(
    "/experience-media/intro.mp4",
  );
  expect(wrapper.get("track").attributes("src")).toBe(
    "/experience-media/intro.fr.vtt",
  );
  expect(element.preload).toBe("metadata");
  expect(element.autoplay).toBe(false);
  expect(play).not.toHaveBeenCalled();
  expect(wrapper.find(".youtube-screen-stub").exists()).toBe(false);
  Object.defineProperty(element, "duration", {
    value: 240,
    configurable: true,
  });
  await wrapper.get("video").trigger("loadedmetadata");
  expect(wrapper.text()).not.toContain("90 s");
  expect(wrapper.get(".sx-prologue-seek input").attributes("max")).toBe("240");

});

it("refuse une source distante et ne réutilise jamais la source ni les sous-titres de démonstration", async () => {
  vi.stubEnv("VITE_SYMBIOSE_INTRO_VIDEO_URL", "https://example.com/intro.mp4");
  vi.stubEnv("VITE_SYMBIOSE_DEMO_URL", "/experience-media/demo.mp4");
  vi.stubEnv(
    "VITE_SYMBIOSE_DEMO_CAPTIONS_URL",
    "/experience-media/demo.fr.vtt",
  );
  const wrapper = setup();
  await flushPromises();
  expect(wrapper.find("video").exists()).toBe(false);
  expect(wrapper.find("track").exists()).toBe(false);
  expect(wrapper.text()).toContain("chemin local");
  expect(wrapper.find(".youtube-screen-stub").exists()).toBe(false);
});

it("conserve volume, sourdine et progression du MP4", async () => {
  vi.stubEnv("VITE_SYMBIOSE_INTRO_VIDEO_URL", "/experience-media/intro.mp4");
  const wrapper = setup();
  const element = wrapper.get("video").element as HTMLVideoElement;
  Object.defineProperty(element, "duration", {
    value: 240,
    configurable: true,
  });
  await wrapper.get("video").trigger("loadedmetadata");
  await wrapper.get(".sx-prologue-volume input").setValue("0.35");
  expect(element.volume).toBe(0.35);
  await wrapper
    .get('[aria-label="Couper le son de la vidéo"]')
    .trigger("click");
  expect(element.muted).toBe(true);
  await wrapper
    .get('[aria-label="Activer le son de la vidéo"]')
    .trigger("click");
  expect(element.muted).toBe(false);
  await wrapper.get(".sx-prologue-seek input").setValue("35");
  expect(element.currentTime).toBe(35);
  await wrapper.get("video").trigger("timeupdate");
  expect(wrapper.get(".sx-prologue-time").text()).toContain("0:35");
});

it("garde le secours YouTube manuel après une erreur MP4 et permet de poursuivre le récit", async () => {
  vi.stubEnv("VITE_SYMBIOSE_INTRO_VIDEO_URL", "/experience-media/intro.mp4");
  const wrapper = setup();
  await wrapper.setProps({ fallback: true, focused: true });
  await wrapper.get("video").trigger("error");
  await flushPromises();
  expect(wrapper.find("video").exists()).toBe(false);
  expect(wrapper.find(".youtube-screen-stub").exists()).toBe(false);
  expect(play).not.toHaveBeenCalled();
  const fallback = wrapper
    .findAll("button")
    .find((button) => button.text() === "Regarder sur YouTube");
  expect(fallback).toBeDefined();
  await fallback!.trigger("click");
  expect(wrapper.find(".youtube-screen-stub").exists()).toBe(true);
  expect(wrapper.emitted("focus")).toHaveLength(1);
  await wrapper.get(".sx-prologue-skip").trigger("click");
  expect(wrapper.emitted("skip")).toHaveLength(1);
});

it("met le MP4 en pause quand l’onglet est masqué", async () => {
  vi.stubEnv("VITE_SYMBIOSE_INTRO_VIDEO_URL", "/experience-media/intro.mp4");
  const wrapper = setup();
  await wrapper.get('[aria-label="Découvrir Symbiose"]').trigger("click");
  expect(wrapper.emitted("playing")?.at(-1)).toEqual([true]);
  vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  document.dispatchEvent(new Event("visibilitychange"));
  expect(pause).toHaveBeenCalled();
  expect(wrapper.emitted("playing")?.at(-1)).toEqual([false]);
});

it("met en pause une fenêtre inactive et préserve la lecture quand le focus reste dans le document", async () => {
  vi.stubEnv("VITE_SYMBIOSE_INTRO_VIDEO_URL", "/experience-media/intro.mp4");
  const wrapper = setup();
  const focus = vi.spyOn(document, "hasFocus").mockReturnValue(true);
  await wrapper.get('[aria-label="Découvrir Symbiose"]').trigger("click");
  const pauseCalls = pause.mock.calls.length;
  window.dispatchEvent(new Event("blur"));
  expect(pause).toHaveBeenCalledTimes(pauseCalls);
  expect(wrapper.emitted("playing")?.at(-1)).toEqual([true]);
  focus.mockReturnValue(false);
  window.dispatchEvent(new Event("blur"));
  expect(pause).toHaveBeenCalledTimes(pauseCalls + 1);
  expect(wrapper.emitted("playing")?.at(-1)).toEqual([false]);
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
