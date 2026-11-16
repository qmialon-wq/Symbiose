import { describe, expect, it } from "vitest";
import {
  BoxGeometry,
  Matrix4,
  PerspectiveCamera,
  Quaternion,
  Vector3,
} from "three";
import { projectMarineFishBox } from "../../src/experience/excursions/MarineScene";

describe("marine fish screen annotations", () => {
  const camera = new PerspectiveCamera(60, 16 / 9, 0.1, 100);
  camera.updateMatrixWorld(true);
  const geometry = new BoxGeometry(1, 0.4, 0.2);
  const transform = (x = 2, y = 0, z = -10, rotation = 0) =>
    new Matrix4().compose(
      new Vector3(x, y, z),
      new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), rotation),
      new Vector3(1, 1, 1),
    );

  it("projects the actual transformed instance and moves its box with the fish", () => {
    const first = projectMarineFishBox(geometry, transform(), camera)!;
    const second = projectMarineFishBox(
      geometry,
      transform(3, 0, -10),
      camera,
    )!;
    expect(first.x).toBeGreaterThan(0.5);
    expect(first.y).toBeLessThan(0.5);
    expect(first.width).toBeGreaterThan(0.015);
    expect(second.x).toBeGreaterThan(first.x);
    expect(second.y).toBe(first.y);
    expect(
      projectMarineFishBox(geometry, transform(2, 0, -10, Math.PI / 2), camera)!
        .height,
    ).toBeGreaterThan(first.height * 2);
  });

  it("does not clamp hidden or offscreen fish into a spurious box", () => {
    for (const [x, y, z] of [
      [2, 0, 10],
      [100, 0, -10],
      [2, 20, -10],
      [2, 0, -101],
    ])
      expect(
        projectMarineFishBox(geometry, transform(x, y, z), camera),
      ).toBeUndefined();
  });

  it("leaves the narrative copy and controls free and ignores unreadably small fish", () => {
    for (const [x, y, z] of [
      [-4, 0, -10],
      [2, -4, -10],
      [2, 0, -90],
    ])
      expect(
        projectMarineFishBox(geometry, transform(x, y, z), camera),
      ).toBeUndefined();
  });

  it("refuses bounds intersecting the near plane or empty geometry", () => {
    expect(
      projectMarineFishBox(geometry, transform(0, 0, -0.1), camera),
    ).toBeUndefined();
    const empty = new BoxGeometry(0, 0, 0);
    expect(projectMarineFishBox(empty, transform(), camera)).toBeUndefined();
    empty.dispose();
  });
});
