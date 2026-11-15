import { describe, expect, it } from "vitest";
import { sampleCamera } from "../../src/experience/CameraController";
import {
  connectedCameraKeys,
  sampleConnectedExcursion,
  type ConnectedCameraPose,
} from "../../src/experience/excursions/connected-camera";
import {
  excursionProgress,
  excursions,
  sampleRoute,
} from "../../src/experience/excursions/route";

const components = (pose: ConnectedCameraPose) => [
  ...pose.position,
  ...pose.target,
  pose.fov,
];
const distance = (a: readonly number[], b: readonly number[]) =>
  Math.hypot(...a.map((value, index) => value - b[index]));

describe("camera excursions connected to the same world", () => {
  for (const { id, anchor } of excursions) {
    it(`${id} rejoins the exact original position, look direction and lens at both ends`, () => {
      const original = sampleCamera(anchor / 210);
      expect(sampleConnectedExcursion(id, 0)).toEqual(original);
      expect(sampleConnectedExcursion(id, 1)).toEqual(original);
      for (const local of [0, 1]) {
        const route = sampleRoute(excursionProgress(id, local));
        expect(route.progress).toBeCloseTo(anchor / 210, 12);
        expect(components(sampleCamera(route.progress))).toEqual(
          expect.arrayContaining(
            components(original).map((v) => expect.closeTo(v, 9)),
          ),
        );
      }
      expect(sampleConnectedExcursion(id, -1)).toEqual(original);
      expect(sampleConnectedExcursion(id, Number.NaN)).toEqual(original);
      expect(sampleConnectedExcursion(id, Infinity)).toEqual(original);
      expect(sampleConnectedExcursion(id, 2)).toEqual(original);
    });

    it(`${id} stays continuous and retraces its movement when scrolling backwards`, () => {
      const forward = Array.from({ length: 3001 }, (_, frame) =>
        sampleConnectedExcursion(id, frame / 3000),
      );
      const backward = Array.from({ length: 3001 }, (_, frame) =>
        sampleConnectedExcursion(id, (3000 - frame) / 3000),
      );
      expect(backward).toEqual([...forward].reverse());
      for (let frame = 0; frame < forward.length; frame++) {
        const pose = forward[frame];
        expect(components(pose).every(Number.isFinite)).toBe(true);
        expect(distance(pose.position, pose.target)).toBeGreaterThan(1);
        if (frame === 0) continue;
        expect(
          distance(pose.position, forward[frame - 1].position),
        ).toBeLessThan(0.5);
        expect(distance(pose.target, forward[frame - 1].target)).toBeLessThan(
          0.5,
        );
        expect(Math.abs(pose.fov - forward[frame - 1].fov)).toBeLessThan(0.02);
      }
    });

    it(`${id} has continuous velocity at keys and comes to rest at its joins`, () => {
      const epsilon = 1e-7;
      const derivative = (from: number, to: number) => {
        const a = components(sampleConnectedExcursion(id, from)),
          b = components(sampleConnectedExcursion(id, to));
        return a.map((value, axis) => (b[axis] - value) / (to - from));
      };
      for (const slope of [
        ...derivative(0, epsilon),
        ...derivative(1 - epsilon, 1),
      ])
        expect(Math.abs(slope)).toBeLessThan(0.02);
      for (const key of connectedCameraKeys[id].slice(1, -1)) {
        const incoming = derivative(key.at - epsilon, key.at),
          outgoing = derivative(key.at, key.at + epsilon);
        for (let axis = 0; axis < incoming.length; axis++)
          expect(Math.abs(incoming[axis] - outgoing[axis])).toBeLessThan(0.02);
      }
    });
  }

  it("descends into the soil opening, faces the cutaway and climbs out", () => {
    const poses = Array.from({ length: 1001 }, (_, step) =>
      sampleConnectedExcursion("soil", step / 1000),
    );
    const belowGround = poses.filter((pose) => pose.position[1] < 1);
    expect(belowGround.length).toBeGreaterThan(400);
    for (const pose of belowGround) {
      expect(pose.position[0]).toBeGreaterThan(-13);
      expect(pose.position[0]).toBeLessThan(15);
      expect(pose.position[2]).toBeGreaterThan(-17);
      expect(pose.position[2]).toBeLessThan(-3);
      expect(pose.target[2]).toBe(-12);
    }
    expect(poses[650].position[1]).toBe(-2);
    expect(poses[800].position[1]).toBe(3);
  });

  it("turns right towards the drone and moves around its survey area", () => {
    const rightTurn = sampleConnectedExcursion("drone", 0.18),
      nearSide = sampleConnectedExcursion("drone", 0.4),
      farSide = sampleConnectedExcursion("drone", 0.6);
    expect(rightTurn.target[0] - rightTurn.position[0]).toBeGreaterThan(40);
    expect(rightTurn.position[1]).toBeLessThan(94);
    expect(nearSide.position[0]).toBeLessThan(nearSide.target[0]);
    expect(farSide.position[0]).toBeGreaterThan(farSide.target[0]);
    expect(farSide.position[1]).toBeGreaterThan(0);
  });

  it("crosses the sea surface twice with a continuous submerged passage", () => {
    const poses = Array.from({ length: 1001 }, (_, step) =>
      sampleConnectedExcursion("marine", step / 1000),
    );
    const crossings = poses
      .slice(1)
      .filter(
        (pose, index) => pose.position[1] < 0 !== poses[index].position[1] < 0,
      );
    expect(crossings).toHaveLength(2);
    expect(poses[560].position[1]).toBe(-6.4);
    expect(poses[560].target[1]).toBeLessThan(0);
    expect(poses[800].position[1]).toBeGreaterThan(0);
  });
});
