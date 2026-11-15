import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { seededRandom } from "../world-utils";

/** An illustrative cutaway, not a measured soil profile or a functioning soil analysis. */
export const soilCameraKeys = [
  { at: 0, position: [0, 3.1, 14], target: [0, -1, 0], fov: 57 },
  { at: 0.18, position: [0.5, 0.6, 11], target: [0, -1.2, 0], fov: 57 },
  { at: 0.35, position: [1, -1, 8], target: [0, -1, 0], fov: 57 },
  { at: 0.65, position: [-2, -3, 5], target: [1, -2, 0], fov: 57 },
  { at: 0.84, position: [-1, -0.8, 9], target: [0, -1, 0], fov: 57 },
  { at: 1, position: [0, 3.1, 14], target: [0, -1, 0], fov: 57 },
] as const;

export function createSoilScene(economy: boolean, connected = false) {
  const scene = new T.Scene();
  scene.name = "symbiose-soil-cutaway";
  scene.background = new T.Color("#1f3027");
  scene.fog = new T.FogExp2("#354232", 0.023);
  const random = seededRandom(6017);
  const staticSet = new T.Group();
  staticSet.name = "soil-section-and-root-network";
  scene.add(staticSet);
  const extraTextures = new Set<T.Texture>();
  const makeTexture = (
    paint: (ctx: CanvasRenderingContext2D, size: number) => void,
    size = economy ? 512 : 1024,
  ) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    paint(canvas.getContext("2d")!, size);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = economy ? 2 : 4;
    extraTextures.add(texture);
    return texture;
  };
  const soilMap = makeTexture((ctx, size) => {
    const rows = [
      [0, 0.075, "#382e21"],
      [0.075, 0.27, "#56402b"],
      [0.27, 0.59, "#8a6240"],
      [0.59, 0.84, "#ac8859"],
      [0.84, 1, "#7e735a"],
    ] as const;
    for (const [a, b, color] of rows) {
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let x = 0; x <= size; x += 8) {
        const y =
          a * size +
          (a ? Math.sin(x * 0.009) * 12 + Math.sin(x * 0.036) * 3 : 0);
        if (!x) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(size, b * size + 22);
      ctx.lineTo(0, b * size + 22);
      ctx.closePath();
      ctx.fill();
    }
    for (let i = 0; i < size * 75; i++) {
      ctx.fillStyle =
        i % 3
          ? `rgba(23,16,10,${0.08 + random() * 0.25})`
          : `rgba(235,208,160,${0.05 + random() * 0.2})`;
      const x = random() * size,
        y = random() * size;
      ctx.fillRect(x, y, 0.3 + random() * 2.3, 0.3 + random() * 1.4);
    }
    for (let i = 0; i < 170; i++) {
      const x = random() * size,
        y = random() * size;
      ctx.fillStyle = "#34271d44";
      ctx.beginPath();
      ctx.ellipse(
        x,
        y,
        1 + random() * 4,
        0.5 + random() * 2.2,
        random() * 4,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  });
  const grainMap = makeTexture((ctx, size) => {
    const image = ctx.createImageData(size, size);
    for (let i = 0; i < image.data.length; i += 4) {
      const value = 85 + random() * 95;
      image.data[i] = image.data[i + 1] = image.data[i + 2] = value;
      image.data[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }, 512);
  grainMap.colorSpace = T.NoColorSpace;
  const earth = new T.MeshStandardMaterial({
    color: "#ddd2b5",
    map: soilMap,
    bumpMap: grainMap,
    bumpScale: 0.1,
    roughness: 0.98,
  });
  const darkEarth = new T.MeshStandardMaterial({
    color: "#3b3022",
    roughness: 1,
    bumpMap: grainMap,
    bumpScale: 0.08,
  });
  const roots = new T.MeshStandardMaterial({
    color: "#b79e72",
    roughness: 0.86,
    bumpMap: grainMap,
    bumpScale: 0.025,
  });
  const paleRoot = new T.MeshStandardMaterial({
    color: "#d4c29a",
    roughness: 0.94,
  });
  const fungi = new T.MeshStandardMaterial({
    color: "#c6b795",
    emissive: "#5b623b",
    emissiveIntensity: 0.08,
    roughness: 1,
  });
  const darkMetal = new T.MeshStandardMaterial({
    color: "#667a70",
    roughness: 0.55,
    metalness: 0.7,
  });
  const cream = new T.MeshStandardMaterial({
    color: "#d9d3ae",
    roughness: 0.7,
  });
  const green = new T.MeshStandardMaterial({
    color: "#486b3d",
    roughness: 0.9,
    side: T.DoubleSide,
  });
  function mesh(
    geometry: T.BufferGeometry,
    material: T.Material,
    x: number,
    y: number,
    z: number,
    parent: T.Group = staticSet,
  ) {
    const object = new T.Mesh(geometry, material);
    object.position.set(x, y, z);
    object.castShadow = !economy;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function tube(
    points: number[][],
    radius: number,
    material: T.Material,
    parent = staticSet,
  ) {
    const curve = new T.CatmullRomCurve3(
      points.map((p) => new T.Vector3(...(p as [number, number, number]))),
    );
    const object = mesh(
      new T.TubeGeometry(
        curve,
        economy ? 18 : 30,
        radius,
        economy ? 5 : 7,
        false,
      ),
      material,
      0,
      0,
      0,
      parent,
    );
    return { object, curve };
  }
  mesh(new T.BoxGeometry(29, 8, 4), earth, 0, -4, -2.02);
  mesh(new T.BoxGeometry(30, 0.2, 5), darkEarth, 0, -0.05, -2.45);
  // Uneven grass-line and leaf litter make the cutaway feel connected to the forest floor.
  const grassGeometry = new T.ConeGeometry(0.026, 0.43, 3);
  const grassCount = economy ? 220 : 420;
  const grasses = new T.InstancedMesh(grassGeometry, green, grassCount);
  const dummy = new T.Object3D();
  for (let i = 0; i < grassCount; i++) {
    dummy.position.set(
      (random() - 0.5) * 28,
      0.18 + random() * 0.08,
      -random() * 4.5,
    );
    dummy.rotation.set(
      (random() - 0.5) * 0.5,
      random() * 6.28,
      (random() - 0.5) * 0.55,
    );
    dummy.scale.setScalar(0.6 + random() * 1.1);
    dummy.updateMatrix();
    grasses.setMatrixAt(i, dummy.matrix);
  }
  staticSet.add(grasses);
  const pebbles = new T.InstancedMesh(
    new T.IcosahedronGeometry(1, 0),
    new T.MeshStandardMaterial({ color: "#b3a081", roughness: 1 }),
    economy ? 100 : 190,
  );
  for (let i = 0; i < pebbles.count; i++) {
    dummy.position.set((random() - 0.5) * 28, -0.3 - random() * 7.3, 0.04);
    dummy.rotation.set(random() * 6, random() * 6, random() * 6);
    dummy.scale.set(
      0.025 + random() * 0.14,
      0.02 + random() * 0.08,
      0.02 + random() * 0.045,
    );
    dummy.updateMatrix();
    pebbles.setMatrixAt(i, dummy.matrix);
  }
  staticSet.add(pebbles);

  // A living tree above the profile. Its roots bend into the exposed section.
  const bark = new T.MeshStandardMaterial({
    color: "#66553c",
    roughness: 0.96,
    bumpMap: grainMap,
    bumpScale: 0.15,
  });
  if (!connected) {
    const trunk = mesh(
      new T.CylinderGeometry(0.4, 0.68, 9, 11),
      bark,
      2.2,
      4.45,
      -2.2,
    );
    trunk.rotation.z = -0.05;
  }
  tube(
    [
      [2.2, 0.3, -2.2],
      [1.9, -0.2, -0.7],
      [1.3, -1, 0.25],
      [-0.4, -1.65, 0.3],
      [-2.4, -2.2, 0.18],
    ],
    0.16,
    roots,
  );
  tube(
    [
      [2.3, 0.2, -2.1],
      [2.6, -0.4, -0.5],
      [3, -1, 0.24],
      [4.4, -1.8, 0.3],
      [6.1, -3.1, 0.22],
    ],
    0.14,
    roots,
  );
  tube(
    [
      [2.2, 0, -1],
      [2.1, -1.5, 0.12],
      [2.8, -2.8, 0.23],
      [2.4, -4.5, 0.19],
      [3.7, -5.7, 0.08],
    ],
    0.1,
    roots,
  );
  for (let i = 0; i < (economy ? 20 : 34); i++) {
    const side = i % 2 ? 1 : -1;
    const x = 2 + side * random() * 4.5;
    const y = -0.3 - random() * 2.5;
    const length = 0.6 + random() * 1.9;
    tube(
      [
        [x, y, 0.16],
        [x + side * length * 0.3, y - 0.22, 0.24],
        [x + side * length * 0.8, y - 0.7, 0.2],
        [x + side * length, y - 1.15, 0.08],
      ],
      0.012 + random() * 0.035,
      paleRoot,
    );
  }
  for (let i = 0; i < (economy ? 24 : 46); i++) {
    const x = -3 + random() * 11,
      y = -0.9 - random() * 3.2;
    tube(
      [
        [x, y, 0.17],
        [x - 0.2, y - 0.15, 0.22],
        [x + 0.05, y - 0.36, 0.18],
        [x + 0.3, y - 0.55, 0.1],
      ],
      0.004,
      fungi,
    );
  }
  if (!connected) {
    const crown = new T.InstancedMesh(
      new T.IcosahedronGeometry(1, 1),
      new T.MeshStandardMaterial({ color: "#476646", roughness: 1 }),
      16,
    );
    for (let i = 0; i < 16; i++) {
      dummy.position.set(
        2.2 + Math.sin(i * 2.4) * (1 + random() * 2.2),
        8.2 + random() * 2.3,
        -2.3 + Math.cos(i * 2.4) * 2,
      );
      dummy.rotation.set(random() * 6, random() * 6, random() * 6);
      dummy.scale.set(1.7, 1.3, 1.5);
      dummy.updateMatrix();
      crown.setMatrixAt(i, dummy.matrix);
    }
    staticSet.add(crown);
    for (const [x, z, size] of [
      [-10, -10, 1.2],
      [12, -13, 1.1],
      [-5, -16, 0.8],
      [7, -20, 1.3],
    ]) {
      mesh(
        new T.CylinderGeometry(0.22 * size, 0.4 * size, 14 * size, 7),
        bark,
        x,
        7 * size,
        z,
      );
      mesh(new T.IcosahedronGeometry(4 * size, 1), green, x, 13 * size, z);
    }
  }
  if (connected) {
    // The viewing chamber is an actual opening in the shared forest floor.
    mesh(new T.BoxGeometry(1, 8, 9), darkEarth, -14.5, -4, 4.5);
    mesh(new T.BoxGeometry(1, 8, 9), darkEarth, 14.5, -4, 4.5);
    mesh(new T.BoxGeometry(29, 8, 0.5), darkEarth, 0, -4, 9);
    mesh(new T.BoxGeometry(29, 0.4, 9), darkEarth, 0, -8, 4.5);
  }

  // Extracted core in a hollow sampler: layers continue into the sample.
  const core = new T.Group();
  core.name = "illustrative-soil-core";
  core.position.set(-5.4, 0, 0.75);
  staticSet.add(core);
  const glass = new T.MeshPhysicalMaterial({
    color: "#c2ddd3",
    transparent: true,
    opacity: 0.11,
    roughness: 0.18,
    metalness: 0.05,
    side: T.DoubleSide,
    depthWrite: false,
  });
  const casing = mesh(
    new T.CylinderGeometry(0.48, 0.48, 6.8, economy ? 20 : 32, 1, true),
    glass,
    0,
    -3.1,
    0,
    core,
  );
  casing.castShadow = false;
  const coreColors = ["#473423", "#6a4b2e", "#956e47", "#b19869", "#7d745a"];
  const heights = [0.5, 1.5, 2.1, 1.5, 0.6];
  let top = 0.05;
  heights.forEach((height, i) => {
    mesh(
      new T.CylinderGeometry(0.35, 0.35, height - 0.035, economy ? 18 : 28),
      new T.MeshStandardMaterial({
        color: coreColors[i],
        roughness: 1,
        bumpMap: grainMap,
        bumpScale: 0.04,
      }),
      0,
      top - height / 2,
      0,
      core,
    );
    top -= height;
  });
  for (const y of [0.35, -6.5]) {
    const ring = mesh(
      new T.TorusGeometry(0.48, 0.055, 6, 24),
      darkMetal,
      0,
      y,
      0,
      core,
    );
    ring.rotation.x = Math.PI / 2;
  }
  mesh(
    new T.CylinderGeometry(0.53, 0.53, 0.18, 24, 1, true),
    darkMetal,
    0,
    0.42,
    0,
    core,
  );
  const handle = mesh(
    new T.CylinderGeometry(0.055, 0.055, 1.8, 8),
    darkMetal,
    0,
    0.82,
    0,
    core,
  );
  handle.rotation.z = Math.PI / 2;
  for (let i = 0; i < 13; i++)
    mesh(
      new T.BoxGeometry(i % 2 ? 0.1 : 0.18, 0.012, 0.02),
      cream,
      -0.56,
      -i * 0.48,
      0.04,
      core,
    );

  // Macro view of an earthworm: annulated body, clitellum and gently tapered ends.
  const worm = new T.Group();
  worm.name = "earthworm-annelid-illustration";
  scene.add(worm);
  const wormCurve = new T.CatmullRomCurve3([
    new T.Vector3(-1, -3.05, 0.36),
    new T.Vector3(-0.3, -2.5, 0.55),
    new T.Vector3(0.55, -2.65, 0.52),
    new T.Vector3(1.1, -3.2, 0.43),
    new T.Vector3(2, -3.55, 0.37),
    new T.Vector3(2.65, -3.35, 0.3),
  ]);
  const wormMat = new T.MeshStandardMaterial({
    color: "#aa6e59",
    roughness: 0.63,
    metalness: 0,
    bumpMap: grainMap,
    bumpScale: 0.008,
  });
  const clitellumMat = new T.MeshStandardMaterial({
    color: "#c08c70",
    roughness: 0.69,
  });
  const segmentGeo = new T.SphereGeometry(1, economy ? 9 : 13, 7);
  const count = economy ? 40 : 60;
  const segments = new T.InstancedMesh(segmentGeo, wormMat, count);
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1),
      p = wormCurve.getPoint(t),
      direction = wormCurve.getTangent(t);
    const r = (0.065 + 0.057 * Math.sin(t * Math.PI)) * (i % 2 ? 1 : 0.93);
    dummy.position.copy(p);
    dummy.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction);
    dummy.scale.set(r, 0.065, r);
    dummy.updateMatrix();
    segments.setMatrixAt(i, dummy.matrix);
  }
  worm.add(segments);
  for (let i = 0; i < 6; i++) {
    const t = 0.25 + i * 0.012;
    const p = wormCurve.getPoint(t);
    const ring = mesh(
      new T.SphereGeometry(1, 11, 7),
      clitellumMat,
      p.x,
      p.y,
      p.z,
      worm,
    );
    ring.quaternion.setFromUnitVectors(
      new T.Vector3(0, 1, 0),
      wormCurve.getTangent(t),
    );
    ring.scale.set(0.13, 0.06, 0.13);
  }
  // Beetle larva in a small chamber, with a sclerotised head and three pairs of legs.
  const larva = new T.Group();
  larva.name = "beetle-larva-illustration";
  scene.add(larva);
  const chamber = mesh(
    new T.SphereGeometry(1, 24, 16),
    new T.MeshStandardMaterial({ color: "#35291e", roughness: 1 }),
    -2.65,
    -1.75,
    0.03,
  );
  chamber.scale.set(0.8, 0.64, 0.1);
  const larvaSkin = new T.MeshStandardMaterial({
    color: "#c5b693",
    roughness: 0.82,
  });
  for (let i = 0; i < 11; i++) {
    const angle = -1.9 + (i / 10) * 3.5;
    const body = mesh(
      new T.SphereGeometry(1, 11, 7),
      larvaSkin,
      -2.65 + Math.cos(angle) * 0.42,
      -1.75 + Math.sin(angle) * 0.34,
      0.29,
      larva,
    );
    body.scale.set(0.12, 0.105, 0.12);
  }
  const head = mesh(
    new T.SphereGeometry(0.15, 13, 9),
    new T.MeshStandardMaterial({ color: "#745038", roughness: 0.63 }),
    -2.61,
    -2.13,
    0.35,
    larva,
  );
  head.scale.set(1.15, 0.8, 1);
  for (let i = 0; i < 3; i++)
    for (const side of [-1, 1])
      tube(
        [
          [-2.61 + i * 0.09, -2.02 + i * 0.1, 0.31],
          [-2.77 + side * 0.15 + i * 0.09, -2.14 + i * 0.08, 0.4],
        ],
        0.014,
        roots,
        larva,
      );

  function label(text: string, x: number, y: number, z: number, width: number) {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 160;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#15251de8";
    ctx.beginPath();
    ctx.roundRect(0, 0, 1024, 160, 18);
    ctx.fill();
    ctx.fillStyle = "#c9e8ab";
    ctx.fillRect(24, 28, 5, 104);
    ctx.font = "500 45px Segoe UI, Arial, sans-serif";
    ctx.fillStyle = "#f5f8ef";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 54, 81);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    extraTextures.add(texture);
    const sprite = new T.Sprite(
      new T.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        toneMapped: false,
      }),
    );
    sprite.position.set(x, y, z);
    sprite.scale.set(width, (width * 160) / 1024, 1);
    sprite.renderOrder = 10;
    scene.add(sprite);
    return sprite;
  }
  const labels = [
    label("Lombric · annélide", 1.3, -4.15, 0.9, 2.5),
    label("Larve de coléoptère", -2.75, -0.87, 0.8, 2.65),
    label("Racines & mycélium", 4.3, -1, 0.7, 2.7),
    label("Carottage · échantillon illustratif", -5.5, 1.45, 0.8, 4),
  ];
  const labelAnchors = labels.map((object) => object.position.clone());
  const labelPoint = new T.Vector3();
  const topNotice = label(
    "Coupe pédagogique · aucune mesure",
    0.7,
    2.45,
    0.4,
    5,
  );

  const ambient = new T.HemisphereLight("#d2e5d1", "#61442f", 1.8);
  const sun = new T.DirectionalLight("#fff0ce", 3.3);
  sun.position.set(-6, 11, 8);
  sun.castShadow = !economy;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -17;
  sun.shadow.camera.right = sun.shadow.camera.top = 17;
  sun.shadow.camera.far = 60;
  sun.shadow.normalBias = 0.035;
  const warm = new T.PointLight("#efd4a6", 22, 21, 2);
  warm.position.set(1, -1.3, 5);
  const rim = new T.PointLight("#a6c3a1", 12, 17, 2);
  rim.position.set(-6, -0.5, 3);
  scene.add(ambient, sun, sun.target, warm, rim);
  const dustGeo = new T.BufferGeometry();
  const dustPoints: number[] = [];
  for (let i = 0; i < (economy ? 70 : 130); i++)
    dustPoints.push(
      (random() - 0.5) * 19,
      -random() * 7 + 0.2,
      0.8 + random() * 3.2,
    );
  dustGeo.setAttribute("position", new T.Float32BufferAttribute(dustPoints, 3));
  const dust = new T.Points(
    dustGeo,
    new T.PointsMaterial({
      color: "#d7c6a2",
      size: 0.022,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    }),
  );
  scene.add(dust);

  // One merged draw per static material, rather than one draw for each rootlet.
  const batches = new Map<string, T.Mesh<T.BufferGeometry, T.Material>[]>();
  staticSet.updateMatrixWorld(true);
  staticSet.traverse((object) => {
    if (
      !(object instanceof T.Mesh) ||
      object instanceof T.InstancedMesh ||
      Array.isArray(object.material) ||
      object.material.transparent
    )
      return;
    const list = batches.get(object.material.uuid) ?? [];
    list.push(object as T.Mesh<T.BufferGeometry, T.Material>);
    batches.set(object.material.uuid, list);
  });
  for (const objects of batches.values()) {
    if (objects.length < 2) continue;
    const source = objects.map((object) =>
      (object.geometry.index
        ? object.geometry.toNonIndexed()
        : object.geometry.clone()
      ).applyMatrix4(object.matrixWorld),
    );
    const merged = mergeGeometries(source, false);
    source.forEach((geometry) => geometry.dispose());
    if (!merged) continue;
    const shared = new Set(objects.map((object) => object.geometry));
    objects.forEach((object) => object.removeFromParent());
    shared.forEach((geometry) => geometry.dispose());
    const object = new T.Mesh(merged, objects[0].material);
    object.castShadow = !economy;
    object.receiveShadow = true;
    scene.add(object);
  }
  let disposed = false;
  return {
    scene,
    update(local: number, camera: T.PerspectiveCamera) {
      const p = T.MathUtils.clamp(local, 0, 1);
      const underground = Math.sin(p * Math.PI);
      worm.position.x = Math.sin(p * Math.PI * 2) * 0.035;
      worm.rotation.z = Math.sin(p * Math.PI * 2) * 0.008;
      larva.rotation.z = Math.sin(p * Math.PI * 2) * 0.012;
      dust.position.y = Math.sin(p * Math.PI * 2) * 0.055;
      labels.forEach((object, index) => {
        object.position.copy(labelAnchors[index]);
        object.getWorldPosition(labelPoint).project(camera);
        object.visible =
          camera.aspect >= 1.2 &&
          underground > 0.28 &&
          labelPoint.z > -1 &&
          labelPoint.z < 1 &&
          labelPoint.x > -0.2 &&
          labelPoint.x < 0.85 &&
          labelPoint.y < 0.55;
        if (object.visible && labelPoint.y < -0.42) {
          labelPoint.y = -0.42;
          object.position.copy(
            object.parent!.worldToLocal(labelPoint.unproject(camera)),
          );
        }
      });
      topNotice.visible = camera.aspect >= 1.2 && underground < 0.82;
      warm.intensity = 22 + underground * 7;
      return { immersion: 0 };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      sun.shadow.map?.dispose();
      const geometries = new Set<T.BufferGeometry>(),
        materials = new Set<T.Material>();
      scene.traverse((object) => {
        if (
          object instanceof T.Mesh ||
          object instanceof T.Points ||
          object instanceof T.Line ||
          object instanceof T.Sprite
        ) {
          if (!(object instanceof T.Sprite)) geometries.add(object.geometry);
          const list = Array.isArray(object.material)
            ? object.material
            : [object.material];
          list.forEach((material) => {
            materials.add(material);
            for (const value of Object.values(material))
              if (value instanceof T.Texture) extraTextures.add(value);
          });
          if (object instanceof T.InstancedMesh) object.dispose();
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      extraTextures.forEach((texture) => texture.dispose());
      extraTextures.clear();
      scene.clear();
    },
  };
}
