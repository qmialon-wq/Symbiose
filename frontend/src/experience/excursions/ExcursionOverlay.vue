<script setup lang="ts">
import { computed } from "vue";
import { excursions, type ExcursionState } from "./route";
import { excursionCopy } from "./copy";
import "./excursions.css";
const props = defineProps<{ state: ExcursionState }>();
const emit = defineEmits<{ leave: [] }>();
const entry = computed(() => excursions.find((e) => e.id === props.state.id)!);
const copy = computed(() => excursionCopy[props.state.id]);
</script>
<template>
  <section
    class="sx-excursion-copy"
    :data-excursion-copy="state.id"
    :aria-label="entry.label"
  >
    <p class="sx-excursion-eyebrow">{{ copy.number }} / {{ entry.label }}</p>
    <h2>{{ copy.title }}</h2>
    <p class="sx-excursion-intro">{{ copy.body }}</p>
    <ul>
      <li v-for="note in copy.notes" :key="note">{{ note }}</li>
    </ul>
    <p class="sx-excursion-disclaimer">{{ copy.disclaimer }}</p>
    <button class="sx-excursion-leave" @click="emit('leave')">
      Poursuivre le voyage <span aria-hidden="true">↗</span>
    </button>
  </section>
</template>
