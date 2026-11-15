<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  defaultIntroYouTubeUrl,
  loadYouTubeAPI,
  youtubeVideoId,
  type YouTubePlayer,
  type YouTubeStateEvent,
} from "./youtube-player";

const props = defineProps<{ active: boolean; suspended: boolean }>();
const emit = defineEmits<{
  playing: [value: boolean];
  ended: [];
  error: [message: string];
  ready: [];
}>();
const host = ref<HTMLDivElement>();
let player: YouTubePlayer | undefined;
let disposed = false;
const allowed = () => props.active && !props.suspended && !document.hidden;
function pause() {
  player?.pauseVideo?.();
  if (!disposed) emit("playing", false);
}
function play() {
  if (allowed()) player?.playVideo?.();
}
function changed(event: YouTubeStateEvent) {
  if (disposed) return;
  if (event.data === 1 || event.data === 3) {
    if (!allowed()) {
      pause();
      return;
    }
    emit("playing", true);
  } else {
    emit("playing", false);
    if (event.data === 0) emit("ended");
  }
}
const visibility = () => {
  if (document.hidden) pause();
};
watch(
  () => [props.active, props.suspended],
  () => {
    if (!allowed()) pause();
  },
);
onMounted(async () => {
  document.addEventListener("visibilitychange", visibility);
  const configured = import.meta.env.VITE_SYMBIOSE_INTRO_YOUTUBE_URL as
    | string
    | undefined;
  const id = youtubeVideoId(configured?.trim() || defaultIntroYouTubeUrl);
  if (!id) {
    emit("error", "L’adresse de la vidéo YouTube est invalide.");
    return;
  }
  try {
    const api = await loadYouTubeAPI();
    if (disposed || !host.value) return;
    player = new api.Player(host.value, {
      width: 1120,
      height: 630,
      videoId: id,
      playerVars: {
        autoplay: 0,
        controls: 1,
        playsinline: 1,
        rel: 0,
        origin: location.origin,
      },
      events: {
        onReady(event) {
          if (disposed) return;
          const iframe = event.target.getIframe();
          iframe.title = "Vidéo provisoire du prologue — lecteur YouTube";
          iframe.referrerPolicy = "strict-origin-when-cross-origin";
          iframe.allow =
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen";
          iframe.allowFullscreen = true;
          if (!allowed()) event.target.pauseVideo();
          emit("ready");
        },
        onStateChange: changed,
        onError() {
          if (disposed) return;
          emit("playing", false);
          emit(
            "error",
            "Cette vidéo YouTube ne peut pas être lue ici. Elle est peut-être indisponible ou son intégration est désactivée.",
          );
        },
      },
    });
  } catch (error) {
    if (!disposed)
      emit(
        "error",
        error instanceof Error
          ? error.message
          : "Le lecteur YouTube est indisponible.",
      );
  }
});
onBeforeUnmount(() => {
  pause();
  disposed = true;
  document.removeEventListener("visibilitychange", visibility);
  player?.destroy();
  player = undefined;
});
defineExpose({ play, pause });
</script>

<template>
  <div
    class="sx-youtube-screen"
    :aria-hidden="!active"
    :inert="!active || suspended"
  >
    <div ref="host" class="sx-youtube-host" />
  </div>
</template>

<style scoped>
.sx-youtube-screen {
  position: absolute;
  left: 0;
  top: 0;
  width: 1120px;
  height: 630px;
  transform-origin: 0 0;
  pointer-events: auto;
  background: #10221a;
}
.sx-youtube-host,
.sx-youtube-screen :deep(iframe) {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}
</style>
