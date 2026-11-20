<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  pitchChapters,
  pitchIndex,
  statusLabels,
  clock,
  appUrl,
} from "./pitch";
import PitchVisual from "./PitchVisual.vue";
import { narrativeCueAt, narrativeEventAt } from "./narrative-cues";
import { editorialFacts, sceneEditorial } from "./editorial-content";
import "./narrative-cues.css";
const logoUrl = "/experience-art/shared/symbiose-logo.png";
const props = withDefaults(
  defineProps<{
    progress: number;
    reducedMotion: boolean;
    appHref?: string;
    timeMap?: (seconds: number) => number;
    presentation?: boolean;
    seconds?: number;
  }>(),
  { appHref: appUrl },
);
defineEmits<{ begin: []; sources: [] }>();
const cue = computed(() => narrativeCueAt(props.seconds ?? 0));
const event = computed(() => narrativeEventAt(props.seconds ?? 0));
const usesCue = computed(() => props.seconds !== undefined);
const editorial = computed(() => sceneEditorial(cue.value));
const chapter = computed(() =>
  usesCue.value
    ? pitchChapters.find((item) => item.id === cue.value.chapter)!
    : pitchChapters[pitchIndex(props.progress)],
);
const final = computed(() => chapter.value.id === "night-forest");
const signature = computed(
  () => !props.presentation || event.value?.id === "epilogue-signature",
);
const display = computed(() => ({
  subject: usesCue.value ? cue.value.subject : chapter.value.subject,
  title: usesCue.value ? editorial.value.title : chapter.value.title,
  message: usesCue.value
    ? props.presentation && final.value
      ? [event.value?.label, event.value?.detail].filter(Boolean).join(" · ")
      : cue.value.message
    : chapter.value.message,
  start: usesCue.value
    ? cue.value.start
    : (props.timeMap?.(chapter.value.start) ?? chapter.value.start),
  end: usesCue.value
    ? cue.value.end
    : (props.timeMap?.(chapter.value.start + chapter.value.duration) ??
      chapter.value.start + chapter.value.duration),
  screen: usesCue.value ? cue.value.screen : chapter.value.screen,
}));
const demonstrated = computed(
  () =>
    props.presentation &&
    ["rivers", "wetland", "meadow"].includes(chapter.value.id),
);
const content = ref<HTMLElement>();
watch(
  () =>
    usesCue.value
      ? `${cue.value.id}:${props.presentation ? (event.value?.id ?? "") : ""}`
      : chapter.value.id,
  () => {
    if (content.value) content.value.scrollTop = 0;
  },
  { flush: "post" },
);
</script>

<template>
  <div
    ref="content"
    class="sx-pitch-content"
    :data-chapter="chapter.id"
    :data-jury="!!presentation"
    :data-cue="usesCue ? cue.id : undefined"
  >
    <h1 class="sx-sr-only">Symbiose — {{ editorialFacts.signature }}</h1>
    <section
      :key="usesCue ? cue.id : chapter.id"
      class="sx-pitch-scene"
      :class="{
        'sx-pitch-scene--final': final,
        'sx-pitch-scene--demonstration': demonstrated,
      }"
      :aria-label="display.subject"
    >
      <p v-if="!presentation || !final" class="sx-eyebrow">
        {{ display.subject.toLocaleUpperCase("fr") }}
        <span>{{ clock(display.start) }}—{{ clock(display.end) }}</span>
      </p>
      <img
        v-if="final && signature"
        class="sx-final-logo"
        :src="logoUrl"
        alt="Symbiose"
        width="3634"
        height="1242"
      />
      <img
        v-if="presentation && chapter.id === 'sky'"
        class="sx-identity-logo"
        :src="logoUrl"
        alt="Symbiose"
        width="3634"
        height="1242"
      />
      <h2>{{ display.title }}</h2>
      <p
        v-if="!demonstrated && !(presentation && final && signature)"
        class="sx-pitch-message"
      >
        {{ display.message }}
      </p>
      <p
        v-if="chapter.status && !presentation"
        class="sx-evidence-status"
        :data-status="chapter.status"
      >
        {{ statusLabels[chapter.status] }}
      </p>
      <p v-if="!presentation && usesCue" class="sx-exploration-detail">
        {{ editorial.exploration }}
      </p>
      <PitchVisual
        :chapter="chapter.id"
        :presentation="presentation"
        :seconds="seconds"
        :reduced-motion="reducedMotion"
        @sources="$emit('sources')"
      />
      <ul
        v-if="!presentation && ['forest', 'sky', 'meadow'].includes(chapter.id)"
        class="sx-pitch-points"
      >
        <li v-for="item in display.screen" :key="item">{{ item }}</li>
      </ul>
      <p
        v-if="
          chapter.id === 'coast' &&
          !presentation &&
          (!usesCue || cue.id === 'coast')
        "
        class="sx-next-steps"
      >
        {{ editorialFacts.partnership }}
      </p>
      <a v-if="final && signature" class="sx-cta" :href="appHref"
        >{{ editorialFacts.application }} <span aria-hidden="true">↗</span></a
      >
      <button
        v-if="chapter.id === 'forest' && !presentation"
        class="sx-discover"
        @click="$emit('begin')"
      >
        Découvrir la solution <span aria-hidden="true">↘</span>
      </button>
      <button
        v-if="!presentation || !final"
        class="sx-pitch-source"
        @click="$emit('sources')"
      >
        {{ presentation ? "Sources et limites" : "Sources et texte oral" }}
        <span aria-hidden="true">↗</span>
      </button>
    </section>
  </div>
</template>
