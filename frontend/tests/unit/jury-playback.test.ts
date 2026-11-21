import { afterEach, describe, expect, it, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { gsap } from "gsap";
import { NarrativeTimeline } from "../../src/experience/NarrativeTimeline";
import PresentationControls from "../../src/experience/PresentationControls.vue";
import { narrativeCues } from "../../src/experience/narrative-cues";
import { routeClock, sampleRoute } from "../../src/experience/excursions/route";

const wrappers: VueWrapper[] = [];
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  vi.restoreAllMocks();
});

interface PlaybackFrame {
  cursor: { seconds: number };
  options: gsap.TweenVars;
  tween: { kill: ReturnType<typeof vi.fn> };
}

/** Keep the real timeline's scroll/snap methods; only replace the animation clock. */
function player(reduced = false, allowReducedPlayback = true) {
  const frames: PlaybackFrame[] = [];
  const updates: number[] = [];
  const onPause = vi.fn();
  let scrollY = 0;
  const scrollRange = 10003;
  vi.spyOn(window, "scrollY", "get").mockImplementation(() =>
    Math.round(scrollY),
  );
  vi.spyOn(window, "scrollTo").mockImplementation(
    (options: ScrollToOptions) => {
      scrollY = options.top ?? 0;
    },
  );
  const trigger = {
    progress: 0,
    update: () => {
      // Match the rounding of a browser scroll position, not its exact request.
      trigger.progress = Math.round(scrollY) / scrollRange;
    },
  };
  const scrub = Object.assign(vi.fn(), {
    tween: {
      progress: vi.fn().mockReturnThis(),
      pause: vi.fn().mockReturnThis(),
    },
  });
  vi.spyOn(gsap, "to").mockImplementation((target, options) => {
    const tween = { kill: vi.fn() };
    frames.push({ cursor: target as { seconds: number }, options, tween });
    return tween as unknown as gsap.core.Tween;
  });
  // Bypass DOM event registration, retaining the actual playback implementation.
  const timeline = Object.create(NarrativeTimeline.prototype) as any;
  Object.assign(timeline, {
    reduced,
    allowReducedPlayback,
    prefix: 0,
    presentationClock: routeClock,
    trigger,
    state: { progress: 0 },
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    scrollTop: 0,
    scrollRange,
    smooth: scrub,
    onUpdate: (progress: number) => updates.push(progress),
    onPause,
  });
  return { timeline, frames, updates, onPause, trigger };
}

describe("continuous five-minute jury playback", () => {
  it("publishes every cue boundary immediately and keeps the clock running through camera holds", () => {
    const { timeline, frames, updates, onPause } = player();
    timeline.playPresentation();
    expect(frames).toHaveLength(1);
    const { cursor, options, tween } = frames[0];
    expect(options.seconds).toBe(300);
    expect(options.duration).toBe(300);
    const pauseCallsAtStart = onPause.mock.calls.length;
    // Include times inside visual holds: a still camera must not stop the clock.
    const seconds = [
      ...new Set([
        0,
        6,
        11.5,
        299.999,
        ...narrativeCues.flatMap((cue) => [cue.start, cue.end - 0.001]),
      ]),
    ].sort((a, b) => a - b);
    for (const second of seconds) {
      const emitted = updates.length;
      cursor.seconds = second;
      options.onUpdate!();
      expect(updates.length).toBeGreaterThan(emitted);
      expect(routeClock.seconds(updates.at(-1)!)).toBeCloseTo(second, 9);
      expect(tween.kill).not.toHaveBeenCalled();
      expect(onPause).toHaveBeenCalledTimes(pauseCallsAtStart);
    }
  });

  it("resumes at the exact fractional second instead of the rounded scroll position", () => {
    const { timeline, frames, updates, trigger } = player();
    timeline.playPresentation();
    const first = frames[0];
    first.cursor.seconds = 123.456789;
    first.options.onUpdate!();
    expect(routeClock.seconds(updates.at(-1)!)).toBeCloseTo(123.456789, 9);
    expect(
      Math.abs(routeClock.seconds(trigger.progress) - 123.456789),
    ).toBeGreaterThan(1e-5);
    timeline.pause();
    expect(first.tween.kill).toHaveBeenCalledTimes(1);
    timeline.playPresentation();
    expect(frames).toHaveLength(2);
    expect(frames[1].cursor.seconds).toBeCloseTo(123.456789, 9);
    expect(frames[1].options.duration).toBeCloseTo(176.543211, 9);
    frames[1].cursor.seconds = 123.706789;
    frames[1].options.onUpdate!();
    expect(routeClock.seconds(updates.at(-1)!)).toBeCloseTo(123.706789, 9);
  });

  it("lands exactly at five minutes and releases playback only at completion", () => {
    const { timeline, frames, updates, onPause } = player();
    timeline.playPresentation();
    const { cursor, options, tween } = frames[0];
    const pauseCallsAtStart = onPause.mock.calls.length;
    cursor.seconds = 299.999;
    options.onUpdate!();
    expect(routeClock.seconds(updates.at(-1)!)).toBeCloseTo(299.999, 9);
    expect(tween.kill).not.toHaveBeenCalled();
    options.onComplete!();
    expect(updates.at(-1)).toBe(1);
    expect(routeClock.seconds(updates.at(-1)!)).toBe(300);
    expect(tween.kill).toHaveBeenCalledTimes(1);
    expect(onPause).toHaveBeenCalledTimes(pauseCallsAtStart + 1);
    expect(timeline.playback).toBeUndefined();
  });

  it("allows the explicit jury clock with reduced motion", () => {
    const { timeline, frames, updates } = player(true, true);
    timeline.playPresentation();
    expect(frames).toHaveLength(1);
    frames[0].cursor.seconds = 185.25;
    frames[0].options.onUpdate!();
    expect(routeClock.seconds(updates.at(-1)!)).toBeCloseTo(185.25, 9);
    expect(frames[0].options.duration).toBe(300);
  });

  it("preserves the reduced-motion opt-out for public discovery", () => {
    const { timeline, frames, updates } = player(true, false);
    timeline.playPresentation();
    expect(frames).toHaveLength(0);
    expect(updates).toHaveLength(0);
  });
});

describe("accessible jury transport", () => {
  for (const reducedMotion of [false, true]) {
    it(`starts explicitly and exposes pause/resume with reduced motion ${reducedMotion}`, async () => {
      const wrapper = mount(PresentationControls, {
        attachTo: document.body,
        props: {
          progress: 0,
          routeProgress: 0,
          routeSeconds: 0,
          mode: "presentation",
          playing: false,
          reducedMotion,
          fullscreen: false,
          jury: true,
        },
      });
      wrappers.push(wrapper);
      const start = wrapper.get('button[aria-label="Démarrer le pitch"]');
      (start.element as HTMLButtonElement).focus();
      expect(document.activeElement).toBe(start.element);
      expect(start.text()).toContain("Démarrer le pitch");
      expect(wrapper.get(".sx-counter").text()).toBe("0:00 / 5:00");
      expect(wrapper.emitted("play")).toBeUndefined();
      await start.trigger("click");
      expect(wrapper.emitted("play")).toHaveLength(1);
      await wrapper.setProps({ playing: true });
      await wrapper
        .get('button[aria-label="Mettre en pause"]')
        .trigger("click");
      expect(wrapper.emitted("pause")).toHaveLength(1);
      const route = routeClock.progress(123.75);
      await wrapper.setProps({
        playing: false,
        progress: sampleRoute(route).progress,
        routeProgress: route,
        routeSeconds: 123.75,
      });
      expect(wrapper.get(".sx-counter").text()).toBe("2:03 / 5:00");
      expect(wrapper.find('[aria-label="Démarrer le pitch"]').exists()).toBe(
        false,
      );
      await wrapper.get('button[aria-label="Lire le récit"]').trigger("click");
      expect(wrapper.emitted("play")).toHaveLength(2);
      if (reducedMotion) {
        await wrapper.setProps({ jury: false });
        expect(wrapper.find(".sx-play").exists()).toBe(false);
      }
    });
  }
});
