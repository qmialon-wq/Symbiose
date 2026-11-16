import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import YouTubeScreen from "../../src/experience/prologue/YouTubeScreen.vue";
import {
  defaultIntroYouTubeUrl,
  youtubeVideoId,
  type YouTubeAPI,
  type YouTubePlayer,
  type YouTubePlayerOptions,
} from "../../src/experience/prologue/youtube-player";

type APIWindow = Window & {
  YT?: YouTubeAPI;
  onYouTubeIframeAPIReady?: () => void;
};
const owner = window as APIWindow;
const wrappers: VueWrapper[] = [];
let options: YouTubePlayerOptions;
let player: YouTubePlayer;
let construct: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  const iframe = document.createElement("iframe");
  player = {
    playVideo: vi.fn(),
    pauseVideo: vi.fn(),
    destroy: vi.fn(),
    getIframe: () => iframe,
  };
  construct = vi.fn(function (host: HTMLElement, value: YouTubePlayerOptions) {
    options = value;
    host.replaceWith(iframe);
    return player;
  });
  owner.YT = { Player: construct as unknown as YouTubeAPI["Player"] };
  delete owner.onYouTubeIframeAPIReady;
});
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  document
    .querySelectorAll('script[src="https://www.youtube.com/iframe_api"]')
    .forEach((el) => el.remove());
  delete owner.YT;
  delete owner.onYouTubeIframeAPIReady;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
async function setup() {
  const wrapper = mount(YouTubeScreen, {
    props: { active: true, suspended: false },
  });
  wrappers.push(wrapper);
  await flushPromises();
  return wrapper;
}
function inertNetworkScripts() {
  const create = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation(((tag: string) => {
    const element = create(tag);
    if (tag === "script") (element as HTMLScriptElement).type = "text/plain";
    return element;
  }) as typeof document.createElement);
}

it("sélectionne uniquement les liens YouTube valides et conserve la vidéo provisoire fournie", () => {
  expect(youtubeVideoId(defaultIntroYouTubeUrl)).toBe("J-cDr27eVC0");
  expect(youtubeVideoId("https://youtu.be/J-cDr27eVC0")).toBe("J-cDr27eVC0");
  expect(youtubeVideoId("https://www.youtube.com/watch?v=J-cDr27eVC0")).toBe(
    "J-cDr27eVC0",
  );
  expect(
    youtubeVideoId("https://www.youtube-nocookie.com/embed/J-cDr27eVC0"),
  ).toBe("J-cDr27eVC0");
  for (const url of [
    "javascript:alert(1)",
    "https://youtube.com.attacker.test/embed/J-cDr27eVC0",
    "https://example.com/embed/J-cDr27eVC0",
    "https://www.youtube.com/embed/missing",
    "http://www.youtube.com/embed/J-cDr27eVC0",
    "https://other@youtube.com/watch?v=J-cDr27eVC0",
  ])
    expect(youtubeVideoId(url)).toBeUndefined();
});

it("prépare le lecteur dans le moniteur sans lecture automatique et fournit les contrôles natifs", async () => {
  const wrapper = await setup();
  expect(construct).toHaveBeenCalledTimes(1);
  expect(options.videoId).toBe("J-cDr27eVC0");
  expect(options.playerVars).toMatchObject({
    autoplay: 0,
    controls: 1,
    playsinline: 1,
    origin: location.origin,
  });
  expect(options.width).toBe(1120);
  expect(options.height).toBe(630);
  options.events.onReady({ target: player });
  expect(player.playVideo).not.toHaveBeenCalled();
  expect(wrapper.emitted("ready")).toHaveLength(1);
  expect(player.getIframe().title).toContain("Vidéo provisoire");
  expect(player.getIframe().referrerPolicy).toBe(
    "strict-origin-when-cross-origin",
  );
  expect(player.getIframe().allowFullscreen).toBe(true);
  (wrapper.vm as unknown as { play(): void }).play();
  expect(player.playVideo).toHaveBeenCalledOnce();
});

it("signale lecture, buffering, pause et fin pour synchroniser le verrouillage du récit", async () => {
  const wrapper = await setup();
  for (const data of [1, 3]) {
    options.events.onStateChange({ data, target: player });
    expect(wrapper.emitted("playing")?.at(-1)).toEqual([true]);
  }
  options.events.onStateChange({ data: 2, target: player });
  expect(wrapper.emitted("playing")?.at(-1)).toEqual([false]);
  options.events.onStateChange({ data: 0, target: player });
  expect(wrapper.emitted("ended")).toHaveLength(1);
  options.events.onError({ data: 150, target: player });
  expect(wrapper.emitted("error")?.at(-1)?.[0]).toContain(
    "intégration est désactivée",
  );
});

it("met en pause lors d’une suspension, de la sortie ou d’un onglet masqué et détruit le lecteur", async () => {
  const wrapper = await setup();
  await wrapper.setProps({ suspended: true });
  expect(player.pauseVideo).toHaveBeenCalled();
  const calls = (player.playVideo as ReturnType<typeof vi.fn>).mock.calls
    .length;
  (wrapper.vm as unknown as { play(): void }).play();
  expect(player.playVideo).toHaveBeenCalledTimes(calls);
  await wrapper.setProps({ suspended: false, active: false });
  options.events.onStateChange({ data: 1, target: player });
  expect(wrapper.emitted("playing")?.at(-1)).toEqual([false]);
  vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  document.dispatchEvent(new Event("visibilitychange"));
  expect(player.pauseVideo).toHaveBeenCalled();
  wrapper.unmount();
  wrappers.splice(wrappers.indexOf(wrapper), 1);
  expect(player.destroy).toHaveBeenCalledOnce();
});

it("refuse une configuration invalide sans requête ou remplacement silencieux", async () => {
  vi.stubEnv(
    "VITE_SYMBIOSE_INTRO_YOUTUBE_URL",
    "https://example.com/embed/J-cDr27eVC0",
  );
  const wrapper = await setup();
  expect(construct).not.toHaveBeenCalled();
  expect(wrapper.emitted("error")?.at(-1)).toEqual([
    "L’adresse de la vidéo YouTube est invalide.",
  ]);
});

it("ne crée aucun lecteur si le visiteur quitte l’écran pendant le chargement de l’API", async () => {
  inertNetworkScripts();
  delete owner.YT;
  const wrapper = await setup();
  wrapper.unmount();
  wrappers.splice(wrappers.indexOf(wrapper), 1);
  owner.YT = { Player: construct as unknown as YouTubeAPI["Player"] };
  owner.onYouTubeIframeAPIReady?.();
  await flushPromises();
  expect(construct).not.toHaveBeenCalled();
});

it("mutualise le script officiel, conserve le callback existant et permet une relance après erreur réseau", async () => {
  inertNetworkScripts();
  delete owner.YT;
  const previous = vi.fn();
  owner.onYouTubeIframeAPIReady = previous;
  const { loadYouTubeAPI } = await import(
    "../../src/experience/prologue/youtube-player"
  );
  const first = loadYouTubeAPI();
  expect(loadYouTubeAPI()).toBe(first);
  const rejection = first.catch((error) => error as Error);
  const script = document.querySelector<HTMLScriptElement>(
    'script[src="https://www.youtube.com/iframe_api"]',
  )!;
  expect(script).toBeTruthy();
  script.dispatchEvent(new Event("error"));
  expect((await rejection).message).toContain("connexion");
  expect(script.isConnected).toBe(false);
  expect(owner.onYouTubeIframeAPIReady).toBe(previous);
  const retry = loadYouTubeAPI();
  owner.YT = { Player: construct as unknown as YouTubeAPI["Player"] };
  owner.onYouTubeIframeAPIReady?.();
  await expect(retry).resolves.toBe(owner.YT);
  expect(previous).toHaveBeenCalledOnce();
  expect(owner.onYouTubeIframeAPIReady).toBe(previous);
});

it("interrompt une attente réseau trop longue et nettoie le script pour réessayer", async () => {
  vi.useFakeTimers();
  inertNetworkScripts();
  delete owner.YT;
  const { loadYouTubeAPI } = await import(
    "../../src/experience/prologue/youtube-player"
  );
  const pending = loadYouTubeAPI();
  const rejection = pending.catch((error) => error as Error);
  await vi.advanceTimersByTimeAsync(12000);
  expect((await rejection).message).toContain("ne répond pas");
  expect(
    document.querySelector('script[src="https://www.youtube.com/iframe_api"]'),
  ).toBeNull();
});
