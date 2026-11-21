import { describe, expect, it } from "vitest";
import { sampleCamera } from "../../src/experience/CameraController";
import { cameraKeys } from "../../src/experience/config";
import {
  connectedCameraKeys,
  sampleConnectedExcursion,
  type ConnectedCameraPose,
} from "../../src/experience/excursions/connected-camera";
import { narrativeCues } from "../../src/experience/narrative-cues";
import { samplePresentationCamera } from "../../src/experience/presentation-camera";

const components = (pose: ConnectedCameraPose) => [
  ...pose.position,
  ...pose.target,
  pose.fov,
];
const distance = (a: readonly number[], b: readonly number[]) =>
  Math.hypot(...a.map((value, index) => value - b[index]));

describe("jury camera on the shared world", () => {
  it("holds complete poses while the scene's editorial seconds continue advancing", () => {
    const holds = narrativeCues.flatMap((cue) =>
      cue.camera.filter((span) => span.action === "hold"),
    );
    expect(holds).toHaveLength(5);
    for (const hold of holds) {
      expect(hold.to).toBeGreaterThan(hold.from);
      const pose = samplePresentationCamera(hold.from);
      for (let step = 1; step <= 10; step++)
        expect(
          samplePresentationCamera(
            hold.from + ((hold.to - hold.from) * step) / 10,
          ),
        ).toEqual(pose);
    }
    expect(samplePresentationCamera(75)).toEqual(sampleCamera(60 / 210));
    expect(samplePresentationCamera(202)).toEqual(
      sampleConnectedExcursion("drone", 0.5),
    );
  });

  it("joins the exact original world anchors at both ends of every excursion", () => {
    for (const cue of narrativeCues.filter((item) => item.excursion)) {
      const excursion = cue.excursion!;
      expect(samplePresentationCamera(cue.start)).toEqual(
        sampleConnectedExcursion(excursion, 0),
      );
      expect(samplePresentationCamera(cue.end)).toEqual(
        sampleConnectedExcursion(excursion, 1),
      );
    }
  });

  it("has continuous position, direction and velocity at scene and hold boundaries", () => {
    const boundaries = new Set(
      narrativeCues.flatMap((cue) => [
        cue.start,
        cue.end,
        ...cue.camera.flatMap((span) => [span.from, span.to]),
      ]),
    );
    const epsilon = 1e-4;
    for (const second of boundaries) {
      const before = components(samplePresentationCamera(second - epsilon)),
        at = components(samplePresentationCamera(second)),
        after = components(samplePresentationCamera(second + epsilon));
      expect(distance(before, at)).toBeLessThan(0.001);
      expect(distance(at, after)).toBeLessThan(0.001);
      for (let axis = 0; axis < at.length; axis++) {
        const incoming = (at[axis] - before[axis]) / epsilon,
          outgoing = (after[axis] - at[axis]) / epsilon;
        expect(Math.abs(incoming - outgoing)).toBeLessThan(0.02);
      }
    }
  });

  it("retraces every pose deterministically and has no teleport or invalid lens", () => {
    const forward = Array.from({ length: 6001 }, (_, step) =>
      samplePresentationCamera(step / 20),
    );
    const backward = Array.from({ length: 6001 }, (_, step) =>
      samplePresentationCamera((6000 - step) / 20),
    );
    expect(backward).toEqual([...forward].reverse());
    forward.forEach((pose, index) => {
      expect(components(pose).every(Number.isFinite)).toBe(true);
      expect(distance(pose.position, pose.target)).toBeGreaterThan(1);
      expect(pose.fov).toBeGreaterThan(40);
      expect(pose.fov).toBeLessThan(80);
      if (index === 0) return;
      expect(distance(pose.position, forward[index - 1].position)).toBeLessThan(
        6,
      );
      expect(
        distance(pose.target, forward[index - 1].target),
        `Target displacement at ${index / 20} seconds`,
      ).toBeLessThan(6);
    });
  });

  it("clamps out-of-range times and gives nonfinite input a safe opening pose", () => {
    for (const input of [-30, -1, Number.NaN, Infinity, -Infinity])
      expect(samplePresentationCamera(input)).toEqual(
        samplePresentationCamera(0),
      );
    expect(samplePresentationCamera(450)).toEqual(
      samplePresentationCamera(300),
    );
  });

  it("ends in the night forest with the opening's height, viewing direction and lens", () => {
    const opening = samplePresentationCamera(0),
      final = samplePresentationCamera(300);
    expect(final.position[2]).toBeLessThan(-800);
    expect(final.position[1]).toBe(opening.position[1]);
    expect(final.fov).toBe(opening.fov);
    const direction = (pose: ConnectedCameraPose) =>
      pose.target.map((value, axis) => value - pose.position[axis]);
    expect(direction(final)).toEqual(direction(opening));
    expect(samplePresentationCamera(292)).toEqual(final);
  });

  it("preserves public discovery camera paths and never mutates shared keys", () => {
    const mainKeys = structuredClone(cameraKeys),
      excursions = structuredClone(connectedCameraKeys),
      publicOpening = sampleCamera(0),
      publicFinal = sampleCamera(1),
      publicRiver = sampleCamera(60 / 210);
    for (let second = 0; second <= 300; second++)
      samplePresentationCamera(second);
    expect(cameraKeys).toEqual(mainKeys);
    expect(connectedCameraKeys).toEqual(excursions);
    expect(sampleCamera(0)).toEqual(publicOpening);
    expect(sampleCamera(1)).toEqual(publicFinal);
    expect(sampleCamera(60 / 210)).toEqual(publicRiver);
    expect(publicFinal.position).toEqual([0, 2.5, -865]);
    expect(samplePresentationCamera(300).position).toEqual([0, 2.1, -865]);
  });
});
