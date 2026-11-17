import { chapterIds } from "./config";
import { clamp01, smoothstep } from "./journey";
import { chapterProgress, pitchIndex } from "./pitch";
import { routeAtOriginal, sampleRoute } from "./excursions/route";

const chapterStops = chapterIds.map((_, index) =>
  routeAtOriginal(chapterProgress(index)),
);

/** Le curseur HTML peut arrondir une fin d’exploration quelques ulps avant sa sortie. */
export function fallbackRoute(progress: number, pixelTolerance = 0) {
  const stop = chapterStops.find(
    (value) => Math.abs(progress - value) <= pixelTolerance,
  );
  const route = sampleRoute(stop ?? progress);
  return route.excursion && 1 - route.excursion.local < 1e-12
    ? { ...route, excursion: undefined }
    : route;
}

/** Le repli 2D suit les chapitres éditoriaux, indépendamment des poses 3D. */
export function fallbackFrame(progress: number, reducedMotion = false) {
  const position = clamp01(progress);
  const index = pitchIndex(position);
  const from = chapterIds[index];
  const to = chapterIds[Math.min(index + 1, chapterIds.length - 1)];
  if (reducedMotion || index === chapterIds.length - 1)
    return { from, to, opacity: 0 };
  const start = chapterProgress(index);
  const end = chapterProgress(index + 1);
  const fadeStart = end - (end - start) * 0.12;
  return { from, to, opacity: smoothstep(fadeStart, end, position) };
}
