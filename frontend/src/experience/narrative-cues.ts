import type { ChapterId } from "./config";
import type { ExcursionId } from "./excursions/route";

export const narrativeDurationSeconds = 300;

const currentClassifier = "classificateur PyTorch";
const futureClassifier = "SpeciesNet";
/** Current/future model status is shared by the oral script and both UI modes. */
export const classificationEditorial = {
  current: currentClassifier,
  status: `${currentClassifier[0].toUpperCase()}${currentClassifier.slice(1)} actuel · ${futureClassifier} reste une piste d’évolution`,
  discovery: `MegaDetector localise les animaux, puis un second modèle propose l’espèce : ${currentClassifier} aujourd’hui, ${futureClassifier} en piste pour la suite. Le suivi relie les observations dans le temps.`,
  proposal: `Le ${currentClassifier} propose une espèce, avec une incertitude à examiner ; détection, classification et suivi restent séparés.`,
  note: `Écart explicite avec le script reçu : ${futureClassifier} y était nommé, mais n’est pas intégré au pipeline actuel. La formulation orale décrit le ${currentClassifier} existant ; ${futureClassifier} reste une piste à évaluer.`,
} as const;

export interface NarrativeSpeech {
  speaker: "A" | "B";
  text: string;
}
export interface NarrativeEvent {
  id: string;
  /** Absolute seconds on the jury clock, excluding the public prologue. */
  start: number;
  end: number;
  label: string;
  detail: string;
}
export interface NarrativeCameraSpan {
  from: number;
  to: number;
  action: "hold" | "move";
  /** Local camera-path position during a hold, in the range 0–1. */
  at?: number;
  description: string;
}
export interface NarrativeCue {
  id: string;
  chapter: ChapterId;
  landscape: string;
  excursion?: ExcursionId;
  path:
    | { kind: "main"; from: number; to: number }
    | { kind: "excursion"; id: ExcursionId };
  start: number;
  end: number;
  subject: string;
  title: string;
  message: string;
  screen: readonly string[];
  speeches: readonly NarrativeSpeech[];
  events: readonly NarrativeEvent[];
  camera: readonly NarrativeCameraSpan[];
  transition: string;
  note?: string;
}

/** One editorial clock for the 2D and WebGL jury renderers and the speaker guide. */
export const narrativeCues: readonly NarrativeCue[] = [
  {
    id: "forest-opening",
    landscape: "Forêt",
    chapter: "forest",
    path: { kind: "main", from: 0, to: 12 },
    start: 0,
    end: 18,
    subject: "Ce que l’on ne voit pas",
    title: "Une forêt ordinaire.\nVraiment ?",
    message: "Une vie discrète s’organise autour de nous.",
    screen: ["Qui habite ici ?"],
    speeches: [
      {
        speaker: "A",
        text: "Regardez cette forêt. Des arbres, quelques rayons de soleil. Rien d’extraordinaire, à première vue. Pourtant, une vie discrète s’organise autour de nous. Savons-nous vraiment qui habite ici ?",
      },
    ],
    events: [
      {
        id: "opening-question",
        start: 0,
        end: 18,
        label: "Qui habite ici ?",
        detail:
          "La forêt domine ; les animaux et leurs annotations restent des illustrations, sans observation calculée.",
      },
    ],
    camera: [
      {
        from: 0,
        to: 2,
        action: "move",
        description: "Amorce très lente depuis le cadrage initial de la forêt.",
      },
      {
        from: 2,
        to: 12,
        action: "hold",
        at: 0.06,
        description: "Pause visuelle dans la forêt ; le chronomètre continue.",
      },
      {
        from: 12,
        to: 18,
        action: "move",
        description: "Approche progressive de la litière.",
      },
    ],
    transition: "À 0:18, le regard descend sous la litière vers le sol vivant.",
  },
  {
    id: "soil",
    landscape: "Sol vivant",
    chapter: "forest",
    excursion: "soil",
    path: { kind: "excursion", id: "soil" },
    start: 18,
    end: 42,
    subject: "Sous nos pas",
    title: "Ce qui vit ici\nnous échappe.",
    message:
      "Un projet d’aménagement peut perturber une vie que nous observons peu.",
    screen: [
      "Une route, une clôture, un éclairage",
      "Que risquerions-nous de perturber ?",
    ],
    speeches: [
      {
        speaker: "B",
        text: "Sous nos pas, des animaux circulent, se nourrissent, trouvent refuge. La plupart échappent à notre regard. Maintenant, imaginons qu’un projet d’aménagement soit prévu à cet endroit. Une route, une clôture, un éclairage. Comment savoir ce que nous risquons de perturber ?",
      },
    ],
    events: [
      {
        id: "soil-reveal",
        start: 18,
        end: 42,
        label: "Une vie sous nos pas",
        detail:
          "Révélation progressive de la coupe pédagogique et des organismes illustrés ; aucune analyse de sol exécutée.",
      },
    ],
    camera: [
      {
        from: 18,
        to: 42,
        action: "move",
        description:
          "Descente sous le sol, découverte des organismes, puis remontée progressive.",
      },
    ],
    transition: "À 0:42, retour à la surface et au cadrage forestier.",
    note: "Coupe pédagogique : les organismes représentés ne constituent pas un inventaire du lieu.",
  },
  {
    id: "forest-return",
    landscape: "Retour forêt",
    chapter: "forest",
    path: { kind: "main", from: 12, to: 17.5 },
    start: 42,
    end: 50,
    subject: "Des données à relier",
    title: "Une forêt ordinaire.\nVraiment ?",
    message:
      "Des données existent. Encore faut-il les relier pour mieux décider.",
    screen: ["Observations dispersées", "Comment mieux décider ?"],
    speeches: [
      {
        speaker: "A",
        text: "Les données existent. Mais elles sont dispersées. Alors, comment mieux décider ?",
      },
    ],
    events: [
      {
        id: "forest-data",
        start: 42,
        end: 50,
        label: "Des informations dispersées",
        detail:
          "Retour au paysage ; un seul message prépare la révélation de Symbiose.",
      },
    ],
    camera: [
      {
        from: 42,
        to: 50,
        action: "move",
        description:
          "Retour à la surface, puis élévation douce au-dessus de la forêt.",
      },
    ],
    transition:
      "À 0:50, ouverture sur le ciel et révélation de l’identité Symbiose.",
  },
  {
    id: "sky",
    landscape: "Ciel",
    chapter: "sky",
    path: { kind: "main", from: 17.5, to: 47.5 },
    start: 50,
    end: 67,
    subject: "L’idée Symbiose",
    title: "Rendre l’invisible\nvisible.",
    message:
      "Relier l’intelligence artificielle aux données environnementales ouvertes pour éclairer les choix.",
    screen: [
      "Observer la faune",
      "Comprendre le territoire",
      "Éclairer les projets",
    ],
    speeches: [
      {
        speaker: "B",
        text: "C’est là que commence Symbiose. Notre ambition : rendre visible ce qui nous échappe, en reliant l’intelligence artificielle aux données environnementales ouvertes. Pas pour décider à notre place. Pour éclairer nos choix.",
      },
    ],
    events: [
      {
        id: "identity-reveal",
        start: 50,
        end: 67,
        label: "Symbiose",
        detail:
          "Apparition mesurée de l’identité et de la promesse ; les paysages restent dominants.",
      },
    ],
    camera: [
      {
        from: 50,
        to: 67,
        action: "move",
        description:
          "Travelling vers le ciel, puis suivi de la vallée vers la rivière.",
      },
    ],
    transition:
      "À 1:07, approche du piège photographique et démarrage de la chaîne de reconnaissance.",
  },
  {
    id: "rivers",
    landscape: "Rivière",
    chapter: "rivers",
    path: { kind: "main", from: 47.5, to: 77.5 },
    start: 67,
    end: 87,
    subject: "De la vidéo à l’observation validée",
    title: "L’IA détecte et propose.\nL’humain valide.",
    message:
      "Détection, proposition d’espèce et validation humaine restent trois étapes distinctes.",
    screen: ["Détection", "Identification proposée", "Validation humaine"],
    speeches: [
      {
        speaker: "B",
        text: `Tout part d’une caméra qui observe la faune. MegaDetector repère les animaux dans les images. Un ${classificationEditorial.current} propose une identification. Puis un humain vérifie et valide l’observation. L’intelligence artificielle accélère le travail ; l’expertise reste indispensable.`,
      },
    ],
    events: [
      {
        id: "river-detect",
        start: 67,
        end: 73,
        label: "Détecter",
        detail:
          "MegaDetector repère une présence animale ; les cadres de la scène illustrent cette étape sans exécuter d’inférence.",
      },
      {
        id: "river-identify",
        start: 73,
        end: 80,
        label: "Proposer une espèce",
        detail: classificationEditorial.proposal,
      },
      {
        id: "river-review",
        start: 80,
        end: 87,
        label: "L’humain valide",
        detail:
          "La validation de l’espèce et du recadrage reste humaine. Les six étapes détaillées restent consultables dans le parcours libre.",
      },
    ],
    camera: [
      {
        from: 67,
        to: 72,
        action: "move",
        description: "Approche progressive du piège photographique.",
      },
      {
        from: 72,
        to: 83,
        action: "hold",
        at: 5 / 12,
        description:
          "Cadrage stable près de la caméra pendant la démonstration en trois temps.",
      },
      {
        from: 83,
        to: 87,
        action: "move",
        description: "Reprise lente vers la surface de l’eau.",
      },
    ],
    transition:
      "À 1:27, immersion sous l’eau : identifier ne suffit pas à comprendre le milieu.",
    note: classificationEditorial.note,
  },
  {
    id: "underwater",
    landscape: "Monde sous-marin",
    chapter: "underwater",
    path: { kind: "main", from: 77.5, to: 105 },
    start: 87,
    end: 103,
    subject: "Comprendre le milieu",
    title: "Reconnaître un animal\nne suffit pas.",
    message:
      "Une présence observée ne dit pas encore ce qu’un aménagement pourrait changer.",
    screen: ["Une présence observée", "Un milieu à comprendre"],
    speeches: [
      {
        speaker: "A",
        text: "Mais reconnaître un animal, est-ce suffisant ? Non. Savoir qu’une espèce est présente ne nous dit ni comment elle utilise ce milieu, ni ce qu’un aménagement pourrait changer pour elle.",
      },
    ],
    events: [
      {
        id: "habitat-question",
        start: 87,
        end: 103,
        label: "Comprendre le milieu",
        detail:
          "Les poissons portent la mention « espèce à confirmer » ; aucune identification n’est calculée dans cette scène.",
      },
    ],
    camera: [
      {
        from: 87,
        to: 103,
        action: "move",
        description: "Immersion sous l’eau puis approche lente des roseaux.",
      },
    ],
    transition:
      "À 1:43, remontée vers la zone humide et croisement des informations territoriales.",
  },
  {
    id: "wetland",
    landscape: "Zone humide",
    chapter: "wetland",
    path: { kind: "main", from: 105, to: 132.5 },
    start: 103,
    end: 135,
    subject: "Croiser les données",
    title: "Le vivant, replacé\ndans son territoire.",
    message:
      "Savoir ce que nous savons, d’où viennent les informations et ce qu’il reste à vérifier.",
    screen: [
      "Observations validées",
      "Cadastre · RPG 2024",
      "IGN · DREAL Normandie",
      "Publications scientifiques",
    ],
    speeches: [
      {
        speaker: "B",
        text: "Symbiose replace alors l’observation dans son territoire. Nous la croisons avec des données ouvertes : occupation des sols, parcelles, zonages environnementaux, zones humides lorsque l’information existe. Nous y associons des sources scientifiques consultables. Ce rapprochement ne remplace pas une étude écologique. Il permet de savoir ce que nous savons, d’où viennent les informations et ce qu’il reste à vérifier sur le terrain.",
      },
    ],
    events: [
      {
        id: "context-observations",
        start: 103,
        end: 111,
        label: "Observations validées",
        detail:
          "Une observation humaine validée constitue le point de départ ; les observations de la recette territoriale sont synthétiques.",
      },
      {
        id: "context-parcels",
        start: 111,
        end: 119,
        label: "Cadastre · RPG 2024",
        detail:
          "Situer les parcelles et les usages documentés, avec les millésimes et les limites des données disponibles.",
      },
      {
        id: "context-official",
        start: 119,
        end: 127,
        label: "IGN · DREAL Normandie",
        detail:
          "Consulter les zonages et les zones humides lorsque l’information existe ; les résultats normands affichés proviennent des archives du projet.",
      },
      {
        id: "context-science",
        start: 127,
        end: 135,
        label: "Publications scientifiques",
        detail:
          "Rendre les sources consultables et distinguer les informations disponibles des vérifications encore nécessaires sur le terrain.",
      },
    ],
    camera: [
      {
        from: 103,
        to: 135,
        action: "move",
        description:
          "Remontée lente dans les roseaux ; les quatre catégories apparaissent successivement.",
      },
    ],
    transition:
      "À 2:15, ouverture du bocage et stabilisation pour le cas d’usage.",
  },
  {
    id: "meadow",
    landscape: "Prairie et bocage",
    chapter: "meadow",
    path: { kind: "main", from: 132.5, to: 165 },
    start: 135,
    end: 185,
    subject: "Un projet d’éclairage à examiner",
    title: "Observer, situer, décider :\nun seul parcours.",
    message:
      "Un cas illustratif pour repérer les vigilances et discuter des adaptations avec les spécialistes.",
    screen: ["Aménageurs", "Acteurs de l’environnement", "Territoires"],
    speeches: [
      {
        speaker: "A",
        text: "Prenons un exemple. Une collectivité prévoit d’éclairer un chemin près de ce bocage. Sur une carte, elle voit l’emplacement. Avec Symbiose, elle découvre aussi les observations de faune disponibles et les caractéristiques du milieu. Des informations à examiner avant de décider.",
      },
      {
        speaker: "B",
        text: "Peut-on éteindre à certaines heures ? Réduire l’intensité ? Déplacer l’installation ? Symbiose fait émerger des points de vigilance et des alternatives documentées, avec leurs sources consultables. Ces pistes restent à discuter avec les spécialistes. L’outil n’autorise rien, n’interdit rien : il aide à poser les bonnes questions, plus tôt.",
      },
    ],
    events: [
      {
        id: "lighting-project",
        start: 135,
        end: 144,
        label: "Un projet d’éclairage",
        detail:
          "Scénario illustratif : une collectivité envisage d’éclairer un chemin près d’un bocage normand. Aucun projet réel ni dossier écologique calculé ici.",
      },
      {
        id: "lighting-context",
        start: 144,
        end: 154,
        label: "Observer et situer",
        detail:
          "Relier les observations disponibles aux caractéristiques du milieu. Les données de démonstration ne constituent pas un inventaire réel du site.",
      },
      {
        id: "lighting-vigilance",
        start: 154,
        end: 164,
        label: "Examiner les vigilances",
        detail:
          "Identifier les informations manquantes et les usages du milieu à vérifier avec un spécialiste ; aucun effet écologique n’est mesuré dans cette animation.",
      },
      {
        id: "lighting-adaptations",
        start: 164,
        end: 176,
        label: "Discuter des adaptations",
        detail:
          "Examiner des horaires réduits, le déplacement de certains points lumineux ou leur orientation ; des pistes conditionnelles à discuter avec les spécialistes.",
      },
      {
        id: "lighting-sources",
        start: 176,
        end: 185,
        label: "Consulter les justifications",
        detail:
          "Le registre des douze alternatives documentées reste consultable avec ses sources et conditions. Cette illustration ne calcule ni autorisation ni recommandation personnalisée.",
      },
    ],
    camera: [
      {
        from: 135,
        to: 145,
        action: "move",
        description:
          "Arrivée douce sur le bocage et installation du cas illustratif.",
      },
      {
        from: 145,
        to: 178,
        action: "hold",
        at: 0.25,
        description:
          "Cadrage stable pendant le projet, les vigilances et les adaptations.",
      },
      {
        from: 178,
        to: 185,
        action: "move",
        description: "Élévation progressive vers le survol du bocage.",
      },
    ],
    transition: "À 3:05, passage au survol et présentation de l’équipe ARQ.",
    note: "Scénario illustratif, bénéfices attendus non mesurés ; les propositions ne remplacent pas l’expertise écologique.",
  },
  {
    id: "drone",
    landscape: "Survol du bocage",
    chapter: "meadow",
    excursion: "drone",
    path: { kind: "excursion", id: "drone" },
    start: 185,
    end: 215,
    subject: "L’équipe ARQ",
    title: "Derrière Symbiose,\nl’équipe ARQ.",
    message:
      "Arden, Romain et Quentin réunissent intelligence artificielle, développement logiciel et données.",
    screen: [
      "Intelligence artificielle",
      "Développement logiciel",
      "Exploitation des données",
    ],
    speeches: [
      {
        speaker: "B",
        text: "Derrière Symbiose, il y a ARQ : une équipe qui réunit intelligence artificielle, développement logiciel et exploitation des données. Nous avons combiné ces compétences pour construire un démonstrateur fonctionnel, pensé pour les enjeux du territoire normand.",
      },
      {
        speaker: "A",
        text: "Nous ne développons pas de la technologie pour la technologie. Nous voulons la rendre utile à ceux qui agissent sur le terrain.",
      },
    ],
    events: [
      {
        id: "team-ai",
        start: 191,
        end: 198,
        label: "Intelligence artificielle",
        detail:
          "Réunir les compétences pour traiter les observations tout en gardant la validation humaine.",
      },
      {
        id: "team-software",
        start: 198,
        end: 205,
        label: "Développement logiciel",
        detail:
          "Relier les étapes dans un démonstrateur local utilisable par les acteurs du territoire.",
      },
      {
        id: "team-data",
        start: 205,
        end: 215,
        label: "Exploitation des données",
        detail:
          "Documenter les données et leurs limites pour rendre les informations examinables.",
      },
    ],
    camera: [
      {
        from: 185,
        to: 200,
        action: "move",
        description:
          "Survol du bocage ; six premières secondes sans panneau de compétence.",
      },
      {
        from: 200,
        to: 210,
        action: "hold",
        at: 0.5,
        description:
          "Composition stable pendant la présentation des compétences d’ARQ.",
      },
      {
        from: 210,
        to: 215,
        action: "move",
        description: "Reprise progressive du mouvement vers le littoral.",
      },
    ],
    transition: "À 3:35, ouverture sur Étretat et changement d’échelle.",
    note: "Survol illustratif ; le relevé par drone reste une piste d’évolution.",
  },
  {
    id: "coast",
    landscape: "Littoral",
    chapter: "coast",
    path: { kind: "main", from: 165, to: 180 },
    start: 215,
    end: 228,
    subject: "Du démonstrateur au terrain",
    title: "Rendre l’expertise accessible\nau bon moment.",
    message:
      "Un parcours démontré ; un impact réel sur le terrain encore à mesurer.",
    screen: ["Démonstrateur", "Impact réel à mesurer"],
    speeches: [
      {
        speaker: "A",
        text: "Aujourd’hui, Symbiose est un démonstrateur. Nous avons montré un parcours possible, pas encore mesuré son impact réel sur le terrain.",
      },
    ],
    events: [
      {
        id: "coast-perspective",
        start: 215,
        end: 228,
        label: "Un impact à mesurer",
        detail:
          "Ouvrir les perspectives sans annoncer de résultats écologiques, de gain de temps ou de partenariat acquis.",
      },
    ],
    camera: [
      {
        from: 215,
        to: 228,
        action: "move",
        description:
          "Ouverture sur les falaises d’Étretat puis préparation de la plongée.",
      },
    ],
    transition: "À 3:48, plongée vers les besoins à construire ensemble.",
  },
  {
    id: "marine",
    landscape: "Plongée à Étretat",
    chapter: "coast",
    excursion: "marine",
    path: { kind: "excursion", id: "marine" },
    start: 228,
    end: 258,
    subject: "Ce qu’il reste à construire ensemble",
    title: "Ce qu’il reste à\nconstruire ensemble.",
    message:
      "Confronter Symbiose à de vrais usages avec des partenaires, des données fiables et des moyens d’expérimenter.",
    screen: [
      "Partenaires de terrain",
      "Données fiables et expertise scientifique",
      "Moyens d’expérimenter",
    ],
    speeches: [
      {
        speaker: "B",
        text: "Pour aller plus loin, il nous faut des partenaires : collectivités, associations naturalistes, professionnels de l’aménagement. Leur regard permettra de confronter Symbiose à de vrais usages. Il nous faut aussi des données fiables, une expertise scientifique et des moyens d’expérimenter. Nous voulons mesurer ce qui fonctionne, ce qui doit être amélioré et le coût numérique de nos traitements.",
      },
    ],
    events: [
      {
        id: "needs-partners",
        start: 228,
        end: 238,
        label: "Partenaires de terrain",
        detail:
          "Collectivités, associations naturalistes et professionnels de l’aménagement : des partenaires recherchés, aucun partenariat annoncé.",
      },
      {
        id: "needs-evidence",
        start: 238,
        end: 248,
        label: "Données fiables et expertise scientifique",
        detail:
          "Confronter les propositions à des données documentées et à l’expertise des spécialistes.",
      },
      {
        id: "needs-experiment",
        start: 248,
        end: 258,
        label: "Moyens d’expérimenter",
        detail:
          "Évaluer les usages, les améliorations nécessaires et le coût numérique des traitements.",
      },
    ],
    camera: [
      {
        from: 228,
        to: 258,
        action: "move",
        description:
          "Plongée existante à Étretat ; apparition successive des trois besoins, puis remontée.",
      },
    ],
    transition: "À 4:18, retour apaisé à la surface, face au littoral.",
    note: "Évocation artistique du littoral ; besoins proposés et partenaires recherchés.",
  },
  {
    id: "coast-return",
    landscape: "Retour littoral",
    chapter: "coast",
    path: { kind: "main", from: 180, to: 195 },
    start: 258,
    end: 270,
    subject: "L’expertise au bon moment",
    title: "Rendre l’expertise accessible\nau bon moment.",
    message: "Rendre l’expertise accessible lorsqu’une décision se prépare.",
    screen: ["Éclairer les choix", "Préserver la place de l’expertise"],
    speeches: [
      {
        speaker: "A",
        text: "Parce que l’enjeu n’est pas de remplacer l’expertise. Il est de la rendre accessible au moment où une décision se prépare.",
      },
    ],
    events: [
      {
        id: "coast-expertise",
        start: 258,
        end: 270,
        label: "Au moment de décider",
        detail:
          "Sortie de plongée et transition apaisée ; un message unique sur le rôle de l’expertise.",
      },
    ],
    camera: [
      {
        from: 258,
        to: 270,
        action: "move",
        description:
          "Retour à la surface puis transition douce vers la forêt nocturne.",
      },
    ],
    transition: "À 4:30, retrouver la forêt du début, désormais de nuit.",
  },
  {
    id: "night-forest",
    landscape: "Forêt nocturne",
    chapter: "night-forest",
    path: { kind: "main", from: 195, to: 210 },
    start: 270,
    end: 300,
    subject: "La même forêt, un autre regard",
    title: "Comprendre le vivant\navant d’aménager.",
    message:
      "La forêt est la même. Ce qui a changé, c’est ce que nous en savons.",
    screen: ["Symbiose", "Comprendre le vivant avant d’aménager"],
    speeches: [
      {
        speaker: "A",
        text: "Regardez autour de vous. Vous reconnaissez cette forêt ? C’est ici que notre voyage a commencé.",
      },
      {
        speaker: "B",
        text: "Elle est la même qu’il y a cinq minutes. Ce qui a changé, c’est ce que nous en savons.",
      },
      {
        speaker: "A",
        text: "Et c’est peut-être là que commence une autre façon d’aménager nos territoires. Symbiose. Comprendre le vivant avant d’aménager.",
      },
    ],
    events: [
      {
        id: "epilogue-return",
        start: 270,
        end: 280,
        label: "Vous reconnaissez cette forêt ?",
        detail: "C’est ici que notre voyage a commencé.",
      },
      {
        id: "epilogue-perspective",
        start: 280,
        end: 289,
        label: "La même forêt, un autre regard",
        detail: "Ce qui a changé, c’est ce que nous en savons.",
      },
      {
        id: "epilogue-signature",
        start: 289,
        end: 300,
        label: "Comprendre le vivant avant d’aménager",
        detail: "Comprendre le vivant avant d’aménager.",
      },
    ],
    camera: [
      {
        from: 270,
        to: 292,
        action: "move",
        description:
          "Ralentir et retrouver de nuit un cadrage rappelant la forêt initiale.",
      },
      {
        from: 292,
        to: 300,
        action: "hold",
        at: 1,
        description:
          "Cadrage final stable ; le chronomètre atteint 5:00 puis s’arrête.",
      },
    ],
    transition:
      "À 5:00, récit immobile, logo, signature et accès à l’application conservés.",
  },
];

export const narrativeEvents: readonly NarrativeEvent[] = narrativeCues.flatMap(
  (cue) => cue.events,
);
export const narrativeEventById = (id: string): NarrativeEvent | undefined =>
  narrativeEvents.find((event) => event.id === id);
export const signatureEvent = narrativeEventById("epilogue-signature")!;

const clockBoundaryToleranceSeconds = 1e-7;
const clockBoundaries = [
  ...new Set(
    narrativeCues.flatMap((cue) => [
      cue.start,
      cue.end,
      ...cue.events.flatMap((event) => [event.start, event.end]),
    ]),
  ),
];

/** Remove floating-point round-trip noise at editorial boundaries, in one place. */
export function normalizeNarrativeSeconds(seconds: number): number {
  const value = Math.max(
    0,
    Math.min(narrativeDurationSeconds, Number.isFinite(seconds) ? seconds : 0),
  );
  return (
    clockBoundaries.find(
      (boundary) => Math.abs(value - boundary) <= clockBoundaryToleranceSeconds,
    ) ?? value
  );
}

/** Right-continuous scene selection; the final scene remains visible at 5:00. */
export function narrativeCueAt(seconds: number): NarrativeCue {
  const value = normalizeNarrativeSeconds(seconds);
  return (
    narrativeCues.find((cue) => value < cue.end) ??
    narrativeCues[narrativeCues.length - 1]
  );
}

export function narrativeEventAt(seconds: number): NarrativeEvent | undefined {
  const value = normalizeNarrativeSeconds(seconds);
  return narrativeCueAt(value).events.find(
    (event) =>
      value >= event.start &&
      (value < event.end ||
        (value === narrativeDurationSeconds && event.end === value)),
  );
}
