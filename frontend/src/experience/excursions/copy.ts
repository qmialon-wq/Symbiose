import type { ExcursionId } from "./route";
import { narrativeCues } from "../narrative-cues";

export interface ExcursionCopy {
  number: string;
  title: string;
  body: string;
  notes: string[];
  disclaimer: string;
  /** Speaker cues shown in the presentation notebook, not on the scene. */
  oral: string;
}

const excursionMetadata: Record<
  ExcursionId,
  Pick<ExcursionCopy, "number" | "disclaimer">
> = {
  soil: {
    number: "01 BIS",
    disclaimer:
      "Coupe pédagogique · organismes illustrés · aucune analyse de sol exécutée",
  },
  drone: {
    number: "06 BIS",
    disclaimer:
      "Survol illustratif · le relevé par drone reste une piste d’évolution",
  },
  marine: {
    number: "07 BIS",
    disclaimer:
      "Évocation artistique du littoral · besoins proposés, aucun partenariat annoncé",
  },
};

export const excursionCopy = Object.fromEntries(
  Object.entries(excursionMetadata).map(([id, metadata]) => {
    const cue = narrativeCues.find((cue) => cue.excursion === id)!;
    return [
      id,
      {
        ...metadata,
        title: cue.title,
        body: cue.message,
        notes: [...cue.screen],
        oral: cue.speeches
          .map((speech) => `${speech.speaker} — ${speech.text}`)
          .join("\n\n"),
      },
    ];
  }),
) as Record<ExcursionId, ExcursionCopy>;
