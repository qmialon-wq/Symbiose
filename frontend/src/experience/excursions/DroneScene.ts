import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { disposeScene, seededRandom, terrainY } from "../world-utils";

/** Camera poses for an illustrative survey, independent of the original journey. */
export const droneCameraKeys = [
  { at: 0, position: [15, 12, 25], target: [0, 2, 0], fov: 57 },
  { at: 0.28, position: [11, 9, 18], target: [0, 3, 0], fov: 57 },
  { at: 0.58, position: [-11, 10, 18], target: [0, 3, 0], fov: 57 },
  { at: 0.82, position: [-7, 15, 24], target: [0, 1, 0], fov: 57 },
  { at: 1, position: [15, 12, 25], target: [0, 2, 0], fov: 57 },
] as const;

const groundHeight = (x: number, z: number) =>
  0.24 +
  Math.sin(x * 0.085) * 0.42 +
  Math.cos(z * 0.11) * 0.23 +
  Math.sin((x + z) * 0.16) * 0.08;

/** A small bocage field: the green survey is a cinematic illustration, not an acquired map. */
export function createDroneScene(economy = false) {
  const scene = new T.Scene();
  scene.name = "symbiose-drone-survey";
  scene.background = new T.Color("#b1c5b6");
  scene.fog = new T.FogExp2("#b1c5b6", 0.009);
  const random = seededRandom(42826);
  const ambient = new T.HemisphereLight("#d5e2cf", "#51452e", 1.3);
  const sun = new T.DirectionalLight("#ffefd2", 3.1);
  sun.position.set(-24, 39, 19);
  sun.castShadow = !economy;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -34,
    right: 34,
    top: 34,
    bottom: -34,
    near: 1,
    far: 120,
  });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.00015;
  sun.shadow.normalBias = 0.035;
  sun.shadow.radius = 3;
  scene.add(ambient, sun, sun.target);

  const sky = new T.Mesh(
    new T.SphereGeometry(140, 24, 12),
    new T.ShaderMaterial({
      side: T.BackSide,
      depthWrite: false,
      uniforms: { sun: { value: sun.position.clone().normalize() } },
      vertexShader:
        "varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: `varying vec3 direction;uniform vec3 sun;void main(){vec3 d=normalize(direction);float h=pow(max(0.,d.y),.5);vec3 c=mix(vec3(.73,.79,.66),vec3(.34,.55,.62),h);float glow=pow(max(dot(d,sun),0.),16.);c+=vec3(.22,.17,.07)*glow;gl_FragColor=vec4(c,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`,
    }),
  );
  scene.add(sky);

  const surface = document.createElement("canvas");
  surface.width = surface.height = 1024;
  const ctx = surface.getContext("2d")!;
  ctx.fillStyle = "#73834a";
  ctx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 42000; i++) {
    const x = random() * 1024,
      y = random() * 1024;
    ctx.strokeStyle = i % 3 ? "#afad6730" : "#25422536";
    ctx.lineWidth = 0.5 + random();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (random() - 0.5) * 5, y - random() * 14);
    ctx.stroke();
  }
  const grassMap = new T.CanvasTexture(surface);
  grassMap.colorSpace = T.SRGBColorSpace;
  grassMap.wrapS = grassMap.wrapT = T.RepeatWrapping;
  grassMap.repeat.set(13, 13);
  grassMap.anisotropy = economy ? 2 : 4;
  const groundGeometry = new T.PlaneGeometry(
    130,
    130,
    economy ? 48 : 88,
    economy ? 48 : 88,
  );
  groundGeometry.rotateX(-Math.PI / 2);
  const coordinates = groundGeometry.attributes.position;
  const colors: number[] = [],
    color = new T.Color();
  for (let i = 0; i < coordinates.count; i++) {
    const x = coordinates.getX(i),
      z = coordinates.getZ(i);
    coordinates.setY(i, groundHeight(x, z));
    const mowing = Math.sin((x + z * 0.22) * 0.82) > 0 ? 0.015 : -0.015;
    color.setHSL(
      0.22 + Math.sin(z * 0.1) * 0.012,
      0.34,
      0.39 + mowing + random() * 0.025,
    );
    colors.push(color.r, color.g, color.b);
  }
  groundGeometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  groundGeometry.computeVertexNormals();
  const ground = new T.Mesh(
    groundGeometry,
    new T.MeshStandardMaterial({
      map: grassMap,
      color: "#eef0cf",
      vertexColors: true,
      roughness: 0.98,
    }),
  );
  ground.receiveShadow = true;
  scene.add(ground);

  // One instanced field of tufts, rather than thousands of individual objects.
  const bladeGeometry = new T.BufferGeometry();
  bladeGeometry.setAttribute(
    "position",
    new T.Float32BufferAttribute(
      [
        -0.11, 0, 0, 0.11, 0, 0, 0.025, 0.65, 0, 0, 0, -0.1, 0, 0, 0.1, -0.025,
        0.53, 0.04, -0.07, 0, -0.06, 0.07, 0, 0.06, -0.06, 0.44, 0.035,
      ],
      3,
    ),
  );
  bladeGeometry.computeVertexNormals();
  const tufts = new T.InstancedMesh(
    bladeGeometry,
    new T.MeshStandardMaterial({
      color: "#90a568",
      roughness: 1,
      side: T.DoubleSide,
    }),
    economy ? 3500 : 10000,
  );
  const dummy = new T.Object3D();
  for (let i = 0; i < tufts.count; i++) {
    const x = (random() - 0.5) * 70,
      z = (random() - 0.5) * 70;
    dummy.position.set(x, groundHeight(x, z), z);
    dummy.rotation.set(0, random() * Math.PI * 2, 0);
    const s = 0.24 + random() * 0.38;
    dummy.scale.set(s, s * (0.7 + random() * 0.7), s);
    dummy.updateMatrix();
    tufts.setMatrixAt(i, dummy.matrix);
    color.setHSL(
      0.19 + random() * 0.08,
      0.22 + random() * 0.22,
      0.3 + random() * 0.17,
    );
    tufts.setColorAt(i, color);
  }
  scene.add(tufts);

  const bark = new T.MeshStandardMaterial({
    color: "#645044",
    roughness: 0.95,
  });
  const crownMaterial = new T.MeshStandardMaterial({
    color: "#567147",
    roughness: 0.94,
  });
  const crowns = new T.InstancedMesh(
    new T.IcosahedronGeometry(1, economy ? 1 : 2),
    crownMaterial,
    160,
  );
  const trunks = new T.InstancedMesh(
    new T.CylinderGeometry(0.1, 0.21, 1, 7),
    bark,
    54,
  );
  for (let i = 0; i < trunks.count; i++) {
    const edge = i % 3;
    const x =
      edge === 0
        ? -22 - random() * 4
        : edge === 1
          ? 21 + random() * 3
          : -21 + random() * 43;
    const z = edge === 2 ? -24 - random() * 3 : -23 + random() * 48;
    const height = 3.4 + random() * 3;
    const y = groundHeight(x, z);
    dummy.position.set(x, y + height / 2, z);
    dummy.rotation.set(0, random() * 6, 0);
    dummy.scale.set(1, height, 1);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    for (let branch = 0; branch < 3; branch++) {
      const n = i * 3 + branch;
      if (n >= crowns.count) break;
      dummy.position.set(
        x + (random() - 0.5) * 2.3,
        y + height + branch * 0.25,
        z + (random() - 0.5) * 1.7,
      );
      dummy.rotation.set(random() * 0.5, random() * 6, random() * 0.3);
      dummy.scale.set(1.5 + random(), 1.9 + random() * 1.1, 1.4 + random());
      dummy.updateMatrix();
      crowns.setMatrixAt(n, dummy.matrix);
      color.setHSL(
        0.24 + random() * 0.035,
        0.26 + random() * 0.12,
        0.18 + random() * 0.12,
      );
      crowns.setColorAt(n, color);
    }
  }
  trunks.castShadow = crowns.castShadow = !economy;
  scene.add(trunks, crowns);

  // A narrow hedge links the trees and gives the field its bocage scale.
  const hedge = new T.InstancedMesh(
    new T.IcosahedronGeometry(1, 1),
    crownMaterial,
    80,
  );
  for (let i = 0; i < hedge.count; i++) {
    const x = i < 40 ? -21 : 21;
    const z = -24 + (i % 40) * 1.25;
    dummy.position.set(
      x + (random() - 0.5) * 0.45,
      groundHeight(x, z) + 0.75,
      z,
    );
    dummy.rotation.set(0, random() * 6, 0);
    dummy.scale.set(1.3, 0.9 + random() * 0.7, 1.2);
    dummy.updateMatrix();
    hedge.setMatrixAt(i, dummy.matrix);
  }
  hedge.castShadow = !economy;
  scene.add(hedge);

  const fencePositions: number[] = [];
  const posts = new T.InstancedMesh(
    new T.BoxGeometry(0.12, 1.1, 0.12),
    bark,
    18,
  );
  for (let i = 0; i < posts.count; i++) {
    const z = -23 + i * 2.5,
      y = groundHeight(18.5, z);
    dummy.position.set(18.5, y + 0.55, z);
    dummy.rotation.set(0, 0.03, -0.025);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    posts.setMatrixAt(i, dummy.matrix);
    if (i)
      for (const h of [0.45, 0.85])
        fencePositions.push(
          18.5,
          groundHeight(18.5, z - 2.5) + h,
          z - 2.5,
          18.5,
          y + h,
          z,
        );
  }
  scene.add(
    posts,
    new T.LineSegments(
      new T.BufferGeometry().setAttribute(
        "position",
        new T.Float32BufferAttribute(fencePositions, 3),
      ),
      new T.LineBasicMaterial({
        color: "#736d52",
        transparent: true,
        opacity: 0.65,
      }),
    ),
  );

  const drone = new T.Group();
  drone.name = "illustrative-survey-drone";
  const chassis = new T.MeshStandardMaterial({
    color: "#263b36",
    metalness: 0.55,
    roughness: 0.36,
  });
  const shell = new T.MeshStandardMaterial({
    color: "#d9dfd1",
    metalness: 0.2,
    roughness: 0.48,
  });
  const rubber = new T.MeshStandardMaterial({
    color: "#172923",
    roughness: 0.85,
  });
  const optics = new T.MeshStandardMaterial({
    color: "#152d31",
    metalness: 0.7,
    roughness: 0.12,
  });
  const green = new T.MeshStandardMaterial({
    color: "#a6ed82",
    emissive: "#7ec85f",
    emissiveIntensity: 0.8,
    roughness: 0.35,
  });
  const box = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material: T.Material,
  ) => {
    const mesh = new T.Mesh(
      new RoundedBoxGeometry(
        w,
        h,
        d,
        economy ? 1 : 2,
        Math.min(w, h, d) * 0.18,
      ),
      material,
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = !economy;
    mesh.receiveShadow = true;
    drone.add(mesh);
    return mesh;
  };
  box(1.05, 0.34, 0.8, 0, 0, 0, chassis);
  box(0.85, 0.18, 0.65, 0, 0.21, -0.05, shell);
  box(0.47, 0.05, 0.34, 0, 0.325, -0.05, chassis);
  box(0.11, 0.055, 0.34, 0, 0.36, -0.05, green);
  const rotors: T.Group[] = [];
  for (const [x, z] of [
    [-1.03, -0.87],
    [1.03, -0.87],
    [-1.03, 0.87],
    [1.03, 0.87],
  ]) {
    const arm = box(1.18, 0.13, 0.17, x * 0.55, -0.02, z * 0.55, chassis);
    arm.rotation.y = -Math.atan2(z, x);
    const motor = new T.Mesh(
      new T.CylinderGeometry(0.16, 0.18, 0.24, 16),
      chassis,
    );
    motor.position.set(x, 0.02, z);
    motor.castShadow = !economy;
    drone.add(motor);
    const hub = new T.Group();
    hub.position.set(x, 0.17, z);
    const blade = new T.Mesh(
      new RoundedBoxGeometry(1.05, 0.018, 0.12, 1, 0.008),
      rubber,
    );
    blade.rotation.z = 0.018;
    hub.add(blade);
    const blur = new T.Mesh(
      new T.CircleGeometry(0.53, 28),
      new T.MeshBasicMaterial({
        color: "#81968a",
        transparent: true,
        opacity: 0.12,
        side: T.DoubleSide,
        depthWrite: false,
      }),
    );
    blur.rotation.x = -Math.PI / 2;
    blur.position.y = 0.018;
    hub.add(blur);
    drone.add(hub);
    rotors.push(hub);
    box(0.08, 0.42, 0.08, x * 0.67, -0.32, z * 0.7, chassis);
    box(0.09, 0.07, 0.66, x * 0.67, -0.52, z * 0.7, rubber);
    const lamp = new T.Mesh(new T.SphereGeometry(0.045, 8, 6), green);
    lamp.position.set(x * 0.9, -0.08, z * 0.9);
    drone.add(lamp);
  }
  const gimbal = new T.Mesh(new T.SphereGeometry(0.19, 16, 12), chassis);
  gimbal.position.set(0, -0.29, 0.27);
  drone.add(gimbal);
  const cameraBody = box(0.38, 0.23, 0.31, 0, -0.41, 0.39, chassis);
  cameraBody.rotation.x = 0.22;
  const lens = new T.Mesh(new T.CylinderGeometry(0.095, 0.1, 0.09, 20), optics);
  lens.rotation.x = Math.PI / 2 + 0.22;
  lens.position.set(0, -0.45, 0.55);
  drone.add(lens);
  scene.add(drone);

  // The scan is sampled from local progress, so rewinding precisely reverses it.
  const coneHeight = 5.1;
  const coneMaterial = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: T.DoubleSide,
    uniforms: { phase: { value: 0 } },
    vertexShader:
      "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `varying vec2 vUv;uniform float phase;void main(){float rim=pow(abs(vUv.x-.5)*2.,6.);float band=pow(max(0.,sin(vUv.y*24.-phase)),20.);float fade=sin(vUv.y*3.14159);gl_FragColor=vec4(.08,1.3,.16,(.085+.14*band)*fade);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`,
  });
  const cone = new T.Mesh(
    new T.CylinderGeometry(0.09, 2.75, coneHeight, economy ? 20 : 36, 1, true),
    coneMaterial,
  );
  cone.name = "illustrative-green-survey-volume";
  scene.add(cone);

  const scanGeometry = groundGeometry.clone();
  const scanPositions = scanGeometry.attributes.position;
  for (let i = 0; i < scanPositions.count; i++)
    scanPositions.setY(i, scanPositions.getY(i) + 0.035);
  const scanMaterial = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      center: { value: new T.Vector2() },
      phase: { value: 0 },
      progress: { value: 0 },
    },
    vertexShader:
      "varying vec2 field;void main(){field=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `varying vec2 field;uniform vec2 center;uniform float phase;uniform float progress;
      void main(){float d=distance(field,center);float halo=(1.-smoothstep(2.64,2.78,d))*smoothstep(2.48,2.61,d);
      float inside=1.-smoothstep(2.45,2.75,d);vec2 cell=abs(fract(field/1.6)-.5);float grid=1.-smoothstep(.035,.075,min(cell.x,cell.y));
      float fieldMask=(1.-smoothstep(7.7,8.1,abs(field.x)))*(1.-smoothstep(6.3,6.7,abs(field.y)));
      float covered=step(6.5-progress*13.,field.y);float sweep=pow(max(0.,sin((field.y-center.y)*4.-phase)),18.);
      float alpha=halo*.8+inside*(.075+grid*.38+sweep*.18)+fieldMask*covered*grid*.12;
      if(alpha<.003)discard;gl_FragColor=vec4(.08,1.3,.16,alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
  });
  const footprint = new T.Mesh(scanGeometry, scanMaterial);
  footprint.renderOrder = 2;
  scene.add(footprint);

  const routePoints: T.Vector3[] = [];
  for (let row = 0; row < 5; row++) {
    const z = 6.4 - row * 3.2;
    const side = row % 2 ? 1 : -1;
    routePoints.push(
      new T.Vector3(side * 7.8, 5.2, z),
      new T.Vector3(-side * 7.8, 5.2, z),
    );
  }
  const flight = new T.CatmullRomCurve3(routePoints, false, "centripetal", 0.5);
  const pathPositions: number[] = [];
  for (let i = 0; i <= 180; i++) {
    const p = flight.getPointAt(i / 180);
    pathPositions.push(p.x, groundHeight(p.x, p.z) + 0.055, p.z);
  }
  const route = new T.Line(
    new T.BufferGeometry().setAttribute(
      "position",
      new T.Float32BufferAttribute(pathPositions, 3),
    ),
    new T.LineDashedMaterial({
      color: "#b4dba1",
      transparent: true,
      opacity: 0.23,
      dashSize: 0.38,
      gapSize: 0.32,
    }),
  );
  route.computeLineDistances();
  scene.add(route);

  let disposed = false;
  let surveyOrigin: T.Vector3 | undefined;
  let surveyScale = 1;
  const surveyFloor = (x: number, z: number) =>
    surveyOrigin
      ? (terrainY(
          surveyOrigin.x + x * surveyScale,
          surveyOrigin.z + z * surveyScale,
        ) -
          surveyOrigin.y) /
        surveyScale
      : groundHeight(x, z);
  return {
    scene,
    connect(origin: T.Vector3, scale = 2.4) {
      surveyOrigin = origin.clone();
      surveyScale = scale;
      scene.position.copy(origin);
      scene.scale.setScalar(scale);
      const survey = new Set<T.Object3D>([drone, cone, footprint, route]);
      scene.children.forEach((object) => {
        object.visible = survey.has(object);
      });
      // The beam and route lie on the existing bocage, not on a second field.
      for (let i = 0; i < scanPositions.count; i++)
        scanPositions.setY(
          i,
          surveyFloor(scanPositions.getX(i), scanPositions.getZ(i)) + 0.025,
        );
      scanPositions.needsUpdate = true;
      footprint.geometry.computeBoundingSphere();
      const track = route.geometry.attributes.position;
      for (let i = 0; i < track.count; i++)
        track.setY(i, surveyFloor(track.getX(i), track.getZ(i)) + 0.03);
      track.needsUpdate = true;
    },
    update(local: number, camera: T.PerspectiveCamera) {
      const p = T.MathUtils.clamp(Number.isFinite(local) ? local : 0, 0, 1);
      const position = flight.getPointAt(p);
      const tangent = flight.getTangentAt(p);
      const y = 5.3 + Math.sin(p * Math.PI * 8) * 0.12;
      drone.position.set(position.x, y, position.z);
      drone.rotation.set(
        Math.sin(p * 36) * 0.035,
        Math.atan2(-tangent.x, -tangent.z),
        -tangent.x * 0.045,
      );
      rotors.forEach(
        (rotor, i) => (rotor.rotation.y = p * 720 * (i % 2 ? -1 : 1)),
      );
      const floor = surveyFloor(position.x, position.z);
      const scanHeight = y - floor - 0.3;
      cone.position.set(position.x, floor + scanHeight / 2 + 0.04, position.z);
      cone.scale.y = Math.max(0.5, scanHeight / coneHeight);
      coneMaterial.uniforms.phase.value = p * 68;
      scanMaterial.uniforms.center.value.set(position.x, position.z);
      scanMaterial.uniforms.phase.value = p * 40;
      scanMaterial.uniforms.progress.value = p;
      sky.position.copy(camera.position);
      return { immersion: 0 };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      sun.shadow.map?.dispose();
      disposeScene(scene);
    },
  };
}
