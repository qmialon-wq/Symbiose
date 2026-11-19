<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { clock, localMediaUrl } from "../pitch";
import "./prologue.css";
import YouTubeScreen from "./YouTubeScreen.vue";
import { defaultIntroYouTubeUrl, youtubeVideoId } from "./youtube-player";
import type { OfficeScreenProjection } from "./screen-projection";

const props = defineProps<{
  local: number;
  active: boolean;
  reducedMotion: boolean;
  suspended: boolean;
  fallback?: boolean;
  focused?: boolean;
  screen?: OfficeScreenProjection;
}>();
const emit = defineEmits<{
  video: [element: HTMLVideoElement | null];
  playing: [value: boolean];
  enter: [];
  skip: [];
  focus: [];
}>();
const localFiles = Object.keys(
  import.meta.glob("/public/experience-media/intro.mp4", {
    eager: true,
    query: "?url",
    import: "default",
  }),
);
const configured = import.meta.env.VITE_SYMBIOSE_INTRO_VIDEO_URL as
  | string
  | undefined;
const source = ref(
  configured === undefined
    ? localFiles[0]?.replace("/public", "") || ""
    : localMediaUrl(configured.trim()),
);
const captions = localMediaUrl(
  import.meta.env.VITE_SYMBIOSE_INTRO_CAPTIONS_URL,
);
const video = ref<HTMLVideoElement>();
const playing = ref(false),
  ended = ref(false),
  failed = ref(false);
const current = ref(0),
  duration = ref(0),
  muted = ref(false),
  volume = ref(1);
const notice = ref(""),
  fileName = ref(""),
  caption = ref("");
const youtubeSelected = ref(false);
const useYouTube = computed(() => !source.value || youtubeSelected.value);
const available = computed(
  () => !!source.value && !failed.value && !useYouTube.value,
);
const youtube = ref<InstanceType<typeof YouTubeScreen>>();
const youtubeRequested = ref(false),
  youtubePresented = ref(false),
  youtubeReady = ref(false),
  youtubeError = ref("");
const youtubeGeneration = ref(0);
const youtubeId = youtubeVideoId(
  import.meta.env.VITE_SYMBIOSE_INTRO_YOUTUBE_URL?.trim() ||
    defaultIntroYouTubeUrl,
);
const youtubeLink = youtubeId
  ? `https://www.youtube.com/watch?v=${youtubeId}`
  : "";
const copyVisible = computed(() => props.active && props.local < 0.22);
const opacity = computed(() =>
  Math.max(0, Math.min(1, 1 - (props.local - 0.1) / 0.12)),
);
const finiteDuration = computed(() =>
  Number.isFinite(duration.value) && duration.value > 0 ? duration.value : 0,
);
let objectUrl = "";

function state(value: boolean) {
  playing.value = value;
  emit("playing", value);
}
function pause() {
  video.value?.pause();
  youtube.value?.pause();
  state(false);
}
function approachScreen() {
  if (props.suspended || !copyVisible.value) return;
  youtubeRequested.value = true;
  youtubeError.value = "";
  emit("focus");
  if (props.fallback || props.reducedMotion) youtubePresented.value = true;
}
function resetScreen() {
  pause();
  youtubeRequested.value = youtubePresented.value = youtubeReady.value = false;
  youtubeError.value = "";
}
function fail() {
  pause();
  failed.value = true;
  notice.value =
    "La vidéo est absente ou illisible. Vous pouvez regarder sur YouTube, poursuivre le voyage ou choisir un fichier local.";
}
function watchOnYouTube() {
  if (props.suspended || !copyVisible.value) return;
  pause();
  youtubeSelected.value = true;
  notice.value = "";
  ended.value = false;
  caption.value = "";
  approachScreen();
}
async function toggle() {
  if (useYouTube.value) {
    if (props.suspended || !copyVisible.value) return;
    if (youtubeError.value) {
      youtubeError.value = "";
      youtubeReady.value = false;
      youtubeGeneration.value++;
      return;
    }
    if (!youtubeRequested.value || !props.focused) {
      approachScreen();
      return;
    }
    if (youtubeReady.value) playing.value ? pause() : youtube.value?.play();
    return;
  }
  if (!video.value || props.suspended || !props.active || !copyVisible.value)
    return;
  if (!video.value.paused) pause();
  else {
    try {
      await video.value.play();
    } catch {
      if (!failed.value)
        notice.value =
          "La lecture n’a pas pu démarrer. Réessayez ou choisissez un autre fichier local.";
    }
  }
}
function onPlay() {
  if (props.suspended || !copyVisible.value || document.hidden) {
    pause();
    return;
  }
  ended.value = false;
  state(true);
}
function onEnded() {
  state(false);
  ended.value = true;
}
function seek(event: Event) {
  if (video.value)
    video.value.currentTime = Number((event.target as HTMLInputElement).value);
}
function setVolume(event: Event) {
  volume.value = Number((event.target as HTMLInputElement).value);
  if (video.value) {
    video.value.volume = volume.value;
    video.value.muted = volume.value === 0;
    muted.value = video.value.muted;
  }
}
function toggleMute() {
  muted.value = !muted.value;
  if (video.value) video.value.muted = muted.value;
}
function syncVolume() {
  if (!video.value) return;
  volume.value = video.value.volume;
  muted.value = video.value.muted;
}
function cueChanged(event: Event) {
  const track = (event.target as HTMLTrackElement).track;
  caption.value = Array.from(track.activeCues ?? [])
    .map((cue) => (cue as VTTCue).text)
    .join("\n");
}
function metadata() {
  duration.value = video.value?.duration ?? 0;
  if (video.value?.textTracks[0]) video.value.textTracks[0].mode = "hidden";
}
function chooseFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (!/^video\//.test(file.type) && !/\.(mp4|webm)$/i.test(file.name)) {
    notice.value = "Choisissez une vidéo MP4 ou WebM.";
    return;
  }
  pause();
  youtubeRequested.value = youtubePresented.value = youtubeReady.value = false;
  youtubeSelected.value = false;
  youtubeError.value = "";
  caption.value = "";
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(file);
  source.value = objectUrl;
  failed.value = false;
  ended.value = false;
  fileName.value = file.name;
  current.value = 0;
  duration.value = 0;
  notice.value =
    "Fichier ouvert sur cet appareil, sans téléversement. Lancez la lecture manuellement.";
}
function enter(skip = false) {
  pause();
  if (skip) emit("skip");
  else emit("enter");
}
const visibility = () => {
  if (document.hidden) pause();
};
const blur = () => {
  // Focusing the embedded player keeps focus inside this document.
  if (!document.hasFocus()) pause();
};
watch(
  () => [props.active, props.suspended, props.local],
  () => {
    if (!props.active || props.suspended || props.local >= 0.22) pause();
    if (!props.active || props.local >= 0.22)
      youtubeRequested.value =
        youtubePresented.value =
        youtubeReady.value =
          false;
  },
);
watch(
  () => [props.screen?.focus, props.fallback, props.focused],
  () => {
    if (
      youtubeRequested.value &&
      props.focused &&
      (props.fallback ||
        props.reducedMotion ||
        (props.screen?.focus ?? 0) >= 0.995)
    )
      youtubePresented.value = true;
  },
);
watch(
  video,
  async (element) => {
    await nextTick();
    emit("video", element ?? null);
  },
  { flush: "post" },
);
onMounted(() => {
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("blur", blur);
  if (configured && !localMediaUrl(configured))
    notice.value =
      "La vidéo doit utiliser un chemin local. Configuration distante ignorée.";
});
onBeforeUnmount(() => {
  pause();
  emit("video", null);
  document.removeEventListener("visibilitychange", visibility);
  window.removeEventListener("blur", blur);
  if (objectUrl) URL.revokeObjectURL(objectUrl);
});
defineExpose({ pause, toggle, resetScreen });
</script>

<template>
  <div
    class="sx-prologue-overlay"
    :data-playing="playing"
    :data-active="active"
    :data-fallback-video="fallback && (available || youtubePresented)"
    :data-video-focused="focused && !fallback"
  >
    <div
      v-if="
        useYouTube &&
        copyVisible &&
        (fallback ? youtubeRequested : screen?.visible)
      "
      class="sx-prologue-screen-surface"
      :class="{ 'sx-prologue-screen-surface--fallback': fallback }"
      :style="fallback ? undefined : { transform: screen?.transform }"
    >
      <button
        v-if="!youtubeRequested"
        class="sx-prologue-screen-button"
        aria-label="Découvrir la vidéo sur l’écran"
        @click="approachScreen"
      >
        <span aria-hidden="true">▶</span><b>Découvrir Symbiose</b>
      </button>
      <YouTubeScreen
        v-if="youtubePresented"
        :key="youtubeGeneration"
        ref="youtube"
        :style="fallback ? { width: '100%', height: '100%' } : undefined"
        :active="copyVisible && !!focused"
        :suspended="suspended"
        @ready="youtubeReady = true"
        @playing="state"
        @ended="onEnded"
        @error="youtubeError = $event"
      />
    </div>
    <video
      v-if="available"
      ref="video"
      :key="source"
      class="sx-prologue-media"
      :class="{ 'sx-prologue-media--visible': fallback && copyVisible }"
      :src="source"
      :muted="muted"
      :volume="volume"
      playsinline
      preload="metadata"
      :aria-hidden="!(fallback && copyVisible)"
      :tabindex="fallback && copyVisible ? 0 : -1"
      :controls="fallback && copyVisible"
      aria-label="Vidéo de présentation Symbiose"
      @play="onPlay"
      @pause="state(false)"
      @ended="onEnded"
      @error="fail"
      @loadedmetadata="metadata"
      @timeupdate="current = video?.currentTime ?? 0"
      @volumechange="syncVolume"
    >
      <track
        v-if="captions"
        kind="captions"
        label="Français"
        srclang="fr"
        :src="captions"
        default
        @cuechange="cueChanged"
      />
    </video>
    <section
      class="sx-prologue-copy"
      :style="{ opacity }"
      :inert="!copyVisible || suspended"
      :aria-hidden="!copyVisible"
      aria-labelledby="sx-prologue-title"
    >
      <p class="sx-eyebrow">00 / BUREAU D’ÉTUDES <span>LE PROLOGUE</span></p>
      <h1 id="sx-prologue-title">Du bureau<br />au vivant.</h1>
      <p class="sx-prologue-intro">
        Avant de rencontrer le vivant,<br />prenons le temps de regarder.
      </p>
      <div
        v-if="available || useYouTube"
        class="sx-prologue-player"
        role="group"
        aria-label="Vidéo de présentation Symbiose"
      >
        <button
          class="sx-cta"
          :aria-label="
            playing
              ? 'Mettre la vidéo en pause'
              : useYouTube && youtubeError
                ? 'Réessayer YouTube'
                : useYouTube && youtubePresented
                  ? 'Lire la vidéo'
                  : 'Découvrir Symbiose'
          "
          @click="toggle"
        >
          <span>{{
            playing
              ? "Mettre en pause"
              : useYouTube && youtubeError
                ? "Réessayer YouTube"
                : useYouTube && youtubeRequested
                  ? youtubeReady
                    ? "Lire la vidéo"
                    : youtubePresented
                      ? "Chargement du lecteur…"
                      : "Approche de l’écran…"
                  : ended
                    ? "Revoir Symbiose"
                    : "Découvrir Symbiose"
          }}</span
          ><span aria-hidden="true">{{ playing ? "Ⅱ" : "▶" }}</span>
        </button>
        <div v-if="!useYouTube" class="sx-prologue-media-controls">
          <label class="sx-prologue-seek"
            ><span class="sx-sr-only"
              >Position dans la vidéo de présentation</span
            >
            <input
              type="range"
              min="0"
              :max="finiteDuration || 1"
              step=".1"
              :value="current"
              :disabled="!finiteDuration"
              @input="seek"
            />
          </label>
          <span class="sx-prologue-time"
            >{{ clock(current) }} / {{ clock(finiteDuration) }}</span
          >
          <button
            class="sx-prologue-sound"
            :aria-label="
              muted ? 'Activer le son de la vidéo' : 'Couper le son de la vidéo'
            "
            :aria-pressed="muted"
            @click="toggleMute"
          >
            {{ muted ? "Son coupé" : "Son" }}
          </button>
          <label class="sx-prologue-volume"
            ><span class="sx-sr-only">Volume de la vidéo</span
            ><input
              type="range"
              min="0"
              max="1"
              step=".05"
              :value="volume"
              @input="setVolume"
          /></label>
        </div>
      </div>
      <p v-else class="sx-prologue-unavailable">
        La vidéo locale ne peut pas être lue.<br /><span
          >Vous pouvez entrer dans le vivant ou utiliser YouTube.</span
        >
      </p>
      <button
        v-if="failed && !useYouTube"
        class="sx-prologue-youtube-fallback"
        @click="watchOnYouTube"
      >
        Regarder sur YouTube
      </button>
      <p v-if="useYouTube && !focused" class="sx-prologue-video-note">
        Vidéo officielle · YouTube · lecture manuelle
      </p>
      <p v-if="youtubeError" class="sx-prologue-youtube-error" role="alert">
        {{ youtubeError }}
        <a
          v-if="youtubeLink"
          :href="youtubeLink"
          target="_blank"
          rel="noopener noreferrer"
          >Ouvrir la vidéo sur YouTube</a
        >
      </p>
      <p v-if="ended" class="sx-prologue-ended" role="status">
        La découverte continue, de l’autre côté de la baie.
      </p>
      <div class="sx-prologue-actions">
        <button
          :class="available || useYouTube ? 'sx-prologue-enter' : 'sx-cta'"
          @click="enter()"
        >
          Entrer dans le vivant <span aria-hidden="true">↗</span>
        </button>
        <button class="sx-prologue-skip" @click="enter(true)">
          Passer l’introduction
        </button>
      </div>
      <details class="sx-prologue-file">
        <summary>
          {{
            available
              ? "Changer la vidéo"
              : "Vous avez la vidéo de présentation ?"
          }}
        </summary>
        <label
          >Choisir une vidéo locale<input
            type="file"
            accept="video/mp4,video/webm,.mp4,.webm"
            aria-label="Choisir une vidéo locale pour le prologue"
            @change="chooseFile"
        /></label>
        <span v-if="fileName">{{ fileName }}</span>
      </details>
      <p v-if="notice" class="sx-prologue-notice" role="status">{{ notice }}</p>
    </section>
    <p
      v-if="active && local >= 0.22 && local < 0.9"
      class="sx-prologue-travel"
      aria-hidden="true"
    >
      Observer les données.<br /><em>Rencontrer le vivant.</em>
    </p>
    <p
      v-if="caption && playing && copyVisible"
      class="sx-prologue-caption"
      aria-live="off"
    >
      {{ caption }}
    </p>
  </div>
</template>
