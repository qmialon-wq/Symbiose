import {
  narrativeCues,
  classificationEditorial,
  type NarrativeCue,
} from "./narrative-cues";

/** Shared factual copy. Renderers and navigation modes select its presentation only. */
export const editorialFacts = {
  classifier: classificationEditorial.status,
  recognition: "Illustration du parcours · aucune analyse de cette image",
  classification: "Classification illustrative · espèce à confirmer",
  review: "Confirmer, corriger ou rejeter · jamais de validation automatique",
  pipeline:
    "Chaîne de traitement documentée · aucune inférence exécutée dans cette scène",
  validation: "Une proposition d’espèce reste à vérifier par une personne.",
  lighting: "Scénario illustratif en Normandie · sans relevé de terrain",
  alternatives:
    "Options de conception conditionnelles, à examiner avec des spécialistes. Aucune efficacité sur ce site n’est établie.",
  impact: "Efficacité écologique locale : non mesurée",
  territory:
    "Les consultations des deux points normands sont archivées. Les observations animales de la recette sont synthétiques ; elles ne constituent pas un inventaire de terrain.",
  pointScope:
    "Ces réponses concernent seulement le point interrogé. Une réponse vide ne prouve pas l’absence d’enjeu écologique.",
  partnership:
    "Besoins proposés par l’équipe · aucun partenariat annoncé à ce jour.",
  animals: "Animaux 3D illustratifs · identifications non calculées",
  fallback: "VERSION SIMPLIFIÉE 2D · IMAGES GÉNÉRÉES · FONDU ENTRE PAYSAGES",
  excursionFallback: "Aperçu illustratif · sans WebGL",
  signature: narrativeCues
    .find((cue) => cue.id === "night-forest")!
    .title.replaceAll("\n", " "),
  application: "Commencer l’expérience Symbiose",
} as const;

export const excursionDisclaimers = {
  soil: "Coupe pédagogique · organismes illustrés · aucune analyse de sol exécutée",
  drone: "Survol illustratif · le relevé par drone reste une piste d’évolution",
  marine:
    "Évocation artistique du littoral · besoins proposés, aucun partenariat annoncé",
} as const;

const explorationDescriptions: Record<string, string> = {
  "forest-opening":
    "La présence d’animaux peut rester discrète, même dans un paysage familier. Les animaux représentés ici sont illustratifs : cette scène ne constitue pas un inventaire du lieu.",
  soil: "La coupe pédagogique évoque la vie sous la litière et les usages du milieu. Une route, une clôture ou un éclairage invitent à vérifier sur le terrain ce qu’un projet pourrait perturber.",
  "forest-return":
    "Vidéos, observations, données territoriales et publications sont des informations de natures différentes. Les relier avec leur provenance aide à préparer les questions à examiner avant une décision.",
  sky: "Symbiose est un démonstrateur local d’aide à la décision. Il relie observations de biodiversité, intelligence artificielle et données environnementales ouvertes pour éclairer les choix humains, sans se substituer à l’expertise écologique.",
  rivers:
    "Une vidéo peut être importée, analysée puis examinée par une personne. La détection localise les animaux, la classification propose une espèce et le suivi relie les observations dans le temps. Ces fonctions restent distinctes.",
  underwater:
    "Identifier une espèce ne décrit ni ses déplacements, ni ses usages du milieu, ni l’effet d’un aménagement. Il faut examiner le contexte et compléter les informations par l’expertise et les vérifications de terrain.",
  wetland:
    "Les observations confirmées peuvent être rapprochées des parcelles, des usages agricoles déclarés, des zonages disponibles et de publications consultables. La couverture et les millésimes varient ; ce rapprochement ne remplace pas une étude écologique.",
  meadow:
    "Dans ce scénario illustratif, une collectivité envisage d’éclairer un chemin près d’un bocage normand. Parcourez les cinq étapes pour examiner le contexte, les informations manquantes et des adaptations à discuter avec des spécialistes.",
  drone:
    "ARQ réunit Arden, Romain et Quentin autour de l’intelligence artificielle, du développement logiciel et de l’exploitation des données. Les rôles individuels ne sont pas attribués ici. Le survol illustre le territoire ; il ne démontre pas un service de relevé par drone.",
  coast:
    "Le démonstrateur permet d’examiner un parcours fonctionnel. Son utilité en situation réelle, ses gains éventuels et son coût numérique restent à évaluer avec les acteurs du terrain.",
  marine:
    "Les trois besoins sont complémentaires : des partenaires pour confronter l’outil aux usages, des données fiables et une expertise scientifique, puis des moyens pour expérimenter et mesurer les résultats. Aucun partenariat n’est présenté comme acquis.",
  "coast-return":
    "Les informations, sources et propositions préparent une discussion au moment où le projet se dessine. Les spécialistes et les responsables du projet gardent la décision ; l’outil ne délivre ni autorisation ni validation écologique automatique.",
  "night-forest":
    "Le retour à la forêt invite à regarder autrement un même milieu. Comprendre les informations disponibles et leurs limites aide à préparer l’aménagement ; aucun bénéfice écologique réel n’a été mesuré dans ce récit.",
};

/** Exact shared title/message and a deliberate, richer discovery description. */
export function sceneEditorial(cue: NarrativeCue) {
  return {
    title: cue.title,
    message: cue.message,
    exploration: explorationDescriptions[cue.id],
  };
}

export const notebookEditorial = {
  timing:
    "Le mode jury ouvre directement la forêt à 0:00. Cliquez sur « Démarrer le pitch » pour lancer les cinq minutes à deux voix (A et B), sans vidéo ni travelling préalable. Espace suspend ou reprend le récit ; les flèches changent d’étape. Le parcours public conserve le bureau, la vidéo officielle et le travelling de 14 secondes, puis se découvre librement. Une répétition chronométrée à deux reste nécessaire.",
  archives:
    "Les documents originaux ci-dessous sont conservés comme archives. Leur transcription n’est pas une description actualisée de toutes les fonctions : le conducteur, les réserves affichées et la documentation technique précisent l’état actuel du démonstrateur.",
} as const;

export const evidenceDefinitions = [
  {
    status: "operational",
    description:
      "Capacité décrite dans les livrables ; configuration locale requise pour l’exécuter.",
  },
  {
    status: "measured",
    description:
      "Recette ou archive datée ; aucune efficacité écologique déduite.",
  },
  {
    status: "expected",
    description:
      "Utilité visée ; aucun gain de temps ou de biodiversité mesuré.",
  },
  {
    status: "future",
    description: "Développement ou évaluation à venir.",
  },
] as const;

export const lightingOptions = [
  "Éviter ou déplacer certains points lumineux",
  "Réduire la durée de fonctionnement",
  "Cibler l’orientation sur les usages nécessaires",
] as const;

export const designReferences = [
  {
    label: "Ministère · Trame verte, bleue et noire",
    url: "https://www.ecologie.gouv.fr/politiques-publiques/trame-verte-bleue",
  },
  {
    label: "OFB · Clôtures et faune",
    url: "https://patbiodiv.ofb.fr/index.php/fiche-methodologique/amenagements-terrestres/clotures-impacts-faune-887",
  },
  {
    label: "Cerema · Désimperméabilisation",
    url: "https://www.cerema.fr/system/files/documents/2022/11/2022_plaquette_desimpermeabilisation.pdf",
  },
] as const;

export const layers: Record<string, string> = {
  znieff1: "ZNIEFF I",
  znieff2: "ZNIEFF II",
  "natura-habitat": "Natura · Habitats",
  "natura-oiseaux": "Natura · Oiseaux",
};
export const pipeline = [
  [
    "Vidéo",
    "Les vidéos sont importées dans le stockage local et associées au dossier.",
  ],
  [
    "Extraction",
    "Des images sont extraites pour permettre l’analyse visuelle.",
  ],
  ["Reconnaissance", classificationEditorial.discovery],
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
export const catalogue = [
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
