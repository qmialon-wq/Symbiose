<script setup lang="ts">
import { computed, ref } from "vue";
import type { ChapterId } from "./config";
import evidence from "./content/territorial-evidence.json";
import JuryDemonstration from "./JuryDemonstration.vue";
import { narrativeEventAt, narrativeCues } from "./narrative-cues";
import {
  catalogue,
  pipeline,
  layers,
  editorialFacts,
  designReferences,
} from "./editorial-content";

const props = defineProps<{
  chapter: ChapterId;
  presentation?: boolean;
  seconds?: number;
  reducedMotion?: boolean;
}>();
const emit = defineEmits<{ sources: [] }>();
const event = computed(() => narrativeEventAt(props.seconds ?? 0));
const cue = computed(
  () =>
    narrativeCues.find(
      (cue) => cue.chapter === props.chapter && !cue.excursion,
    )!,
);
const alternativesCount = catalogue.reduce(
  (count, group) => count + group.options.length,
  0,
);
const place = ref(1),
  step = ref(0);
</script>
<template>
  <JuryDemonstration
    v-if="presentation || chapter === 'meadow'"
    :chapter="chapter"
    :seconds="seconds ?? cue.start"
    :presentation="!!presentation"
    :reduced-motion="reducedMotion"
    @sources="emit('sources')"
  />
  <div v-if="chapter === 'wetland'" class="sx-data-confluence">
    <div
      v-if="!presentation"
      class="sx-tributaries"
      aria-label="Sources utilisées par le prototype"
    >
      <span v-for="source in cue.screen" :key="source">{{ source }}</span>
    </div>
    <svg
      v-if="!presentation"
      class="sx-river-links"
      viewBox="0 0 600 55"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M70 0C70 40 300 15 300 55M220 0C220 20 300 20 300 55M380 0C380 20 300 20 300 55M530 0C530 40 300 15 300 55"
      />
    </svg>
    <p class="sx-territory-limit">{{ editorialFacts.territory }}</p>
    <details class="sx-archive">
      <summary>Résultats vérifiés · deux points normands</summary>
      <p class="sx-archive-tag">
        ARCHIVES IGN · 10 NOVEMBRE 2026 · AUCUN APPEL EN DIRECT
      </p>
      <div class="sx-place-choice" role="group" aria-label="Point archivé">
        <button
          v-for="(record, index) in evidence"
          :key="record.place"
          :aria-pressed="place === index"
          @click="place = index"
        >
          {{ record.place }}
        </button>
      </div>
      <p>
        {{ evidence[place].location.latitude }},
        {{ evidence[place].location.longitude }} · WGS84
      </p>
      <ul class="sx-layer-matrix">
        <li v-for="layer in evidence[place].layers" :key="layer.code">
          <span>{{ layers[layer.code] }}</span
          ><strong>{{
            layer.status === "empty"
              ? "Aucun objet renvoyé"
              : layer.features.map((f) => f.source_id).join(", ")
          }}</strong>
        </li>
      </ul>
      <p>
        {{ editorialFacts.pointScope }}
      </p>
      <button class="sx-inline-source" @click="emit('sources')">
        Consulter les preuves et leurs limites ↗
      </button>
    </details>
  </div>
  <div
    v-else-if="chapter === 'rivers' && !presentation"
    class="sx-living-pipeline"
  >
    <ol aria-label="Étapes de traitement">
      <li v-for="(item, index) in pipeline" :key="item[0]">
        <button :aria-pressed="step === index" @click="step = index">
          <span>0{{ index + 1 }}</span
          >{{ item[0] }}
        </button>
      </li>
    </ol>
    <p class="sx-pipeline-detail" aria-live="polite">{{ pipeline[step][1] }}</p>
    <small>{{ editorialFacts.validation }}</small>
    <p class="sx-demo-disclosure">{{ editorialFacts.classifier }}</p>
    <p class="sx-demo-disclosure">{{ editorialFacts.pipeline }}</p>
  </div>
  <div
    v-if="
      chapter === 'meadow' &&
      (!presentation || event?.id === 'lighting-sources')
    "
    class="sx-impact-proof"
  >
    <strong v-if="!presentation"
      >{{ alternativesCount }} <span>alternatives documentées</span></strong
    ><span v-if="!presentation"
      >Clôture · éclairage · végétation · terrassement ·
      imperméabilisation</span
    ><button class="sx-inline-source" @click="emit('sources')">
      Inventaire du prototype et limites ↗</button
    ><small>{{ editorialFacts.impact }}</small>
    <details class="sx-design-catalogue">
      <summary>
        Explorer les {{ alternativesCount }} alternatives et leurs conditions
      </summary>
      <p>
        {{ editorialFacts.alternatives }}
      </p>
      <section v-for="group in catalogue" :key="group.title">
        <h3>{{ group.title }}</h3>
        <ul>
          <li v-for="option in group.options" :key="option">{{ option }}</li>
        </ul>
        <p>{{ group.condition }}</p>
      </section>
      <p>
        Références générales de conception, sans qualification scientifique
        locale :
      </p>
      <ul class="sx-design-references">
        <li v-for="reference in designReferences" :key="reference.url">
          <a :href="reference.url" target="_blank" rel="noopener noreferrer">{{
            reference.label
          }}</a>
        </li>
      </ul>
      <button class="sx-inline-source" @click="emit('sources')">
        Lire les preuves archivées et la documentation du prototype
      </button>
    </details>
  </div>
</template>
