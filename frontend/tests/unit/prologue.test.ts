import { describe, expect, it, vi } from "vitest";
import { gsap } from "gsap";
import { sampleCamera } from "../../src/experience/CameraController";
import { NarrativeTimeline } from "../../src/experience/NarrativeTimeline";
import {
  chapterProgress,
  pitchSeconds,
  progressAtSeconds,
} from "../../src/experience/pitch";
import {
  prologueFraction,
  samplePrologue,
  toJourney,
  toTotal,
} from "../../src/experience/prologue/prologue";

describe("prologue isolated from the existing journey", () => {
  it("adds scroll space without changing any original chapter or editorial second", () => {
    for (let seconds = 0; seconds <= 300; seconds++) {
      const p = progressAtSeconds(seconds);
      expect(pitchSeconds(toJourney(toTotal(p)))).toBeCloseTo(seconds, 9);
    }
    for (let i = 0; i < 8; i++)
      expect(toJourney(toTotal(chapterProgress(i)))).toBeCloseTo(
        chapterProgress(i),
        12,
      );
    expect(toJourney(0)).toBe(0);
    expect(toTotal(0)).toBe(prologueFraction);
    expect(toTotal(1)).toBe(1);
  });
  it("crosses the open passage and lands on the exact original forest pose in either direction", () => {
    expect(samplePrologue(1)).toEqual(sampleCamera(0));
    const poses = Array.from({ length: 1001 }, (_, i) =>
      samplePrologue(i / 1000),
    );
    expect([...poses].reverse()).toEqual(
      Array.from({ length: 1001 }, (_, i) => samplePrologue((1000 - i) / 1000)),
    );
    for (const pose of poses) {
      expect(
        [...pose.position, ...pose.target, pose.fov].every(Number.isFinite),
      ).toBe(true);
      const [x, , z] = pose.position;
      if (z >= 31.8 && z <= 32.2) {
        expect(x).toBeGreaterThan(-4);
        expect(x).toBeLessThan(0);
      }
    }
    for (let i = 1; i < poses.length; i++)
      expect(
        Math.hypot(
          ...poses[i].position.map((n, k) => n - poses[i - 1].position[k]),
        ),
      ).toBeLessThan(0.12);
  });
  it("keeps the reduced-motion office fixed and focuses the actual screen on request", () => {
    expect(samplePrologue(0.8, true)).toEqual(samplePrologue(0));
    expect(samplePrologue(0, false, 1).target).toEqual([2.5, 3.1, 37]);
    expect(samplePrologue(1, false, 1)).toEqual(sampleCamera(0));
    for (const aspect of [390 / 844, 16 / 9]) {
      const pose = samplePrologue(0, false, 1, aspect);
      const visibleWidth =
        2 * 5.9 * Math.tan((pose.fov * Math.PI) / 360) * aspect;
      expect(visibleWidth).toBeGreaterThanOrEqual(5.6 / 0.86 - 1e-10);
    }
  });
  it("runs the unchanged five-minute presentation after the prefix", () => {
    let cursor: { seconds: number }, options: any;
    const spy = vi.spyOn(gsap, "to").mockImplementation(((c: any, o: any) => {
      cursor = c;
      options = o;
      return { kill: vi.fn() };
    }) as any);
    try {
      const timeline = Object.create(NarrativeTimeline.prototype) as any;
      Object.assign(timeline, {
        prefix: prologueFraction,
        reduced: false,
        trigger: { progress: toTotal(0) },
        onPause: vi.fn(),
        scrollTo: vi.fn(),
        snap: vi.fn(),
      });
      timeline.playPresentation();
      expect(options.duration).toBe(300);
      for (const seconds of [35, 150, 240, 299]) {
        cursor!.seconds = seconds;
        options.onUpdate();
        expect(
          pitchSeconds(toJourney(timeline.scrollTo.mock.calls.at(-1)[0])),
        ).toBeCloseTo(seconds, 9);
      }
    } finally {
      spy.mockRestore();
    }
  });
});
