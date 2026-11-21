<script setup lang="ts">
import { computed } from "vue";
import { excursions, type ExcursionState } from "./route";
import { excursionCopy } from "./copy";
import { narrativeCueAt, narrativeEventAt } from "../narrative-cues";
import { sceneEditorial } from "../editorial-content";
import "./excursions.css";
import "../narrative-cues.css";
const props = defineProps<{
  state: ExcursionState;
  presentation?: boolean;
  seconds?: number;
  reducedMotion?: boolean;
}>();
const emit = defineEmits<{ leave: [] }>();
const entry = computed(() => excursions.find((e) => e.id === props.state.id)!);
const copy = computed(() => excursionCopy[props.state.id]);
const cue = computed(() => narrativeCueAt(props.seconds ?? 0));
const usesCue = computed(() => props.seconds !== undefined);
const editorial = computed(() => sceneEditorial(cue.value));
const event = computed(() =>
  cue.value.excursion === props.state.id
    ? narrativeEventAt(props.seconds ?? 0)
    : undefined,
);
const ready = computed(
  () => !props.presentation || props.state.id !== "drone" || !!event.value,
);
</script>
<template>
  <section
    v-if="ready"
    class="sx-excursion-copy"
    :data-excursion-copy="state.id"
    :aria-label="entry.label"
    :data-jury="!!presentation"
    :data-event="presentation ? event?.id : undefined"
    :data-reduced-motion="!!reducedMotion"
  >
    <p class="sx-excursion-eyebrow">{{ copy.number }} / {{ entry.label }}</p>
    <h2>{{ usesCue ? cue.title : copy.title }}</h2>
    <p v-if="!presentation || state.id !== 'marine'" class="sx-excursion-intro">
      {{ usesCue ? cue.message : copy.body }}
    </p>
    <div
      v-if="presentation && event && state.id !== 'soil'"
      class="sx-excursion-phase"
      aria-live="polite"
      aria-atomic="true"
    >
      <h3>{{ event.label }}</h3>
      <p>{{ event.detail }}</p>
    </div>
    <ul v-if="!presentation">
      <li v-for="note in copy.notes" :key="note">{{ note }}</li>
    </ul>
    <p v-if="!presentation && usesCue" class="sx-exploration-detail">
      {{ editorial.exploration }}
    </p>
    <p class="sx-excursion-disclaimer">{{ copy.disclaimer }}</p>
    <button class="sx-excursion-leave" @click="emit('leave')">
      Poursuivre le voyage <span aria-hidden="true">↗</span>
    </button>
  </section>
</template>
