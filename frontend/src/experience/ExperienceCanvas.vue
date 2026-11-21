<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { gsap } from "gsap";
import {
  ACESFilmicToneMapping,
  PCFSoftShadowMap,
  WebGLRenderer,
  Vector3,
  PerspectiveCamera,
} from "three";
import { CameraController } from "./CameraController";
import { AtmosphereController } from "./AtmosphereController";
import { AssetPreloader } from "./AssetPreloader";
import {
  PerformanceMonitor,
  type PerformanceSample,
} from "./PerformanceMonitor";
import { createWorld } from "./world";
import { RefractionPass } from "./RefractionPass";
import {
  defaultLayers,
  reducedProgress,
  transitionAt,
  type JourneyLayers,
} from "./journey";
import type { FrameReport } from "./telemetry";
import { pitchIndex } from "./pitch";
import { textureWindow } from "./runtime-assets";
import { samplePrologue } from "./prologue/prologue";
import type { createOfficeScene } from "./prologue/OfficeScene";
import {
  screenTransform,
  type OfficeScreenProjection,
  type ScreenQuad,
} from "./prologue/screen-projection";
import { type ExcursionState } from "./excursions/route";
import { sampleConnectedExcursion } from "./excursions/connected-camera";
import { samplePresentationCamera } from "./presentation-camera";
import { narrativeCueAt, signatureEvent } from "./narrative-cues";
import { smoothstep } from "./journey";
import { terrainY } from "./world-utils";
import {
  deviceHints,
  initialQuality,
  renderPixelRatio,
  type QualityPreference,
  type LoadingState,
} from "./render-quality";
const props = defineProps<{
  progress: number;
  reducedMotion: boolean;
  layers?: JourneyLayers;
  suspended?: boolean;
  prologue?: number;
  prologueVideo?: HTMLVideoElement | null;
  prologueFocus?: boolean;
  excursion?: ExcursionState;
  qualityPreference?: QualityPreference;
  presentationSeconds?: number;
}>();
const emit = defineEmits<{
  ready: [];
  error: [message: string];
  performance: [sample: PerformanceSample];
  frame: [frame: FrameReport];
  assets: [issues: string[]];
  screen: [projection: OfficeScreenProjection | undefined];
  loading: [state: LoadingState];
}>();
const host = ref<HTMLDivElement>();
let renderFrame: (() => void) | undefined, teardown: (() => void) | undefined;
watch(
  () => [
    props.progress,
    props.reducedMotion,
    props.layers,
    props.suspended,
    props.prologue,
    props.prologueVideo,
    props.prologueFocus,
    props.excursion,
    props.presentationSeconds,
  ],
  () => renderFrame?.(),
  { flush: "post" },
);
onMounted(async () => {
  if (!host.value) return;
  const abort = new AbortController(),
    preloader = new AssetPreloader(),
    camera = new CameraController(),
    atmosphere = new AtmosphereController();
  let renderer: WebGLRenderer | undefined,
    world: ReturnType<typeof createWorld> | undefined,
    pass: RefractionPass | undefined,
    observer: ResizeObserver | undefined;
  let office: ReturnType<typeof createOfficeScene> | undefined;
  let officeLoading = false,
    screenFocus = 0;
  let landscapeLoading: Promise<unknown> | undefined;
  let lastPose = "";
  let viewportWidth = 1,
    viewportHeight = 1;
  let landscapeIdle = 0,
    landscapeTimer = 0;
  const hints = deviceHints();
  const initial = initialQuality(props.qualityPreference ?? "auto", hints);
  const loading = (progress: number, label: string) =>
    emit("loading", { progress, label });
  function ensureLandscape() {
    if (!landscapeLoading)
      landscapeLoading = world!.loadInitial().finally(invalidate);
    return landscapeLoading;
  }
  let excursion:
    | {
        id: string;
        scene: import("three").Scene;
        update: (
          local: number,
          camera: PerspectiveCamera,
        ) => { immersion: number; animals?: FrameReport["animals"] };
        dispose: () => void;
      }
    | undefined;
  let excursionLoading = "",
    excursionVersion = 0;
  async function selectExcursion(id: ExcursionState["id"]) {
    if (excursion?.id === id || excursionLoading === id) return;
    const version = ++excursionVersion;
    excursionLoading = id;
    excursion?.dispose();
    excursion = undefined;
    try {
      const economy = quality === "eco";
      const module =
        id === "soil"
          ? await import("./excursions/SoilScene")
          : id === "drone"
            ? await import("./excursions/DroneScene")
            : await import("./excursions/MarineScene");
      if (
        abort.signal.aborted ||
        version !== excursionVersion ||
        props.excursion?.id !== id
      )
        return;
      const next =
        "createSoilScene" in module
          ? module.createSoilScene(economy, true)
          : "createDroneScene" in module
            ? {
                ...module.createDroneScene(economy),
              }
            : {
                ...module.createMarineScene(economy, true),
              };
      if ("ready" in next) await next.ready;
      if (
        abort.signal.aborted ||
        version !== excursionVersion ||
        props.excursion?.id !== id
      ) {
        next.dispose();
        return;
      }
      if (id === "soil") {
        next.scene.position.set(1, terrainY(1, -12), -12);
        next.scene.children.forEach((object) => {
          if (
            object.type === "HemisphereLight" ||
            object.type === "DirectionalLight"
          )
            object.visible = false;
        });
      }
      if ("connect" in next && typeof next.connect === "function")
        next.connect(new Vector3(48, terrainY(48, -620), -620));
      next.scene.background = null;
      next.scene.fog = null;
      world!.scene.add(next.scene);
      excursion = {
        id,
        ...next,
        dispose() {
          next.scene.removeFromParent();
          next.dispose();
        },
      };
      world!.scene.updateMatrixWorld(true);
    } catch {
      if (!abort.signal.aborted)
        emit(
          "error",
          "Ce nouveau paysage n’a pas pu être chargé. Le voyage reste accessible en aperçu simplifié.",
        );
    } finally {
      if (version === excursionVersion) excursionLoading = "";
      invalidate();
    }
  }
  async function ensureOffice() {
    if (office || officeLoading || abort.signal.aborted) return;
    officeLoading = true;
    try {
      const { createOfficeScene } = await import("./prologue/OfficeScene");
      if (!abort.signal.aborted && props.prologue !== undefined) {
        office = createOfficeScene(world!.scene, quality === "eco", invalidate);
        office.setVideo(props.prologueVideo ?? null);
        renderer!.shadowMap.needsUpdate = true;
        invalidate();
      }
    } catch {
      if (!abort.signal.aborted)
        emit(
          "error",
          "Le décor du prologue n’a pas pu être chargé. Le voyage reste disponible en version simplifiée.",
        );
    } finally {
      officeLoading = false;
    }
  }
  let scheduled = false,
    dirty = false,
    initialized = false,
    renderCount = 0,
    device = "",
    quality: "standard" | "eco" = "standard",
    monitor: PerformanceMonitor;
  let assetVersion = 0,
    activeIndex = -1,
    assetsPending = true;
  const attached = new Set<string>();
  const modelIssues = new Set<string>();
  let imageIssues: string[] = [];
  const publishAssetIssues = () =>
    emit("assets", [...modelIssues, ...imageIssues]);
  let wanted: string[] = [];
  async function selectAssets(index: number) {
    activeIndex = index;
    assetsPending = true;
    wanted = textureWindow(index);
    const version = ++assetVersion;
    const assets = await preloader.load(
      abort.signal,
      wanted.filter((id) => id !== "logo" || !attached.has("logo")),
    );
    if (abort.signal.aborted) return;
    if (version !== assetVersion) {
      preloader.releaseExcept([...new Set([...wanted, ...attached])]);
      return;
    }
    const additions = new Map(
      [...assets.textures].filter(([id]) => !attached.has(id)),
    );
    world!.attachTextures(additions);
    additions.forEach((texture, id) => {
      attached.add(id);
      if (id !== "logo") renderer!.initTexture(texture);
    });
    for (const id of attached)
      if (!wanted.includes(id)) {
        world!.releaseTexture(id);
        attached.delete(id);
      }
    // Logo pixels have been sampled into particle coordinates; no GPU texture or retained bitmap is needed.
    preloader.releaseExcept(wanted.filter((id) => id !== "logo"));
    imageIssues = assets.issues;
    publishAssetIssues();
    assetsPending = false;
    invalidate();
  }
  function draw() {
    if (
      abort.signal.aborted ||
      !initialized ||
      document.hidden ||
      props.suspended ||
      !renderer ||
      !world ||
      !host.value
    )
      return;
    const began = performance.now();
    const index = pitchIndex(props.progress);
    if (index !== activeIndex) void selectAssets(index);
    renderer.info.reset();
    const progress = props.reducedMotion
        ? reducedProgress(props.progress)
        : props.progress,
      layers = props.layers ?? defaultLayers;
    // The bureau can open before any outdoor models/textures are downloaded.
    if (props.prologue === undefined || props.prologue > 0.35)
      void ensureLandscape();
    let pose = camera.update(progress);
    if (props.presentationSeconds !== undefined && !props.reducedMotion) {
      pose = samplePresentationCamera(props.presentationSeconds);
      camera.camera.position.set(...pose.position);
      camera.camera.lookAt(...pose.target);
      camera.camera.fov = pose.fov;
      camera.camera.updateProjectionMatrix();
      camera.camera.updateMatrixWorld(true);
    } else if (props.excursion) {
      pose = sampleConnectedExcursion(
        props.excursion.id,
        props.reducedMotion ? 0.5 : props.excursion.local,
      );
      camera.camera.position.set(...pose.position);
      camera.camera.lookAt(...pose.target);
      if (camera.camera.fov !== pose.fov) {
        camera.camera.fov = pose.fov;
        camera.camera.updateProjectionMatrix();
      }
      camera.camera.updateMatrixWorld(true);
    }
    if (props.prologue !== undefined) {
      void ensureOffice();
      screenFocus = props.reducedMotion
        ? Number(!!props.prologueFocus)
        : screenFocus + (Number(!!props.prologueFocus) - screenFocus) * 0.09;
      if (Math.abs(Number(!!props.prologueFocus) - screenFocus) < 0.0001)
        screenFocus = Number(!!props.prologueFocus);
      pose = samplePrologue(
        props.prologue,
        props.reducedMotion,
        screenFocus,
        camera.camera.aspect,
      );
      camera.camera.position.set(...pose.position);
      camera.camera.lookAt(...pose.target);
      if (camera.camera.fov !== pose.fov) {
        camera.camera.fov = pose.fov;
        camera.camera.updateProjectionMatrix();
      }
      camera.camera.updateMatrixWorld(true);
      office?.setVideo(props.prologueVideo ?? null);
      office?.update(
        props.prologue,
        performance.now() / 1000,
        props.reducedMotion,
      );
    } else if (office) {
      office.update(1, 0, true);
      screenFocus = 0;
      // Rebuild on reverse navigation rather than retaining office textures throughout the voyage.
      if (props.progress > 0.09) {
        office.dispose();
        office = undefined;
      }
    }
    const presentation =
      props.presentationSeconds === undefined
        ? undefined
        : {
            logo: smoothstep(
              signatureEvent.start,
              signatureEvent.end,
              props.presentationSeconds,
            ),
            riverTrap:
              narrativeCueAt(props.presentationSeconds).id === "rivers",
          };
    const state = world.apply(
      progress,
      camera.camera,
      layers,
      props.excursion,
      presentation,
    );
    atmosphere.update(renderer, state.effects.night);
    if (props.prologue !== undefined)
      renderer.toneMappingExposure =
        0.95 + 0.17 * Math.min(1, props.prologue / 0.8);
    let activeImmersion = state.effects.immersion;
    let animalBoxes = props.excursion ? [] : state.animals;
    if (props.excursion) void selectExcursion(props.excursion.id);
    else if (excursion || excursionLoading) {
      excursionVersion++;
      excursionLoading = "";
      excursion?.dispose();
      excursion = undefined;
    }
    if (props.excursion && excursion?.id === props.excursion.id) {
      const local = props.reducedMotion ? 0.5 : props.excursion.local;
      const effects = excursion.update(local, camera.camera);
      activeImmersion = effects.immersion;
      animalBoxes = effects.animals ?? [];
      renderer.shadowMap.needsUpdate = true;
    }
    world.renderReflection(renderer, camera.camera);
    pass!.render(
      renderer,
      world.scene,
      camera.camera,
      layers.water ? activeImmersion : 0,
      state.effects.time,
    );
    if (props.prologue !== undefined && office) {
      office.screen.updateWorldMatrix(true, false);
      const points = [
        [-2.8, 1.575],
        [2.8, 1.575],
        [2.8, -1.575],
        [-2.8, -1.575],
      ].map(([x, y]) =>
        new Vector3(x, y, 0)
          .applyMatrix4(office!.screen.matrixWorld)
          .project(camera.camera),
      );
      const quad = points.map((p) => ({
        x: ((p.x + 1) * viewportWidth) / 2,
        y: ((1 - p.y) * viewportHeight) / 2,
      })) as unknown as ScreenQuad;
      const transform = screenTransform(quad);
      emit("screen", {
        transform: transform ?? "",
        visible:
          !!transform &&
          props.prologue < 0.22 &&
          points.every((p) => p.z > -1 && p.z < 1),
        focus: screenFocus,
      });
    } else emit("screen", undefined);
    const rig = transitionAt(progress);
    const report: FrameReport = {
      progress,
      transition: rig.id,
      local: rig.local,
      position: [...pose.position],
      target: [...pose.target],
      fov: pose.fov,
      immersion: activeImmersion,
      night: state.effects.night,
      logo: state.effects.logo,
      observation: state.effects.observation,
      dataMorph: state.effects.dataMorph,
      bounds: state.observationBounds,
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      renderCount: ++renderCount,
      quality,
      pixelRatio: renderer.getPixelRatio(),
      renderer: device,
      textureCount: renderer.info.memory.textures,
      geometryCount: renderer.info.memory.geometries,
      residentImages: preloader.residentCount,
      estimatedImageBytes: preloader.estimatedImageBytes,
      postProcessing: layers.water && activeImmersion > 0,
      cpuSubmitMs: performance.now() - began,
      assetsPending:
        assetsPending ||
        (!!landscapeLoading && world.pending) ||
        !!excursionLoading,
      animals: animalBoxes,
      excursion: props.excursion
        ? {
            id: props.excursion.id,
            local: props.excursion.local,
            connected: true,
          }
        : undefined,
    };
    host.value.dataset.cameraY = pose.position[1].toFixed(3);
    host.value.dataset.progress = progress.toFixed(5);
    host.value.dataset.drawCalls = String(report.drawCalls);
    host.value.dataset.renderCount = String(renderCount);
    host.value.dataset.state = JSON.stringify(report);
    host.value.dataset.prologue =
      props.prologue === undefined ? "" : props.prologue.toFixed(5);
    host.value.dataset.excursion = props.excursion?.id ?? "";
    host.value.dataset.excursionLocal = props.excursion?.local.toFixed(6) ?? "";
    host.value.dataset.renderScene = "journey-world";
    host.value.dataset.cameraMode = props.excursion ? "connected" : "original";
    const poseKey = `${pose.position.join(",")}:${pose.target.join(",")}:${pose.fov}`;
    monitor.frame(
      performance.now(),
      !props.reducedMotion && lastPose !== poseKey,
    );
    lastPose = poseKey;
    emit("frame", report);
  }
  // Share the animation clock with the scroll timeline. Scheduling a second RAF
  // from Vue's post-flush watcher otherwise skips alternate GSAP frames.
  function tick() {
    if (!dirty || document.hidden || props.suspended) {
      stopRendering();
      return;
    }
    dirty = false;
    draw();
    // Render again only while the camera approaches/recedes from the monitor,
    // or while an actual local video supplies new pixels. A still bureau sleeps.
    if (
      props.prologue !== undefined &&
      ((!props.reducedMotion &&
        screenFocus !== Number(!!props.prologueFocus)) ||
        (props.prologueVideo &&
          !props.prologueVideo.paused &&
          !props.prologueVideo.ended))
    )
      dirty = true;
  }
  function stopRendering() {
    gsap.ticker.remove(tick);
    scheduled = false;
    dirty = false;
    // A settled seek is not a slow animation. Start the next measurement window
    // only when a real sequence of moving frames resumes.
    monitor?.frame(performance.now(), false);
  }
  function invalidate() {
    if (!initialized || document.hidden || props.suspended) return;
    dirty = true;
    if (!scheduled) {
      scheduled = true;
      gsap.ticker.add(tick);
    }
  }
  function resize() {
    if (!renderer || !host.value) return;
    const box = host.value.getBoundingClientRect();
    viewportWidth = box.width;
    viewportHeight = box.height;
    renderer.setPixelRatio(
      renderPixelRatio(quality, box.width, box.height, devicePixelRatio),
    );
    renderer.setSize(box.width, box.height, false);
    camera.resize(box.width, box.height);
    pass?.resize(
      box.width * renderer.getPixelRatio(),
      box.height * renderer.getPixelRatio(),
    );
    invalidate();
  }
  const lost = (event: Event) => {
    event.preventDefault();
    abort.abort();
    stopRendering();
    if (landscapeIdle) window.cancelIdleCallback(landscapeIdle);
    clearTimeout(landscapeTimer);
    emit(
      "error",
      "Le contexte graphique a été interrompu. Le parcours reste disponible en version 2D simplifiée.",
    );
  };
  const visibility = () => {
    if (document.hidden) {
      stopRendering();
    } else invalidate();
  };
  teardown = () => {
    abort.abort();
    if (landscapeIdle) window.cancelIdleCallback(landscapeIdle);
    clearTimeout(landscapeTimer);
    initialized = false;
    stopRendering();
    observer?.disconnect();
    document.removeEventListener("visibilitychange", visibility);
    renderer?.domElement.removeEventListener("webglcontextlost", lost);
    pass?.dispose();
    excursionVersion++;
    excursion?.dispose();
    office?.dispose();
    world?.dispose();
    preloader.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss();
    renderer?.domElement.remove();
  };
  try {
    loading(0.12, "Préparation du moteur graphique…");
    renderer = new WebGLRenderer({
      antialias: initial !== "eco",
      powerPreference: initial === "eco" ? "low-power" : "default",
    });
    renderer.localClippingEnabled = true;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.info.autoReset = false;
    const gl = renderer.getContext(),
      debug = gl.getExtension("WEBGL_debug_renderer_info");
    device = debug
      ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))
      : String(gl.getParameter(gl.RENDERER));
    // Measured SwiftShader delivery is below 10 FPS on the audit laptop.
    // A deliberately explicit diagnostic URL can still measure that renderer.
    if (
      /SwiftShader|llvmpipe|software/i.test(device) &&
      new URLSearchParams(location.search).get("render") !== "software"
    ) {
      teardown();
      emit(
        "error",
        "Le rendu graphique logiciel est trop lent pour ce voyage. Le parcours continue sans WebGL.",
      );
      return;
    }
    const economy =
      initial === "eco" ||
      /SwiftShader|llvmpipe|software/i.test(device) ||
      window.matchMedia("(max-width: 600px)").matches;
    quality = economy ? "eco" : "standard";
    renderer.shadowMap.enabled = !economy;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    monitor = new PerformanceMonitor(
      (sample) => emit("performance", sample),
      () => {
        quality = "eco";
        world?.setEconomy(true);
        renderer!.shadowMap.enabled = false;
        resize();
      },
      quality,
      () => {
        emit(
          "error",
          "Cet appareil bénéficie du mode léger sans 3D pour garder une navigation fluide. Les chapitres et les explorations restent accessibles.",
        );
      },
    );
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.addEventListener("webglcontextlost", lost);
    host.value.append(renderer.domElement);
    loading(0.28, "Création du paysage…");
    world = createWorld(economy, abort.signal, invalidate, (message) => {
      modelIssues.add(message);
      publishAssetIssues();
    });
    pass = new RefractionPass();
    camera.update(props.progress);
    resize();
    // Logo particles are only needed outdoors. Do not block the office on them.
    if (props.prologue === undefined) {
      loading(0.42, "Chargement des éléments du paysage…");
      await Promise.all([
        selectAssets(pitchIndex(props.progress)),
        ensureLandscape(),
      ]);
    }
    loading(0.7, "Préparation de la lumière…");
    world.prepareEnvironment(renderer);
    if (props.prologue !== undefined) {
      loading(0.78, "Préparation du bureau d’études…");
      await ensureOffice();
    }
    if (abort.signal.aborted) return;
    loading(0.9, "Préparation du premier affichage…");
    if (
      !(await preloader.prepare(
        renderer,
        world.scene,
        camera.camera,
        abort.signal,
      ))
    )
      return;
    initialized = true;
    renderFrame = invalidate;
    observer = new ResizeObserver(resize);
    observer.observe(host.value);
    document.addEventListener("visibilitychange", visibility);
    renderer.info.reset();
    draw();
    loading(1, "Le voyage est prêt.");
    emit("ready");
    // After the bureau is visible, prepare the outdoors without holding the
    // initial reveal hostage. Explicit data-saving waits for an actual departure.
    if (props.prologue !== undefined && !hints.connection?.saveData) {
      const prepareLandscape = () => {
        if (!abort.signal.aborted) void ensureLandscape();
      };
      if (typeof window.requestIdleCallback === "function")
        landscapeIdle = window.requestIdleCallback(prepareLandscape, {
          timeout: 1200,
        });
      else landscapeTimer = window.setTimeout(prepareLandscape, 300);
    }
  } catch {
    const interrupted = abort.signal.aborted;
    teardown();
    if (!interrupted)
      emit(
        "error",
        "La vue WebGL n’est pas disponible. Le parcours est présenté en version 2D simplifiée.",
      );
  }
});
onBeforeUnmount(() => {
  renderFrame = undefined;
  teardown?.();
});
</script>
<template>
  <div
    ref="host"
    class="sx-canvas"
    aria-hidden="true"
    data-testid="experience-canvas"
  />
</template>
