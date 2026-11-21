import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  excursionArt,
  excursionArtFrame,
  ExcursionArtLoader,
  nextExcursionArt,
} from "../../src/experience/excursions/fallback-art";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("photographic excursion plates", () => {
  it("ships four real local WebPs with checked dimensions, size, checksum and recorded generated provenance", () => {
    expect(Object.keys(excursionArt)).toEqual([
      "soil",
      "drone-bocage",
      "marine-surface",
      "marine-underwater",
    ]);
    for (const item of Object.values(excursionArt)) {
      const bytes = readFileSync("public" + item.url);
      expect(bytes.toString("ascii", 0, 4)).toBe("RIFF");
      expect(bytes.toString("ascii", 8, 12)).toBe("WEBP");
      expect(bytes.length).toBe(item.bytes);
      expect(bytes.length).toBeGreaterThan(80000);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        item.sha256,
      );
      expect(item.width * 9).toBe(item.height * 16);
      expect(item.generated).toBe(true);
      expect(readFileSync("public" + item.provenance, "utf8")).toContain(
        "Codex built-in image_gen",
      );
    }
  });

  it("crossfades two complete images continuously, reversibly and without a horizontal split", () => {
    const expected = [
      [0, 0],
      [0.2, 0],
      [0.3, 0.5],
      [0.4, 1],
      [0.6, 1],
      [0.7, 1],
      [0.8, 0.5],
      [0.9, 0],
      [1, 0],
    ];
    for (const [local, blend] of [...expected, ...[...expected].reverse()]) {
      const frame = excursionArtFrame("marine", local);
      expect(frame.base).toBe("marine-surface");
      expect(frame.overlay).toBe("marine-underwater");
      expect(frame.blend).toBeCloseTo(blend, 12);
    }
    for (const boundary of [0.2, 0.4, 0.7, 0.9]) {
      const left = excursionArtFrame("marine", boundary - 0.00001).blend;
      const right = excursionArtFrame("marine", boundary + 0.00001).blend;
      expect(Math.abs(left - right)).toBeLessThan(0.000001);
    }
    expect(excursionArtFrame("marine", NaN).blend).toBe(0);
  });

  it("keeps the established fixed immersion in reduced motion while prefetching only the following excursion", () => {
    for (const local of [0, 0.3, 0.7, 1])
      expect(excursionArtFrame("marine", local, true).blend).toBe(1);
    expect(nextExcursionArt("soil")).toEqual(["drone-bocage"]);
    expect(nextExcursionArt("drone")).toEqual([
      "marine-surface",
      "marine-underwater",
    ]);
    expect(nextExcursionArt("marine")).toEqual([]);
  });
});

describe("cancelable image decoding", () => {
  function images() {
    const created: any[] = [];
    vi.stubGlobal(
      "Image",
      class {
        src = "";
        onload?: () => void;
        onerror?: () => void;
        resolveDecode?: () => void;
        decode = () =>
          new Promise<void>((resolve) => {
            this.resolveDecode = resolve;
          });
        constructor() {
          created.push(this);
        }
      },
    );
    return created;
  }
  it("publishes only after decode, and reuses a successful preparation", async () => {
    const created = images(),
      loader = new ExcursionArtLoader();
    const prepared = loader.prepare("soil");
    created[0].onload();
    expect(loader.prepared.has("soil")).toBe(false);
    created[0].resolveDecode();
    await prepared;
    expect(loader.prepared.has("soil")).toBe(true);
    await loader.prepare("soil");
    expect(created).toHaveLength(1);
    loader.dispose();
  });
  it("cancels stale navigation and ignores a decode completing after disposal", async () => {
    const created = images(),
      loader = new ExcursionArtLoader();
    const stale = loader.prepare("soil");
    created[0].onload();
    const rejection = expect(stale).rejects.toThrow("Unavailable");
    loader.retain(new Set(["drone-bocage"]));
    await rejection;
    expect(created[0].src).toBe("");
    loader.dispose();
    created[0].resolveDecode();
    await Promise.resolve();
    expect(loader.prepared.size).toBe(0);
    expect(created[0].onload).toBeNull();
  });
  it("times out a hung image without preventing later retry", async () => {
    vi.useFakeTimers();
    const created = images(),
      loader = new ExcursionArtLoader();
    const rejection = expect(loader.prepare("soil")).rejects.toThrow(
      "Unavailable",
    );
    await vi.advanceTimersByTimeAsync(8000);
    await rejection;
    const retry = loader.prepare("soil");
    expect(created).toHaveLength(2);
    const cancelled = expect(retry).rejects.toThrow("Unavailable");
    loader.dispose();
    await cancelled;
  });
});
