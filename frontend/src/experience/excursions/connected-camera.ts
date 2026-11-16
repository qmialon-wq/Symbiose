import { cameraKeys, type Vec3 } from "../config";
import { clamp01 } from "../journey";
import { excursions, type ExcursionCameraKey, type ExcursionId } from "./route";

export interface ConnectedCameraPose {
  position: Vec3;
  target: Vec3;
  fov: number;
}

function anchorPose(id: ExcursionId): ConnectedCameraPose {
  const anchor = excursions.find((excursion) => excursion.id === id)!.anchor;
  const key = cameraKeys.find((key) => key.time === anchor);
  if (!key) throw new Error(`Missing world camera anchor for ${id}`);
  return { position: key.position, target: key.target, fov: key.fov };
}

const soilAnchor = anchorPose("soil"),
  droneAnchor = anchorPose("drone"),
  marineAnchor = anchorPose("marine");

/** All positions belong to the journey world; the endpoints reuse its exact poses. */
export const connectedCameraKeys: Readonly<
  Record<ExcursionId, readonly ExcursionCameraKey[]>
> = {
  soil: [
    { at: 0, ...soilAnchor },
    { at: 0.12, position: [1, 5, -2], target: [1, 0, -12], fov: 59 },
    { at: 0.25, position: [1, 0.2, -6], target: [1, -1, -12], fov: 59 },
    { at: 0.45, position: [2, -1, -6], target: [1, -2, -12], fov: 59 },
    { at: 0.65, position: [-1, -2, -7], target: [2, -2, -12], fov: 59 },
    { at: 0.8, position: [1, 3, -4], target: [1, 1, -12], fov: 59 },
    { at: 1, ...soilAnchor },
  ],
  drone: [
    { at: 0, ...droneAnchor },
    { at: 0.18, position: [4, 70, -615], target: [48, 18, -620], fov: 57 },
    { at: 0.4, position: [20, 32, -605], target: [48, 15, -620], fov: 57 },
    { at: 0.6, position: [63, 25, -593], target: [48, 15, -620], fov: 57 },
    { at: 0.8, position: [16, 60, -605], target: [48, 18, -620], fov: 57 },
    { at: 1, ...droneAnchor },
  ],
  marine: [
    { at: 0, ...marineAnchor },
    { at: 0.18, position: [22, 13, -690], target: [-22, 8, -753], fov: 57 },
    { at: 0.33, position: [1, 0.45, -710], target: [-24, -2, -746], fov: 59 },
    { at: 0.43, position: [-14, -4, -720], target: [-36, -6, -745], fov: 60 },
    { at: 0.56, position: [-40, -6.4, -733], target: [-61, -5, -747], fov: 60 },
    { at: 0.69, position: [-58, -1.1, -718], target: [-36, 2, -755], fov: 59 },
    { at: 0.8, position: [-34, 7, -689], target: [-28, 14, -753], fov: 57 },
    { at: 1, ...marineAnchor },
  ],
};

/** Monotone Hermite slopes preserve each segment's bounds without stopping at every key. */
function tangent(
  keys: readonly ExcursionCameraKey[],
  index: number,
  value: (key: ExcursionCameraKey) => number,
) {
  if (index === 0 || index === keys.length - 1) return 0;
  const previous = keys[index - 1],
    current = keys[index],
    next = keys[index + 1];
  const before = current.at - previous.at,
    after = next.at - current.at;
  const incoming = (value(current) - value(previous)) / before,
    outgoing = (value(next) - value(current)) / after;
  if (incoming * outgoing <= 0) return 0;
  const firstWeight = 2 * after + before,
    secondWeight = after + 2 * before;
  return (
    (firstWeight + secondWeight) /
    (firstWeight / incoming + secondWeight / outgoing)
  );
}

/** A pure scroll lookup: reversing scroll retraces the same physical camera movement. */
export function sampleConnectedExcursion(
  id: ExcursionId,
  local: number,
): ConnectedCameraPose {
  const keys = connectedCameraKeys[id];
  const progress = clamp01(local);
  let index = keys.findIndex((key) => key.at >= progress);
  if (index <= 0) index = index === 0 ? 1 : keys.length - 1;
  const a = keys[index - 1],
    b = keys[index];
  const span = b.at - a.at;
  const t = (progress - a.at) / span;
  const interpolate = (value: (key: ExcursionCameraKey) => number) => {
    const start = value(a),
      end = value(b);
    const incoming = tangent(keys, index - 1, value),
      outgoing = tangent(keys, index, value);
    if (start === end && incoming === 0 && outgoing === 0) return start;
    return (
      (2 * t ** 3 - 3 * t ** 2 + 1) * start +
      (t ** 3 - 2 * t ** 2 + t) * span * incoming +
      (-2 * t ** 3 + 3 * t ** 2) * end +
      (t ** 3 - t ** 2) * span * outgoing
    );
  };
  const vector = (field: "position" | "target") =>
    [0, 1, 2].map((axis) =>
      interpolate((key) => key[field][axis]),
    ) as unknown as Vec3;
  return {
    position: vector("position"),
    target: vector("target"),
    fov: interpolate((key) => key.fov),
  };
}
