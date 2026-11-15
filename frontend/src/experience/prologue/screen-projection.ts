export interface ScreenCorner {
  x: number;
  y: number;
}
export type ScreenQuad = readonly [
  ScreenCorner,
  ScreenCorner,
  ScreenCorner,
  ScreenCorner,
];
export interface OfficeScreenProjection {
  transform: string;
  visible: boolean;
  focus: number;
}

/** Project the native 16:9 iframe onto the four actual corners of the 3D monitor.
 * CSS matrix3d applies the same perspective division as the WebGL camera. */
export function screenTransform(
  quad: ScreenQuad,
  width = 1120,
  height = 630,
): string | undefined {
  if (
    width <= 0 ||
    height <= 0 ||
    quad.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))
  )
    return;
  const [p0, p1, p2, p3] = quad;
  const dx1 = p1.x - p2.x,
    dx2 = p3.x - p2.x,
    dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y,
    dy2 = p3.y - p2.y,
    dy3 = p0.y - p1.y + p2.y - p3.y;
  const denominator = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(denominator) < 1e-8) return;
  const g = (dx3 * dy2 - dx2 * dy3) / denominator;
  const h = (dx1 * dy3 - dx3 * dy1) / denominator;
  const values = [
    (p1.x - p0.x + g * p1.x) / width,
    (p1.y - p0.y + g * p1.y) / width,
    0,
    g / width,
    (p3.x - p0.x + h * p3.x) / height,
    (p3.y - p0.y + h * p3.y) / height,
    0,
    h / height,
    0,
    0,
    1,
    0,
    p0.x,
    p0.y,
    0,
    1,
  ];
  return `matrix3d(${values.join(",")})`;
}
