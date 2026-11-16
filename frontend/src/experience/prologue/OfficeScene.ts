import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { seededRandom } from "../world-utils";

/** Office-only resources. No existing world material, light or geometry is mutated. */
export function createOfficeScene(
  scene: T.Scene,
  economy: boolean,
  invalidate: () => void,
) {
  const group = new T.Group();
  group.name = "symbiose-office-prologue";
  const textures = new Set<T.Texture>();
  const materials = new Set<T.Material>();
  const geometries = new Set<T.BufferGeometry>();
  let disposed = false;
  const random = seededRandom(2066);
  const canvasTexture = (
    draw: (ctx: CanvasRenderingContext2D) => void,
    width = 1024,
    height = 1024,
  ) => {
    const canvas = document.createElement("canvas");
    const scale = economy && width === 1024 ? 0.5 : 1;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);
    draw(ctx);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = economy ? 2 : 4;
    textures.add(texture);
    return texture;
  };
  const material = (parameters: T.MeshStandardMaterialParameters) => {
    const m = new T.MeshStandardMaterial(parameters);
    materials.add(m);
    return m;
  };
  const oakMap = canvasTexture((ctx) => {
    ctx.fillStyle = "#af8156";
    ctx.fillRect(0, 0, 1024, 1024);
    for (let x = 0; x < 1024; x++) {
      const line = Math.sin(x * 0.032) * 5 + Math.sin(x * 0.086) * 3;
      ctx.strokeStyle = `rgba(${line > 0 ? "247,216,168" : "71,40,18"},${0.02 + random() * 0.085})`;
      ctx.lineWidth = 0.3 + random() * 1.8;
      ctx.beginPath();
      for (let y = 0; y <= 1024; y += 12) {
        const offset =
          Math.sin(y * 0.003 + x * 0.013) * 5 +
          Math.sin(y * 0.014 + x * 0.09) * 1.1;
        if (!y) ctx.moveTo(x + offset, y);
        else ctx.lineTo(x + offset, y);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 30; i++) {
      const x = random() * 1024,
        y = random() * 1024;
      ctx.strokeStyle = "#4f341b18";
      for (let j = 0; j < 9; j++) {
        ctx.beginPath();
        ctx.ellipse(x, y, 3 + j * 1.5, 10 + j * 6, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  });
  oakMap.wrapS = oakMap.wrapT = T.RepeatWrapping;
  const grainNormal = economy
    ? undefined
    : canvasTexture((ctx) => {
        const image = ctx.createImageData(1024, 1024);
        for (let i = 0; i < image.data.length; i += 4) {
          const x = (i / 4) % 1024,
            y = Math.floor(i / 4096);
          image.data[i] = 128 + Math.sin(x * 0.8 + Math.sin(y * 0.015)) * 13;
          image.data[i + 1] = 128 + Math.sin(x * 0.04 + y * 0.012) * 3;
          image.data[i + 2] = 254;
          image.data[i + 3] = 255;
        }
        ctx.putImageData(image, 0, 0);
      });
  if (grainNormal) {
    grainNormal.colorSpace = T.NoColorSpace;
    grainNormal.wrapS = grainNormal.wrapT = T.RepeatWrapping;
  }
  const roughMap = economy
    ? undefined
    : canvasTexture((ctx) => {
        ctx.fillStyle = "#c7c7c7";
        ctx.fillRect(0, 0, 1024, 1024);
        for (let i = 0; i < 14000; i++) {
          ctx.fillStyle = `rgba(40,40,40,${random() * 0.1})`;
          ctx.fillRect(
            random() * 1024,
            random() * 1024,
            0.6,
            7 + random() * 25,
          );
        }
      });
  if (roughMap) roughMap.colorSpace = T.NoColorSpace;
  const oak = material({
    color: "#e1b17c",
    map: oakMap,
    normalMap: grainNormal,
    normalScale: new T.Vector2(0.16, 0.16),
    roughnessMap: roughMap,
    roughness: 0.72,
  });
  const darkOak = material({
    color: "#735c40",
    map: oakMap,
    normalMap: grainNormal,
    normalScale: new T.Vector2(0.12, 0.12),
    roughness: 0.8,
  });
  const plasterMap = canvasTexture((ctx) => {
    ctx.fillStyle = "#ded9cb";
    ctx.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 60000; i++) {
      ctx.fillStyle = random() > 0.5 ? "#fff1" : "#59482a08";
      ctx.fillRect(
        random() * 1024,
        random() * 1024,
        1 + random() * 3,
        1 + random() * 3,
      );
    }
  });
  const plaster = material({
    color: "#e2daca",
    map: plasterMap,
    roughness: 0.98,
  });
  const sage = material({ color: "#536052", map: plasterMap, roughness: 0.95 });
  const metal = material({
    color: "#232d2b",
    metalness: 0.62,
    roughness: 0.38,
  });
  const bronze = material({
    color: "#827052",
    metalness: 0.72,
    roughness: 0.45,
  });
  const paper = material({ color: "#e2ddc4", roughness: 0.97 });
  const ceramic = material({ color: "#bbb2a0", roughness: 0.62 });
  const linen = material({ color: "#6c7668", map: roughMap, roughness: 0.97 });
  const black = material({
    color: "#141b19",
    roughness: 0.62,
    metalness: 0.12,
  });
  const glass = new T.MeshPhysicalMaterial({
    color: "#a0b6ae",
    roughness: 0.12,
    metalness: 0.1,
    transparent: true,
    opacity: 0.14,
    side: T.DoubleSide,
    depthWrite: false,
  });
  materials.add(glass);
  const rounded = (
    width: number,
    height: number,
    depth: number,
    x: number,
    y: number,
    z: number,
    m: T.Material,
    radius = 0.035,
  ) => {
    const geometry = new RoundedBoxGeometry(
      width,
      height,
      depth,
      economy ? 1 : 2,
      Math.min(radius, width / 4, height / 4, depth / 4),
    );
    geometries.add(geometry);
    const mesh = new T.Mesh(geometry, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = !m.transparent;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const box = (
    width: number,
    height: number,
    depth: number,
    x: number,
    y: number,
    z: number,
    m: T.Material,
  ) => {
    const geometry = new T.BoxGeometry(width, height, depth);
    geometries.add(geometry);
    const mesh = new T.Mesh(geometry, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = !m.transparent;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const cylinder = (
    top: number,
    bottom: number,
    height: number,
    x: number,
    y: number,
    z: number,
    m: T.Material,
  ) => {
    const geometry = new T.CylinderGeometry(
      top,
      bottom,
      height,
      economy ? 12 : 24,
    );
    geometries.add(geometry);
    const mesh = new T.Mesh(geometry, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const panel = (
    map: T.Texture,
    width: number,
    height: number,
    x: number,
    y: number,
    z: number,
    angle = 0,
  ) => {
    const geometry = new T.PlaneGeometry(width, height);
    geometries.add(geometry);
    const m = material({ map, roughness: 0.9, side: T.DoubleSide });
    const mesh = new T.Mesh(geometry, m);
    mesh.position.set(x, y, z);
    mesh.rotation.y = angle;
    group.add(mesh);
    return mesh;
  };

  // Raised timber slab sits above the existing landscape; the terrace meets it naturally.
  box(18.2, 0.35, 25.2, 0, 1.075, 44.5, darkOak);
  const floorMap = oakMap.clone();
  floorMap.repeat.set(9, 5);
  textures.add(floorMap);
  const floor = material({
    color: "#bbae91",
    map: floorMap,
    normalMap: grainNormal,
    normalScale: new T.Vector2(0.08, 0.08),
    roughness: 0.82,
  });
  box(18, 0.06, 25, 0, 1.28, 44.5, floor);
  // Fine expansion joints are physical gaps, not a low-resolution floor photograph.
  const joints = new T.BufferGeometry();
  const jointVertices: number[] = [];
  for (let x = -8.4; x < 9; x += 0.9)
    jointVertices.push(x, 1.315, 32, x, 1.315, 57);
  for (let z = 34; z < 57; z += 4.8)
    jointVertices.push(-9, 1.315, z, 9, 1.315, z);
  joints.setAttribute(
    "position",
    new T.Float32BufferAttribute(jointVertices, 3),
  );
  geometries.add(joints);
  const jointMaterial = new T.LineBasicMaterial({
    color: "#5b4d36",
    transparent: true,
    opacity: 0.35,
  });
  materials.add(jointMaterial);
  group.add(new T.LineSegments(joints, jointMaterial));
  box(18, 0.2, 25, 0, 7.7, 44.5, plaster);
  box(0.25, 6.5, 25, -9, 4.5, 44.5, plaster);
  box(0.25, 6.5, 25, 9, 4.5, 44.5, sage);
  box(18, 6.5, 0.22, 0, 4.5, 57, sage);
  box(0.13, 0.22, 25, -8.82, 1.42, 44.5, darkOak);
  box(0.13, 0.22, 25, 8.82, 1.42, 44.5, darkOak);
  // Glazed elevation: an explicitly OPEN four-metre passage, never a glass collision.
  box(18, 0.25, 0.3, 0, 7.5, 32, metal);
  for (const x of [-8.9, -4.1, 0.1, 4.4, 8.9])
    box(0.12, 6.1, 0.15, x, 4.3, 32, metal);
  for (const [x, width] of [
    [-6.5, 4.65],
    [2.25, 4.15],
    [6.7, 4.25],
  ]) {
    box(width, 5.85, 0.035, x, 4.32, 32, glass);
    box(width, 0.1, 0.2, x, 1.4, 32, metal);
  }
  // Folded-back glass door occupies the side of the opening, not its centre.
  const openDoor = box(0.04, 5.8, 3.3, -4.05, 4.3, 33.65, glass);
  openDoor.rotation.y = -0.05;
  box(0.09, 5.8, 0.09, -4.05, 4.3, 35.3, metal);
  box(0.14, 0.5, 0.08, -3.95, 3.9, 35.04, bronze);
  box(4.2, 0.16, 4, -2, 1.2, 30, darkOak);
  box(4.4, 0.15, 1, -2, 1.08, 27.5, darkOak);
  // Ceiling beams, acoustic baffles and the warm indirect light line.
  for (const z of [36, 43, 50, 56]) box(18, 0.18, 0.15, 0, 7.48, z, darkOak);
  box(
    0.07,
    0.06,
    19,
    8.75,
    7.36,
    45,
    material({
      color: "#fff0c9",
      emissive: "#ffe3af",
      emissiveIntensity: 1.7,
      roughness: 0.7,
    }),
  );
  for (let i = 0; i < 9; i++)
    box(0.06, 0.55, 5.2, 1.2 + i * 0.55, 7.3, 49.5, linen);

  // A freestanding oak presentation partition leaves the route to the open bay clear.
  box(7.5, 5.9, 0.18, 3.1, 4.2, 36.55, sage);
  for (let i = 0; i < 27; i++)
    box(0.09, 5.8, 0.1, -0.45 + i * 0.27, 4.2, 36.7, oak);
  const poster = canvasTexture(
    (ctx) => {
      const gradient = ctx.createLinearGradient(0, 0, 1600, 900);
      gradient.addColorStop(0, "#18372b");
      gradient.addColorStop(1, "#0a1b17");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1600, 900);
      ctx.strokeStyle = "#afbc8c35";
      ctx.lineWidth = 1.2;
      for (let j = 0; j < 15; j++) {
        ctx.beginPath();
        for (let i = 0; i < 85; i++) {
          const x = 850 + i * 13,
            y = 30 + j * 70 + Math.sin(i * 0.13 + j * 0.4) * 58;
          if (!i) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.fillStyle = "#c5e7a6";
      ctx.font = "500 25px 'Segoe UI', sans-serif";
      ctx.fillText("SYMBIOSE · NORMANDIE", 110, 160);
      ctx.fillStyle = "#f4f3e4";
      ctx.font = "500 91px 'Segoe UI', sans-serif";
      ctx.fillText("Du bureau", 105, 360);
      ctx.fillText("au vivant.", 105, 470);
      ctx.fillStyle = "#c5cdb8";
      ctx.font = "28px 'Segoe UI', sans-serif";
      ctx.fillText("Observer. Comprendre. Préserver.", 110, 580);
      ctx.strokeStyle = "#bdd694";
      ctx.beginPath();
      ctx.moveTo(110, 667);
      ctx.lineTo(220, 667);
      ctx.stroke();
      ctx.fillStyle = "#c5cdb8";
      ctx.font = "21px 'Segoe UI', sans-serif";
      ctx.fillText("DATATHON NORMANDIE 2026", 110, 735);
    },
    1600,
    900,
  );
  rounded(5.84, 3.39, 0.17, 2.5, 3.1, 36.91, black, 0.06);
  const screenMaterial = material({
    map: poster,
    emissiveMap: poster,
    emissive: "#ffffff",
    emissiveIntensity: 0.4,
    roughness: 0.68,
    metalness: 0,
    envMapIntensity: 0.04,
    toneMapped: false,
  });
  const screenGeometry = new T.PlaneGeometry(5.6, 3.15);
  geometries.add(screenGeometry);
  const screen = new T.Mesh(screenGeometry, screenMaterial);
  screen.position.set(2.5, 3.1, 37.01);
  screen.name = "symbiose-office-screen";
  group.add(screen);
  box(
    0.018,
    0.018,
    0.018,
    5.13,
    1.52,
    37.02,
    material({ color: "#c9e49b", emissive: "#c9e49b", emissiveIntensity: 1 }),
  );
  box(6.7, 0.22, 0.75, 2.5, 1.58, 37.1, oak);
  // Small soundbar under the screen, discrete observer equipment rather than futuristic UI.
  rounded(1.4, 0.13, 0.14, 2.5, 1.77, 37.38, metal, 0.04);

  // Main worktable and its tactile foreground still-life.
  rounded(4.6, 0.15, 2.45, 4.7, 2.2, 43.5, oak, 0.06);
  for (const x of [2.8, 6.6])
    for (const z of [42.6, 44.4]) box(0.12, 0.95, 0.13, x, 1.73, z, metal);
  box(3.9, 0.08, 0.1, 4.7, 1.48, 44.4, metal);
  rounded(
    2.8,
    0.018,
    1.35,
    4.6,
    2.286,
    43.45,
    material({ color: "#536355", roughness: 1 }),
    0.03,
  );
  // Notebook, stitched binding and pencil.
  rounded(0.78, 0.065, 1.05, 3.7, 2.34, 43.7, darkOak, 0.035).rotation.y = 0.15;
  rounded(0.73, 0.025, 0.99, 3.7, 2.379, 43.7, paper, 0.015).rotation.y = 0.15;
  const pencil = cylinder(0.011, 0.011, 0.7, 4.2, 2.33, 43.6, bronze);
  pencil.rotation.z = Math.PI / 2;
  pencil.rotation.y = 0.25;
  const pages = box(1.12, 0.018, 0.85, 5.4, 2.316, 43.6, paper);
  pages.rotation.y = -0.12;
  // Labelled field record: only descriptive text, no invented measurements or species claims.
  const noteMap = canvasTexture((ctx) => {
    ctx.fillStyle = "#eae4ce";
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.fillStyle = "#355146";
    ctx.font = "42px 'Segoe UI', sans-serif";
    ctx.fillText("CARNET DE TERRAIN", 80, 135);
    ctx.strokeStyle = "#71816e55";
    ctx.lineWidth = 2;
    for (let y = 220; y < 950; y += 75) {
      ctx.beginPath();
      ctx.moveTo(80, y);
      ctx.lineTo(944, y);
      ctx.stroke();
    }
    ctx.font = "27px 'Segoe UI', sans-serif";
    ctx.fillText("Lieu · habitat · observations", 80, 200);
  });
  const note = panel(noteMap, 0.68, 0.9, 3.7, 2.396, 43.7);
  note.rotation.x = -Math.PI / 2;
  note.rotation.z = 0.15;
  // Closed laptop with metal case, field binoculars and ceramic cup.
  rounded(1.2, 0.06, 0.82, 5.65, 2.33, 42.8, metal, 0.045);
  rounded(0.11, 0.018, 0.06, 5.65, 2.365, 42.8, bronze, 0.008);
  cylinder(0.11, 0.085, 0.23, 6.4, 2.42, 43.8, ceramic);
  cylinder(
    0.085,
    0.085,
    0.009,
    6.4,
    2.54,
    43.8,
    material({ color: "#392c21", roughness: 0.3 }),
  );
  for (const x of [2.85, 3.14]) {
    const barrel = cylinder(0.075, 0.095, 0.36, x, 2.38, 42.8, black);
    barrel.rotation.x = Math.PI / 2;
  }
  rounded(0.25, 0.11, 0.15, 3, 2.39, 42.8, black, 0.03);
  // A task lamp with real geometry and a restrained light pool.
  cylinder(0.22, 0.25, 0.04, 6.3, 2.3, 42.65, metal);
  const lampStem = cylinder(0.02, 0.02, 0.72, 6.3, 2.67, 42.65, bronze);
  lampStem.rotation.z = 0.22;
  const lampShade = cylinder(0.23, 0.13, 0.17, 6.21, 3.04, 42.65, metal);
  lampShade.rotation.z = 0.2;
  const lampLight = new T.PointLight("#ffdeb2", 4, 3, 2);
  lampLight.position.set(6.2, 2.92, 42.65);
  group.add(lampLight);
  // Chair with curved upholstered back and slender legs.
  rounded(1.05, 0.15, 1.05, 4.9, 1.87, 45.6, linen, 0.08);
  const chairBack = rounded(1.04, 0.82, 0.13, 4.9, 2.3, 46.1, linen, 0.065);
  chairBack.rotation.x = -0.1;
  for (const x of [4.5, 5.3])
    for (const z of [45.25, 45.95]) box(0.045, 0.55, 0.045, x, 1.58, z, metal);

  // Left-side work display: original diagram, explicitly schematic rather than fake data.
  const mapTexture = canvasTexture(
    (ctx) => {
      ctx.fillStyle = "#dfddc9";
      ctx.fillRect(0, 0, 1400, 1000);
      ctx.fillStyle = "#2f4d3b";
      ctx.font = "500 39px 'Segoe UI', sans-serif";
      ctx.fillText("NORMANDIE", 80, 100);
      ctx.font = "21px 'Segoe UI', sans-serif";
      ctx.fillText("Territoires & milieux · schéma illustratif", 80, 145);
      ctx.strokeStyle = "#71836660";
      ctx.lineWidth = 2;
      for (let j = 0; j < 19; j++) {
        ctx.beginPath();
        for (let i = 0; i < 120; i++) {
          const x = 30 + i * 12,
            y =
              220 +
              j * 40 +
              Math.sin(i * 0.065 + j * 0.24) * 50 +
              Math.cos(i * 0.13 + j * 0.6) * 22;
          if (!i) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.strokeStyle = "#284c3a";
      ctx.fillStyle = "#a8b59d55";
      ctx.lineWidth = 5;
      // Hand-drawn situation outline, never presented as a cadastral boundary.
      ctx.beginPath();
      ctx.moveTo(260, 280);
      ctx.lineTo(305, 292);
      ctx.lineTo(318, 420);
      ctx.lineTo(490, 482);
      ctx.lineTo(660, 447);
      ctx.lineTo(810, 402);
      ctx.lineTo(965, 345);
      ctx.lineTo(1090, 300);
      ctx.lineTo(1195, 393);
      ctx.lineTo(1122, 546);
      ctx.lineTo(1010, 585);
      ctx.lineTo(920, 737);
      ctx.lineTo(756, 788);
      ctx.lineTo(623, 715);
      ctx.lineTo(478, 758);
      ctx.lineTo(370, 687);
      ctx.lineTo(250, 620);
      ctx.lineTo(280, 509);
      ctx.lineTo(240, 405);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#2f4d3b";
      ctx.font = "22px 'Segoe UI', sans-serif";
      ctx.fillText("Observer les liens entre les milieux", 80, 920);
    },
    1400,
    1000,
  );
  rounded(0.1, 2.9, 4.1, -8.76, 4.5, 42.7, oak, 0.02);
  panel(mapTexture, 3.88, 2.72, -8.695, 4.5, 42.7, Math.PI / 2);
  // Parcel sketch pinned onto a second board. No claim of geolocation.
  const parcelTexture = canvasTexture((ctx) => {
    ctx.fillStyle = "#e2dfca";
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.fillStyle = "#405840";
    ctx.font = "38px 'Segoe UI', sans-serif";
    ctx.fillText("PARCELLES & HABITATS", 75, 110);
    ctx.font = "24px 'Segoe UI', sans-serif";
    ctx.fillText("Croquis d’étude · non géolocalisé", 75, 160);
    const shapes = [
      [
        [80, 280],
        [400, 220],
        [390, 520],
        [80, 600],
      ],
      [
        [430, 220],
        [850, 270],
        [790, 540],
        [420, 510],
      ],
      [
        [90, 640],
        [390, 560],
        [470, 880],
        [110, 880],
      ],
      [
        [430, 550],
        [780, 580],
        [890, 880],
        [510, 880],
      ],
    ];
    shapes.forEach((p, i) => {
      ctx.fillStyle = ["#a1ad87", "#b8bb92", "#c0bb90", "#97a17f"][i];
      ctx.strokeStyle = "#62714f";
      ctx.lineWidth = 8;
      ctx.beginPath();
      p.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
    ctx.strokeStyle = "#6a8a8b";
    ctx.lineWidth = 17;
    ctx.beginPath();
    ctx.moveTo(50, 620);
    ctx.bezierCurveTo(300, 490, 640, 560, 940, 570);
    ctx.stroke();
  });
  rounded(0.08, 2.25, 2.25, -8.76, 4.3, 48.25, oak, 0.015);
  panel(parcelTexture, 2.12, 2.12, -8.7, 4.3, 48.25, Math.PI / 2);

  // Sideboard: books, a recognisable trail camera and acoustic recorder.
  rounded(1.05, 1.25, 5.3, -7.95, 1.93, 37.3, darkOak, 0.04);
  for (const z of [35.5, 37.35, 39.2])
    box(0.03, 1, 0.025, -7.4, 1.95, z, bronze);
  box(1.2, 0.09, 5.5, -7.95, 2.6, 37.3, oak);
  for (const y of [3.75, 5.1]) box(0.95, 0.09, 5.4, -8.4, y, 37.3, oak);
  for (let i = 0; i < 9; i++) {
    const b = rounded(
      0.45,
      0.43 + random() * 0.18,
      0.09,
      -8.22,
      4.02 + random() * 0.05,
      35.12 + i * 0.13,
      i % 3 === 0 ? sage : i % 3 === 1 ? linen : paper,
      0.007,
    );
    b.rotation.x = (random() - 0.5) * 0.08;
  }
  rounded(
    0.35,
    0.5,
    0.38,
    -8.1,
    4.08,
    37.2,
    material({ color: "#4d5540", roughness: 0.85 }),
    0.04,
  );
  const lens = cylinder(0.075, 0.09, 0.065, -7.895, 4.16, 37.2, black);
  lens.rotation.z = Math.PI / 2;
  const lensGlass = cylinder(
    0.054,
    0.054,
    0.007,
    -7.857,
    4.16,
    37.2,
    material({ color: "#283a3a", metalness: 0.5, roughness: 0.06 }),
  );
  lensGlass.rotation.z = Math.PI / 2;
  rounded(0.015, 0.08, 0.13, -7.916, 3.98, 37.2, black, 0.008);
  rounded(0.23, 0.36, 0.15, -8.1, 5.33, 38, metal, 0.025);
  const microphone = cylinder(0.035, 0.035, 0.29, -8.1, 5.65, 38, black);
  microphone.rotation.z = 0.13;
  rounded(0.018, 0.1, 0.11, -7.975, 5.34, 38, sage, 0.005);
  for (let i = 0; i < 3; i++)
    rounded(
      0.5,
      0.04,
      0.65,
      -7.8,
      2.67 + i * 0.045,
      39.1,
      i === 2 ? sage : paper,
      0.01,
    );

  // Plants are constructed from thin curved leaves: actual silhouettes with parallax.
  const leafMaterial = material({
    color: "#3e5a34",
    roughness: 0.8,
    side: T.DoubleSide,
  });
  const stemMaterial = material({ color: "#566847", roughness: 0.9 });
  const plant = (x: number, z: number, scale: number) => {
    cylinder(
      0.26 * scale,
      0.19 * scale,
      0.5 * scale,
      x,
      1.32 + 0.25 * scale,
      z,
      ceramic,
    );
    cylinder(
      0.23 * scale,
      0.23 * scale,
      0.015,
      x,
      1.32 + 0.5 * scale,
      z,
      material({ color: "#343326", roughness: 1 }),
    );
    for (let i = 0; i < (economy ? 7 : 12); i++) {
      const angle = i * 2.4,
        length = (0.5 + random() * 0.7) * scale;
      const y = 1.32 + 0.5 * scale;
      const curve = new T.CatmullRomCurve3([
        new T.Vector3(x, y, z),
        new T.Vector3(
          x + Math.cos(angle) * 0.12 * scale,
          y + length * 0.5,
          z + Math.sin(angle) * 0.12 * scale,
        ),
        new T.Vector3(
          x + Math.cos(angle) * 0.55 * scale,
          y + length * 0.9,
          z + Math.sin(angle) * 0.55 * scale,
        ),
      ]);
      const stemGeometry = new T.TubeGeometry(
        curve,
        8,
        0.009 * scale,
        4,
        false,
      );
      geometries.add(stemGeometry);
      group.add(new T.Mesh(stemGeometry, stemMaterial));
      const leafGeometry = new T.SphereGeometry(
        1,
        economy ? 6 : 10,
        6,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2,
      );
      leafGeometry.scale(0.13 * scale, 0.035 * scale, 0.38 * scale);
      geometries.add(leafGeometry);
      const leaf = new T.Mesh(leafGeometry, leafMaterial);
      leaf.position.copy(curve.getPoint(1));
      leaf.rotation.set(0.2, angle, Math.cos(angle) * 0.3);
      leaf.castShadow = true;
      group.add(leaf);
    }
  };
  plant(7.7, 34.3, 1.6);
  plant(-6.3, 33.8, 1.2);
  // A restrained warm source stays local to the room; exterior lighting is untouched.
  const roomLight = new T.PointLight("#ffdfb0", 35, 18, 2);
  roomLight.position.set(2.2, 6.7, 47);
  group.add(roomLight);
  // The screen emits towards the viewers. An omnidirectional lamp in front of
  // it would reflect a bright artificial hotspot straight into the camera.
  const screenLight = new T.SpotLight("#c9e2d4", 3.5, 7, 1.1, 1, 2);
  screenLight.position.set(2.5, 3.1, 37.2);
  screenLight.target.position.set(2.5, 2.6, 43.5);
  group.add(screenLight, screenLight.target);
  // Soft baked contact shadows belong to the office only and disappear with it.
  const contactMap = canvasTexture((ctx) => {
    const g = ctx.createRadialGradient(512, 512, 40, 512, 512, 490);
    g.addColorStop(0, "rgba(9,17,11,.43)");
    g.addColorStop(1, "rgba(9,17,11,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 1024);
  });
  const contactMaterial = new T.MeshBasicMaterial({
    map: contactMap,
    transparent: true,
    depthWrite: false,
    opacity: 0.85,
  });
  materials.add(contactMaterial);
  const contactGeometry = new T.PlaneGeometry(7.3, 5.4);
  geometries.add(contactGeometry);
  const contact = new T.Mesh(contactGeometry, contactMaterial);
  contact.rotation.x = -Math.PI / 2;
  contact.position.set(4.7, 1.323, 43.6);
  group.add(contact);
  // Instanced sun shafts sit inside the glazed elevation, not over the forest.
  const shaftMaterial = new T.MeshBasicMaterial({
    color: "#fff0c8",
    transparent: true,
    opacity: 0.055,
    depthWrite: false,
    side: T.DoubleSide,
  });
  materials.add(shaftMaterial);
  for (const x of [1, 4.8, 8]) {
    const shaft = box(0.035, 0.01, 16, x, 1.335, 40, shaftMaterial);
    shaft.rotation.y = -0.45;
    shaft.scale.x = 14;
  }
  const dustGeometry = new T.BufferGeometry();
  const dustPositions = new Float32Array((economy ? 24 : 60) * 3);
  for (let i = 0; i < dustPositions.length; i += 3) {
    dustPositions[i] = -7 + random() * 14;
    dustPositions[i + 1] = 1.6 + random() * 5;
    dustPositions[i + 2] = 33 + random() * 20;
  }
  dustGeometry.setAttribute(
    "position",
    new T.BufferAttribute(dustPositions, 3),
  );
  geometries.add(dustGeometry);
  const dustMaterial = new T.PointsMaterial({
    color: "#e9e6cb",
    size: 0.022,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  });
  materials.add(dustMaterial);
  const dust = new T.Points(dustGeometry, dustMaterial);
  group.add(dust);

  // Official mark, loaded locally without introducing a replacement logo.
  const logoImage = new Image();
  logoImage.onload = () => {
    if (disposed) return;
    const logoTexture = new T.Texture(logoImage);
    logoTexture.colorSpace = T.SRGBColorSpace;
    logoTexture.needsUpdate = true;
    textures.add(logoTexture);
    const logoMaterial = new T.MeshBasicMaterial({
      map: logoTexture,
      transparent: true,
      depthWrite: false,
    });
    materials.add(logoMaterial);
    const geo = new T.PlaneGeometry(1.65, 0.564);
    geometries.add(geo);
    const logo = new T.Mesh(geo, logoMaterial);
    logo.position.set(3.1, 5.71, 36.82);
    group.add(logo);
    invalidate();
  };
  logoImage.src = "/experience-art/shared/symbiose-logo.png";
  let videoTexture: T.VideoTexture | undefined;
  let attachedVideo: HTMLVideoElement | null = null;
  const refreshVideoSurface = () => {
    const ready =
      !!attachedVideo && attachedVideo.readyState >= 2 && !attachedVideo.error;
    const next = ready && videoTexture ? videoTexture : poster;
    if (screenMaterial.map !== next) {
      screenMaterial.map = screenMaterial.emissiveMap = next;
      screenMaterial.needsUpdate = true;
    }
    invalidate();
  };
  const detachVideoEvents = () => {
    attachedVideo?.removeEventListener("loadeddata", refreshVideoSurface);
    attachedVideo?.removeEventListener("error", refreshVideoSurface);
    attachedVideo?.removeEventListener("play", refreshVideoSurface);
    attachedVideo?.removeEventListener("pause", refreshVideoSurface);
    attachedVideo?.removeEventListener("seeking", refreshVideoSurface);
  };
  const setVideo = (video: HTMLVideoElement | null) => {
    if (video === attachedVideo || disposed) return;
    detachVideoEvents();
    attachedVideo = video;
    videoTexture?.dispose();
    videoTexture = undefined;
    if (video) {
      videoTexture = new T.VideoTexture(video);
      videoTexture.colorSpace = T.SRGBColorSpace;
      videoTexture.minFilter = T.LinearFilter;
      videoTexture.magFilter = T.LinearFilter;
      video.addEventListener("loadeddata", refreshVideoSurface);
      video.addEventListener("error", refreshVideoSurface);
      video.addEventListener("play", refreshVideoSurface);
      video.addEventListener("pause", refreshVideoSurface);
      video.addEventListener("seeking", refreshVideoSurface);
    }
    refreshVideoSurface();
  };
  // Static furniture is merged by material and shadow policy: the entire room
  // adds a few dozen draw calls rather than one call for every slat or book.
  // The video surface and animated dust remain independent.
  const batches = new Map<string, T.Mesh<T.BufferGeometry, T.Material>[]>();
  for (const object of [...group.children]) {
    if (
      !(object instanceof T.Mesh) ||
      object === screen ||
      Array.isArray(object.material)
    )
      continue;
    const key = `${object.material.uuid}:${object.castShadow}:${object.receiveShadow}`;
    const batch = batches.get(key) ?? [];
    batch.push(object as T.Mesh<T.BufferGeometry, T.Material>);
    batches.set(key, batch);
  }
  for (const objects of batches.values()) {
    if (objects.length < 2) continue;
    const copies = objects.map((object) => {
      object.updateMatrix();
      return (
        object.geometry.index
          ? object.geometry.toNonIndexed()
          : object.geometry.clone()
      ).applyMatrix4(object.matrix);
    });
    const merged = mergeGeometries(copies, false);
    copies.forEach((copy) => copy.dispose());
    if (!merged) continue;
    geometries.add(merged);
    const mesh = new T.Mesh(merged, objects[0].material);
    mesh.castShadow = objects[0].castShadow;
    mesh.receiveShadow = objects[0].receiveShadow;
    objects.forEach((object) => object.removeFromParent());
    group.add(mesh);
  }
  scene.add(group);
  return {
    group,
    screen,
    update(local: number, elapsed: number, reduced: boolean) {
      group.visible = local < 1;
      if (!group.visible) return;
      dust.position.y = reduced ? 0 : Math.sin(elapsed * 0.09) * 0.055;
      dust.position.x = reduced ? 0 : Math.sin(elapsed * 0.07) * 0.045;
      screenLight.intensity = videoTexture ? 5 : 3.5;
    },
    setVideo,
    dispose() {
      if (disposed) return;
      disposed = true;
      logoImage.onload = null;
      logoImage.src = "";
      detachVideoEvents();
      videoTexture?.dispose();
      videoTexture = undefined;
      attachedVideo = null;
      group.removeFromParent();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      group.clear();
    },
  };
}

export type OfficeScene = ReturnType<typeof createOfficeScene>;
