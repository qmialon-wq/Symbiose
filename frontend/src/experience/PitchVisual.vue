<script setup lang="ts">
import { computed, ref } from "vue";
import type { ChapterId } from "./config";
import evidence from "./content/territorial-evidence.json";
import JuryDemonstration from "./JuryDemonstration.vue";
import { narrativeEventAt } from "./narrative-cues";

const props = defineProps<{
  chapter: ChapterId;
  presentation?: boolean;
  seconds?: number;
  reducedMotion?: boolean;
}>();
const emit = defineEmits<{ sources: [] }>();
const event = computed(() => narrativeEventAt(props.seconds ?? 0));
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
// Editorial summaries of the twelve conditional options in shared/parcels/design.py.
// They describe the existing catalogue, never an analysis of the illustrated site.
const catalogue = [
  {
    title: "Clôture",
    options: [
      "Modifier le tracé",
      "Limiter le périmètre clôturé",
      "Examiner une conception adaptée à la faune",
    ],
    condition:
      "Repérer les éléments présents, confirmer les déplacements et vérifier les usages et la sécurité.",
  },
  {
    title: "Éclairage extérieur",
    options: [
      "Éviter certains points lumineux",
      "Réduire la durée de fonctionnement",
      "Adapter l’orientation de l’éclairage",
    ],
    condition:
      "Justifier les points et horaires nécessaires ; faire examiner visibilité, sécurité et éléments voisins réellement présents.",
  },
  {
    title: "Végétation",
    options: [
      "Implanter le projet en préservant la végétation présente",
      "Réduire l’emprise de suppression de végétation",
    ],
    condition:
      "Inventorier les arbres ou haies effectivement présents et vérifier les contraintes avant intervention.",
  },
  {
    title: "Terrassement",
    options: [
      "Comparer une implantation différente",
      "Réduire l’emprise des terrassements",
    ],
    condition:
      "Disposer d’un plan et d’une topographie ; vérifier les enjeux localisés et la faisabilité du chantier.",
  },
  {
    title: "Imperméabilisation",
    options: [
      "Éviter des surfaces imperméabilisées non indispensables",
      "Examiner des revêtements perméables compatibles avec les usages",
    ],
    condition:
      "Étudier le sol, l’infiltration, les usages, les charges et l’entretien avant tout choix technique.",
  },
];
</script>
<template>
  <JuryDemonstration
    v-if="presentation"
    :chapter="chapter"
    :seconds="seconds ?? 0"
    :reduced-motion="reducedMotion"
    @sources="emit('sources')"
  />
  <div v-if="chapter === 'wetland'" class="sx-data-confluence">
    <div
      v-if="!presentation"
      class="sx-tributaries"
      aria-label="Sources utilisées par le prototype"
    >
      <span>Observations validées</span><span>Cadastre · RPG 2024</span
      ><span>IGN · DREAL Normandie</span><span>Publications scientifiques</span>
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
    <small>Une proposition d’espèce reste à vérifier par une personne.</small>
  </div>
  <div
    v-if="
      chapter === 'meadow' &&
      (!presentation || event?.id === 'lighting-sources')
    "
    class="sx-impact-proof"
  >
    <strong v-if="!presentation"
      >12 <span>alternatives documentées</span></strong
    ><span v-if="!presentation"
      >Clôture · éclairage · végétation · terrassement ·
      imperméabilisation</span
    ><button class="sx-inline-source" @click="emit('sources')">
      Inventaire du prototype et limites ↗</button
    ><small>Efficacité écologique locale : non mesurée</small>
    <details class="sx-design-catalogue">
      <summary>Explorer les 12 alternatives et leurs conditions</summary>
      <p>
        Options de conception conditionnelles, à examiner avec des spécialistes.
        Aucune efficacité sur ce site n’est établie.
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
        <li>
          <a
            href="https://www.ecologie.gouv.fr/politiques-publiques/trame-verte-bleue"
            target="_blank"
            rel="noopener noreferrer"
            >Ministère · Trame verte, bleue et noire</a
          >
        </li>
        <li>
          <a
            href="https://patbiodiv.ofb.fr/index.php/fiche-methodologique/amenagements-terrestres/clotures-impacts-faune-887"
            target="_blank"
            rel="noopener noreferrer"
            >OFB · Clôtures et faune</a
          >
        </li>
        <li>
          <a
            href="https://www.cerema.fr/system/files/documents/2022/11/2022_plaquette_desimpermeabilisation.pdf"
            target="_blank"
            rel="noopener noreferrer"
            >Cerema · Désimperméabilisation</a
          >
        </li>
      </ul>
      <button class="sx-inline-source" @click="emit('sources')">
        Lire les preuves archivées et la documentation du prototype
      </button>
    </details>
  </div>
</template>
