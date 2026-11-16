import { describe, expect, it } from "vitest";
import {
  screenTransform,
  type ScreenQuad,
} from "../../src/experience/prologue/screen-projection";

function project(matrix: string, x: number, y: number) {
  const m = matrix.slice("matrix3d(".length, -1).split(",").map(Number);
  const w = m[3] * x + m[7] * y + m[15];
  return {
    x: (m[0] * x + m[4] * y + m[12]) / w,
    y: (m[1] * x + m[5] * y + m[13]) / w,
  };
}
function matches(quad: ScreenQuad, width = 1120, height = 630) {
  const transform = screenTransform(quad, width, height);
  expect(transform).toMatch(/^matrix3d\(/);
  const input = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ];
  for (let i = 0; i < 4; i++) {
    const p = project(transform!, input[i][0], input[i][1]);
    expect(Math.abs(p.x - quad[i].x)).toBeLessThan(1e-6);
    expect(Math.abs(p.y - quad[i].y)).toBeLessThan(1e-6);
  }
}

describe("projection du lecteur sur la surface réelle de l’écran", () => {
  it("reproduit les quatre coins d’un quadrilatère en perspective", () => {
    matches([
      { x: 10, y: 20 },
      { x: 230, y: 40 },
      { x: 210, y: 140 },
      { x: 30, y: 130 },
    ]);
    matches(
      [
        { x: 700, y: 100 },
        { x: 1140, y: 140 },
        { x: 1100, y: 400 },
        { x: 730, y: 410 },
      ],
      640,
      360,
    );
  });
  it("garde un rectangle 16:9 et son centre alignés lorsque la caméra fait face à l’écran", () => {
    const quad: ScreenQuad = [
      { x: 27, y: 327.5 },
      { x: 363, y: 327.5 },
      { x: 363, y: 516.5 },
      { x: 27, y: 516.5 },
    ];
    matches(quad);
    const center = project(screenTransform(quad)!, 560, 315);
    expect(center.x).toBeCloseTo(195, 8);
    expect(center.y).toBeCloseTo(422, 8);
  });
  it("conserve une transformation affine inclinée sans déplacement des coins", () => {
    matches([
      { x: 100, y: 30 },
      { x: 400, y: 90 },
      { x: 380, y: 270 },
      { x: 80, y: 210 },
    ]);
  });
  it("refuse une surface dégénérée, des coordonnées non finies ou une taille source nulle", () => {
    const valid: ScreenQuad = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    expect(
      screenTransform([
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 3 },
        { x: 4, y: 4 },
      ]),
    ).toBeUndefined();
    expect(
      screenTransform([{ x: NaN, y: 1 }, valid[1], valid[2], valid[3]]),
    ).toBeUndefined();
    expect(
      screenTransform([valid[0], valid[1], { x: 1, y: Infinity }, valid[3]]),
    ).toBeUndefined();
    expect(screenTransform(valid, 0, 630)).toBeUndefined();
    expect(screenTransform(valid, 1120, -1)).toBeUndefined();
  });
});
