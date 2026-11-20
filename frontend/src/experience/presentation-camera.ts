import { sampleCamera } from "./CameraController";
import { narrativeDuration as spatialDuration, type Vec3 } from "./config";
import {
  sampleConnectedExcursion,
  type ConnectedCameraPose,
} from "./excursions/connected-camera";
import {
  narrativeCueAt,
  narrativeDurationSeconds,
  type NarrativeCue,
} from "./narrative-cues";

const ease = (value: number) => value * value * (3 - 2 * value);

/** Retimes the camera only. The presentation clock and scene animations keep running. */
function cameraProgress(cue: NarrativeCue, seconds: number): number {
  const knots = [
    { seconds: cue.start, value: 0 },
    ...cue.camera
      .filter((span) => span.action === "hold")
      .flatMap((span) => [
        { seconds: span.from, value: span.at! },
        { seconds: span.to, value: span.at! },
      ]),
    { seconds: cue.end, value: 1 },
  ];
  for (let index = 1; index < knots.length; index++) {
    const before = knots[index - 1],
      after = knots[index];
    if (seconds > after.seconds) continue;
    if (before.value === after.value) return before.value;
    const local = (seconds - before.seconds) / (after.seconds - before.seconds);
    return before.value + (after.value - before.value) * ease(local);
  }
  return 1;
}

/** Match the opening's height, view direction and lens in the existing night forest. */
function nightOpening(): ConnectedCameraPose {
  const opening = sampleCamera(0),
    night = sampleCamera(1);
  const offset: Vec3 = [
    night.position[0] - opening.position[0],
    0,
    night.position[2] - opening.position[2],
  ];
  const translate = (vector: Vec3) =>
    vector.map((value, axis) => value + offset[axis]) as unknown as Vec3;
  return {
    position: translate(opening.position),
    target: translate(opening.target),
    fov: opening.fov,
  };
}

/** Pure, reversible jury camera; public discovery keeps its original samplers. */
export function samplePresentationCamera(seconds: number): ConnectedCameraPose {
  const time = Math.min(
    narrativeDurationSeconds,
    Math.max(0, Number.isFinite(seconds) ? seconds : 0),
  );
  const cue = narrativeCueAt(time);
  const progress = cameraProgress(cue, time);
  if (cue.path.kind === "excursion")
    return sampleConnectedExcursion(cue.path.id, progress);

  const units = cue.path.from + (cue.path.to - cue.path.from) * progress;
  const pose = sampleCamera(units / spatialDuration);
  if (cue.path.to !== spatialDuration) return pose;

  const final = nightOpening();
  if (progress === 1) return final;
  const nativeEnd = sampleCamera(1),
    amount = ease(progress);
  const adjust = (field: "position" | "target") =>
    pose[field].map(
      (value, axis) =>
        value + (final[field][axis] - nativeEnd[field][axis]) * amount,
    ) as unknown as Vec3;
  return {
    position: adjust("position"),
    target: adjust("target"),
    fov: pose.fov + (final.fov - nativeEnd.fov) * amount,
  };
}
