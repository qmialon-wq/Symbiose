import type { ExcursionId } from "./route";

export interface ExcursionCopy {
  number: string;
  title: string;
  body: string;
  notes: string[];
  disclaimer: string;
  /** Speaker cues shown in the presentation notebook, not on the scene. */
  oral: string;
}

export const excursionCopy: Record<ExcursionId, ExcursionCopy> = {
  soil: {
    number: "01 BIS",
    title: "Ce qui vit ici\nnous échappe.",
    body: "Racines, mycélium, lombrics, larves : une vie intense, presque toujours hors de notre vue.",
    notes: [
      "Lombric · un annélide, pas un insecte",
      "Un projet d’aménagement prévu ici demain ?",
      "Que risquerait-il de perturber ?",
    ],
    disclaimer:
      "Coupe pédagogique · organismes illustrés · aucune analyse de sol exécutée",
    oral: "0:17 · B — « Des animaux se déplacent… » Ils se nourrissent, se reproduisent, passent devant nous sans être remarqués. Puis l’hypothèse : un projet d’aménagement prévu ici demain. Comment savoir ce que nous risquons de perturber ?",
  },
  drone: {
    number: "06 BIS",
    title: "Derrière Symbiose,\nl’équipe ARQ.",
    body: "Arden, Romain et Quentin : une même ambition, construire un outil utile à celles et ceux qui agissent sur nos territoires.",
    notes: [
      "Intelligence artificielle",
      "Développement logiciel",
      "Exploitation des données",
    ],
    disclaimer:
      "Survol illustratif · le relevé par drone reste une piste d’évolution",
    oral: "3:05 · B — « Derrière cette idée, il y a notre équipe : ARQ. » Des compétences réunies en IA, développement logiciel et exploitation des données. A — Pas de technologie pour la technologie : un outil qui puisse un jour servir celles et ceux qui agissent sur nos territoires.",
  },
  marine: {
    number: "07 BIS",
    title: "Ce qu’il nous\nmanque.",
    body: "Passer du démonstrateur au terrain : confronter Symbiose aux besoins réels.",
    notes: [
      "Partenaires de terrain · collectivités, associations, aménageurs",
      "Données fiables et expertise scientifique",
      "Moyens pour expérimenter et déployer",
    ],
    disclaimer:
      "Évocation artistique du littoral · besoins proposés, aucun partenariat annoncé",
    oral: "3:47 · B — D’abord des partenaires de terrain (collectivités, associations naturalistes, professionnels de l’aménagement) pour confronter la solution à leurs besoins réels. Ensuite des données fiables et une expertise scientifique. Enfin des moyens pour expérimenter, améliorer et déployer Symbiose à plus grande échelle.",
  },
};
