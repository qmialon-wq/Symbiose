<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import { RouterLink } from "vue-router";
import NarrativeOverlay from "../experience/NarrativeOverlay.vue";
import PresentationControls from "../experience/PresentationControls.vue";
import { NarrativeTimeline } from "../experience/NarrativeTimeline";
import { narrativeCueAt } from "../experience/narrative-cues";
import { scrollScreens } from "../experience/config";
import {
  appUrl,
  chapterProgress,
  pitchChapters,
  pitchIndex,
  pitchSeconds,
  progressAtSeconds,
} from "../experience/pitch";
import type { PerformanceSample } from "../experience/PerformanceMonitor";
import LandingLoading from "../experience/LandingLoading.vue";
import {
  readQualityPreference,
  qualityStorageKey,
  type QualityPreference,
  type LoadingState,
} from "../experience/render-quality";
import "../experience/experience.css";
import "../experience/journey.css";
import "../experience/pitch.css";
import "../experience/finishing.css";
import symbioseLogo from "../assets/symbiose-logo.png";
import FallbackScene from "../experience/FallbackScene.vue";
import { fallbackRoute } from "../experience/fallback-frame";
import PrologueOverlay from "../experience/prologue/PrologueOverlay.vue";
import PrologueFallback from "../experience/prologue/PrologueFallback.vue";
import type { OfficeScreenProjection } from "../experience/prologue/screen-projection";
import ExcursionOverlay from "../experience/excursions/ExcursionOverlay.vue";
import ExcursionFallback from "../experience/excursions/ExcursionFallback.vue";
import {
  expandedScrollScreens,
  sampleRoute,
  routeAtOriginal,
  excursionProgress,
  adjacentStop,
  routeClock,
  expandedTime,
  type ExcursionId,
} from "../experience/excursions/route";
import {
  prologueScreens,
  prologueFraction,
  prologueAt,
  toJourney,
  toTotal,
  prologueTravelSeconds,
} from "../experience/prologue/prologue";
import JourneyAnnotations from "../experience/JourneyAnnotations.vue";
import FaunaAnnotations from "../experience/FaunaAnnotations.vue";
import {
  defaultLayers,
  transitions,
  transitionProgress,
  referenceScene,
  type JourneyLayers,
} from "../experience/journey";
import type { FrameReport } from "../experience/telemetry";
import {
  ownsPresentationKey,
  readCheckpoint,
  saveCheckpoint,
  type JuryCheckpoint,
} from "../experience/jury-state";
const props = withDefaults(
  defineProps<{ jury?: boolean; applicationHref?: string }>(),
  { jury: false, applicationHref: appUrl },
);
const ExperienceCanvas = defineAsyncComponent(
  () => import("../experience/ExperienceCanvas.vue"),
);
const DebugControls = defineAsyncComponent(
  () => import("../experience/DebugControls.vue"),
);
const checkpoint = ref<JuryCheckpoint>();
const restartGeneration = ref(0);
const forced2d = ref(
  new URLSearchParams(location.search).get("render") === "2d",
);

const root = ref<HTMLElement>();
const totalProgress = ref(0);
const ready = ref(false),
  error = ref("");
const minimumLoadingElapsed = ref(false);
let minimumLoadingTimer: ReturnType<typeof setTimeout> | undefined;
const qualityPreference = ref(readQualityPreference());
const loading = shallowRef<LoadingState>({
  progress: 0.04,
  label: "Chargement de l’expérience…",
});
function chooseQuality(value: QualityPreference) {
  if (value === qualityPreference.value) return;
  timeline?.pause();
  qualityPreference.value = value;
  try {
    localStorage.setItem(qualityStorageKey, value);
  } catch {
    /* Session choice still works. */
  }
  if (!forced2d.value && !error.value) {
    ready.value = false;
    loading.value = { progress: 0.04, label: "Adaptation de la qualité…" };
  }
}
function lightweight() {
  clearTimeout(minimumLoadingTimer);
  minimumLoadingElapsed.value = true;
  timeline?.pause();
  ready.value = false;
  error.value = "";
  forced2d.value = true;
  loading.value = { progress: 0.25, label: "Chargement de l’aperçu léger…" };
  frame.value = undefined;
}
const mode = ref<"exploration" | "presentation">(
  props.jury ? "presentation" : "exploration",
);
const playing = ref(false),
  systemReduced = ref(false),
  userReduced = ref(false);
const reducedMotion = computed(() => systemReduced.value || userReduced.value);
const showLoading = computed(
  () => !ready.value || (!minimumLoadingElapsed.value && !reducedMotion.value),
);
const dialog = ref<HTMLDialogElement>();
const dialogOpen = ref(false),
  fullscreen = ref(false),
  fullscreenNote = ref("");
const PitchSources = defineAsyncComponent(
  () => import("../experience/PitchSources.vue"),
);
let fullscreenOwned = false;
const performance = ref<PerformanceSample>();
const frame = shallowRef<FrameReport>();
const layers = ref<JourneyLayers>({ ...defaultLayers });
const assetIssues = ref<string[]>([]);
function showFallback(message: string) {
  error.value = message;
  frame.value = undefined;
}
const debug = ["experience", "transitions"].includes(
  new URLSearchParams(window.location.search).get("debug") ?? "",
);
// Existing renderers and editorial content retain their original 0–1 coordinates.
const hasPrologue = !debug && !props.jury;
const prefix = hasPrologue ? prologueFraction : 0;
const routeProgress = computed(() => toJourney(totalProgress.value, prefix));
const route = computed(() =>
  debug
    ? {
        progress: routeProgress.value,
        excursion: undefined,
        seconds: pitchSeconds(routeProgress.value),
      }
    : forced2d.value || error.value
      ? fallbackRoute(
          routeProgress.value,
          0.5 / (expandedScrollScreens * window.innerHeight),
        )
      : sampleRoute(routeProgress.value),
);
const progress = computed(() => route.value.progress);
const currentCue = computed(() => narrativeCueAt(route.value.seconds));
const presentationEnding = computed(
  () =>
    !debug &&
    mode.value === "presentation" &&
    !inPrologue.value &&
    currentCue.value.id === "night-forest",
);
const excursion = computed(() =>
  !inPrologue.value ? route.value.excursion : undefined,
);
const prologueLocal = computed(() =>
  hasPrologue ? prologueAt(totalProgress.value) : 1,
);
const inPrologue = computed(
  () => hasPrologue && totalProgress.value < prefix - 1e-8,
);
const prologueVideo = ref<HTMLVideoElement | null>(null);
const prologuePlaying = ref(false),
  prologueFocus = ref(false);
const prologueOverlay = ref<InstanceType<typeof PrologueOverlay>>();
const officeScreen = shallowRef<OfficeScreenProjection>();
const approachingScreen = ref(false),
  leavingScreen = ref(false);
const mediaLocked = computed(
  () => prologuePlaying.value || approachingScreen.value || leavingScreen.value,
);
watch(
  () => [forced2d.value, !!error.value, reducedMotion.value],
  () => {
    if (forced2d.value || error.value || reducedMotion.value) {
      approachingScreen.value = false;
      if (forced2d.value || error.value) officeScreen.value = undefined;
      if (leavingScreen.value) {
        leavingScreen.value = false;
        travelOutside();
      }
    }
  },
);
let lockedProgress = 0;
function focusScreen() {
  timeline?.pause();
  lockedProgress = totalProgress.value;
  prologueFocus.value = true;
  approachingScreen.value =
    !reducedMotion.value && !error.value && !forced2d.value;
}
function screenChanged(value: OfficeScreenProjection | undefined) {
  officeScreen.value = value;
  if (value && value.focus >= 0.995) approachingScreen.value = false;
  if (leavingScreen.value && value && value.focus < 0.005) {
    leavingScreen.value = false;
    travelOutside();
  }
}
function videoPlaying(value: boolean) {
  prologuePlaying.value = value;
  if (value) {
    timeline?.pause();
    lockedProgress = totalProgress.value;
    prologueFocus.value = true;
  }
}
function updateProgress(value: number) {
  if (mediaLocked.value && Math.abs(value - lockedProgress) > 1e-7) {
    timeline?.seek(lockedProgress, true);
    return;
  }
  totalProgress.value = value;
  if (!inPrologue.value) prologueFocus.value = false;
}
function intro(skip = false) {
  prologueOverlay.value?.pause();
  approachingScreen.value = false;
  if (
    !skip &&
    prologueFocus.value &&
    !reducedMotion.value &&
    !error.value &&
    !forced2d.value
  ) {
    lockedProgress = totalProgress.value;
    leavingScreen.value = true;
    prologueFocus.value = false;
    return;
  }
  leavingScreen.value = false;
  prologueFocus.value = false;
  if (skip || reducedMotion.value) timeline?.seek(prefix, true);
  else travelOutside();
}
function travelOutside() {
  // In presentation mode the five-minute narrative starts as soon as the
  // travelling reaches the forest; any wheel, key or click cancels both.
  timeline?.playTo(
    prefix,
    prologueTravelSeconds * (1 - prologueLocal.value),
    () => {
      if (mode.value === "presentation") play();
    },
  );
  playing.value = true;
}
function backToPrologue() {
  prologueOverlay.value?.resetScreen();
  prologueFocus.value = false;
  approachingScreen.value = leavingScreen.value = false;
  timeline?.seek(0, true);
}
function holdVideoScroll(event: WheelEvent | TouchEvent) {
  if (mediaLocked.value) event.preventDefault();
}
const reference = computed(() => referenceScene(progress.value));
function setLayer(key: keyof JourneyLayers, value: boolean) {
  layers.value = { ...layers.value, [key]: value };
}
let timeline: NarrativeTimeline | undefined;
let media: MediaQueryList;
let resizeObserver: ResizeObserver;
let resizeFrame = 0;
const originalTitle = document.title;
const originalScrollRestoration = history.scrollRestoration;
function buildTimeline() {
  const destination = totalProgress.value;
  const rebuilding = !!timeline;
  timeline?.dispose();
  if (root.value)
    timeline = new NarrativeTimeline(
      root.value,
      reducedMotion.value,
      updateProgress,
      () => (playing.value = false),
      prefix,
      debug ? undefined : routeClock,
      props.jury,
    );
  if (rebuilding) timeline?.seek(destination, true);
}
function mediaChanged() {
  systemReduced.value = media.matches;
  buildTimeline();
}
function toggleMotion() {
  userReduced.value = !userReduced.value;
  buildTimeline();
}
function seek(
  value: number,
  immediate = props.jury || forced2d.value || !!error.value,
) {
  seekRoute(debug ? value : routeAtOriginal(value), immediate);
}
function seekRoute(
  value: number,
  immediate = props.jury || forced2d.value || !!error.value,
) {
  prologueOverlay.value?.pause();
  approachingScreen.value = leavingScreen.value = false;
  timeline?.seek(toTotal(value, prefix), immediate);
}
function visitExcursion(id: ExcursionId) {
  seekRoute(excursionProgress(id), true);
}
function nextChapter(direction: number) {
  if (inPrologue.value) {
    intro();
    return;
  }
  if (direction < 0 && routeProgress.value < 1e-5) {
    backToPrologue();
    return;
  }
  seekRoute(adjacentStop(routeProgress.value, direction));
}
function restart() {
  timeline?.pause();
  restartGeneration.value++;
  checkpoint.value = undefined;
  backToPrologue();
  if (props.jury) saveCheckpoint(0, mode.value);
  root.value?.focus({ preventScroll: true });
}
function skipAnimation() {
  if (inPrologue.value) {
    intro(true);
    return;
  }
  if (!debug) {
    if (excursion.value)
      seekRoute(excursionProgress(excursion.value.id, 1), true);
    else nextChapter(1);
    return;
  }
  const index = pitchIndex(progress.value);
  seek(index === 7 ? 1 : chapterProgress(index + 1), true);
}
function resume() {
  if (checkpoint.value) {
    mode.value = checkpoint.value.mode;
    seek(checkpoint.value.progress, true);
    root.value?.focus({ preventScroll: true });
  }
}
function toggleRenderer() {
  timeline?.pause();
  forced2d.value = !(forced2d.value || !!error.value);
  if (!forced2d.value) {
    error.value = "";
    ready.value = false;
    loading.value = { progress: 0.04, label: "Préparation de la scène 3D…" };
  }
  frame.value = undefined;
}
function persist() {
  if (props.jury) saveCheckpoint(progress.value, mode.value);
}
watch(
  () => pitchIndex(progress.value),
  () => persist(),
);
function setMode(value: "exploration" | "presentation") {
  timeline?.pause();
  mode.value = value;
  if (value === "presentation" && inPrologue.value) {
    // Presentation starts in the forest; the public introduction stays available
    // when returning to free exploration.
    prologueOverlay.value?.resetScreen();
    prologueFocus.value = false;
    approachingScreen.value = leavingScreen.value = false;
    timeline?.seek(prefix, true);
  }
}
function play() {
  if (document.hidden || dialogOpen.value) return;
  if (inPrologue.value) {
    intro();
    return;
  }
  if ((!reducedMotion.value || props.jury) && !showLoading.value) {
    if (progress.value >= 0.999) {
      seek(0);
    }
    timeline?.playPresentation();
    playing.value = true;
  }
}
function openProject() {
  timeline?.pause();
  dialogOpen.value = true;
  dialog.value?.showModal();
}
function fullscreenChanged() {
  fullscreen.value = !!document.fullscreenElement;
}
async function toggleFullscreen() {
  timeline?.pause();
  fullscreenNote.value = "";
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
      fullscreenOwned = true;
    } else
      fullscreenNote.value =
        "Le plein écran n’est pas disponible dans ce navigateur.";
  } catch {
    fullscreenNote.value =
      "Le navigateur a refusé le plein écran. Les contrôles restent disponibles.";
  }
}
function presentationKey(event: KeyboardEvent) {
  if (inPrologue.value && ownsPresentationKey(event)) {
    // Native media controls keep keyboard ownership; navigation first pauses the film.
    if (mediaLocked.value) {
      event.preventDefault();
      if (event.key === " ") prologueOverlay.value?.pause();
      return;
    }
    if (
      ["ArrowRight", "ArrowDown", "PageDown"].includes(event.key) &&
      mode.value === "presentation"
    ) {
      event.preventDefault();
      intro();
      return;
    }
  }
  if (
    mode.value !== "presentation" ||
    dialogOpen.value ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  )
    return;
  if (!ownsPresentationKey(event)) return;
  const index = pitchIndex(progress.value);
  if (["ArrowRight", "ArrowDown", "PageDown"].includes(event.key)) {
    event.preventDefault();
    if (!debug) nextChapter(1);
    else seek(index === 7 ? 1 : chapterProgress(index + 1));
  } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
    event.preventDefault();
    if (!debug) nextChapter(-1);
    else seek(chapterProgress(index - 1));
  } else if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    event.key === "Home" ? backToPrologue() : seek(1);
  } else if (event.key === " ") {
    event.preventDefault();
    playing.value ? timeline?.pause() : play();
  }
}

onMounted(() => {
  minimumLoadingTimer = setTimeout(() => {
    minimumLoadingElapsed.value = true;
  }, 2500);
  document.title = "Symbiose — Le vivant nous relie";
  media = window.matchMedia("(prefers-reduced-motion: reduce)");
  systemReduced.value = media.matches;
  media.addEventListener("change", mediaChanged);
  if (props.jury) {
    checkpoint.value = readCheckpoint();
    history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  buildTimeline();
  window.addEventListener("pagehide", persist);
  window.addEventListener("keydown", presentationKey);
  window.addEventListener("wheel", holdVideoScroll, { passive: false });
  window.addEventListener("touchmove", holdVideoScroll, { passive: false });
  document.addEventListener("fullscreenchange", fullscreenChanged);
  const query = new URLSearchParams(location.search),
    id = transitions.find((t) => t.id === query.get("transition"))?.id;
  if (debug && id) seek(transitionProgress(id, Number(query.get("p") ?? 0)));
  resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => timeline?.refresh());
  });
  resizeObserver.observe(root.value!);
});
onBeforeUnmount(() => {
  clearTimeout(minimumLoadingTimer);
  timeline?.dispose();
  resizeObserver?.disconnect();
  cancelAnimationFrame(resizeFrame);
  media?.removeEventListener("change", mediaChanged);
  window.removeEventListener("keydown", presentationKey);
  window.removeEventListener("wheel", holdVideoScroll);
  window.removeEventListener("touchmove", holdVideoScroll);
  window.removeEventListener("pagehide", persist);
  document.removeEventListener("fullscreenchange", fullscreenChanged);
  if (fullscreenOwned && document.fullscreenElement)
    void document.exitFullscreen().catch(() => {});
  dialog.value?.close();
  document.title = originalTitle;
  if (props.jury) history.scrollRestoration = originalScrollRestoration;
});
</script>

<template>
  <main
    ref="root"
    id="main-content"
    tabindex="-1"
    class="landing sx-experience"
    :data-mode="mode"
    :data-reduced-motion="reducedMotion"
    :data-progress="progress.toFixed(6)"
    :data-route-progress="routeProgress.toFixed(6)"
    :data-excursion="excursion?.id ?? ''"
    :data-excursion-local="excursion?.local.toFixed(6) ?? ''"
    :data-prologue="prologueLocal.toFixed(6)"
    :data-prologue-active="inPrologue"
    :data-prologue-video-focus="prologueFocus"
    :data-screen-focus="(officeScreen?.focus ?? 0).toFixed(5)"
    :data-jury="jury"
    :data-seconds="route.seconds.toFixed(3)"
    :data-cue="inPrologue ? 'prologue' : currentCue.id"
    :data-ending="presentationEnding"
    :style="{
      '--sx-scroll-screens': debug
        ? scrollScreens
        : expandedScrollScreens + (hasPrologue ? prologueScreens : 0),
      '--sx-flow': `${-progress * 96}px`,
    }"
  >
    <div
      class="sx-stage"
      :class="{
        'sx-stage--ready': ready,
        'sx-stage--fallback': error || forced2d,
      }"
    >
      <ExperienceCanvas
        v-if="!error && !forced2d"
        :key="qualityPreference"
        :quality-preference="qualityPreference"
        :progress="progress"
        :reduced-motion="reducedMotion"
        :layers="layers"
        :prologue="inPrologue ? prologueLocal : undefined"
        :prologue-video="prologueVideo"
        :prologue-focus="prologueFocus"
        :excursion="excursion"
        :presentation-seconds="
          !debug && mode === 'presentation' && !inPrologue
            ? route.seconds
            : undefined
        "
        :suspended="dialogOpen"
        @ready="ready = true"
        @loading="loading = $event"
        @error="showFallback"
        @performance="performance = $event"
        @frame="frame = $event"
        @assets="assetIssues = $event"
        @screen="screenChanged"
      />
      <FallbackScene
        v-else-if="!inPrologue"
        :progress="progress"
        :reduced-motion="reducedMotion"
        @ready="ready = true"
      />
      <PrologueFallback
        v-if="inPrologue && (error || forced2d)"
        :local="prologueLocal"
        @ready="ready = true"
      />
      <ExcursionFallback
        v-if="excursion && (error || forced2d)"
        :state="excursion"
        :reduced-motion="reducedMotion"
      />
      <div class="sx-vignette" aria-hidden="true" />
      <header class="sx-header">
        <component
          :is="jury ? 'a' : RouterLink"
          class="sx-brand"
          v-bind="jury ? { href: '/jury/' } : { to: '/' }"
          aria-label="Symbiose Normandie — accueil"
        >
          <img :src="symbioseLogo" alt="Symbiose" width="3634" height="1242" />
        </component>
        <span class="sx-event"
          >UN PROJET NORMAND<span>Datathon Normandie · 2026</span></span
        >
        <nav aria-label="Navigation d’accueil">
          <button class="sx-project-link" @click="openProject">
            Le projet <span aria-hidden="true">+</span></button
          ><a class="sx-app-link" :href="applicationHref"
            >Accéder à l’application <span aria-hidden="true">↗</span></a
          >
        </nav>
      </header>
      <NarrativeOverlay
        v-if="!debug && !inPrologue && !excursion"
        :key="restartGeneration"
        :progress="progress"
        :reduced-motion="reducedMotion"
        :app-href="applicationHref"
        :time-map="expandedTime"
        :presentation="mode === 'presentation'"
        :seconds="route.seconds"
        @begin="seek(chapterProgress(1))"
        @sources="openProject"
      />
      <ExcursionOverlay
        v-if="excursion"
        :state="excursion"
        :presentation="mode === 'presentation'"
        :seconds="route.seconds"
        :reduced-motion="reducedMotion"
        @leave="seekRoute(excursionProgress(excursion.id, 1), true)"
      />
      <h1 v-if="excursion" class="sx-sr-only">
        Symbiose — nouvelles explorations
      </h1>
      <PrologueOverlay
        v-if="hasPrologue"
        ref="prologueOverlay"
        :local="prologueLocal"
        :active="inPrologue"
        :reduced-motion="reducedMotion"
        :suspended="dialogOpen"
        :fallback="!!error || forced2d"
        :focused="prologueFocus"
        :screen="officeScreen"
        @video="prologueVideo = $event"
        @playing="videoPlaying"
        @focus="focusScreen"
        @enter="intro()"
        @skip="intro(true)"
      />
      <h1 v-if="debug" class="sx-sr-only">Symbiose — Le vivant nous relie</h1>
      <JourneyAnnotations
        v-if="debug"
        :frame="frame"
        :visible="layers.observation"
      />
      <FaunaAnnotations
        v-if="
          !inPrologue &&
          !presentationEnding &&
          (!excursion || excursion.id === 'marine') &&
          frame?.animals?.length
        "
        :animals="frame.animals"
      />
      <div v-show="!presentationEnding" class="sx-location">
        <span class="sx-location-mark" aria-hidden="true">⌖</span> NORMANDIE,
        FRANCE<span class="sx-location-rule" aria-hidden="true" /><span>{{
          "TRAJET ILLUSTRATIF · NON GÉOLOCALISÉ"
        }}</span>
      </div>
      <div v-show="!presentationEnding" class="sx-prototype">
        <span>VOYAGE · 8 ATMOSPHÈRES · 3 EXPLORATIONS</span
        ><button @click="openProject">
          {{
            error || forced2d
              ? "Version simplifiée 2D · images générées"
              : "Reconstruction 3D · calques générés"
          }}
          <span aria-hidden="true">↗</span>
        </button>
      </div>
      <p
        v-if="assetIssues.length && !debug"
        class="sx-motion-note"
        role="status"
      >
        Certains calques sont indisponibles · géométrie conservée
      </p>
      <Transition name="sx-loader">
        <LandingLoading
          v-if="showLoading"
          :state="
            ready ? { progress: 1, label: 'L’expérience est prête.' } : loading
          "
          :app-href="applicationHref"
          @lightweight="lightweight"
        />
      </Transition>
      <div v-if="error" class="sx-fallback-note" role="status">
        <p>{{ error }}</p>
        <button @click="openProject">Lire le projet et le parcours</button>
      </div>
      <p v-if="reducedMotion" class="sx-motion-note">
        Mouvements réduits · points de vue fixes
      </p>
      <PresentationControls
        :progress="progress"
        :mode="mode"
        :playing="playing"
        :reduced-motion="reducedMotion"
        :fullscreen="fullscreen"
        :fallback="!!error || forced2d"
        :jury="jury"
        :prologue="inPrologue"
        :include-prologue="hasPrologue"
        :route-progress="debug ? undefined : routeProgress"
        :route-seconds="debug ? undefined : route.seconds"
        :excursion="excursion?.id"
        :quality="qualityPreference"
        @quality="chooseQuality"
        :resume-label="
          checkpoint
            ? pitchChapters[pitchIndex(checkpoint.progress)].subject
            : undefined
        "
        @seek="seek"
        @mode="setMode"
        @play="play"
        @pause="timeline?.pause()"
        @fullscreen="toggleFullscreen"
        @restart="restart"
        @skip="skipAnimation"
        @resume="resume"
        @renderer="toggleRenderer"
        @prologue="backToPrologue"
        @route-seek="seekRoute"
        @excursion="visitExcursion"
        @next="nextChapter(1)"
        @previous="nextChapter(-1)"
      />
      <p v-if="fullscreenNote" class="sx-fullscreen-note" role="status">
        {{ fullscreenNote }}
      </p>
      <DebugControls
        v-if="debug"
        :progress="progress"
        :layers="layers"
        :frame="frame"
        :performance="performance"
        :issues="assetIssues"
        :fallback="!!error"
        @seek="seek"
        @layer="setLayer"
      />
      <figure v-if="debug && layers.reference" class="sx-debug-reference">
        <img
          :src="`/experience-art/${reference}/primary-v1.png`"
          alt="Composition de référence générée par IA"
        />
        <figcaption>
          Référence fixe · {{ reference }} · image générée
        </figcaption>
      </figure>
    </div>
    <dialog
      ref="dialog"
      class="sx-dialog"
      aria-labelledby="sx-project-title"
      @close="dialogOpen = false"
      @click="$event.target === dialog && dialog?.close()"
    >
      <div class="sx-dialog-inner">
        <button
          class="sx-dialog-close"
          autofocus
          aria-label="Fermer le projet"
          @click="dialog?.close()"
        >
          Fermer <span aria-hidden="true">×</span>
        </button>
        <PitchSources
          v-if="dialogOpen"
          :chapter-id="pitchChapters[pitchIndex(progress)].id"
        />
        <p class="sx-resource-note">
          Ce voyage relie huit milieux par une reconstruction 3D d’intention et
          des calques générés. Les tracés, signaux et animaux sont illustratifs
          ; aucun score d’IA ni relevé cadastral n’est calculé ici. Étretat est
          une évocation, et les changements de lieu ne sont pas une captation
          réelle. Les fonds reconstruits et profondeurs calibrées de production
          restent absents. Les informations du pitch sont distinctes de ces
          illustrations ; les archives IGN sont datées et consultables
          localement.
        </p>
        <div class="sx-dialog-actions">
          <a v-if="!jury" href="/experience-art/index.html"
            >Voir les huit atmosphères ↗</a
          >
          <RouterLink v-if="!jury" class="sx-cta" to="/inscription"
            >Créer un compte <span aria-hidden="true">↗</span></RouterLink
          ><a :href="applicationHref">Se connecter</a
          ><button
            v-if="!systemReduced"
            :aria-pressed="userReduced"
            @click="toggleMotion"
          >
            {{
              userReduced ? "Activer les mouvements" : "Réduire les mouvements"
            }}</button
          ><span v-else>Mouvements réduits par le système</span>
        </div>
      </div>
    </dialog>
  </main>
</template>
