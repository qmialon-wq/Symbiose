<script setup lang="ts">
import { ref } from "vue";
import type { ChapterId } from "./config";
import evidence from "./content/territorial-evidence.json";
defineProps<{ chapter: ChapterId }>();
const emit = defineEmits<{ sources: [] }>();
const place = ref(1),
  step = ref(0);
const layers: Record<string, string> = {
  znieff1: "ZNIEFF I",
  znieff2: "ZNIEFF II",
  "natura-habitat": "Natura · Habitats",
  "natura-oiseaux": "Natura · Oiseaux",
};
const pipeline = [
  [
    "Vidéo",
    "Les vidéos sont importées dans le stockage local et associées au dossier.",
  ],
  [
    "Extraction",
    "Des images sont extraites pour permettre l’analyse visuelle.",
  ],
  [
    "Reconnaissance",
    "MegaDetector localise les animaux, puis un second modèle propose l’espèce : classificateur PyTorch aujourd’hui, SpeciesNet en piste pour la suite. Le suivi relie les observations dans le temps.",
  ],
  [
    "Validation",
    "Une personne confirme, corrige ou rejette l’espèce et le recadrage. Une prédiction seule ne confirme pas une présence.",
  ],
  [
    "Enrichissement",
    "Les observations confirmées sont rapprochées des données ouvertes et des publications, avec leur provenance.",
  ],
  [
    "Propositions",
    "Des alternatives conditionnelles sont reliées au projet, aux sources et aux vérifications encore nécessaires.",
  ],
];
</script>
<template>
  <div v-if="chapter === 'wetland'" class="sx-data-confluence">
    <div class="sx-tributaries" aria-label="Sources utilisées par le prototype">
      <span>Observations validées</span><span>Cadastre · RPG 2024</span
      ><span>IGN · DREAL Normandie</span><span>Publications scientifiques</span>
    </div>
    <svg
      class="sx-river-links"
      viewBox="0 0 600 55"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M70 0C70 40 300 15 300 55M220 0C220 20 300 20 300 55M380 0C380 20 300 20 300 55M530 0C530 40 300 15 300 55"
      />
    </svg>
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
        Ces réponses concernent seulement le point interrogé. Une réponse vide
        ne prouve pas l’absence d’enjeu écologique.
      </p>
      <button class="sx-inline-source" @click="emit('sources')">
        Consulter les preuves et leurs limites ↗
      </button>
    </details>
  </div>
  <div v-else-if="chapter === 'rivers'" class="sx-living-pipeline">
    <ol aria-label="Étapes de traitement">
      <li v-for="(item, index) in pipeline" :key="item[0]">
        <button :aria-pressed="step === index" @click="step = index">
          <span>0{{ index + 1 }}</span
          >{{ item[0] }}
        </button>
      </li>
    </ol>
    <p class="sx-pipeline-detail" aria-live="polite">{{ pipeline[step][1] }}</p>
    <small
      >Traitements locaux · tâches en arrière-plan · GPU partagé
      séquentiellement</small
    >
  </div>
  <div v-else-if="chapter === 'meadow'" class="sx-impact-proof">
    <strong>12 <span>alternatives documentées</span></strong
    ><span
      >Clôture · éclairage · végétation · terrassement ·
      imperméabilisation</span
    ><button class="sx-inline-source" @click="emit('sources')">
      Inventaire du prototype et limites ↗</button
    ><small>Efficacité écologique locale : non mesurée</small>
  </div>
</template>
