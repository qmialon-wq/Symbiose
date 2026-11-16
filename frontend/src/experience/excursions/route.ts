import { clamp01, smoothstep } from "../journey";
import { pitchDuration, pitchSeconds, progressAtSeconds } from "../pitch";
import type { Vec3 } from "../config";

export type ExcursionId = "soil" | "drone" | "marine";
export const expandedScrollScreens = 39;
export const excursions = [
  {
    id: "soil",
    anchor: 12,
    units: 35,
    seconds: 50,
    name: "Sous nos pieds",
    label: "Le sol vivant",
    color: "#9a704e",
  },
  {
    id: "drone",
    anchor: 165,
    units: 30,
    seconds: 50,
    name: "Le regard du drone",
    label: "Survol du bocage",
    color: "#7eaa70",
  },
  {
    id: "marine",
    anchor: 180,
    units: 40,
    seconds: 50,
    name: "Sous la Manche",
    label: "Plongée à Étretat",
    color: "#4e979b",
  },
] as const;
export const expandedUnits = 210 + excursions.reduce((n, e) => n + e.units, 0);
export const expandedDuration =
  pitchDuration + excursions.reduce((n, e) => n + e.seconds, 0);
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
  let added = 0,
    seconds = 0;
  for (const e of excursions) {
    const start = e.anchor + added;
    if (time < start) break;
    if (time < start + e.units) {
      const local = clamp01((time - start) / e.units);
      return {
        progress: e.anchor / 210,
        seconds: pitchSeconds(e.anchor / 210) + seconds + local * e.seconds,
        excursion: {
          id: e.id,
          local,
          weight: 1,
        },
      };
    }
    added += e.units;
    seconds += e.seconds;
  }
  const original = clamp01((time - added) / 210);
  return { progress: original, seconds: pitchSeconds(original) + seconds };
}
export function routeAtSeconds(seconds: number) {
  const value = Math.max(
    0,
    Math.min(expandedDuration, Number.isFinite(seconds) ? seconds : 0),
  );
  let added = 0;
  for (const e of excursions) {
    const start = pitchSeconds(e.anchor / 210) + added;
    if (value < start) break;
    if (value < start + e.seconds)
      return excursionProgress(e.id, (value - start) / e.seconds);
    added += e.seconds;
  }
  return routeAtOriginal(progressAtSeconds(value - added));
}
const boundaries = [0, 17.5, 47.5, 77.5, 105, 132.5, 165, 195];
export const routeStops = [
  ...boundaries.map((p) => routeAtOriginal(p / 210)),
  ...excursions.map((e) => excursionProgress(e.id, 0)),
  1,
].sort((a, b) => a - b);
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
