import inventory from "../content/runtime-assets.json";
import type { ExcursionId } from "./route";

export type ExcursionArtId = keyof typeof inventory.excursions;
export const excursionArt = inventory.excursions;
export interface ExcursionArtFrame {
  base: ExcursionArtId;
  overlay?: ExcursionArtId;
  blend: number;
}
const clamp = (value: number) =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const smooth = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

/** Spatial progress only: no timer, CSS animation or effect on the narrative clock. */
export function excursionArtFrame(
  id: ExcursionId,
  local: number,
  reduced = false,
): ExcursionArtFrame {
  if (id !== "marine")
    return { base: id === "soil" ? "soil" : "drone-bocage", blend: 0 };
  const t = reduced ? 0.5 : clamp(local);
  return {
    base: "marine-surface",
    overlay: "marine-underwater",
    blend: smooth((t - 0.2) / 0.2) * (1 - smooth((t - 0.7) / 0.2)),
  };
}

export function nextExcursionArt(id: ExcursionId): ExcursionArtId[] {
  return id === "soil"
    ? ["drone-bocage"]
    : id === "drone"
      ? ["marine-surface", "marine-underwater"]
      : [];
}
export const excursionArtPosition: Record<ExcursionArtId, string> = {
  soil: "72% center",
  "drone-bocage": "65% center",
  "marine-surface": "72% center",
  "marine-underwater": "70% center",
};

/** Bounded per-mount loading; only decoded images are published. */
export class ExcursionArtLoader {
  readonly prepared = new Set<ExcursionArtId>();
  private requests = new Map<ExcursionArtId, Promise<void>>();
  private pending = new Map<ExcursionArtId, () => void>();
  private disposed = false;

  prepare(
    id: ExcursionArtId,
    priority: "high" | "low" = "high",
  ): Promise<void> {
    if (this.disposed)
      return Promise.reject(new Error("Disposed image loader"));
    const cached = this.requests.get(id);
    if (cached) return cached;
    const request = new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.fetchPriority = priority;
      let settled = false;
      const finish = (failed = false) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.pending.delete(id);
        image.onload = null;
        image.onerror = null;
        if (failed) {
          this.requests.delete(id);
          reject(new Error(`Unavailable excursion image: ${id}`));
        } else {
          this.prepared.add(id);
          resolve();
        }
      };
      const cancel = () => {
        finish(true);
        image.src = "";
      };
      const timer = setTimeout(cancel, 8000);
      this.pending.set(id, cancel);
      image.onload = () => {
        void image.decode().then(
          () => finish(),
          () => finish(true),
        );
      };
      image.onerror = () => finish(true);
      image.src = excursionArt[id].url;
    });
    this.requests.set(id, request);
    return request;
  }
  retain(ids: ReadonlySet<ExcursionArtId>) {
    for (const [id, cancel] of this.pending) if (!ids.has(id)) cancel();
  }
  dispose() {
    this.disposed = true;
    for (const cancel of this.pending.values()) cancel();
    this.pending.clear();
    this.requests.clear();
    this.prepared.clear();
  }
}
