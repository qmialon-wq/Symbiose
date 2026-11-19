export const defaultIntroYouTubeUrl = "https://youtu.be/O4J-Na3stKY";

/** Accept only real YouTube URLs, never arbitrary iframe markup or remote hosts. */
export function youtubeVideoId(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return;
    let id: string | null | undefined;
    if (url.hostname === "youtu.be") id = url.pathname.slice(1);
    else if (
      [
        "youtube.com",
        "www.youtube.com",
        "youtube-nocookie.com",
        "www.youtube-nocookie.com",
      ].includes(url.hostname)
    ) {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else id = /^\/embed\/([\w-]{11})\/?$/.exec(url.pathname)?.[1];
    }
    return id && /^[\w-]{11}$/.test(id) ? id : undefined;
  } catch {
    return;
  }
}

export interface YouTubePlayer {
  playVideo(): void;
  pauseVideo(): void;
  destroy(): void;
  getIframe(): HTMLIFrameElement;
}
export interface YouTubeEvent {
  target: YouTubePlayer;
}
export interface YouTubeStateEvent extends YouTubeEvent {
  data: number;
}
export interface YouTubePlayerOptions {
  width: number;
  height: number;
  videoId: string;
  playerVars: Record<string, string | number>;
  events: {
    onReady(event: YouTubeEvent): void;
    onStateChange(event: YouTubeStateEvent): void;
    onError(event: YouTubeStateEvent): void;
  };
}
export interface YouTubeAPI {
  Player: new (
    host: HTMLElement,
    options: YouTubePlayerOptions,
  ) => YouTubePlayer;
}
type YouTubeWindow = Window & {
  YT?: YouTubeAPI;
  onYouTubeIframeAPIReady?: () => void;
};
let pending: Promise<YouTubeAPI> | undefined;

/** Loaded only after the visitor opens the screen; one API request per page. */
export function loadYouTubeAPI(): Promise<YouTubeAPI> {
  const owner = window as YouTubeWindow;
  if (owner.YT?.Player) return Promise.resolve(owner.YT);
  if (pending) return pending;
  pending = new Promise<YouTubeAPI>((resolve, reject) => {
    const previous = owner.onYouTubeIframeAPIReady;
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    const script = existing ?? document.createElement("script");
    let settled = false;
    const finish = (failure?: string) => {
      if (settled) return;
      if (!failure && !owner.YT?.Player) return;
      settled = true;
      window.clearTimeout(timeout);
      script.removeEventListener("error", failed);
      script.removeEventListener("load", loaded);
      if (owner.onYouTubeIframeAPIReady === ready)
        owner.onYouTubeIframeAPIReady = previous;
      if (failure) {
        if (!existing) script.remove();
        reject(new Error(failure));
      } else resolve(owner.YT!);
    };
    const ready = () => {
      try {
        previous?.();
      } finally {
        finish();
      }
    };
    const failed = () =>
      finish(
        "Le lecteur YouTube n’a pas pu être chargé. Vérifiez votre connexion ou les restrictions du navigateur.",
      );
    const loaded = () => finish();
    const timeout = window.setTimeout(
      () =>
        finish(
          "YouTube ne répond pas. Vous pouvez réessayer ou poursuivre le voyage.",
        ),
      12000,
    );
    owner.onYouTubeIframeAPIReady = ready;
    script.addEventListener("error", failed);
    script.addEventListener("load", loaded);
    if (!existing) {
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.referrerPolicy = "strict-origin-when-cross-origin";
      document.head.append(script);
    }
  }).catch((error) => {
    pending = undefined;
    throw error;
  });
  return pending;
}
