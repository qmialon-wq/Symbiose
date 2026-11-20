<script setup lang="ts">
import { computed, ref } from "vue";
import type { ChapterId } from "./config";
import { narrativeCueAt, narrativeEventAt } from "./narrative-cues";
import { editorialFacts, lightingOptions } from "./editorial-content";
import "./narrative-cues.css";

const props = withDefaults(
  defineProps<{
    chapter: ChapterId;
    seconds: number;
    reducedMotion?: boolean;
    presentation?: boolean;
  }>(),
  { presentation: true },
);
const emit = defineEmits<{ sources: [] }>();
const selected = ref(0);
const cue = computed(() => narrativeCueAt(props.seconds));
const event = computed(() =>
  cue.value.chapter === props.chapter
    ? props.presentation
      ? narrativeEventAt(props.seconds)
      : cue.value.events[selected.value]
    : undefined,
);
const stage = computed(() =>
  cue.value.events.findIndex((item) => item.id === event.value?.id),
);
</script>

<template>
  <div
    v-if="event && ['rivers', 'wetland', 'meadow'].includes(chapter)"
    class="sx-jury-demo"
    :data-demo-stage="event.id"
    :data-reduced-motion="!!reducedMotion"
  >
    <div
      v-if="!presentation"
      class="sx-case-steps"
      role="group"
      aria-label="Étapes du cas d’éclairage illustratif"
    >
      <button
        v-for="(phase, index) in cue.events"
        :key="phase.id"
        :aria-pressed="selected === index"
        @click="selected = index"
      >
        {{ phase.label }}
      </button>
    </div>
    <div v-if="chapter === 'rivers'" class="sx-recognition-example">
      <svg
        viewBox="0 0 360 150"
        role="img"
        aria-label="Animal dessiné dans un cadre : illustration du parcours de reconnaissance"
      >
        <path class="sx-demo-ground" d="M0 125 Q80 112 160 126 T360 122" />
        <path
          class="sx-demo-animal"
          d="M92 82 Q105 60 150 67 L182 75 L202 51 L214 49 L224 35 L224 53 L233 63 L222 75 L206 80 L191 103 L185 127 L177 127 L177 102 L146 99 L134 126 L126 126 L128 99 L107 101 L98 126 L90 126 L93 98 L78 84 L81 76 Z"
        />
        <rect
          class="sx-demo-animal-box"
          x="66"
          y="26"
          width="185"
          height="110"
          rx="3"
        />
        <g class="sx-demo-camera" transform="translate(292 63)">
          <rect width="43" height="51" rx="7" />
          <circle cx="21.5" cy="28" r="11" />
          <path d="M8 0V-10H34V0M21 51V68" />
        </g>
        <g v-if="event.id === 'river-review'" class="sx-demo-check">
          <circle cx="281" cy="29" r="12" />
          <path d="M290 38L300 48" />
        </g>
      </svg>
      <p class="sx-demo-disclosure">
        {{ editorialFacts.recognition }}
      </p>
      <p v-if="event.id === 'river-identify'" class="sx-demo-qualification">
        {{ editorialFacts.classification }}
      </p>
      <p v-if="event.id === 'river-review'" class="sx-demo-qualification">
        {{ editorialFacts.review }}
      </p>
    </div>
    <svg
      v-else-if="chapter === 'meadow'"
      class="sx-lighting-example"
      viewBox="0 0 420 105"
      role="img"
      aria-label="Schéma illustratif d’un chemin, d’une haie et de points lumineux, sans localisation réelle"
    >
      <path
        class="sx-demo-hedge"
        d="M10 22Q35 1 60 22Q85 1 110 22Q135 1 160 22Q185 1 210 22Q235 1 260 22Q285 1 310 22Q335 1 360 22Q385 1 410 22"
      />
      <path class="sx-demo-path" d="M10 82Q140 44 238 67T410 58" />
      <g
        v-for="(x, index) in [95, 214, 330]"
        :key="x"
        :transform="`translate(${x} 35)`"
        :class="{ 'sx-demo-lamp--alternative': stage >= 3 && index === 1 }"
      >
        <path class="sx-demo-lamp" d="M0 32V2Q0-5 12-5H21M10-2L-2 26H33L21-2" />
        <circle cx="17" cy="-3" r="3" class="sx-demo-lamp-light" />
      </g>
    </svg>
    <p class="sx-demo-progress" aria-hidden="true">
      {{ stage + 1 }} / {{ cue.events.length }}
    </p>
    <div class="sx-demo-copy" aria-live="polite" aria-atomic="true">
      <h3>{{ event.label }}</h3>
      <p v-if="event.id !== 'lighting-adaptations'">{{ event.detail }}</p>
    </div>
    <ul v-if="event.id === 'lighting-adaptations'" class="sx-lighting-options">
      <li v-for="option in lightingOptions" :key="option">{{ option }}</li>
    </ul>
    <p v-if="chapter === 'meadow'" class="sx-demo-disclosure">
      {{ editorialFacts.lighting }}
    </p>
    <p v-if="event.id === 'lighting-project'" class="sx-demo-disclosure">
      {{ cue.screen.join(" · ") }}
    </p>
    <p v-if="event.id === 'river-identify'" class="sx-demo-disclosure">
      {{ editorialFacts.classifier }}
    </p>
    <template v-if="event.id === 'lighting-sources'">
      <button class="sx-inline-source" @click="emit('sources')">
        Consulter les justifications et leurs limites
      </button>
    </template>
  </div>
</template>
