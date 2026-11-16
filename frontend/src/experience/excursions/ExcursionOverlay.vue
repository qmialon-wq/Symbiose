<script setup lang="ts">
import { computed } from "vue";
import { excursions, type ExcursionState } from "./route";
import "./excursions.css";
const props = defineProps<{ state: ExcursionState }>();
const emit = defineEmits<{ leave: [] }>();
const entry = computed(() => excursions.find((e) => e.id === props.state.id)!);
const content = {
  soil: {
    number: "01 BIS",
    title: "Le vivant,\nsous nos pieds.",
    body: "Les racines dessinent un réseau. Autour d’elles, une autre biodiversité travaille à l’abri des regards.",
    notes: [
      "Lombric · un annélide, pas un insecte",
      "Larve de coléoptère · vie du sol",
      "Carottage · observer les horizons du sol",
    ],
    disclaimer:
      "Coupe pédagogique · organismes illustrés · aucune analyse de sol exécutée",
  },
  drone: {
    number: "06 BIS",
    title: "Prendre du recul.\nLire le paysage.",
    body: "Au-dessus du bocage, le drone suit un quadrillage. Son faisceau vert rend visible la zone parcourue.",
    notes: [
      "Trajectoire de survol en bandes",
      "Halo et grille de balayage illustratifs",
      "Une autre échelle pour observer le territoire",
    ],
    disclaimer:
      "Mise en scène · le relevé par drone reste une piste d’évolution",
  },
  marine: {
    number: "07 BIS",
    title: "Sous la surface,\nun autre monde.",
    body: "Quittons les falaises d’Étretat. La caméra rejoint la mer, passe sous la surface, puis retrouve la lumière du littoral.",
    notes: [
      "Franchir la surface de la Manche",
      "Algues, poissons et reliefs sous-marins",
      "Remonter face aux falaises",
    ],
    disclaimer:
      "Évocation artistique du littoral · aucune observation marine mesurée",
  },
};
const copy = computed(() => content[props.state.id]);
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
