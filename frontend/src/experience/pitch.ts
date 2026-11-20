import type { ChapterId } from "./config";
import { narrativeCues } from "./narrative-cues";

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
 * Condensed clock retained for public chapter navigation. The jury clock
 * includes the three explorations and comes from narrative-cues.ts; the public
 * opening video and office travelling are outside that five-minute clock.
 */
export const pitchDuration = narrativeCues
  .filter((cue) => !cue.excursion)
  .reduce((seconds, cue) => seconds + cue.end - cue.start, 0);
// Preserve the existing spatial study and all seven reversible camera transitions.
// Presentation seconds are an editorial clock, independent of the 210-unit camera path.
export const visualBoundaries = [
  0, 17.5, 47.5, 77.5, 105, 132.5, 165, 195, 210,
];
const chapterMetadata: readonly Pick<
  PitchChapter,
  "id" | "status" | "sources"
>[] = [
  {
    id: "forest",
    sources: ["manifesto", "description", "jury-questions"],
  },
  {
    id: "sky",
    status: "operational",
    sources: ["manifesto", "vision", "design"],
  },
  {
    id: "rivers",
    status: "operational",
    sources: ["vision", "review", "architecture"],
  },
  {
    id: "underwater",
    sources: ["manifesto", "territory"],
  },
  {
    id: "wetland",
    status: "operational",
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
    status: "expected",
    sources: ["manifesto", "design", "design-validation"],
  },
  {
    id: "coast",
    status: "future",
    sources: ["manifesto", "jury-questions", "annex"],
  },
  {
    id: "night-forest",
    sources: ["manifesto", "description"],
  },
];

/** Public chapter navigation keeps its original coordinates; editorial copy is shared with jury cues. */
export const pitchChapters: readonly PitchChapter[] = chapterMetadata.map(
  (metadata) => {
    const cues = narrativeCues.filter(
      (cue) => cue.chapter === metadata.id && !cue.excursion,
    );
    const first = cues[0];
    return {
      ...metadata,
      start: narrativeCues
        .filter((cue) => !cue.excursion && cue.start < first.start)
        .reduce((seconds, cue) => seconds + cue.end - cue.start, 0),
      duration: cues.reduce((seconds, cue) => seconds + cue.end - cue.start, 0),
      subject: first.subject,
      title: first.title,
      message: first.message,
      oral: cues
        .map(
          (cue) =>
            `${clock(cue.start)} · ${cue.speeches.map((speech) => `${speech.speaker} — ${speech.text}`).join("\n")}`,
        )
        .join("\n\n"),
      screen: [...first.screen],
      interaction: cues
        .flatMap((cue) => cue.events.map((event) => event.detail))
        .join(" "),
      transition: cues.map((cue) => cue.transition).join(" "),
    };
  },
);

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
    "Mode jury de cinq minutes à deux voix, sans prologue ; vidéo d’ouverture réservée à la découverte publique. Répétition à effectuer.",
  ],
] as const;

export function clock(seconds: number): string {
  return `${Math.floor((seconds + 1e-6) / 60)}:${String(Math.floor((seconds + 1e-6) % 60)).padStart(2, "0")}`;
}

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
