import { clamp01, smoothstep } from "../journey";
import { cameraKeys, type Vec3 } from "../config";
import { expandedScrollScreens } from "../excursions/route";

/** Three additional scroll screens; the original 21-screen journey keeps its scale. */
export const prologueScreens = 3;
export const prologueFraction =
  prologueScreens / (expandedScrollScreens + prologueScreens);
export const prologueTravelSeconds = 14;
export const toJourney = (total: number, prefix = prologueFraction) =>
  clamp01((total - prefix) / (1 - prefix));
export const toTotal = (journey: number, prefix = prologueFraction) =>
  prefix + clamp01(journey) * (1 - prefix);
export const prologueAt = (total: number) => clamp01(total / prologueFraction);

const { position, target, fov } = cameraKeys[0];
const forest = { position, target, fov };
const keys: { at: number; position: Vec3; target: Vec3; fov: number }[] = [
  { at: 0, position: [4.8, 2.65, 52], target: [-1, 3.1, 37], fov: 48 },
  { at: 0.16, position: [4.6, 2.7, 51.6], target: [-1, 3.1, 37], fov: 48 },
  { at: 0.32, position: [6, 2.9, 54], target: [-2, 3, 32], fov: 57 },
  { at: 0.55, position: [-1.8, 2.65, 41], target: [-2, 2.8, 22], fov: 57 },
  { at: 0.76, position: [-2, 2.25, 29], target: [-2, 4.5, -10], fov: 57 },
  { at: 1, ...forest },
];

/** Reversible, deterministic camera path. The last pose is the untouched forest pose. */
export function samplePrologue(
  local: number,
  reduced = false,
  focus = 0,
  aspect = 16 / 9,
) {
  const p = reduced ? 0 : clamp01(local);
  let i = keys.findIndex((key) => key.at >= p);
  if (i <= 0) i = i === 0 ? 1 : keys.length - 1;
  const a = keys[i - 1],
    b = keys[i];
  const t = smoothstep(a.at, b.at, p);
  const mix = (x: number, y: number, f = t) => x + (y - x) * f;
  const vector = (field: "position" | "target") =>
    a[field].map((n, axis) => mix(n, b[field][axis])) as unknown as Vec3;
  const pose = {
    position: vector("position"),
    target: vector("target"),
    fov: mix(a.fov, b.fov),
  };
  // A user-triggered screen focus makes the video readable without moving the scroll cursor.
  const f = clamp01(focus) * (1 - smoothstep(0.12, 0.25, p));
  const screenFov = Math.min(
    120,
    Math.max(
      45,
      (2 * Math.atan(5.6 / (2 * 5.9 * Math.max(0.25, aspect) * 0.86)) * 180) /
        Math.PI,
    ),
  );
  return {
    position: pose.position.map((n, axis) =>
      mix(n, [2.5, 3.1, 42.9][axis], f),
    ) as unknown as Vec3,
    target: pose.target.map((n, axis) =>
      mix(n, [2.5, 3.1, 37][axis], f),
    ) as unknown as Vec3,
    fov: mix(pose.fov, screenFov, f),
  };
}
