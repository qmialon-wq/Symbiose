import type { ChapterId } from "./config";

export type EvidenceStatus = "operational" | "measured" | "expected" | "future";
export const statusLabels: Record<EvidenceStatus, string> = {
  operational: "Fonction documentée",
  measured: "Résultat technique vérifié",
  expected: "Bénéfice attendu · non mesuré",
  future: "Perspective · non opérationnelle",
};
export interface PitchChapter {
  id: ChapterId;
  subject: string;
  title: string;
  message: string;
  /** Only chapters that make a claim about Symbiose carry an evidence label. */
  status?: EvidenceStatus;
  start: number;
  duration: number;
  /** Speaker cues shown in the presentation notebook, not on the scene. */
  oral: string;
  screen: string[];
  interaction: string;
  transition: string;
  sources: string[];
}

/**
 * Seconds of the eight main-route chapters. The three explorations add 84 s
 * (see excursions/route.ts), so the presented clock lasts exactly five minutes,
 * after the opening video and the travelling out of the office.
 */
export const pitchDuration = 216;
// Preserve the existing spatial study and all seven reversible camera transitions.
// Presentation seconds are an editorial clock, independent of the 210-unit camera path.
export const visualBoundaries = [
  0, 17.5, 47.5, 77.5, 105, 132.5, 165, 195, 210,
];
export const pitchChapters: readonly PitchChapter[] = [
  {
    id: "forest",
    subject: "Ce que l’on ne voit pas",
    title: "Une forêt ordinaire.\nVraiment ?",
    message: "Le vivant passe ici chaque jour, presque toujours sans témoin.",
    start: 0,
    duration: 26,
    oral: "0:00 · A — « Regardez cette forêt… » Un décor ordinaire, puis la question : que savons-nous de ce qui vit ici ? La descente dans le sol accompagne la réplique de B. 0:41 · A — « Les informations existent… » Observations, inventaires, données : dispersées, difficiles à traduire en décisions. Comment comprendre ce territoire avant de le transformer ?",
    screen: [
      "Observations éparses",
      "Inventaires dispersés",
      "Des décisions difficiles à éclairer",
    ],
    interaction:
      "Chevreuil, sanglier et pigeon traversent le sous-bois ; leurs cadres restent illustratifs.",
    transition:
      "La caméra plonge sous la litière, remonte, puis prend de la hauteur.",
    sources: ["manifesto", "description", "jury-questions"],
  },
  {
    id: "sky",
    subject: "L’idée Symbiose",
    title: "Rendre l’invisible\nvisible.",
    message:
      "Symbiose associe intelligence artificielle et données environnementales ouvertes pour éclairer l’aménagement.",
    status: "operational",
    start: 26,
    duration: 17,
    oral: "B — « C’est pour répondre à cette question que nous avons imaginé Symbiose. » Une idée simple : l’IA et les données environnementales ouvertes pour transformer des observations en informations utiles à l’aménagement. Annoncer que tout commence avec une caméra qui observe la faune.",
    screen: [
      "Observer la faune",
      "Comprendre le territoire",
      "Éclairer les projets",
    ],
    interaction:
      "Le survol révèle les liens entre les milieux normands ; le trajet reste illustratif.",
    transition: "Le regard suit la vallée et rejoint le réseau des rivières.",
    sources: ["manifesto", "vision", "design"],
  },
  {
    id: "rivers",
    subject: "De la vidéo à l’espèce",
    title: "L’IA détecte et propose.\nL’humain valide.",
    message:
      "Une caméra filme, MegaDetector repère, un second modèle propose l’espèce.",
    status: "operational",
    start: 43,
    duration: 20,
    oral: "B — MegaDetector détecte les animaux ; un second modèle propose leur espèce (SpeciesNet : piste étudiée pour la suite, le classificateur actuel est un modèle PyTorch) ; l’observation est ensuite vérifiée et validée par un humain. Terminer sur la question : reconnaître cet animal suffit-il pour comprendre les enjeux du territoire ?",
    screen: [
      "Vidéo",
      "Extraction",
      "Reconnaissance et suivi",
      "Validation humaine",
      "Données ouvertes et publications",
      "Propositions",
    ],
    interaction:
      "La frise des six étapes suit le fil de l’eau ; chaque étape explique son rôle au clic.",
    transition: "Le courant entraîne le regard sous la surface.",
    sources: ["vision", "review", "architecture"],
  },
  {
    id: "underwater",
    subject: "Comprendre le milieu",
    title: "Reconnaître un animal\nne suffit pas.",
    message: "Sa présence ne prend sens que dans le milieu qui l’accueille.",
    start: 63,
    duration: 16,
    oral: "A — « Non. » Savoir qu’un animal est présent ne dit pas encore ce que cela implique pour un projet d’aménagement. Il faut aussi comprendre l’environnement dans lequel il évolue.",
    screen: ["Une présence observée", "Un milieu à comprendre"],
    interaction:
      "Les poissons portent la mention « espèce à confirmer » ; aucune identification n’est calculée.",
    transition: "La caméra remonte vers les roseaux de la zone humide.",
    sources: ["manifesto", "territory"],
  },
  {
    id: "wetland",
    subject: "Croiser les données",
    title: "Le vivant, replacé\ndans son territoire.",
    message:
      "ZNIEFF, Natura 2000, zones humides : vérifications et alternatives sourcées.",
    status: "operational",
    start: 79,
    duration: 32,
    oral: "B — Symbiose croise les observations avec les données officielles : ZNIEFF, Natura 2000, zones humides lorsque les données existent. Exemple d’un projet d’éclairage : informations à examiner, vérifications, alternatives (adapter, déplacer, modifier), justifiées et sourcées. A — L’IA ne décide pas de ce que nous construisons ; elle aide à comprendre ce qu’il faut prendre en compte avant de construire.",
    screen: [
      "Observations validées",
      "Cadastre · RPG 2024",
      "IGN · DREAL Normandie",
      "Publications scientifiques",
    ],
    interaction:
      "Quatre affluents documentaires convergent ; une matrice montre les réponses IGN réellement archivées pour deux points normands.",
    transition:
      "La caméra quitte les roseaux et s’ouvre sur la prairie et le bocage.",
    sources: [
      "territory",
      "territory-validation",
      "wetlands",
      "parcels",
      "design",
      "documents",
    ],
  },
  {
    id: "meadow",
    subject: "Vers la décision",
    title: "Observer, situer, décider :\nun seul parcours.",
    message:
      "Trois démarches réunies pour repérer plus tôt les points de vigilance.",
    status: "expected",
    start: 111,
    duration: 50,
    oral: "B — Qu’est-ce que cela change ? Observer une espèce, consulter les zonages, étudier un projet : trois démarches aujourd’hui distinctes, réunies dans un même parcours. A — Pour un aménageur, des points de vigilance identifiés plus tôt ; pour les acteurs de l’environnement, des connaissances mieux valorisées ; pour les territoires, des décisions mieux éclairées. Un démonstrateur fonctionnel, dont l’impact réel reste à mesurer. Conviction : mieux comprendre un territoire pour mieux le préserver.",
    screen: [
      "Aménageurs : des vigilances repérées plus tôt",
      "Acteurs de l’environnement : des connaissances valorisées",
      "Territoires : des décisions mieux éclairées",
    ],
    interaction:
      "Les trois publics et l’inventaire des douze alternatives documentées accompagnent le bocage.",
    transition: "La caméra rejoint le drone qui survole le bocage.",
    sources: ["manifesto", "design", "design-validation"],
  },
  {
    id: "coast",
    subject: "Et demain ?",
    title: "Rendre l’expertise accessible\nau bon moment.",
    message:
      "Un démonstrateur fonctionnel aujourd’hui. Demain, un appui pour les experts, sans les remplacer.",
    status: "future",
    start: 161,
    duration: 25,
    oral: "3:35 · A — Aujourd’hui, Symbiose est un démonstrateur ; notre ambition va plus loin. Qu’est-ce qu’il nous manque ? (B détaille les besoins pendant la plongée.) 4:17 · B — Notre objectif n’est pas de remplacer les experts de la biodiversité, mais de rendre leurs connaissances accessibles au moment où les décisions se prennent.",
    screen: [
      "Un démonstrateur fonctionnel",
      "Des experts mieux outillés, jamais remplacés",
    ],
    interaction:
      "Étretat encadre la question ; la plongée détaille les besoins puis la caméra remonte face aux falaises.",
    transition:
      "La lumière baisse ; le voyage revient vers la forêt, à la nuit tombée.",
    sources: ["manifesto", "jury-questions", "annex"],
  },
  {
    id: "night-forest",
    subject: "La même forêt",
    title: "Comprendre le vivant\navant d’aménager.",
    message: "Retour au point de départ : la même forêt, un autre regard.",
    start: 186,
    duration: 30,
    oral: "Silence, quelques secondes de nature. A — « Regardez autour de vous… C’est ici que notre voyage a commencé. » Pause. B — La même forêt qu’il y a cinq minutes ; ce qui a changé, c’est ce que nous en savons. A — Peut-être le début d’une meilleure façon d’aménager nos territoires. Le logo se forme : Comprendre le vivant avant d’aménager.",
    screen: ["Logo Symbiose", "Comprendre le vivant avant d’aménager"],
    interaction:
      "Chevreuil et sanglier reviennent dans la forêt nocturne ; le logo se forme, avec le lien vers l’application.",
    transition:
      "Arrêt final. L’utilisateur choisit d’entrer dans l’application.",
    sources: ["manifesto", "description"],
  },
];

export const juryCoverage = [
  [
    "Problème",
    "Forêt · Sous nos pas",
    "Un vivant qui passe inaperçu ; des données dispersées, difficiles à traduire en décisions.",
  ],
  [
    "Solution",
    "Ciel · Rivières · Sous-marin · Zone humide",
    "Détection et proposition d’espèce, validation humaine, croisement avec les données officielles et alternatives sourcées.",
  ],
  [
    "Impacts",
    "Prairie et bocage",
    "Bénéfices attendus pour aménageurs, acteurs de l’environnement et territoires ; impact réel à mesurer.",
  ],
  [
    "Équipe",
    "L’équipe ARQ",
    "ARQ : Arden, Romain et Quentin ; IA, développement logiciel et données ; rôles individuels non détaillés.",
  ],
  [
    "Besoins pour changer d’échelle",
    "Littoral · Changer d’échelle",
    "Partenaires de terrain, données fiables et expertise scientifique, moyens d’expérimentation ; aucun partenariat annoncé.",
  ],
  [
    "Originalité",
    "Ciel · Zone humide",
    "Partir d’un projet concret et rendre visibles vérifications, alternatives et sources.",
  ],
  [
    "Innovation",
    "Rivières · Zone humide",
    "Vision par ordinateur, validation humaine et contexte territorial reliés au projet d’aménagement.",
  ],
  [
    "Données ouvertes",
    "Zone humide",
    "ZNIEFF, Natura 2000, zones humides DREAL, cadastre et RPG 2024 ; limites des consultations ponctuelles.",
  ],
  [
    "Faisabilité",
    "Rivières · Prairie et bocage",
    "Démonstrateur fonctionnel, socle local existant et recettes techniques archivées.",
  ],
  [
    "Numérique responsable",
    "Rivières · Carnet de présentation",
    "Traitements locaux, GPU sérialisé ; consommation et utilité à mesurer.",
  ],
  [
    "Pertinence territoriale",
    "Zone humide · Littoral",
    "Sources DREAL Normandie et archives de points normands ; usages proposés aux acteurs locaux.",
  ],
  [
    "Qualité de la présentation orale",
    "Ensemble du parcours",
    "Vidéo d’ouverture puis récit de cinq minutes à deux voix, calé sur l’horloge du parcours ; répétition à effectuer.",
  ],
] as const;

export const clock = (seconds: number) =>
  `${Math.floor((seconds + 1e-6) / 60)}:${String(Math.floor((seconds + 1e-6) % 60)).padStart(2, "0")}`;

export function pitchIndex(progress: number): number {
  const units =
    Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0)) * 210;
  const index = visualBoundaries.findIndex(
    (end, i) => i > 0 && units < end - 1e-8,
  );
  return index === -1 ? 7 : index - 1;
}
export function pitchSeconds(progress: number): number {
  const index = pitchIndex(progress),
    chapter = pitchChapters[index];
  const units =
    Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0)) * 210;
  return (
    chapter.start +
    (chapter.duration * (units - visualBoundaries[index])) /
      (visualBoundaries[index + 1] - visualBoundaries[index])
  );
}
export function progressAtSeconds(seconds: number): number {
  const value = Math.min(
    pitchDuration,
    Math.max(0, Number.isFinite(seconds) ? seconds : 0),
  );
  const index = pitchChapters.findIndex(
    (chapter) => value < chapter.start + chapter.duration,
  );
  if (index === -1) return 1;
  const chapter = pitchChapters[index];
  return (
    (visualBoundaries[index] +
      ((value - chapter.start) / chapter.duration) *
        (visualBoundaries[index + 1] - visualBoundaries[index])) /
    210
  );
}
export const chapterProgress = (index: number) =>
  progressAtSeconds(pitchChapters[Math.min(7, Math.max(0, index))].start);

export function applicationUrl(value?: string): string {
  const candidate = value?.trim();
  if (!candidate) return "/connexion";
  if (/^\/(?![\/\\])/.test(candidate) && !candidate.includes("\\"))
    return candidate;
  try {
    const url = new URL(candidate);
    if (["http:", "https:"].includes(url.protocol)) return url.href;
  } catch {
    /* Invalid configuration falls back to the existing login route. */
  }
  return "/connexion";
}

export const appUrl = applicationUrl(import.meta.env.VITE_SYMBIOSE_APP_URL);
export function localMediaUrl(value?: string): string {
  const candidate = value?.trim() ?? "";
  return /^\/(?![\/\\])/.test(candidate) && !/[\\?#\s]/.test(candidate)
    ? candidate
    : "";
}
