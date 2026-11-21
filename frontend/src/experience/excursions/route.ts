import { clamp01, smoothstep } from "../journey";
import { progressAtSeconds } from "../pitch";
import {
  narrativeCues,
  narrativeDurationSeconds,
  normalizeNarrativeSeconds,
} from "../narrative-cues";
import type { Vec3 } from "../config";

export type ExcursionId = "soil" | "drone" | "marine";
export const expandedScrollScreens = 39;
function excursionSeconds(id: ExcursionId): number {
  const cue = narrativeCues.find((cue) => cue.excursion === id)!;
  return cue.end - cue.start;
}
// `seconds` pace each exploration on the five-minute presentation clock;
// `units` keep their scroll share and camera path unchanged.
export const excursions = [
  {
    id: "soil",
    anchor: 12,
    units: 35,
    seconds: excursionSeconds("soil"),
    name: "Le sol vivant",
    label: "Sous nos pas",
    color: "#9a704e",
  },
  {
    id: "drone",
    anchor: 165,
    units: 30,
    seconds: excursionSeconds("drone"),
    name: "Survol du bocage",
    label: "L’équipe ARQ",
    color: "#7eaa70",
  },
  {
    id: "marine",
    anchor: 180,
    units: 40,
    seconds: excursionSeconds("marine"),
    name: "Plongée à Étretat",
    label: "Changer d’échelle",
    color: "#4e979b",
  },
] as const;
export const expandedUnits = 210 + excursions.reduce((n, e) => n + e.units, 0);
export const expandedDuration = narrativeDurationSeconds;
// Scroll distance and world anchors stay unchanged. Only the presentation
// clock is reparameterized, with exact cue boundaries from the shared script.
export const narrativeRouteLandmarks = [
  0, 12, 47, 52.5, 82.5, 112.5, 140, 167.5, 200, 230, 245, 285, 300, 315,
] as const;
const narrativeTimes = [
  ...narrativeCues.map((cue) => cue.start),
  expandedDuration,
];

function interpolate(
  value: number,
  from: readonly number[],
  to: readonly number[],
) {
  const index = from.findIndex((end, i) => i > 0 && value < end);
  if (index === -1) return to[to.length - 1];
  const previous = index - 1;
  return (
    to[previous] +
    ((value - from[previous]) / (from[index] - from[previous])) *
      (to[index] - to[previous])
  );
}
export interface ExcursionState {
  id: ExcursionId;
  local: number;
  weight: number;
}
export interface ExcursionCameraKey {
  at: number;
  position: Vec3;
  target: Vec3;
  fov: number;
}

export function excursionProgress(id: ExcursionId, local = 0.18) {
  const index = excursions.findIndex((e) => e.id === id);
  const e = excursions[index];
  return (
    (e.anchor +
      excursions.slice(0, index).reduce((n, item) => n + item.units, 0) +
      clamp01(local) * e.units) /
    expandedUnits
  );
}
/** Original chapters retain their coordinates; a direct chapter jump lands after its preceding insert. */
export function routeAtOriginal(progress: number) {
  const units = clamp01(progress) * 210;
  return (
    (units +
      excursions
        .filter((e) => e.anchor <= units + 1e-9)
        .reduce((n, e) => n + e.units, 0)) /
    expandedUnits
  );
}
export function sampleRoute(progress: number): {
  progress: number;
  excursion?: ExcursionState;
  seconds: number;
} {
  const time = clamp01(progress) * expandedUnits;
  const seconds = normalizeNarrativeSeconds(
    interpolate(time, narrativeRouteLandmarks, narrativeTimes),
  );
  let added = 0;
  for (const e of excursions) {
    const start = e.anchor + added;
    if (time < start - 1e-9) break;
    if (time < start + e.units - 1e-9) {
      const local = clamp01((time - start) / e.units);
      return {
        progress: e.anchor / 210,
        seconds,
        excursion: {
          id: e.id,
          local,
          weight: 1,
        },
      };
    }
    added += e.units;
  }
  const original = clamp01((time - added) / 210);
  return { progress: original, seconds };
}
export function routeAtSeconds(seconds: number) {
  const value = normalizeNarrativeSeconds(seconds);
  return (
    interpolate(value, narrativeTimes, narrativeRouteLandmarks) / expandedUnits
  );
}
export const routeStops = narrativeRouteLandmarks.map(
  (units) => units / expandedUnits,
);
export function adjacentStop(progress: number, direction: number) {
  return direction > 0
    ? (routeStops.find((p) => p > progress + 1e-5) ?? 1)
    : ([...routeStops].reverse().find((p) => p < progress - 1e-5) ?? 0);
}
export function sampleExcursionCamera(
  keys: readonly ExcursionCameraKey[],
  local: number,
) {
  const p = clamp01(local);
  let i = keys.findIndex((k) => k.at >= p);
  if (i <= 0) i = i === 0 ? 1 : keys.length - 1;
  const a = keys[i - 1],
    b = keys[i];
  const t = smoothstep(a.at, b.at, p);
  const vector = (field: "position" | "target") =>
    a[field].map((v, axis) => v + (b[field][axis] - v) * t) as unknown as Vec3;
  return {
    position: vector("position"),
    target: vector("target"),
    fov: a.fov + (b.fov - a.fov) * t,
  };
}
export const routeClock = {
  duration: expandedDuration,
  seconds: (p: number) => sampleRoute(p).seconds,
  progress: routeAtSeconds,
};
export function expandedTime(seconds: number) {
  return sampleRoute(routeAtOriginal(progressAtSeconds(seconds))).seconds;
}
