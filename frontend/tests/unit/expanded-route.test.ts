import { describe, expect, it, vi } from "vitest";
import { gsap } from "gsap";
import { cameraKeys, scrollScreens } from "../../src/experience/config";
import {
  chapterProgress,
  pitchChapters,
  pitchDuration,
} from "../../src/experience/pitch";
import { NarrativeTimeline } from "../../src/experience/NarrativeTimeline";
import {
  prologueFraction,
  prologueScreens,
} from "../../src/experience/prologue/prologue";
import { soilCameraKeys } from "../../src/experience/excursions/SoilScene";
import { droneCameraKeys } from "../../src/experience/excursions/DroneScene";
import { marineCameraKeys } from "../../src/experience/excursions/MarineScene";
import {
  adjacentStop,
  expandedDuration,
  expandedScrollScreens,
  expandedUnits,
  narrativeRouteLandmarks,
  excursions,
  excursionProgress,
  expandedTime,
  routeAtOriginal,
  routeAtSeconds,
  routeClock,
  routeStops,
  sampleExcursionCamera,
  sampleRoute,
  type ExcursionCameraKey,
} from "../../src/experience/excursions/route";

describe("the longer continuous journey", () => {
  it("gives the complete journey 1.75 times the former scroll distance", () => {
    expect(scrollScreens).toBe(21);
    expect(expandedScrollScreens).toBe(39);
    expect(prologueScreens).toBe(3);
    expect(
      (expandedScrollScreens + prologueScreens) /
        (scrollScreens + prologueScreens),
    ).toBe(1.75);
    expect(prologueFraction).toBe(3 / 42);
    expect(expandedUnits).toBe(315);
    expect(expandedDuration).toBe(pitchDuration + 84);
    expect(expandedDuration).toBe(300);
  });

  it("starts each scene on the five-minute clock where the spoken pitch expects it", () => {
    expect(pitchChapters.map((c) => expandedTime(c.start))).toEqual([
      0, 50, 67, 87, 103, 135, 215, 270,
    ]);
    const starts = excursions.map(
      (e) => sampleRoute(excursionProgress(e.id, 0)).seconds,
    );
    expect(starts[0]).toBeCloseTo(18, 9);
    expect(starts[1]).toBeCloseTo(185, 9);
    expect(starts[2]).toBeCloseTo(228, 9);
    expect(excursions.map((e) => e.seconds)).toEqual([24, 30, 30]);
    // Pitch sections: problem, solution, impacts, team, needs, epilogue.
    const sections = [0, 50, 135, 185, 215, 270, 300];
    expect(expandedTime(pitchChapters[1].start)).toBe(sections[1]);
    expect(expandedTime(pitchChapters[5].start)).toBe(sections[2]);
    expect(starts[1]).toBeCloseTo(sections[3], 9);
    expect(expandedTime(pitchChapters[6].start)).toBe(sections[4]);
    expect(expandedTime(pitchChapters[7].start)).toBe(sections[5]);
    expect(expandedTime(pitchDuration)).toBe(sections[6]);
  });

  it("places all thirteen scene boundaries on their exact clock times without moving world anchors", () => {
    const seconds = [
      0, 18, 42, 50, 67, 87, 103, 135, 185, 215, 228, 258, 270, 300,
    ];
    for (const [index, second] of seconds.entries()) {
      const route = routeAtSeconds(second);
      expect(route * expandedUnits).toBeCloseTo(
        narrativeRouteLandmarks[index],
        10,
      );
      expect(sampleRoute(route).seconds).toBeCloseTo(second, 10);
    }
    for (const [id, start, end] of [
      ["soil", 18, 42],
      ["drone", 185, 215],
      ["marine", 228, 258],
    ] as const) {
      expect(sampleRoute(routeAtSeconds(start)).excursion?.id).toBe(id);
      expect(sampleRoute(routeAtSeconds(end)).excursion).toBeUndefined();
      expect(sampleRoute(excursionProgress(id, 1)).seconds).toBeCloseTo(
        end,
        10,
      );
    }
  });

  it("maps all original chapters and camera anchors back to their unchanged coordinates", () => {
    const originals = [
      0,
      1,
      ...Array.from({ length: 8 }, (_, index) => chapterProgress(index)),
      ...cameraKeys.map((key) => key.time / 210),
      ...Array.from({ length: 211 }, (_, index) => index / 210),
    ];
    for (const original of originals) {
      const route = routeAtOriginal(original);
      expect(route).toBeGreaterThanOrEqual(0);
      expect(route).toBeLessThanOrEqual(1);
      expect(sampleRoute(route).progress).toBeCloseTo(original, 11);
    }
    expect(routeAtOriginal(-1)).toBe(0);
    expect(routeAtOriginal(2)).toBe(1);
  });

  it("visits soil, drone and marine in order without advancing the original camera during each insert", () => {
    expect(excursions.map((excursion) => excursion.id)).toEqual([
      "soil",
      "drone",
      "marine",
    ]);
    let previousEnd = -1;
    for (const excursion of excursions) {
      const start = excursionProgress(excursion.id, 0);
      const end = excursionProgress(excursion.id, 1);
      expect(start).toBeGreaterThan(previousEnd);
      expect(end).toBeGreaterThan(start);
      expect(sampleRoute(start).excursion?.id).toBe(excursion.id);
      expect(sampleRoute(start).excursion?.local).toBeCloseTo(0, 11);
      for (const local of [0.01, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99]) {
        const state = sampleRoute(excursionProgress(excursion.id, local));
        expect(state.progress).toBeCloseTo(excursion.anchor / 210, 12);
        expect(state.excursion?.id).toBe(excursion.id);
        expect(state.excursion?.local).toBeCloseTo(local, 11);
        expect(state.excursion!.weight).toBeGreaterThanOrEqual(0);
        expect(state.excursion!.weight).toBeLessThanOrEqual(1);
      }
      expect(
        sampleRoute(excursionProgress(excursion.id, 0.5)).excursion?.weight,
      ).toBe(1);
      expect(sampleRoute(end).progress).toBeCloseTo(excursion.anchor / 210, 11);
      previousEnd = end;
    }
  });

  it("keeps the 300-second clock continuous, monotonic and reversible across every boundary", () => {
    let previousProgress = -1,
      previousSeconds = -1;
    for (let step = 0; step <= 2400; step++) {
      const seconds = step / 8;
      const progress = routeAtSeconds(seconds);
      const state = sampleRoute(progress);
      expect(progress).toBeGreaterThanOrEqual(previousProgress - 1e-12);
      expect(state.seconds).toBeGreaterThanOrEqual(previousSeconds - 1e-10);
      expect(state.seconds).toBeCloseTo(seconds, 9);
      previousProgress = progress;
      previousSeconds = state.seconds;
    }
    for (let step = 0; step <= 2000; step++) {
      const progress = step / 2000;
      expect(routeAtSeconds(sampleRoute(progress).seconds)).toBeCloseTo(
        progress,
        10,
      );
    }
    expect(routeAtSeconds(-10)).toBe(0);
    expect(routeAtSeconds(Infinity)).toBe(0);
    expect(routeAtSeconds(1000)).toBe(1);
  });

  it("lets previous and next reach each added excursion as well as each historical chapter", () => {
    const stops = [
      0, 18, 42, 50, 67, 87, 103, 135, 185, 215, 228, 258, 270, 300,
    ];
    expect(routeStops).toHaveLength(stops.length);
    for (const [index, stop] of routeStops.entries())
      expect(sampleRoute(stop).seconds).toBeCloseTo(stops[index], 10);
    expect(routeStops[0]).toBe(0);
    expect(routeStops.at(-1)).toBe(1);
    for (const excursion of excursions)
      expect(routeStops).toContain(excursionProgress(excursion.id, 0));
    for (let i = 1; i < routeStops.length; i++) {
      expect(routeStops[i]).toBeGreaterThan(routeStops[i - 1]);
      expect(adjacentStop(routeStops[i - 1], 1)).toBe(routeStops[i]);
      expect(adjacentStop(routeStops[i], -1)).toBe(routeStops[i - 1]);
    }
    expect(adjacentStop(0, -1)).toBe(0);
    expect(adjacentStop(1, 1)).toBe(1);
  });
});

describe("reversible excursion camera sampling", () => {
  for (const [name, keys] of [
    ["soil", soilCameraKeys],
    ["drone", droneCameraKeys],
    ["marine", marineCameraKeys],
  ] as const) {
    it(`${name} keeps finite, bounded poses and has identical sampling on reversal`, () => {
      const cameraKeys: readonly ExcursionCameraKey[] = keys;
      const forward = Array.from({ length: 1001 }, (_, index) =>
        sampleExcursionCamera(cameraKeys, index / 1000),
      );
      const reverse = Array.from({ length: 1001 }, (_, index) =>
        sampleExcursionCamera(cameraKeys, (1000 - index) / 1000),
      );
      expect(reverse).toEqual([...forward].reverse());
      for (const pose of forward)
        expect(
          [...pose.position, ...pose.target, pose.fov].every(Number.isFinite),
        ).toBe(true);
      for (let index = 1; index < cameraKeys.length; index++) {
        const a = cameraKeys[index - 1],
          b = cameraKeys[index];
        for (let step = 0; step <= 25; step++) {
          const pose = sampleExcursionCamera(
            cameraKeys,
            a.at + ((b.at - a.at) * step) / 25,
          );
          for (const field of ["position", "target"] as const)
            for (let axis = 0; axis < 3; axis++) {
              expect(pose[field][axis]).toBeGreaterThanOrEqual(
                Math.min(a[field][axis], b[field][axis]) - 1e-10,
              );
              expect(pose[field][axis]).toBeLessThanOrEqual(
                Math.max(a[field][axis], b[field][axis]) + 1e-10,
              );
            }
          expect(pose.fov).toBeGreaterThanOrEqual(
            Math.min(a.fov, b.fov) - 1e-10,
          );
          expect(pose.fov).toBeLessThanOrEqual(Math.max(a.fov, b.fov) + 1e-10);
        }
      }
      expect(sampleExcursionCamera(cameraKeys, -1)).toEqual(
        sampleExcursionCamera(cameraKeys, 0),
      );
      expect(sampleExcursionCamera(cameraKeys, NaN)).toEqual(
        sampleExcursionCamera(cameraKeys, 0),
      );
      expect(sampleExcursionCamera(cameraKeys, 2)).toEqual(
        sampleExcursionCamera(cameraKeys, 1),
      );
    });
  }
});

it("injects the expanded clock into the existing presentation player and resumes for its remaining duration", () => {
  let cursor: any, options: any;
  const tween = { kill: vi.fn() };
  const spy = vi.spyOn(gsap, "to").mockImplementation(((
    target: any,
    config: any,
  ) => {
    cursor = target;
    options = config;
    return tween;
  }) as any);
  try {
    const timeline = Object.create(NarrativeTimeline.prototype) as any;
    const prefix = prologueFraction;
    Object.assign(timeline, {
      reduced: false,
      prefix,
      presentationClock: routeClock,
      trigger: { progress: prefix },
      onPause: vi.fn(),
      scrollTo: vi.fn(),
      snap: vi.fn(),
    });
    timeline.playPresentation();
    expect(options.seconds).toBe(300);
    expect(options.duration).toBe(300);
    expect(options.ease).toBe("none");
    for (const seconds of [12, 24, 49, 74, 150, 190, 230, 299.5]) {
      cursor.seconds = seconds;
      options.onUpdate();
      const total = timeline.scrollTo.mock.calls.at(-1)[0];
      expect(sampleRoute((total - prefix) / (1 - prefix)).seconds).toBeCloseTo(
        seconds,
        9,
      );
    }
    timeline.trigger.progress = prefix + routeAtSeconds(123.75) * (1 - prefix);
    timeline.playPresentation();
    expect(tween.kill).toHaveBeenCalled();
    expect(options.duration).toBeCloseTo(300 - 123.75, 10);
    options.onComplete();
    expect(timeline.snap).toHaveBeenCalledWith(1);
  } finally {
    spy.mockRestore();
  }
});
