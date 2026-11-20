import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import ts from "typescript";

const root = new URL("../../", import.meta.url);
const content = new URL("frontend/src/experience/", root);
const cueCompiled = ts.transpileModule(
  readFileSync(new URL("narrative-cues.ts", content), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const cueUrl = `data:text/javascript;base64,${Buffer.from(cueCompiled).toString("base64")}`;
const { narrativeCues, narrativeDurationSeconds } = await import(cueUrl);
const source = readFileSync(new URL("pitch.ts", content), "utf8");
const compiled = ts.transpileModule(
  source
    .replace("import.meta.env.VITE_SYMBIOSE_APP_URL", "undefined")
    .replace('from "./narrative-cues"', `from "${cueUrl}"`),
  {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const { pitchChapters, juryCoverage, clock, statusLabels } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);

const evidence = ["caen", "carentan"].map((name) => {
  const path = `docs/evidence/territorial/${name}.json.gz`;
  const bytes = readFileSync(new URL(path, root));
  const archive = JSON.parse(gunzipSync(bytes));
  return {
    place: name === "caen" ? "Caen" : "Carentan",
    location: archive.location,
    created_at: archive.created_at,
    mode: archive.mode,
    origin: archive.origin,
    archive: path,
    archive_sha256: createHash("sha256").update(bytes).digest("hex"),
    layers: Object.values(archive.layers).map((layer) => ({
      code: layer.layer,
      status: layer.status,
      source_url: layer.source_url,
      retrieved_at: layer.retrieved_at,
      sha256: layer.sha256,
      features: layer.features.map(({ name, source_id }) => ({
        name,
        source_id,
      })),
    })),
  };
});

const words = narrativeCues
  .flatMap((cue) => cue.speeches.map((speech) => speech.text))
  .join(" ")
  .split(/\s+/).length;
const cell = (text) => text.replaceAll("|", "\\|").replaceAll("\n", "<br>");
const cameraText = (cue) =>
  cue.camera
    .map(
      (span) => `${clock(span.from)}–${clock(span.to)} : ${span.description}`,
    )
    .join("\n");
const eventText = (cue) =>
  cue.events
    .map(
      (event) =>
        `${clock(event.start)}–${clock(event.end)} · ${event.label} : ${event.detail}`,
    )
    .join("\n");
const speechText = (cue) =>
  cue.speeches
    .map((speech) => `**${speech.speaker}** — ${speech.text}`)
    .join("\n");
const conductorDoc = `# Conducteur Symbiose — cinq minutes à deux voix

Généré depuis [narrative-cues.ts](../frontend/src/experience/narrative-cues.ts) par \`node frontend/scripts/export-conducteur.mjs\`.

Horloge jury : **0:00–5:00**, forêt au départ, sans vidéo introductive ni travelling du bureau. Les mêmes treize séquences pilotent les rendus 2D et WebGL. Les paroles ci-dessous servent aux deux intervenants ; elles ne sont pas affichées intégralement sur la scène et aucune voix n’est générée.

| Temps | Scène | Titre affiché | Texte secondaire | Caméra et pauses visuelles | Animation ou interaction | Paroles correspondantes | Transition |
|---|---|---|---|---|---|---|---|
${narrativeCues.map((cue) => `| ${[`${clock(cue.start)}–${clock(cue.end)}`, cue.landscape, cue.title, cue.message, cameraText(cue), eventText(cue), speechText(cue), cue.transition].map(cell).join(" | ")} |`).join("\n")}

## Écarts et limites explicites

${narrativeCues
  .filter((cue) => cue.note)
  .map((cue) => `- **${cue.subject} :** ${cue.note}`)
  .join("\n")}

Les résultats territoriaux conservés s’appuient sur les archives du dépôt. Le registre des douze alternatives constitue un inventaire documenté, sans résultat écologique ni autorisation automatique. Les démonstrations temporelles sont pédagogiques ; elles ne déclenchent pas d’inférence, d’analyse territoriale ou de recherche scientifique en arrière-plan.

## Réglages après répétition

- Ajuster les événements internes et les pauses visuelles dans le conducteur, en conservant les treize bornes principales et les ${narrativeDurationSeconds} secondes.
- Caler les changements de voix, la respiration de l’épilogue et l’apparition finale de la signature.
- Vérifier la lisibilité au vidéoprojecteur et le temps de consultation des sources en gardant le paysage dominant.
- Confronter le cas illustratif et ses pistes d’adaptation à l’expertise du terrain avant de présenter un projet réel.

Pour régénérer : \`node frontend/scripts/export-conducteur.mjs\`. Pour vérifier les exports : ajouter \`--check\`.
`;
const presentationText =
  `SYMBIOSE — CONDUCTEUR ORAL À DEUX VOIX\nSource : frontend/src/experience/narrative-cues.ts\nDurée jury : 5:00. Vidéo et travelling réservés au parcours public, hors de ces cinq minutes.\n\n` +
  narrativeCues
    .map(
      (cue, index) =>
        `${index + 1}. ${clock(cue.start)}–${clock(cue.end)} — ${cue.subject.toLocaleUpperCase("fr")}\nÉCRAN : ${cue.title.replaceAll("\n", " ")}\nTEXTE SECONDAIRE : ${cue.message}\nCAMÉRA : ${cameraText(cue)}\n${cue.speeches.map((speech) => `INTERVENANT ${speech.speaker}\n${speech.text}`).join("\n\n")}\nTRANSITION : ${cue.transition}${cue.note ? `\nLIMITE : ${cue.note}` : ""}`,
    )
    .join("\n\n────────────────────\n\n") +
  "\n";

let doc =
  `# Symbiose — pitch du Datathon Normandie 2026\n\n` +
  `Généré depuis [narrative-cues.ts](../frontend/src/experience/narrative-cues.ts) et [pitch.ts](../frontend/src/experience/pitch.ts) par \`node frontend/scripts/export-pitch.mjs\`.\n\n` +
  `Durée cible : **5 minutes**, sans vidéo préalable en mode jury. Les démonstrations visuelles font partie des treize séquences et du chronomètre. ` +
  `Le texte compte environ **${words} mots**, soit **${Math.round(words / 5)} mots/minute**. Une répétition à deux voix reste nécessaire. ` +
  `Le [conducteur final](CONDUCTEUR_SYMBIOSE.md) détaille les horaires, les paroles, les mouvements de caméra et les événements.\n\n` +
  `## État des sources et limites\n\n` +
  `Le manifeste final ARQ (13 pages, dont les captures), le règlement fourni (5 pages), la trame de descriptif DOCX (vierge), l’image des cinq questions, les guides du dépôt, les recettes techniques et les archives territoriales ont été examinés. ` +
  `Le manifeste répond aux sept rubriques de la trame : solution et équipe, mots-clés, problème, cibles, bénéfices attendus, producteurs et liens des données, accès et captures. Les sources externes mentionnées sont celles utilisées par le code ; aucune actualisation réseau n’est réalisée par cette présentation. ` +
  `Le règlement § 5, p. 3 donne six critères : pertinence thématique, originalité, innovation, sobriété numérique, faisabilité et qualité orale. L’image fournie fixe les cinq questions. La correspondance ci-dessous les couvre sans prétendre certifier l’ensemble des obligations administratives du concours. ` +
  `Le § 3 du règlement mentionne emploi-formation et cite les données de biodiversité dans sa note de bas de page ; cette ambiguïté du document n’est pas réécrite. ` +
  `La vidéo introductive officielle appartient au parcours public ; elle n’entre pas dans les cinq minutes du jury. La démonstration du bocage reste un cas illustratif, sans vidéo produit de 90 secondes ni résultats inventés. Les vidéos de navigation archivées ne constituent pas des preuves de performance.\n\n` +
  `Les douze options de conception sont un inventaire fonctionnel documenté ; aucun gain écologique, gain de temps ou score de reconnaissance validé n’est annoncé. ` +
  `Les observations animales de la recette territoriale sont synthétiques. Les besoins de passage à l’échelle sont des propositions éditoriales à confirmer par l’équipe, sans partenaire acquis ni montant inventé.\n\n` +
  `## Déroulé chronométré\n\n`;
for (const cue of narrativeCues) {
  const chapter = pitchChapters.find((chapter) => chapter.id === cue.chapter);
  doc +=
    `### ${clock(cue.start)}–${clock(cue.end)} · ${cue.subject} (${cue.end - cue.start} s)\n\n` +
    `**Message principal :** ${cue.message}\n\n` +
    (chapter.status
      ? `**Statut :** ${statusLabels[chapter.status]}.\n\n`
      : "") +
    `**Texte oral :** ${speechText(cue).replaceAll("\n", "\n\n")}\n\n` +
    `**Écran :** ${cue.title.replaceAll("\n", " ")} — ${cue.screen.join(" ; ")}.\n\n` +
    `**Interaction / animation :** ${eventText(cue).replaceAll("\n", " ; ")}\n\n` +
    `**Caméra :** ${cameraText(cue).replaceAll("\n", " ; ")}\n\n` +
    `**Transition :** ${cue.transition}\n\n` +
    (cue.note ? `**Limite :** ${cue.note}\n\n` : "") +
    `**Sources locales :** ${chapter.sources.join(", ")} (registre ci-dessous et carnet de sources dans l’expérience).\n\n`;
}

doc +=
  `## Correspondance avec les attendus du jury\n\n| Attendu de la demande | Scènes | Couverture |\n|---|---|---|\n` +
  juryCoverage.map((row) => `| ${row.join(" | ")} |`).join("\n") +
  "\n\n" +
  `## Registre de sources\n\n` +
  `| Identifiant | Document |\n|---|---|\n` +
  `| annex | annexe_règlement_datathon_2026 (1).pdf, § 3 (thématique), § 4 (livrables), § 5 (six critères) ; transcription locale embarquée |\n` +
  `| description | Descriptif_projet_Datathon (1).docx : trame vierge à sept rubriques ; aucun résultat supplémentaire |\n` +
  `| jury-questions | image (4).png : problème, solution, impacts, équipe, besoins pour changer d’échelle |\n` +
  `| manifesto | Manifeste - Symbiose - Equipe ARQ.pdf, p. 1–3 (discours) et 3–13 (application) ; transcription locale embarquée et capture p. 7 |\n` +
  `| architecture | [README](../README.md), socle local et exploitation |\n` +
  `| parcels | [Parcelles et données utilisées](PARCEL_DOSSIERS.md) |\n` +
  `| territory | [Contexte territorial](TERRITORIAL_CONTEXT.md) |\n` +
  `| territory-validation | [Recette et archives IGN](TERRITORIAL_VALIDATION.md) |\n` +
  `| wetlands | [DREAL Normandie](DREAL_WETLANDS.md) |\n` +
  `| design | [Alternatives de conception](PROJECT_DESIGN.md) |\n` +
  `| design-validation | [Recette des alternatives](PROJECT_DESIGN_VALIDATION.md) |\n` +
  `| vision | [Pipeline vision](../workers/vision/INFERENCE.md) |\n` +
  `| review | [Validation humaine](../HUMAN_REVIEW.md) |\n` +
  `| documents | [Worker scientifique](../workers/documents/README.md) |\n` +
  `| rag | [Recherche et génération documentaires](RAG.md) |\n\n` +
  `## Deux modes de lecture\n\n` +
  `- Découverte publique : bureau, vidéo introductive sur action, travelling de 14 secondes, puis exploration libre des huit chapitres et trois sous-scènes. Carnet, sources et détails restent accessibles.\n` +
  `- Présentation jury : départ direct à 0:00 dans la forêt, événements automatiques, pause et reprise sur une même horloge de 300 secondes, conclusion immobile à 5:00. La vidéo du prologue reste hors de ce mode.\n` +
  `- Les paroles sont prononcées en direct par A et B ; aucune synthèse vocale, voix off ou reconnaissance audio n’est utilisée. Le compteur mesure le récit, pas la parole humaine.\n` +
  `- La stabilisation de caméra n’arrête pas le chronomètre. Les mouvements réduits conservent les déclenchements et la lisibilité. Ouvrir le carnet ou masquer l’onglet met le récit en pause.\n\n` +
  `## Lancer et régénérer\n\n` +
  "```powershell\ncd frontend\nnpm.cmd run dev\nnpm.cmd run build\nnpm.cmd test\nnode scripts/export-conducteur.mjs\nnode scripts/export-conducteur.mjs --check\n```\n\n" +
  `Avec le socle local : \`docker compose up -d --build --no-deps frontend\`, puis \`http://localhost:8080/\` pour la découverte et \`http://localhost:8080/jury/\` pour le jury. ` +
  `La vidéo officielle du prologue se trouve dans \`frontend/public/experience-media/intro.mp4\` et reste hors Git. Sa configuration utilise \`VITE_SYMBIOSE_INTRO_VIDEO_URL\`, \`VITE_SYMBIOSE_INTRO_CAPTIONS_URL\` et \`VITE_SYMBIOSE_INTRO_YOUTUBE_URL\` au build. ` +
  `Le MP4 permet la lecture locale ; YouTube reste un secours explicite nécessitant Internet. Les nouvelles analyses dans l’application nécessitent le backend et les données correspondantes.\n`;

const outputs = [
  [new URL("docs/CONDUCTEUR_SYMBIOSE.md", root), conductorDoc],
  [new URL("pitch-presentation.txt", root), presentationText],
  [
    new URL("content/source-documents.json", content),
    JSON.stringify(
      Object.fromEntries(
        [
          "README.md",
          "docs/PARCEL_DOSSIERS.md",
          "docs/TERRITORIAL_CONTEXT.md",
          "docs/TERRITORIAL_VALIDATION.md",
          "docs/DREAL_WETLANDS.md",
          "docs/PROJECT_DESIGN.md",
          "docs/PROJECT_DESIGN_VALIDATION.md",
          "workers/vision/INFERENCE.md",
          "HUMAN_REVIEW.md",
          "workers/documents/README.md",
          "docs/RAG.md",
        ].map((path) => [
          path,
          readFileSync(new URL(path, root), "utf8").replaceAll("\r\n", "\n"),
        ]),
      ),
      null,
      2,
    ) + "\n",
  ],
  [
    new URL("content/territorial-evidence.json", content),
    JSON.stringify(evidence, null, 2) + "\n",
  ],
  [new URL("docs/PITCH_DATATHON_2026.md", root), doc],
];
for (const [url, value] of outputs) {
  if (process.argv.includes("--check")) {
    if (readFileSync(url, "utf8") !== value)
      throw new Error(`À régénérer : ${fileURLToPath(url)}`);
  } else writeFileSync(url, value, "utf8");
}
console.log(
  `${words} mots ; 300 secondes de récit jury ; sources et exports ${process.argv.includes("--check") ? "à jour" : "générés"}.`,
);
