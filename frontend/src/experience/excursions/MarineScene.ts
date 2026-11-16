import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createCoast } from "../world-coast";
import { disposeScene, seededRandom } from "../world-utils";
import type { Vec3 } from "../config";
import type { AnimalBox } from "../world-fauna";

type MarineFishKind = "mackerel" | "pollack" | "plaice";
const fishLabels: Record<MarineFishKind, string> = {
  mackerel: "Maquereau · illustration",
  pollack: "Lieu jaune · illustration",
  plaice: "Plie · illustration",
};

/** Project one instance, rather than the bounding volume of its entire shoal. */
export function projectMarineFishBox(
  geometry: T.BufferGeometry,
  matrixWorld: T.Matrix4,
  camera: T.PerspectiveCamera,
) {
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  if (!bounds || bounds.isEmpty()) return undefined;
  const points: T.Vector3[] = [];
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) {
        const point = new T.Vector3(x, y, z)
          .applyMatrix4(matrixWorld)
          .project(camera);
        if (
          !Number.isFinite(point.x + point.y + point.z) ||
          point.z < -1 ||
          point.z > 1
        )
          return undefined;
        points.push(point);
      }
  const x = (Math.min(...points.map((point) => point.x)) + 1) / 2;
  const y = (1 - Math.max(...points.map((point) => point.y))) / 2;
  const width = (Math.max(...points.map((point) => point.x)) + 1) / 2 - x;
  const height = (1 - Math.min(...points.map((point) => point.y))) / 2 - y;
  // Leave the copy, header and presentation controls unobstructed. Never move
  // an offscreen fish's box to an unrelated position at the viewport edge.
  return x < 0.42 ||
    y < 0.18 ||
    x + width > 0.97 ||
    y + height > 0.75 ||
    width < 0.015 ||
    height < 0.003
    ? undefined
    : { x, y, width, height };
}

/** Three deliberately illustrative silhouettes, independent of the analysis pipeline. */
function marineFishGeometry(kind: MarineFishKind) {
  const parts: T.BufferGeometry[] = [];
  const paint = (
    source: T.BufferGeometry,
    color: T.Color | ((point: T.Vector3) => T.Color),
  ) => {
    const geometry = source.index ? source.toNonIndexed() : source;
    if (geometry !== source) source.dispose();
    const position = geometry.getAttribute("position");
    const colors: number[] = [];
    const point = new T.Vector3();
    for (let i = 0; i < position.count; i++) {
      point.fromBufferAttribute(position, i);
      const value = typeof color === "function" ? color(point) : color;
      colors.push(value.r, value.g, value.b);
    }
    geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
    parts.push(geometry);
  };
  const flat = kind === "plaice";
  const body = new T.SphereGeometry(1, 32, 16);
  body.scale(
    flat ? 0.47 : 0.56,
    flat ? 0.055 : kind === "pollack" ? 0.18 : 0.13,
    flat ? 0.31 : 0.105,
  );
  const silver = new T.Color("#c6d6cf");
  const back = new T.Color(kind === "mackerel" ? "#297c87" : "#526943");
  const stripe = new T.Color(kind === "mackerel" ? "#173e50" : "#c5ac62");
  const sand = new T.Color("#8f9970");
  const orange = new T.Color("#eaa15b");
  paint(body, (point) => {
    if (flat) {
      const spots = Math.sin(point.x * 43) * Math.sin(point.z * 48);
      return point.y > 0.015 && spots > 0.62 ? orange : sand;
    }
    if (kind === "mackerel")
      return point.y > 0.025
        ? Math.sin(point.x * 48 + point.z * 27) > 0.35
          ? stripe
          : back
        : silver;
    return Math.abs(point.y - 0.015 - Math.sin(point.x * 3) * 0.025) < 0.035
      ? stripe
      : point.y > 0
        ? back
        : silver;
  });
  const fin = (coordinates: number[][], color: T.Color, horizontal = false) => {
    const shape = new T.Shape();
    coordinates.forEach(([x, y], index) =>
      index ? shape.lineTo(x, y) : shape.moveTo(x, y),
    );
    shape.closePath();
    const geometry = new T.ShapeGeometry(shape);
    if (horizontal) geometry.rotateX(-Math.PI / 2);
    paint(geometry, color);
  };
  fin(
    [
      [-0.39, 0],
      [-0.78, 0.2],
      [-0.67, 0],
      [-0.78, -0.2],
    ],
    flat ? sand : back,
    flat,
  );
  if (flat) {
    fin(
      [
        [-0.28, 0.21],
        [0.16, 0.4],
        [0.4, 0.14],
      ],
      sand,
      true,
    );
    fin(
      [
        [-0.28, -0.21],
        [0.16, -0.4],
        [0.4, -0.14],
      ],
      sand,
      true,
    );
  } else {
    fin(
      [
        [-0.22, 0.1],
        [-0.12, 0.3],
        [0.16, 0.12],
      ],
      back,
    );
    fin(
      [
        [-0.15, -0.1],
        [-0.27, -0.23],
        [0.18, -0.1],
      ],
      stripe,
    );
    fin(
      [
        [0.14, 0],
        [-0.12, 0.22],
        [-0.1, 0],
      ],
      silver,
      true,
    );
  }
  for (const side of [-1, 1]) {
    const eye = new T.SphereGeometry(0.025, 8, 6);
    eye.translate(
      flat ? 0.32 : 0.4,
      flat ? 0.052 : 0.035,
      side * (flat ? 0.09 : 0.08),
    );
    paint(eye, new T.Color("#122f32"));
  }
  const geometry = mergeGeometries(parts, false)!;
  parts.forEach((part) => part.dispose());
  geometry.computeBoundingBox();
  return geometry;
}

/** Illustrative offshore excursion; the first and last keys match the existing coast. */
export const marineCameraKeys: readonly {
  at: number;
  position: Vec3;
  target: Vec3;
  fov: number;
}[] = [
  { at: 0, position: [58, 55, -648], target: [-44, 18, -753], fov: 57 },
  { at: 0.18, position: [22, 13, -690], target: [-22, 8, -753], fov: 57 },
  { at: 0.33, position: [1, 0.45, -710], target: [-24, -2, -746], fov: 59 },
  { at: 0.43, position: [-14, -4, -720], target: [-36, -6, -745], fov: 60 },
  { at: 0.56, position: [-40, -6.4, -733], target: [-61, -5, -747], fov: 60 },
  { at: 0.69, position: [-58, -1.1, -718], target: [-36, 2, -755], fov: 59 },
  { at: 0.8, position: [-34, 7, -689], target: [-28, 14, -753], fov: 57 },
  { at: 1, position: [58, 55, -648], target: [-44, 18, -753], fov: 57 },
];

const smooth = (from: number, to: number, value: number) => {
  const t = T.MathUtils.clamp((value - from) / (to - from), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Own marine details; connected mode reuses the journey's coast and water. */
export function createMarineScene(economy: boolean, connected = false) {
  const abort = new AbortController();
  const bitmaps = new Set<ImageBitmap>();
  const ownedTextures = new Set<T.Texture>();
  let disposed = false;
  const scene = new T.Scene();
  scene.name = "marine-excursion";
  scene.background = new T.Color("#9baeb4");
  const fog = new T.FogExp2("#9baeb4", 0.0038);
  scene.fog = fog;
  const random = seededRandom(7532026);
  const phase = { value: 0 };
  const underwater = { value: 0 };
  const deepColor = new T.Color("#18535c");
  const sunDirection = new T.Vector3(-0.25, 0.76, 0.52).normalize();
  const ambient = new T.HemisphereLight("#b5d8df", "#233f3e", 1.25);
  const sun = new T.DirectionalLight("#fff1d2", 3.1);
  sun.position.set(20, 130, -650);
  sun.target.position.set(-35, -5, -735);
  scene.add(ambient, sun, sun.target);
  const coast = connected ? { group: new T.Group() } : createCoast();
  coast.group.traverse((object) => {
    if (object instanceof T.Mesh) {
      object.castShadow = false;
      object.receiveShadow = false;
    }
  });
  scene.add(coast.group);
  // Reuse the existing local CC0 cliff/grass maps, with independent texture ownership.
  const ready = (async () => {
    if (connected) return;
    try {
      const maps = await Promise.all(
        [
          ["rock_face_02-Diffuse.jpg", true],
          ["rock_face_02-nor_gl.jpg", false],
          ["rock_face_02-Rough.jpg", false],
          ["aerial_grass_rock-Diffuse.jpg", true],
        ].map(async ([name, color]) => {
          const response = await fetch(`/experience-models/${name}`, {
            signal: abort.signal,
          });
          if (!response.ok)
            throw new Error(`Local marine material unavailable: ${name}`);
          const bitmap = await createImageBitmap(await response.blob());
          if (disposed) {
            bitmap.close();
            return undefined;
          }
          bitmaps.add(bitmap);
          const texture = new T.Texture(bitmap);
          texture.wrapS = texture.wrapT = T.RepeatWrapping;
          texture.anisotropy = economy ? 2 : 4;
          if (color) texture.colorSpace = T.SRGBColorSpace;
          texture.needsUpdate = true;
          ownedTextures.add(texture);
          return texture;
        }),
      );
      if (disposed || maps.some((map) => !map)) return;
      coast.group.traverse((object) => {
        if (!(object instanceof T.Mesh)) return;
        for (const material of [
          object.material,
        ].flat() as T.MeshStandardMaterial[]) {
          material.map = maps[0]!;
          material.normalMap = maps[1]!;
          material.roughnessMap = maps[2]!;
          material.normalScale.set(0.9, 0.9);
          material.userData.grassMap = maps[3];
          material.needsUpdate = true;
        }
      });
    } catch {
      /* The sculpted local geometry remains usable if a material is missing. */
    }
  })();

  // The horizon is geometry, not a second photographic background.
  const sky = new T.Mesh(
    new T.SphereGeometry(850, 24, 16),
    new T.ShaderMaterial({
      side: T.BackSide,
      depthWrite: false,
      uniforms: {
        immersion: underwater,
        deepColor: { value: deepColor },
        sunDirection: { value: sunDirection },
      },
      vertexShader: `varying vec3 direction;void main(){direction=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec3 direction;uniform float immersion;uniform vec3 sunDirection;uniform vec3 deepColor;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
      void main(){vec3 d=normalize(direction);float h=smoothstep(-.08,.8,d.y);vec3 color=mix(vec3(.68,.75,.73),vec3(.28,.46,.58),h);
        float n=noise(d.xz*7./max(.16,d.y+.25))*.6+noise(d.xz*17./max(.18,d.y+.3))*.4;
        float cloud=smoothstep(.46,.7,n)*smoothstep(.02,.22,d.y)*(1.-smoothstep(.6,.9,d.y));
        color=mix(color,vec3(.9,.91,.84),cloud*.72);color+=pow(max(dot(d,sunDirection),0.),100.)*vec3(.5,.39,.18);
        color=mix(color,deepColor,immersion);gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    }),
  );
  sky.renderOrder = -20;
  sky.frustumCulled = false;
  scene.add(sky);

  const water = new T.Mesh(
    new T.PlaneGeometry(1100, 1100, economy ? 48 : 100, economy ? 48 : 100),
    new T.ShaderMaterial({
      uniforms: {
        phase,
        immersion: underwater,
        deepColor: { value: deepColor },
        sunDirection: { value: sunDirection },
      },
      side: T.DoubleSide,
      vertexShader: `uniform float phase;varying vec3 world;void main(){vec3 p=position;p.z+=sin(p.x*.045+phase*.3)*.08+sin(p.y*.063-phase*.25)*.05;vec4 w=modelMatrix*vec4(p,1.);world=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
      fragmentShader: `uniform float phase;uniform float immersion;uniform vec3 sunDirection;uniform vec3 deepColor;varying vec3 world;
      void main(){vec2 p=world.xz;vec3 n=normalize(vec3(-cos(p.x*.12+phase*.4)*.065,1.,-cos(p.y*.15-phase*.35)*.05));
        vec3 view=normalize(cameraPosition-world);float facing=abs(dot(n,view));float fresnel=pow(1.-facing,4.);
        float fine=sin(p.x*.56+phase*.6)*sin(p.y*.44-phase*.38)*.5+.5;
        vec3 color=mix(vec3(.055,.24,.28),vec3(.2,.4,.43),fine*.26+fresnel*.6);
        float shine=pow(max(dot(reflect(-sunDirection,n),view),0.),150.)*.9;
        color+=vec3(1.,.83,.52)*shine;
        float shore=min(length(p-vec2(23.,-753.))-7.,min(length(p-vec2(-44.,-753.))-5.,length(p-vec2(3.,-753.))-4.));
        float foam=(1.-smoothstep(.8,4.,abs(shore)+sin(p.x*.9+p.y*.8+phase)*.45))*smoothstep(.4,.8,fine);
        color=mix(color,vec3(.72,.82,.76),foam*.6);
        vec3 under=vec3(.025,.11,.14)+vec3(.025,.08,.07)*pow(facing,3.);
        color=mix(color,under,immersion);color=mix(color,vec3(.48,.62,.62),smoothstep(180.,450.,distance(cameraPosition,world))*(1.-immersion));
        color=mix(color,deepColor,smoothstep(35.,95.,distance(cameraPosition,world))*immersion);
        gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(-25, 0, -740);
  scene.add(water);

  const bedGeometry = new T.PlaneGeometry(
    220,
    190,
    economy ? 30 : 64,
    economy ? 28 : 56,
  );
  bedGeometry.rotateX(-Math.PI / 2);
  const positions = bedGeometry.attributes.position;
  const colors: number[] = [];
  const tint = new T.Color();
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      z = positions.getZ(i);
    positions.setY(
      i,
      Math.sin(x * 0.06 + z * 0.025) * 0.7 + Math.sin(z * 0.11) * 0.25,
    );
    tint.setHSL(
      0.12 + random() * 0.025,
      0.19 + random() * 0.08,
      0.29 + random() * 0.07,
    );
    colors.push(tint.r, tint.g, tint.b);
  }
  bedGeometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  bedGeometry.computeVertexNormals();
  const bedMaterial = new T.MeshStandardMaterial({
    color: "#b8c3ac",
    vertexColors: true,
    roughness: 0.95,
  });
  bedMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.marinePhase = phase;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 marineWorld;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nmarineWorld=(modelMatrix*vec4(position,1.)).xyz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 marineWorld;uniform float marinePhase;",
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
      vec2 q=marineWorld.xz*.7;float caustic=pow(max(0.,sin(q.x+sin(q.y*.8+marinePhase*.4))*sin(q.y+cos(q.x*.9-marinePhase*.3))),8.);
      float grain=fract(sin(dot(marineWorld.xz*15.,vec2(127.1,311.7)))*43758.5453);
      float ripple=sin(marineWorld.x*.9+sin(marineWorld.z*.18)*2.);
      diffuseColor.rgb*=.7+caustic*1.1+grain*.12+ripple*.06;`,
      );
  };
  const seabed = new T.Mesh(bedGeometry, bedMaterial);
  seabed.position.set(-35, -10.8, -738);
  scene.add(seabed);

  const stoneGeometry = new T.IcosahedronGeometry(1, economy ? 0 : 1);
  const rockCount = economy ? 38 : 68;
  const rocks = new T.InstancedMesh(
    stoneGeometry,
    new T.MeshStandardMaterial({ color: "#617573", roughness: 0.95 }),
    rockCount,
  );
  const dummy = new T.Object3D();
  for (let i = 0; i < rockCount; i++) {
    dummy.position.set(-95 + random() * 125, -10.6, -692 - random() * 95);
    dummy.rotation.set(random() * 0.4, random() * 6.28, random() * 0.4);
    const s = 0.35 + Math.pow(random(), 2) * 2.5;
    dummy.scale.set(s * 1.4, s * 0.65, s);
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
    tint.setHSL(0.18 + random() * 0.09, 0.1, 0.25 + random() * 0.12);
    rocks.setColorAt(i, tint);
  }
  scene.add(rocks);

  // Each kelp ribbon has real depth/parallax and bends from its holdfast.
  const kelpGeometry = new T.PlaneGeometry(0.52, 4.3, 1, 12);
  kelpGeometry.translate(0, 2.15, 0);
  const kp = kelpGeometry.attributes.position;
  for (let i = 0; i < kp.count; i++) {
    const y = kp.getY(i);
    kp.setX(i, kp.getX(i) * (0.4 + Math.sin(y * 0.7 + 0.4) * 0.6));
    kp.setZ(i, Math.sin(y * 1.3) * 0.12);
  }
  kelpGeometry.computeVertexNormals();
  const kelpMaterial = new T.MeshStandardMaterial({
    color: "#436646",
    roughness: 0.82,
    side: T.DoubleSide,
  });
  kelpMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.marinePhase = phase;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float marinePhase;",
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
      transformed.x+=sin(marinePhase*.55+position.y*.8+instanceMatrix[3].x*.13)*pow(position.y/4.3,2.)*.38;`,
      );
  };
  const kelpCount = economy ? 90 : 170;
  const kelp = new T.InstancedMesh(kelpGeometry, kelpMaterial, kelpCount);
  for (let i = 0; i < kelpCount; i++) {
    const side = i % 2 ? 1 : -1;
    dummy.position.set(
      -32 + side * (9 + random() * 40),
      -10.5 + random() * 0.5,
      -700 - random() * 72,
    );
    dummy.rotation.set((random() - 0.5) * 0.2, random() * 6.28, 0);
    const s = 0.6 + random() * 0.7;
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    kelp.setMatrixAt(i, dummy.matrix);
    tint.setHSL(0.2 + random() * 0.07, 0.35, 0.19 + random() * 0.11);
    kelp.setColorAt(i, tint);
  }
  scene.add(kelp);

  const fishGroups = (["mackerel", "pollack", "plaice"] as const).map(
    (kind) => {
      const count =
        kind === "mackerel"
          ? economy
            ? 24
            : 50
          : kind === "pollack"
            ? economy
              ? 7
              : 14
            : economy
              ? 3
              : 6;
      const fish = new T.InstancedMesh(
        marineFishGeometry(kind),
        new T.MeshStandardMaterial({
          vertexColors: true,
          metalness: kind === "plaice" ? 0 : 0.12,
          roughness: 0.65,
          side: T.DoubleSide,
        }),
        count,
      );
      fish.name = `marine-fish-${kind}`;
      fish.frustumCulled = false;
      const swimmers = Array.from({ length: count }, (_, i) => ({
        x: kind === "plaice" ? -10 - random() * 17 : (random() - 0.5) * 24,
        y: kind === "plaice" ? -9.45 : -3.2 - random() * 4.4,
        z:
          kind === "plaice"
            ? -737 - random() * 15
            : -729 + (random() - 0.5) * 19,
        phase: random() * Math.PI * 2,
        scale:
          kind === "mackerel" ? 0.6 + random() * 0.5 : 1.05 + random() * 0.5,
        school: i % 2,
      }));
      if (economy && kind === "pollack") {
        // With a smaller shoal, keep a representative on the camera's route.
        // It is still an animated mesh and its annotation uses its real bounds.
        Object.assign(swimmers[0], {
          x: -14.2,
          y: -4.2,
          z: -742.03,
          phase: 0,
          scale: 1.3,
          school: 0,
        });
      }
      if (economy && kind === "plaice") {
        Object.assign(swimmers[0], {
          x: -6.8,
          y: -9.45,
          z: -740.7,
          phase: 0,
          scale: 1.5,
          school: 0,
        });
      }
      scene.add(fish);
      return { kind, fish, swimmers };
    },
  );
  const fishWorld = new T.Vector3();
  const fishMatrix = new T.Matrix4();

  const particleCount = economy ? 100 : 220;
  const particleGeometry = new T.BufferGeometry();
  const particlesData = Array.from({ length: particleCount }, () => ({
    x: -79 + random() * 100,
    y: random(),
    z: -697 - random() * 79,
  }));
  const particlePositions = new Float32Array(particleCount * 3);
  particleGeometry.setAttribute(
    "position",
    new T.BufferAttribute(particlePositions, 3),
  );
  const particleMaterial = new T.PointsMaterial({
    color: "#bad6cc",
    size: 0.035,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const particles = new T.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  const shafts = new T.Group();
  const rayMaterial = new T.ShaderMaterial({
    uniforms: { strength: { value: 0 } },
    transparent: true,
    blending: T.AdditiveBlending,
    depthWrite: false,
    side: T.DoubleSide,
    vertexShader: `varying vec2 rayUv;varying float rayDistance;void main(){rayUv=uv;vec4 view=modelViewMatrix*vec4(position,1.);rayDistance=length(view.xyz);gl_Position=projectionMatrix*view;}`,
    fragmentShader: `varying vec2 rayUv;varying float rayDistance;uniform float strength;void main(){float edge=pow(sin(rayUv.x*3.14159),3.);float ends=smoothstep(0.,.2,rayUv.y)*(1.-smoothstep(.7,1.,rayUv.y));float fog=exp(-rayDistance*rayDistance*.001);gl_FragColor=vec4(.4,.68,.6,strength*edge*ends*fog);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  });
  const rayGeometry = new T.PlaneGeometry(1.4, 14);
  for (let i = 0; i < (economy ? 6 : 12); i++) {
    const ray = new T.Mesh(rayGeometry, rayMaterial);
    ray.position.set(-79 + i * 9, -5.8, -737 - random() * 24);
    ray.rotation.z = -0.3;
    shafts.add(ray);
  }
  scene.add(shafts);
  if (connected) {
    // Keep the same cliffs, sky and water surface as the original journey.
    coast.group.visible =
      sky.visible =
      water.visible =
      ambient.visible =
      sun.visible =
        false;
    // The original coast terrain is at -9 m: keep this detailed seabed above it.
    seabed.position.y += 2.8;
    rocks.position.y += 2.8;
    kelp.position.y += 2.8;
    fishGroups.find((group) => group.kind === "plaice")!.fish.position.y += 1.8;
  }

  const dayFog = new T.Color("#a8bbc0"),
    deepFog = deepColor;
  return {
    scene,
    ready,
    update(local: number, camera: T.PerspectiveCamera) {
      const t = T.MathUtils.clamp(Number.isFinite(local) ? local : 0, 0, 1);
      const immersion = 1 - smooth(-0.55, 0.45, camera.position.y);
      const time = t * 58;
      phase.value = time;
      underwater.value = immersion;
      coast.group.visible = !connected && immersion < 0.85;
      sky.position.copy(camera.position);
      fog.color.copy(dayFog).lerp(deepFog, immersion);
      fog.density = T.MathUtils.lerp(0.0038, 0.052, immersion);
      ambient.intensity = T.MathUtils.lerp(1.25, 0.82, immersion);
      ambient.color.set(immersion > 0.5 ? "#8bd3d9" : "#b5d8df");
      sun.intensity = T.MathUtils.lerp(3.1, 2, immersion);
      particles.visible = immersion > 0.005;
      shafts.visible = immersion > 0.005;
      particleMaterial.opacity = immersion * 0.55;
      rayMaterial.uniforms.strength.value = immersion * 0.08;
      camera.updateMatrixWorld();
      const candidates: (AnimalBox & { kind: MarineFishKind })[] = [];
      for (const { kind, fish, swimmers } of fishGroups) {
        fish.visible = immersion > 0.005;
        fish.updateWorldMatrix(true, false);
        for (let i = 0; i < swimmers.length; i++) {
          const f = swimmers[i],
            direction = f.school ? -1 : 1;
          const flat = kind === "plaice";
          dummy.position.set(
            -34 +
              f.x +
              direction *
                Math.sin(time * (flat ? 0.025 : 0.08)) *
                (flat ? 1.2 : 12),
            f.y + Math.sin(time * 0.65 + f.phase) * (flat ? 0.025 : 0.16),
            f.z + Math.cos(time * 0.08) * (flat ? 0.4 : 3),
          );
          dummy.rotation.set(
            0,
            (f.school ? Math.PI : 0) + 0.16 * Math.sin(time * 0.08),
            Math.sin(time * 3 + f.phase) * (flat ? 0.003 : 0.015),
          );
          fishWorld.copy(dummy.position).applyMatrix4(fish.matrixWorld);
          const distance = camera.position.distanceTo(fishWorld);
          dummy.scale.setScalar(distance < 2.5 ? 0 : f.scale);
          dummy.updateMatrix();
          fish.setMatrixAt(i, dummy.matrix);
          if (immersion < 0.35 || distance < 2.5 || distance > 34) continue;
          fishMatrix.multiplyMatrices(fish.matrixWorld, dummy.matrix);
          const bounds = projectMarineFishBox(
            fish.geometry,
            fishMatrix,
            camera,
          );
          if (bounds)
            candidates.push({
              id: `marine-${kind}-${i}`,
              kind,
              label: fishLabels[kind],
              ...bounds,
              opacity:
                smooth(0.2, 0.85, immersion) * (1 - smooth(23, 34, distance)),
            });
        }
        fish.instanceMatrix.needsUpdate = true;
      }
      // Prefer a visible representative of each model before filling the five
      // available annotations; overlapping fish retain their actual boxes.
      candidates.sort((a, b) => b.width * b.height - a.width * a.height);
      const animals: AnimalBox[] = [];
      const representatives = fishGroups.map(({ kind }) =>
        candidates.find((fish) => fish.kind === kind),
      );
      for (const candidate of [...representatives, ...candidates]) {
        if (!candidate || animals.some((fish) => fish.id === candidate.id))
          continue;
        if (
          animals.some(
            (fish) =>
              Math.hypot(
                fish.x + fish.width / 2 - candidate.x - candidate.width / 2,
                fish.y + fish.height / 2 - candidate.y - candidate.height / 2,
              ) < 0.065,
          )
        )
          continue;
        const { kind: _kind, ...animal } = candidate;
        animals.push(animal);
        if (animals.length === 5) break;
      }
      for (let i = 0; i < particlesData.length; i++) {
        const p = particlesData[i];
        particlePositions[i * 3] = p.x + Math.sin(time * 0.09 + p.z) * 0.2;
        particlePositions[i * 3 + 1] = -10.5 + ((p.y + time * 0.018) % 1) * 10;
        particlePositions[i * 3 + 2] = p.z;
      }
      particleGeometry.attributes.position.needsUpdate = true;
      shafts.children.forEach((ray) => {
        ray.quaternion.copy(camera.quaternion);
        ray.rotateZ(-0.3);
      });
      return { immersion, animals };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      abort.abort();
      disposeScene(scene);
      ownedTextures.forEach((texture) => texture.dispose());
      bitmaps.forEach((bitmap) => bitmap.close());
    },
  };
}
