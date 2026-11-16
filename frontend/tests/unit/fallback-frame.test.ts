import { describe, expect, it } from "vitest";
import { chapterIds } from "../../src/experience/config";
import {
  fallbackFrame,
  fallbackRoute,
} from "../../src/experience/fallback-frame";
import { chapterProgress, pitchIndex } from "../../src/experience/pitch";
import {
  routeAtOriginal,
  sampleRoute,
} from "../../src/experience/excursions/route";

describe("paysages 2D alignés sur le récit éditorial", () => {
  it("raccorde les fins d’exploration malgré l’arrondi du curseur, sans supprimer leur contenu", () => {
    for (const units of [12, 165, 180]) {
      const route = routeAtOriginal(units / 210);
      const rounded = (route * 100) / 100 - Number.EPSILON;
      expect(fallbackRoute(rounded).excursion).toBeUndefined();
      expect(fallbackRoute(rounded).progress).toBeCloseTo(units / 210, 12);
    }
    expect(fallbackRoute(29.5 / 315).excursion?.id).toBe("soil");
    expect(fallbackRoute(215 / 315).excursion?.id).toBe("drone");
    expect(fallbackRoute(265 / 315).excursion?.id).toBe("marine");
  });
  it("absorbe uniquement l’arrondi d’un demi-pixel aux arrêts éditoriaux 2D", () => {
    const tolerance = 0.5 / (39 * 900);
    for (let index = 0; index < chapterIds.length; index++) {
      const stop = routeAtOriginal(chapterProgress(index));
      for (const delta of [-0.99, 0, 0.99]) {
        const route = fallbackRoute(
          Math.max(0, stop + delta * tolerance),
          tolerance,
        );
        expect(route.excursion).toBeUndefined();
        expect(fallbackFrame(route.progress).from).toBe(chapterIds[index]);
        expect(fallbackFrame(route.progress).opacity).toBe(0);
      }
    }
    const inSky = routeAtOriginal(0.16);
    expect(fallbackRoute(inSky, tolerance)).toEqual(sampleRoute(inSky));
  });
  it.each([false, true])(
    "affiche les huit destinations intégralement, réduction %s",
    (reduced) => {
      chapterIds.forEach((id, index) => {
        const position = chapterProgress(index);
        for (const progress of [
          position,
          sampleRoute(routeAtOriginal(position)).progress,
        ]) {
          expect(fallbackFrame(progress, reduced)).toMatchObject({
            from: id,
            opacity: 0,
          });
        }
      });
      expect(fallbackFrame(1, reduced)).toEqual({
        from: "night-forest",
        to: "night-forest",
        opacity: 0,
      });
    },
  );

  it("conserve l’image courante pendant 88 % du chapitre et termine le fondu à l’étape suivante", () => {
    for (let index = 0; index < 7; index++) {
      const start = chapterProgress(index),
        end = chapterProgress(index + 1);
      const position = (local: number) => start + local * (end - start);
      expect(fallbackFrame(position(0.87)).opacity).toBe(0);
      expect(fallbackFrame(position(0.88)).opacity).toBeCloseTo(0, 12);
      expect(fallbackFrame(position(0.94))).toMatchObject({
        from: chapterIds[index],
        to: chapterIds[index + 1],
      });
      expect(fallbackFrame(position(0.94)).opacity).toBeCloseTo(0.5, 10);
      expect(fallbackFrame(end - 1e-7).opacity).toBeGreaterThan(0.999);
      expect(fallbackFrame(end)).toMatchObject({
        from: chapterIds[index + 1],
        opacity: 0,
      });
    }
  });

  it("reste réversible, borné et cohérent avec pitchIndex aux frontières numériques", () => {
    const positions = Array.from({ length: 1001 }, (_, i) => i / 1000);
    expect(positions.map((p) => fallbackFrame(p))).toEqual(
      [...positions]
        .reverse()
        .map((p) => fallbackFrame(p))
        .reverse(),
    );
    for (const position of [
      ...positions,
      ...chapterIds.flatMap((_, i) => [
        chapterProgress(i) - 1e-12,
        chapterProgress(i),
        chapterProgress(i) + 1e-12,
      ]),
    ]) {
      const frame = fallbackFrame(position);
      expect(frame.from).toBe(chapterIds[pitchIndex(position)]);
      expect(frame.opacity).toBeGreaterThanOrEqual(0);
      expect(frame.opacity).toBeLessThanOrEqual(1);
      expect(fallbackFrame(position, true).opacity).toBe(0);
    }
    expect(fallbackFrame(Number.NaN)).toEqual(fallbackFrame(0));
    expect(fallbackFrame(-1)).toEqual(fallbackFrame(0));
    expect(fallbackFrame(2)).toEqual(fallbackFrame(1));
  });
});
