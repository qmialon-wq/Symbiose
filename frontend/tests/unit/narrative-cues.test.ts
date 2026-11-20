import { describe, expect, it } from "vitest";
import {
  narrativeCueAt,
  narrativeCues,
  narrativeDurationSeconds,
  narrativeEventAt,
  narrativeEvents,
  signatureEvent,
} from "../../src/experience/narrative-cues";
import { excursionCopy } from "../../src/experience/excursions/copy";
import { pitchChapters } from "../../src/experience/pitch";
import {
  routeAtSeconds,
  sampleRoute,
} from "../../src/experience/excursions/route";

describe("the shared five-minute narrative conductor", () => {
  it("selects the new cue and event exactly after a complete spatial-clock round trip", () => {
    for (const cue of narrativeCues) {
      const cueSeconds = sampleRoute(routeAtSeconds(cue.start)).seconds;
      expect(narrativeCueAt(cueSeconds).id).toBe(cue.id);
      for (const event of cue.events) {
        const eventSeconds = sampleRoute(routeAtSeconds(event.start)).seconds;
        expect(narrativeCueAt(eventSeconds).id).toBe(cue.id);
        expect(narrativeEventAt(eventSeconds)?.id).toBe(event.id);
      }
    }
    expect(sampleRoute(routeAtSeconds(18)).excursion?.id).toBe("soil");
    expect(sampleRoute(routeAtSeconds(42)).excursion).toBeUndefined();
    expect(sampleRoute(routeAtSeconds(228)).excursion?.id).toBe("marine");
    expect(sampleRoute(routeAtSeconds(258)).excursion).toBeUndefined();
  });

  it("covers the exact thirteen requested scenes without a prologue or gap", () => {
    expect(narrativeDurationSeconds).toBe(300);
    expect(narrativeCues.map((cue) => cue.id)).toEqual([
      "forest-opening",
      "soil",
      "forest-return",
      "sky",
      "rivers",
      "underwater",
      "wetland",
      "meadow",
      "drone",
      "coast",
      "marine",
      "coast-return",
      "night-forest",
    ]);
    expect([
      ...narrativeCues.map((cue) => cue.start),
      narrativeCues.at(-1)!.end,
    ]).toEqual([0, 18, 42, 50, 67, 87, 103, 135, 185, 215, 228, 258, 270, 300]);
    for (const [index, cue] of narrativeCues.entries()) {
      expect(cue.end).toBeGreaterThan(cue.start);
      expect(narrativeCueAt(cue.start).id).toBe(cue.id);
      if (index > 0) expect(narrativeCues[index - 1].end).toBe(cue.start);
      if (index < narrativeCues.length - 1)
        expect(narrativeCueAt(cue.end).id).toBe(narrativeCues[index + 1].id);
    }
    expect(narrativeCueAt(300).id).toBe("night-forest");
    expect(narrativeCueAt(999).id).toBe("night-forest");
    expect(narrativeCueAt(-1).id).toBe("forest-opening");
    expect(narrativeCueAt(NaN).id).toBe("forest-opening");
  });

  it("keeps events and camera holds bounded, ordered and uniquely identifiable", () => {
    expect(new Set(narrativeEvents.map((event) => event.id)).size).toBe(
      narrativeEvents.length,
    );
    for (const cue of narrativeCues) {
      let previousEventEnd = cue.start;
      for (const event of cue.events) {
        expect(event.start).toBeGreaterThanOrEqual(previousEventEnd);
        expect(event.end).toBeGreaterThan(event.start);
        expect(event.end).toBeLessThanOrEqual(cue.end);
        expect(narrativeEventAt(event.start)?.id).toBe(event.id);
        previousEventEnd = event.end;
      }
      let previousCameraEnd = cue.start;
      for (const span of cue.camera) {
        expect(span.from).toBe(previousCameraEnd);
        expect(span.to).toBeGreaterThan(span.from);
        if (span.action === "hold") {
          expect(span.at).toBeGreaterThanOrEqual(0);
          expect(span.at).toBeLessThanOrEqual(1);
        }
        previousCameraEnd = span.to;
      }
      expect(previousCameraEnd).toBe(cue.end);
      expect(
        cue.speeches.every(
          (speech) =>
            ["A", "B"].includes(speech.speaker) && speech.text.length > 20,
        ),
      ).toBe(true);
    }
  });

  it("selects demonstration phases on a reversible absolute clock and keeps the final signature", () => {
    const seconds = [
      67, 73, 80, 103, 111, 119, 127, 135, 144, 154, 164, 176, 191, 198, 205,
      228, 238, 248, 270, 280, 289, 300,
    ];
    const forward = seconds.map((time) => narrativeEventAt(time)?.id);
    expect(
      [...seconds].reverse().map((time) => narrativeEventAt(time)?.id),
    ).toEqual([...forward].reverse());
    expect(forward.slice(0, 3)).toEqual([
      "river-detect",
      "river-identify",
      "river-review",
    ]);
    expect(narrativeEventAt(185)).toBeUndefined();
    expect(narrativeEventAt(190.99)).toBeUndefined();
    expect(narrativeEventAt(191)?.id).toBe("team-ai");
    expect(narrativeEventAt(300)).toBe(signatureEvent);
    expect(signatureEvent.start).toBe(289);
  });

  it("shares the editorial text with public chapters and subscenes while describing the real classifier", () => {
    for (const chapter of pitchChapters) {
      const cue = narrativeCues.find(
        (cue) => cue.chapter === chapter.id && !cue.excursion,
      )!;
      expect(chapter.title).toBe(cue.title);
      expect(chapter.message).toBe(cue.message);
      expect(chapter.oral).toContain(cue.speeches[0].text);
    }
    for (const id of ["soil", "drone", "marine"] as const) {
      const cue = narrativeCues.find((cue) => cue.excursion === id)!;
      expect(excursionCopy[id].title).toBe(cue.title);
      expect(excursionCopy[id].oral).toContain(cue.speeches[0].text);
    }
    expect(excursionCopy.marine.title.replaceAll("\n", " ")).toBe(
      "Ce qu’il reste à construire ensemble.",
    );
    const river = narrativeCues.find((cue) => cue.id === "rivers")!;
    expect(river.speeches[0].text).toContain("classificateur PyTorch");
    expect(river.speeches[0].text).not.toContain("SpeciesNet");
    expect(river.note).toContain("SpeciesNet");
  });
});
