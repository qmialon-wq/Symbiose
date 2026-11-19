<script setup lang="ts">
import { ref } from "vue";
import { sources, producers } from "./sources";
import { pitchChapters, juryCoverage, clock, statusLabels } from "./pitch";
import {
  excursions,
  excursionProgress,
  expandedTime,
  routeClock,
} from "./excursions/route";
import { excursionCopy } from "./excursions/copy";
const props = defineProps<{ chapterId: string }>();
const tab = ref<"sources" | "speaker" | "jury">("sources");
// The eight chapters and three explorations, in the order of the five-minute clock.
const steps = [
  ...pitchChapters.map((chapter) => ({
    id: chapter.id,
    title: chapter.subject,
    start: expandedTime(chapter.start),
    end: expandedTime(chapter.start + chapter.duration),
    message: chapter.message,
    oral: chapter.oral,
    status: chapter.status,
    screen: chapter.screen,
    details: [chapter.interaction, chapter.transition],
  })),
  ...excursions.map((excursion) => {
    const copy = excursionCopy[excursion.id],
      start = routeClock.seconds(excursionProgress(excursion.id, 0));
    return {
      id: excursion.id,
      title: `${excursion.label} · ${excursion.name}`,
      start,
      end: start + excursion.seconds,
      message: copy.body,
      oral: copy.oral,
      status: undefined,
      screen: copy.notes,
      details: [copy.disclaimer],
    };
  }),
].sort((a, b) => a.start - b.start);
</script>
<template>
  <div class="sx-source-book">
    <p class="sx-eyebrow">CARNET DE PRÉSENTATION</p>
    <h2 id="sx-project-title">
      Les preuves, les mots,<br /><em>les prochaines étapes.</em>
    </h2>
    <div class="sx-book-tabs" role="group" aria-label="Contenu du carnet">
      <button :aria-pressed="tab === 'sources'" @click="tab = 'sources'">
        Sources et technique
      </button>
      <button :aria-pressed="tab === 'speaker'" @click="tab = 'speaker'">
        Pitch chronométré
      </button>
      <button :aria-pressed="tab === 'jury'" @click="tab = 'jury'">
        Attendus du jury
      </button>
    </div>
    <template v-if="tab === 'sources'">
      <p>
        Le manifeste, ses captures et les livrables du dépôt étayent ce
        parcours. Les textes ci-dessous sont embarqués localement et restent
        consultables sans Internet.
      </p>
      <p class="sx-source-limit">
        <strong>Attendus vérifiés :</strong> les cinq questions de l’image
        fournie, les sept rubriques du descriptif et les six critères du
        règlement (§ 5, p. 3).
      </p>
      <dl class="sx-evidence-key">
        <div>
          <dt>Fonction documentée</dt>
          <dd>
            Capacité décrite dans les livrables ; configuration locale requise
            pour l’exécuter.
          </dd>
        </div>
        <div>
          <dt>Résultat technique vérifié</dt>
          <dd>
            Recette ou archive datée ; aucune efficacité écologique déduite.
          </dd>
        </div>
        <div>
          <dt>Bénéfice attendu</dt>
          <dd>
            Utilité visée ; aucun gain de temps ou de biodiversité mesuré.
          </dd>
        </div>
        <div>
          <dt>Perspective</dt>
          <dd>Développement ou évaluation à venir.</dd>
        </div>
      </dl>
      <h3>Documents examinés</h3>
      <details
        v-for="source in sources"
        :key="source.id"
        :open="
          pitchChapters
            .find((c) => c.id === props.chapterId)
            ?.sources.includes(source.id) || undefined
        "
      >
        <summary>{{ source.title }}</summary>
        <p>{{ source.scope }}</p>
        <small>{{ source.path }}</small>
        <details class="sx-source-original">
          <summary>Lire le texte local du document</summary>
          <pre>{{ source.text }}</pre>
        </details>
      </details>
      <h3>Producteurs des données utilisées</h3>
      <p>
        Ces liens externes sont facultatifs et nécessitent Internet. La scène ne
        consulte aucun service distant.
      </p>
      <ul>
        <li v-for="[label, url] in producers" :key="url">
          <a :href="url" target="_blank" rel="noopener noreferrer"
            >{{ label }} ↗</a
          >
        </li>
      </ul>
      <h3>Faisabilité et numérique responsable</h3>
      <p>
        FastAPI et Vue 3, workers vision et documentaire séparés, PostgreSQL et
        Redis, stockage local persistant. La détection, la classification et le
        suivi restent distincts. Les tâches longues passent par une file ; une
        seule tâche GPU lourde s’exécute à la fois. Les modèles se préparent
        explicitement.
      </p>
      <p>
        Les traitements locaux et l’absence d’entraînement automatique sont des
        choix d’architecture. La consommation énergétique, le gain de temps et
        l’impact écologique restent à mesurer.
      </p>
      <p>
        Le RPG décrit une occupation agricole déclarée pour 2024. Un point et un
        zonage n’établissent ni l’état de toute une parcelle ni l’efficacité
        d’une adaptation. Les suggestions et publications doivent être examinées
        avant décision ; la compensation reste non évaluée.
      </p>
    </template>
    <template v-else-if="tab === 'speaker'">
      <p>
        La vidéo d’ouverture (environ une minute) et le travelling vers la forêt
        précèdent le récit. Le récit dure ensuite cinq minutes, à deux voix (A
        et B). En mode présentation, la lecture continue démarre à l’arrivée en
        forêt ; Espace la met en pause, les flèches changent d’étape. Une
        répétition chronométrée reste nécessaire.
      </p>
      <section v-for="step in steps" :key="step.id" class="sx-speaker-chapter">
        <p class="sx-eyebrow">
          {{ clock(step.start) }}–{{ clock(step.end) }} ·
          {{ Math.round(step.end - step.start) }} S
        </p>
        <h3>{{ step.title }}</h3>
        <p>
          <strong>{{ step.message }}</strong>
        </p>
        <p class="sx-script">{{ step.oral }}</p>
        <small v-if="step.status">{{ statusLabels[step.status] }}</small>
        <details>
          <summary>À l’écran et transition</summary>
          <p>{{ step.screen.join(" · ") }}</p>
          <p v-for="line in step.details" :key="line">{{ line }}</p>
        </details>
      </section>
    </template>
    <template v-else>
      <p>
        Correspondance avec les cinq questions fournies et les six critères du
        règlement (§ 5, p. 3), complétée par l’Open Data et l’ancrage normand.
        Les rôles individuels et les moyens financiers ne sont pas documentés.
      </p>
      <div
        class="sx-table-scroll"
        tabindex="0"
        role="region"
        aria-label="Correspondance jury et scènes"
      >
        <table>
          <caption>
            Attendus et scènes du pitch
          </caption>
          <thead>
            <tr>
              <th scope="col">Attendu</th>
              <th scope="col">Scènes</th>
              <th scope="col">Éléments présentés</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in juryCoverage" :key="row[0]">
              <th scope="row">{{ row[0] }}</th>
              <td>{{ row[1] }}</td>
              <td>{{ row[2] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
