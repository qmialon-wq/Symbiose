import { it, expect, vi } from "vitest";
import { gsap } from "gsap";
import { NarrativeTimeline } from "../../src/experience/NarrativeTimeline";
import {
  pitchDuration,
  pitchSeconds,
  progressAtSeconds,
} from "../../src/experience/pitch";

it("runs one chapter clock through all chapters and resumes for the remaining time", () => {
  let cursor: any, options: any;
  const tween = { kill: vi.fn() };
  const spy = vi.spyOn(gsap, "to").mockImplementation(((c: any, o: any) => {
    cursor = c;
    options = o;
    return tween;
  }) as any);
  try {
    const timeline = Object.create(NarrativeTimeline.prototype) as any;
    Object.assign(timeline, {
      reduced: false,
      trigger: { progress: 0 },
      onPause: vi.fn(),
      scrollTo: vi.fn(),
      snap: vi.fn(),
    });
    timeline.playPresentation();
    expect(options.duration).toBe(pitchDuration);
    expect(options.ease).toBe("none");
    for (const seconds of [26, 43, 79, 111, 150, 186, 215]) {
      cursor.seconds = seconds;
      options.onUpdate();
      expect(pitchSeconds(timeline.scrollTo.mock.calls.at(-1)[0])).toBeCloseTo(
        seconds,
      );
      expect(tween.kill).not.toHaveBeenCalled();
    }
    options.onComplete();
    expect(timeline.snap).toHaveBeenCalledWith(1);
    timeline.trigger.progress = progressAtSeconds(111);
    timeline.playPresentation();
    expect(options.duration).toBe(pitchDuration - 111);
  } finally {
    spy.mockRestore();
  }
});

it("starts the narrative after the travelling only when it reaches its destination", () => {
  let options: any;
  const tween = { kill: vi.fn() };
  const spy = vi.spyOn(gsap, "to").mockImplementation(((_c: any, o: any) => {
    options = o;
    return tween;
  }) as any);
  try {
    const timeline = Object.create(NarrativeTimeline.prototype) as any;
    Object.assign(timeline, {
      reduced: false,
      trigger: { progress: 0 },
      onPause: vi.fn(),
      scrollTo: vi.fn(),
      snap: vi.fn(),
    });
    const arrive = vi.fn();
    timeline.playTo(0.2, 14, arrive);
    expect(options.duration).toBe(14);
    // Wheel, key or click: the tween is killed before it can complete.
    timeline.pause();
    expect(tween.kill).toHaveBeenCalled();
    expect(arrive).not.toHaveBeenCalled();
    timeline.playTo(0.2, 14, arrive);
    options.onComplete();
    expect(timeline.snap).toHaveBeenCalledWith(0.2);
    expect(arrive).toHaveBeenCalledTimes(1);
  } finally {
    spy.mockRestore();
  }
});
