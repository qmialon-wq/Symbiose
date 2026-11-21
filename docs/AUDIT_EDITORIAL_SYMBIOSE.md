# Audit éditorial Symbiose — un récit, deux modes

## Périmètre et méthode

État avant correction : commit `2b512cb`. L’audit a visité les vraies entrées `/` et `/jury/`, avec les rendus 2D et WebGL matériel. Il relève **88 états de scène et 12 affichages du carnet avant, puis autant après**. Les treize séquences couvrent les huit chapitres, les trois sous-scènes, les deux retours et la conclusion. Les six boutons du traitement, les points Caen/Carentan, les détails du catalogue, les cinq nouvelles étapes manuelles et les trois onglets du carnet ont été parcourus.

Les textes ci-dessous proviennent du DOM rendu, avec ouverture des panneaux, et pas seulement des objets TypeScript. L’authentification est neutralisée pour ouvrir la landing publique ; aucune réponse d’IA ou analyse écologique n’est simulée. Les archives territoriales sont celles du dépôt. Les relevés complets sont conservés localement dans `output/symbiose/editorial/before.json` et `after.json` ; l’annexe ci-dessous embarque les textes pertinents pour la revue.

Les textes inscrits sur des textures WebGL ont également été inspectés dans `OfficeScene.ts` et `SoilScene.ts` ; les labels d’animaux proviennent de `world-fauna.ts` et `MarineScene.ts`. Ils ne sont pas accessibles par une extraction DOM. L’image 2D du bureau a été inspectée visuellement : elle ne comporte pas de signature incrustée à modifier. La vidéo officielle est conservée comme contenu fourni.

## Sources et conditions d’affichage

| Source | Contenu et condition |
| --- | --- |
| `pages/LandingPage.vue` | `/jury/` sélectionne initialement la présentation, sans prologue ; `/` sélectionne la découverte avec bureau, vidéo et travelling. Le mode peut être changé par les commandes existantes. Les deux transmettent les mêmes secondes et la même scène aux composants. |
| `experience/narrative-cues.ts` | Référence commune des treize titres, messages, textes courts, paroles, événements, horaires et pauses caméra. Les bornes 0:00–5:00 sont conservées. |
| `experience/editorial-content.ts` | Compléments exploratoires des treize scènes, réserves factuelles, statut du classificateur, six étapes de traitement, douze options, références, mentions des rendus et consignes communes du carnet. |
| `experience/pitch.ts`, `config.ts` | Huit chapitres historiques dérivés du conducteur, coordonnées de navigation, statuts de preuve, sources et grille du jury. Ils ne constituent pas un second scénario. |
| `experience/NarrativeOverlay.vue` | Titre et message de la séquence courante ; explications et interactions supplémentaires en découverte. L’épilogue conserve maintenant le même titre pendant toutes ses phases. |
| `experience/PitchVisual.vue` | Six boutons manuels en rivière ; quatre catégories de sources et archives dans la zone humide ; catalogue des douze alternatives dans le bocage. Le catalogue est immédiatement consultable en découverte et révélé à la phase des justifications en jury. |
| `experience/JuryDemonstration.vue` | Événements du conducteur : trois phases de reconnaissance, quatre catégories de sources, cinq étapes du cas d’éclairage. Le jury suit l’horloge ; la découverte sélectionne manuellement les cinq étapes du même cas. |
| `experience/excursions/copy.ts`, `ExcursionOverlay.vue` | Titres/messages issus du conducteur. Les notes et explications restent consultables en découverte ; le jury révèle une compétence ou un besoin à la fois. Les six premières secondes du survol restent sans panneau. |
| `experience/PitchSources.vue` | Trois onglets communs ; le chapitre courant détermine les sources ouvertes par défaut. Les treize titres, paroles et consignes de départ sont communs aux deux entrées. |
| `experience/sources.ts`, `content/*` | Provenance et transcriptions originales des documents, documentation technique embarquée et réponses territoriales archivées. Les originaux sont explicitement distingués de l’état actuel décrit par le conducteur. |
| `jury/JuryApp.vue`, manifeste et service worker | Une installation hors ligne conserve une édition précise du jury. Après une reconstruction, utiliser « Vérifier / actualiser l’installation » pour charger la nouvelle édition. Les relevés avant/après utilisent des contextes neufs afin de comparer le code servi, sans mélanger des éditions en cache. |
| `FallbackScene.vue`, `ExcursionFallback.vue`, `FaunaAnnotations.vue` | Même récit dans les deux rendus ; seules les mentions de génération, d’illustration et les annotations propres aux objets visibles diffèrent. Elles utilisent les réserves communes. |
| `prologue/PrologueOverlay.vue`, `PrologueFallback.vue`, `OfficeScene.ts` | Introduction réservée au parcours public. Le poster dessiné sur l’écran WebGL reprend désormais la signature commune. Les textes décoratifs du carnet et des plans restent des croquis illustratifs. |
| `JourneyAnnotations.vue`, `DebugControls.vue` | Outils réservés aux paramètres de diagnostic ; ils ne sont pas montés dans les deux parcours normaux. Leur lien d’inscription et leurs commentaires techniques ne sont pas une seconde conclusion publique. |

## Comparaison avant correction, scène par scène

La colonne jury donne le premier état textuel visible de la scène. Pour l’épilogue, elle inclut ses trois formulations successives. Les autres phases et les contenus des panneaux ouverts sont reproduits en annexe. Une différence justifiée correspond à un niveau de détail ou à un déclenchement différent ; elle n’est pas assimilée à une contradiction.

| Séquence | Jury avant (texte rendu) | Exploration avant (texte rendu) | Différence | Classification | Correction appliquée |
| --- | --- | --- | --- | --- | --- |
| forest-opening | CE QUE L’ON NE VOIT PAS 0:00—0:18 Une forêt ordinaire. Vraiment ? Une vie discrète s’organise autour de nous. Sources et limites ↗ | CE QUE L’ON NE VOIT PAS 0:00—0:18 Une forêt ordinaire. Vraiment ? Une vie discrète s’organise autour de nous. Qui habite ici ? Découvrir la solution ↘ Sources et texte oral ↗ | Même titre et même message. | Identique | Préserver les textes courts ; développer uniquement la découverte. |
| soil | 01 BIS / SOUS NOS PAS Ce qui vit ici nous échappe. Un projet d’aménagement peut perturber une vie que nous observons peu. Coupe pédagogique · organismes illustrés · aucune analyse de sol exécutée Poursuivre le voyage ↗ | 01 BIS / SOUS NOS PAS Ce qui vit ici nous échappe. Un projet d’aménagement peut perturber une vie que nous observons peu. Une route, une clôture, un éclairage Que risquerions-nous de perturber ? Coupe pédagogique · organismes illustrés · aucune analyse de sol exécutée Poursuivre le voyage ↗ | Même titre ; notes exploratoires et révélation pédagogique. | Différence justifiée | Conserver les notes et ajouter une description développée avec la même réserve pédagogique. |
| forest-return | DES DONNÉES À RELIER 0:42—0:50 Une forêt ordinaire. Vraiment ? Des données existent. Encore faut-il les relier pour mieux décider. Sources et limites ↗ | DES DONNÉES À RELIER 0:42—0:50 Une forêt ordinaire. Vraiment ? Des données existent. Encore faut-il les relier pour mieux décider. Qui habite ici ? Découvrir la solution ↘ Sources et texte oral ↗ | Le message actuel côtoyait les repères de l’ouverture du chapitre. | Divergence éditoriale | Utiliser les repères propres au retour : observations dispersées et décision. |
| sky | L’IDÉE SYMBIOSE 0:50—1:07 Rendre l’invisible visible. Relier l’intelligence artificielle aux données environnementales ouvertes pour éclairer les choix. Sources et limites ↗ | L’IDÉE SYMBIOSE 0:50—1:07 Rendre l’invisible visible. Relier l’intelligence artificielle aux données environnementales ouvertes pour éclairer les choix. Fonction documentée Observer la faune Comprendre le territoire Éclairer les projets Sources et texte oral ↗ | Même titre et même promesse ; détails publics supplémentaires. | Identique | Expliciter l’aide à la décision humaine dans la description commune de découverte. |
| rivers | DE LA VIDÉO À L’OBSERVATION VALIDÉE 1:07—1:27 L’IA détecte et propose. L’humain valide. Illustration du parcours · aucune analyse de cette image 1 / 3 Détecter MegaDetector repère une présence animale ; les cadres de la scène illustrent cette étape sans exécuter d’inférence. Sources et limites ↗ | DE LA VIDÉO À L’OBSERVATION VALIDÉE 1:07—1:27 L’IA détecte et propose. L’humain valide. Détection, proposition d’espèce et validation humaine restent trois étapes distinctes. Fonction documentée 01 Vidéo 02 Extraction 03 Reconnaissance 04 Validation 05 Enrichissement 06 Propositions Les vidéos sont importées dans le stockage local et associées au dossier. Une proposition d’espèce reste à vérifier par une personne. Sources et texte oral ↗ | Trois séquences automatiques contre six étapes manuelles. PyTorch était déjà le modèle actuel. | Différence justifiée | Conserver les six étapes ; regrouper les textes et rendre les réserves communes explicites. |
| underwater | COMPRENDRE LE MILIEU 1:27—1:43 Reconnaître un animal ne suffit pas. Une présence observée ne dit pas encore ce qu’un aménagement pourrait changer. Sources et limites ↗ | COMPRENDRE LE MILIEU 1:27—1:43 Reconnaître un animal ne suffit pas. Une présence observée ne dit pas encore ce qu’un aménagement pourrait changer. Sources et texte oral ↗ | Même titre et même limite de l’identification seule. | Identique | Développer le besoin d’expertise et de terrain en découverte. |
| wetland | CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. 1 / 4 Observations validées Une observation humaine validée constitue le point de départ ; les observations de la recette territoriale sont synthétiques. Résultats vérifiés · deux points normands Sources et limites ↗ | CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. Savoir ce que nous savons, d’où viennent les informations et ce qu’il reste à vérifier. Fonction documentée Observations validées Cadastre · RPG 2024 IGN · DREAL Normandie Publications scientifiques Résultats vérifiés · deux points normands Sources et texte oral ↗ | Les réserves sur les observations synthétiques étaient moins visibles en découverte. | Divergence éditoriale | Montrer la même réserve dans les deux modes ; conserver les deux points archivés. |
| meadow | UN PROJET D’ÉCLAIRAGE À EXAMINER 2:15—3:05 Observer, situer, décider : un seul parcours. 1 / 5 Un projet d’éclairage Scénario illustratif : une collectivité envisage d’éclairer un chemin près d’un bocage normand. Aucun projet réel ni dossier écologique calculé ici. Scénario illustratif en Normandie · sans relevé de terrain Aménageurs · Acteurs de l’environnement · Territoires Sources et limites ↗ | UN PROJET D’ÉCLAIRAGE À EXAMINER 2:15—3:05 Observer, situer, décider : un seul parcours. Un cas illustratif pour repérer les vigilances et discuter des adaptations avec les spécialistes. Bénéfice attendu · non mesuré 12 alternatives documentées Clôture · éclairage · végétation · terrassement · imperméabilisation Inventaire du prototype et limites ↗ Efficacité écologique locale : non mesurée Explorer les 12 alternatives et leurs conditions Aménageurs Acteurs de l’environnement Territoires Sources et texte oral ↗ | Le cas illustratif temporisé n’avait pas d’équivalent interactif en découverte. | Divergence éditoriale | Proposer les mêmes cinq phases en manuel, sans perdre les trois publics et les douze alternatives. |
| drone | Six premières secondes sans panneau. Puis : 06 BIS / L’ÉQUIPE ARQ Derrière Symbiose, l’équipe ARQ. Arden, Romain et Quentin réunissent intelligence artificielle, développement logiciel et données. Intelligence artificielle Réunir les compétences pour traiter les observations tout en gardant la validation humaine. Survol illustratif · le relevé par drone reste une piste d’évolution Poursuivre le voyage ↗ | 06 BIS / L’ÉQUIPE ARQ Derrière Symbiose, l’équipe ARQ. Arden, Romain et Quentin réunissent intelligence artificielle, développement logiciel et données. Intelligence artificielle Développement logiciel Exploitation des données Survol illustratif · le relevé par drone reste une piste d’évolution Poursuivre le voyage ↗ | Survol sans panneau puis une compétence à la fois en jury ; liste en découverte. | Différence justifiée | Conserver le rythme et les mêmes compétences ; développer la présentation sans attribuer de rôles individuels. |
| coast | DU DÉMONSTRATEUR AU TERRAIN 3:35—3:48 Rendre l’expertise accessible au bon moment. Un parcours démontré ; un impact réel sur le terrain encore à mesurer. Sources et limites ↗ | DU DÉMONSTRATEUR AU TERRAIN 3:35—3:48 Rendre l’expertise accessible au bon moment. Un parcours démontré ; un impact réel sur le terrain encore à mesurer. Perspective · non opérationnelle Besoins proposés par l’équipe · aucun partenariat annoncé à ce jour. Sources et texte oral ↗ | Même titre et même absence d’impact mesuré ; complément public sur les partenaires. | Différence justifiée | Conserver la perspective et développer ce qui reste à évaluer sur le terrain. |
| marine | 07 BIS / CHANGER D’ÉCHELLE Ce qu’il reste à construire ensemble. Partenaires de terrain Collectivités, associations naturalistes et professionnels de l’aménagement : des partenaires recherchés, aucun partenariat annoncé. Évocation artistique du littoral · besoins proposés, aucun partenariat annoncé Poursuivre le voyage ↗ | 07 BIS / CHANGER D’ÉCHELLE Ce qu’il reste à construire ensemble. Confronter Symbiose à de vrais usages avec des partenaires, des données fiables et des moyens d’expérimenter. Partenaires de terrain Données fiables et expertise scientifique Moyens d’expérimenter Évocation artistique du littoral · besoins proposés, aucun partenariat annoncé Poursuivre le voyage ↗ | Titre déjà correct dans les deux modes ; besoins successifs ou liste. | Différence justifiée | Préserver les trois besoins et la réserve sur les partenariats, dans la source commune. |
| coast-return | L’EXPERTISE AU BON MOMENT 4:18—4:30 Rendre l’expertise accessible au bon moment. Rendre l’expertise accessible lorsqu’une décision se prépare. Sources et limites ↗ | L’EXPERTISE AU BON MOMENT 4:18—4:30 Rendre l’expertise accessible au bon moment. Rendre l’expertise accessible lorsqu’une décision se prépare. Perspective · non opérationnelle Besoins proposés par l’équipe · aucun partenariat annoncé à ce jour. Sources et texte oral ↗ | Le complément public sur les partenaires débordait sur le retour à l’expertise. | Divergence éditoriale | Faire porter ce retour sur la décision humaine ; garder la réserve de partenariat dans les perspectives. |
| night-forest | Vous reconnaissez cette forêt ? C’est ici que notre voyage a commencé. / La même forêt, un autre regard Ce qui a changé, c’est ce que nous en savons. / Comprendre le vivant avant d’aménager. Commencer l’expérience Symbiose ↗ | LA MÊME FORÊT, UN AUTRE REGARD 4:30—5:00 Comprendre le vivant avant d’aménager. La forêt est la même. Ce qui a changé, c’est ce que nous en savons. Commencer l’expérience Symbiose ↗ Sources et texte oral ↗ | Le titre principal variait dans les premières phases du jury. | Divergence éditoriale | Conserver la signature comme titre ; placer les prompts temporisés dans le message secondaire. |

## Divergences corrigées : avant et après

| Point | Avant | Après |
| --- | --- | --- |
| Titre de l’épilogue | Jury : « Vous reconnaissez cette forêt ? », puis « La même forêt, un autre regard ». Découverte : « Comprendre le vivant avant d’aménager. » | Titre principal strictement identique dans les deux modes pendant toute la scène. Les questions du jury restent des messages secondaires temporisés. |
| Retour en forêt | Le message parlait de données dispersées mais la liste reprenait « Qui habite ici ? », provenant de l’ouverture du chapitre historique. | La liste consomme la séquence courante : « Observations dispersées » et « Comment mieux décider ? ». |
| Retour littoral | Le complément public répétait une réserve sur les partenaires alors que le message portait sur l’expertise au moment de décider. | L’explication développée traite de la décision humaine ; le complément sur les partenaires reste dans la scène des perspectives. |
| Cas d’éclairage | Cinq phases en jury ; découverte centrée sur les trois publics et le catalogue, sans démonstration équivalente. | Même scénario, mêmes cinq phases et mêmes réserves. La découverte les parcourt par boutons, tout en conservant les trois publics et les douze alternatives. |
| Zone humide | Le caractère synthétique des observations de recette était précisé dans une phase du jury et dans les documents, mais peu visible dans le panneau public. | Réserve commune visible dans les deux modes : consultations archivées, observations animales de test synthétiques, absence d’inventaire de terrain. |
| Carnet : démarrage | « La vidéo d’ouverture […] précède le récit » et « la lecture continue démarre à l’arrivée en forêt », également affichés depuis `/jury/`. | Explication des deux entrées : jury directement à 0:00, départ au clic ; introduction et travelling de 14 secondes uniquement en découverte publique. |
| Carnet : titres | Les rubriques utilisaient les sujets courts, distincts des titres des scènes. | Les treize titres principaux sont repris exactement ; horaires, paroles A/B et détails restent disponibles. |
| Signature sur le poster WebGL du bureau | « Observer. Comprendre. Préserver. » était encore dessiné dans `OfficeScene.ts`. | Le poster utilise la signature commune « Comprendre le vivant avant d’aménager. ». |
| Risque de nouvelles divergences | Pipeline, catalogue, réserves, catégories et mentions illustratives répartis dans des composants. | Données communes consommées par les deux modes ; les variantes longues restent explicites et les tests comparent les rendus réels. |

**Points vérifiés qui étaient déjà exacts :** « Ce qu’il reste à construire ensemble » était déjà affiché dans les deux modes. SpeciesNet était déjà décrit comme une piste future dans le panneau public ; aucune présentation opérationnelle de ce modèle n’a été constatée. Les options n’étaient pas annoncées comme automatiquement validées par des experts. Ces éléments ont été conservés et regroupés, sans inventer une erreur factuelle antérieure.

La consigne de démarrage du carnet est classée **contradiction factuelle** avec le comportement réel du jury : aucun prologue n’y précède 0:00 et le départ attend un clic. Les changements de titres, les repères de retour et le manque d’équivalent exploratoire du cas d’éclairage sont des **divergences éditoriales**. Les réserves ont été rendues aussi accessibles dans les deux modes, sans transformer une archive en nouvelle donnée de terrain.

La recette visuelle a également conduit à placer les panneaux publics sous les deux rangées de commandes, y compris en mobile : leurs explications plus longues restent consultables par défilement sans superposer les petits titres à la navigation.

## Différences volontairement conservées

| Différence | Justification |
| --- | --- |
| Bureau, vidéo et travelling uniquement en découverte publique | Entrée narrative libre ; le jury garde ses cinq minutes depuis la forêt et son départ manuel. |
| Trois phases de reconnaissance en jury, six étapes manuelles en découverte | Démonstration courte à l’oral ; explication détaillée de vidéo, extraction, reconnaissance, validation, enrichissement et propositions en découverte. Même chaîne technique. |
| Cas d’éclairage automatique ou manuel | Événements et réserves identiques ; sélection par horloge en jury, par boutons en découverte. Les boutons ne font pas avancer l’horloge. |
| Quatre catégories de sources successives ou simultanées | Lisibilité du pitch ; accès immédiat et archives détaillées dans le parcours libre. |
| Une compétence/un besoin à la fois en jury, liste et description en découverte | Même équipe, mêmes compétences et mêmes besoins. Aucune attribution individuelle ni partenariat acquis ajouté. |
| Six secondes de survol sans panneau ; apparition finale du logo et du lien | Respiration du pitch conservée. Les titres sont identiques dès leur apparition ; l’exploration offre immédiatement le contenu et l’accès final. |
| Explications développées et catalogue consultable en découverte | Préservation de la richesse du parcours public, sans imposer toutes les informations pendant la parole. |
| Photographies générées en 2D ; animaux et coupe pédagogique en WebGL | Rendus distincts clairement qualifiés. Les mots du panneau narratif et du carnet sont identiques entre 2D et WebGL pour chacun des modes. |
| Documents originaux et récit actualisé | Les transcriptions fournies restent intactes comme archives ; une réserve commune indique que le conducteur et les documents techniques décrivent l’état actuel. |

## Vérifications et reproduction

Les relevés avant/après ne contiennent aucune erreur JavaScript. Les textes de panneau, les contenus ouverts et les choix interactifs correspondent entre 2D et WebGL. Les trois onglets du carnet sont identiques entre les deux modes après correction. Les tests automatisés contrôlent les titres de toutes les scènes et phases, les retours, les réserves partagées, le cas manuel et les treize rubriques du carnet.

Depuis `frontend/`, contre la version à auditer déjà servie :

```powershell
node scripts/audit-editorial.mjs --base-url http://127.0.0.1:8080 --output ../output/symbiose/editorial/relecture.json
node node_modules/@playwright/test/cli.js test editorial-consistency.spec.ts jury-conductor.spec.ts pitch.spec.ts
npm.cmd test -- --maxWorkers=2 --testTimeout=15000
npm.cmd run build
node scripts/export-conducteur.mjs --check
node scripts/export-pitch.mjs --check
```

Les résultats finaux de compilation, de tests et de contrôle de production sont récapitulés dans le [guide du présentateur](PRESENTER_GUIDE.md). La vérification sur vidéoprojecteur et la répétition orale restent humaines. Les illustrations, archives ponctuelles et références générales ne prouvent ni l’efficacité d’un aménagement ni un impact environnemental mesuré.

## Fichiers de cette harmonisation

- `frontend/src/experience/editorial-content.ts` : source des contenus développés et des réserves communes.
- `frontend/src/experience/narrative-cues.ts` : statut actuel/futur du classificateur partagé avec le script oral, sans changement des horaires ou des formulations résultantes.
- `NarrativeOverlay.vue`, `PitchVisual.vue`, `JuryDemonstration.vue`, `PitchSources.vue` : titres, repères courants, démonstration manuelle et carnet cohérents.
- `excursions/copy.ts`, `excursions/ExcursionOverlay.vue` : réserves communes et compléments des trois sous-scènes.
- `FallbackScene.vue`, `FaunaAnnotations.vue`, `excursions/ExcursionFallback.vue`, `prologue/OfficeScene.ts` : mentions des rendus et signature du poster.
- `narrative-cues.css` : lisibilité des descriptions et commandes manuelles ; les styles restent dans le répertoire `frontend/src/experience/`.
- `frontend/scripts/audit-editorial.mjs` : relevé navigateur reproductible des deux modes et des deux rendus.
- `frontend/tests/unit/editorial-consistency.test.ts`, `frontend/tests/e2e/editorial-consistency.spec.ts` : couverture de cohérence éditoriale et de navigation manuelle.
- `frontend/tests/unit/jury-demonstration.test.ts`, `frontend/tests/e2e/pitch.spec.ts` : attentes adaptées aux titres désormais communs.
- `docs/AUDIT_EDITORIAL_SYMBIOSE.md`, `docs/PRESENTER_GUIDE.md` : audit, différences assumées, fichiers et recette.
- `output/symbiose/editorial/before.json`, `after.json` : relevés bruts avant/après des textes et panneaux réellement rendus.

Les horaires, les trajectoires et pauses caméra, les photographies, les modèles 3D et la vidéo officielle conservent leurs sources existantes.

## Annexe — textes réellement rendus avant et après

Les panneaux natifs ouverts et les choix manuels sont inclus lorsqu’ils ajoutent un texte différent. Les états textuels répétés sont dédupliqués. Les textes 2D suffisent ici : leur égalité avec les panneaux WebGL a été vérifiée dans les deux relevés. Les mentions propres au rendu et les textes de textures sont traités séparément ci-dessus.

<details>
<summary>forest-opening — textes et panneaux consultés</summary>

**Avant · jury**

> CE QUE L’ON NE VOIT PAS 0:00—0:18 Une forêt ordinaire. Vraiment ? Une vie discrète s’organise autour de nous. Sources et limites ↗

**Avant · exploration**

> CE QUE L’ON NE VOIT PAS 0:00—0:18 Une forêt ordinaire. Vraiment ? Une vie discrète s’organise autour de nous. Qui habite ici ? Découvrir la solution ↘ Sources et texte oral ↗

**Après · jury**

> CE QUE L’ON NE VOIT PAS 0:00—0:18 Une forêt ordinaire. Vraiment ? Une vie discrète s’organise autour de nous. Sources et limites ↗

**Après · exploration**

> CE QUE L’ON NE VOIT PAS 0:00—0:18 Une forêt ordinaire. Vraiment ? Une vie discrète s’organise autour de nous. La présence d’animaux peut rester discrète, même dans un paysage familier. Les animaux représentés ici sont illustratifs : cette scène ne constitue pas un inventaire du lieu. Qui habite ici ? Découvrir la solution ↘ Sources et texte oral ↗

</details>

<details>
<summary>soil — textes et panneaux consultés</summary>

**Avant · jury**

> 01 BIS / SOUS NOS PAS Ce qui vit ici nous échappe. Un projet d’aménagement peut perturber une vie que nous observons peu. Coupe pédagogique · organismes illustrés · aucune analyse de sol exécutée Poursuivre le voyage ↗

**Avant · exploration**

> 01 BIS / SOUS NOS PAS Ce qui vit ici nous échappe. Un projet d’aménagement peut perturber une vie que nous observons peu. Une route, une clôture, un éclairage Que risquerions-nous de perturber ? Coupe pédagogique · organismes illustrés · aucune analyse de sol exécutée Poursuivre le voyage ↗

**Après · jury**

> 01 BIS / SOUS NOS PAS Ce qui vit ici nous échappe. Un projet d’aménagement peut perturber une vie que nous observons peu. Coupe pédagogique · organismes illustrés · aucune analyse de sol exécutée Poursuivre le voyage ↗

**Après · exploration**

> 01 BIS / SOUS NOS PAS Ce qui vit ici nous échappe. Un projet d’aménagement peut perturber une vie que nous observons peu. Une route, une clôture, un éclairage Que risquerions-nous de perturber ? La coupe pédagogique évoque la vie sous la litière et les usages du milieu. Une route, une clôture ou un éclairage invitent à vérifier sur le terrain ce qu’un projet pourrait perturber. Coupe pédagogique · organismes illustrés · aucune analyse de sol exécutée Poursuivre le voyage ↗

</details>

<details>
<summary>forest-return — textes et panneaux consultés</summary>

**Avant · jury**

> DES DONNÉES À RELIER 0:42—0:50 Une forêt ordinaire. Vraiment ? Des données existent. Encore faut-il les relier pour mieux décider. Sources et limites ↗

**Avant · exploration**

> DES DONNÉES À RELIER 0:42—0:50 Une forêt ordinaire. Vraiment ? Des données existent. Encore faut-il les relier pour mieux décider. Qui habite ici ? Découvrir la solution ↘ Sources et texte oral ↗

**Après · jury**

> DES DONNÉES À RELIER 0:42—0:50 Une forêt ordinaire. Vraiment ? Des données existent. Encore faut-il les relier pour mieux décider. Sources et limites ↗

**Après · exploration**

> DES DONNÉES À RELIER 0:42—0:50 Une forêt ordinaire. Vraiment ? Des données existent. Encore faut-il les relier pour mieux décider. Vidéos, observations, données territoriales et publications sont des informations de natures différentes. Les relier avec leur provenance aide à préparer les questions à examiner avant une décision. Observations dispersées Comment mieux décider ? Découvrir la solution ↘ Sources et texte oral ↗

</details>

<details>
<summary>sky — textes et panneaux consultés</summary>

**Avant · jury**

> L’IDÉE SYMBIOSE 0:50—1:07 Rendre l’invisible visible. Relier l’intelligence artificielle aux données environnementales ouvertes pour éclairer les choix. Sources et limites ↗

**Avant · exploration**

> L’IDÉE SYMBIOSE 0:50—1:07 Rendre l’invisible visible. Relier l’intelligence artificielle aux données environnementales ouvertes pour éclairer les choix. Fonction documentée Observer la faune Comprendre le territoire Éclairer les projets Sources et texte oral ↗

**Après · jury**

> L’IDÉE SYMBIOSE 0:50—1:07 Rendre l’invisible visible. Relier l’intelligence artificielle aux données environnementales ouvertes pour éclairer les choix. Sources et limites ↗

**Après · exploration**

> L’IDÉE SYMBIOSE 0:50—1:07 Rendre l’invisible visible. Relier l’intelligence artificielle aux données environnementales ouvertes pour éclairer les choix. Fonction documentée Symbiose est un démonstrateur local d’aide à la décision. Il relie observations de biodiversité, intelligence artificielle et données environnementales ouvertes pour éclairer les choix humains, sans se substituer à l’expertise écologique. Observer la faune Comprendre le territoire Éclairer les projets Sources et texte oral ↗

</details>

<details>
<summary>rivers — textes et panneaux consultés</summary>

**Avant · jury**

> DE LA VIDÉO À L’OBSERVATION VALIDÉE 1:07—1:27 L’IA détecte et propose. L’humain valide. Illustration du parcours · aucune analyse de cette image 1 / 3 Détecter MegaDetector repère une présence animale ; les cadres de la scène illustrent cette étape sans exécuter d’inférence. Sources et limites ↗

> DE LA VIDÉO À L’OBSERVATION VALIDÉE 1:07—1:27 L’IA détecte et propose. L’humain valide. Illustration du parcours · aucune analyse de cette image Classification illustrative · espèce à confirmer 2 / 3 Proposer une espèce Le classificateur PyTorch propose une espèce, avec une incertitude à examiner ; détection, classification et suivi restent séparés. Classificateur PyTorch actuel · SpeciesNet reste une piste d’évolution Sources et limites ↗

> DE LA VIDÉO À L’OBSERVATION VALIDÉE 1:07—1:27 L’IA détecte et propose. L’humain valide. Illustration du parcours · aucune analyse de cette image Confirmer, corriger ou rejeter · jamais de validation automatique 3 / 3 L’humain valide La validation de l’espèce et du recadrage reste humaine. Les six étapes détaillées restent consultables dans le parcours libre. Sources et limites ↗

**Avant · exploration**

> DE LA VIDÉO À L’OBSERVATION VALIDÉE 1:07—1:27 L’IA détecte et propose. L’humain valide. Détection, proposition d’espèce et validation humaine restent trois étapes distinctes. Fonction documentée 01 Vidéo 02 Extraction 03 Reconnaissance 04 Validation 05 Enrichissement 06 Propositions Les vidéos sont importées dans le stockage local et associées au dossier. Une proposition d’espèce reste à vérifier par une personne. Sources et texte oral ↗

> DE LA VIDÉO À L’OBSERVATION VALIDÉE 1:07—1:27 L’IA détecte et propose. L’humain valide. Détection, proposition d’espèce et validation humaine restent trois étapes distinctes. Fonction documentée 01 Vidéo 02 Extraction 03 Reconnaissance 04 Validation 05 Enrichissement 06 Propositions Des images sont extraites pour permettre l’analyse visuelle. Une proposition d’espèce reste à vérifier par une personne. Sources et texte oral ↗

> DE LA VIDÉO À L’OBSERVATION VALIDÉE 1:07—1:27 L’IA détecte et propose. L’humain valide. Détection, proposition d’espèce et validation humaine restent trois étapes distinctes. Fonction documentée 01 Vidéo 02 Extraction 03 Reconnaissance 04 Validation 05 Enrichissement 06 Propositions MegaDetector localise les animaux, puis un second modèle propose l’espèce : classificateur PyTorch aujourd’hui, SpeciesNet en piste pour la suite. Le suivi relie les observations dans le temps. Une proposition d’espèce reste à vérifier par une personne. Sources et texte oral ↗

> DE LA VIDÉO À L’OBSERVATION VALIDÉE 1:07—1:27 L’IA détecte et propose. L’humain valide. Détection, proposition d’espèce et validation humaine restent trois étapes distinctes. Fonction documentée 01 Vidéo 02 Extraction 03 Reconnaissance 04 Validation 05 Enrichissement 06 Propositions Une personne confirme, corrige ou rejette l’espèce et le recadrage. Une prédiction seule ne confirme pas une présence. Une proposition d’espèce reste à vérifier par une personne. Sources et texte oral ↗

> DE LA VIDÉO À L’OBSERVATION VALIDÉE 1:07—1:27 L’IA détecte et propose. L’humain valide. Détection, proposition d’espèce et validation humaine restent trois étapes distinctes. Fonction documentée 01 Vidéo 02 Extraction 03 Reconnaissance 04 Validation 05 Enrichissement 06 Propositions Les observations confirmées sont rapprochées des données ouvertes et des publications, avec leur provenance. Une proposition d’espèce reste à vérifier par une personne. Sources et texte oral ↗

> DE LA VIDÉO À L’OBSERVATION VALIDÉE 1:07—1:27 L’IA détecte et propose. L’humain valide. Détection, proposition d’espèce et validation humaine restent trois étapes distinctes. Fonction documentée 01 Vidéo 02 Extraction 03 Reconnaissance 04 Validation 05 Enrichissement 06 Propositions Des alternatives conditionnelles sont reliées au projet, aux sources et aux vérifications encore nécessaires. Une proposition d’espèce reste à vérifier par une personne. Sources et texte oral ↗

**Après · jury**

> DE LA VIDÉO À L’OBSERVATION VALIDÉE 1:07—1:27 L’IA détecte et propose. L’humain valide. Illustration du parcours · aucune analyse de cette image 1 / 3 Détecter MegaDetector repère une présence animale ; les cadres de la scène illustrent cette étape sans exécuter d’inférence. Sources et limites ↗

> DE LA VIDÉO À L’OBSERVATION VALIDÉE 1:07—1:27 L’IA détecte et propose. L’humain valide. Illustration du parcours · aucune analyse de cette image Classification illustrative · espèce à confirmer 2 / 3 Proposer une espèce Le classificateur PyTorch propose une espèce, avec une incertitude à examiner ; détection, classification et suivi restent séparés. Classificateur PyTorch actuel · SpeciesNet reste une piste d’évolution Sources et limites ↗

> DE LA VIDÉO À L’OBSERVATION VALIDÉE 1:07—1:27 L’IA détecte et propose. L’humain valide. Illustration du parcours · aucune analyse de cette image Confirmer, corriger ou rejeter · jamais de validation automatique 3 / 3 L’humain valide La validation de l’espèce et du recadrage reste humaine. Les six étapes détaillées restent consultables dans le parcours libre. Sources et limites ↗

**Après · exploration**

> DE LA VIDÉO À L’OBSERVATION VALIDÉE 1:07—1:27 L’IA détecte et propose. L’humain valide. Détection, proposition d’espèce et validation humaine restent trois étapes distinctes. Fonction documentée Une vidéo peut être importée, analysée puis examinée par une personne. La détection localise les animaux, la classification propose une espèce et le suivi relie les observations dans le temps. Ces fonctions restent distinctes. 01 Vidéo 02 Extraction 03 Reconnaissance 04 Validation 05 Enrichissement 06 Propositions Les vidéos sont importées dans le stockage local et associées au dossier. Une proposition d’espèce reste à vérifier par une personne. Classificateur PyTorch actuel · SpeciesNet reste une piste d’évolution Chaîne de traitement documentée · aucune inférence exécutée dans cette scène Sources et texte oral ↗

> DE LA VIDÉO À L’OBSERVATION VALIDÉE 1:07—1:27 L’IA détecte et propose. L’humain valide. Détection, proposition d’espèce et validation humaine restent trois étapes distinctes. Fonction documentée Une vidéo peut être importée, analysée puis examinée par une personne. La détection localise les animaux, la classification propose une espèce et le suivi relie les observations dans le temps. Ces fonctions restent distinctes. 01 Vidéo 02 Extraction 03 Reconnaissance 04 Validation 05 Enrichissement 06 Propositions Des images sont extraites pour permettre l’analyse visuelle. Une proposition d’espèce reste à vérifier par une personne. Classificateur PyTorch actuel · SpeciesNet reste une piste d’évolution Chaîne de traitement documentée · aucune inférence exécutée dans cette scène Sources et texte oral ↗

> DE LA VIDÉO À L’OBSERVATION VALIDÉE 1:07—1:27 L’IA détecte et propose. L’humain valide. Détection, proposition d’espèce et validation humaine restent trois étapes distinctes. Fonction documentée Une vidéo peut être importée, analysée puis examinée par une personne. La détection localise les animaux, la classification propose une espèce et le suivi relie les observations dans le temps. Ces fonctions restent distinctes. 01 Vidéo 02 Extraction 03 Reconnaissance 04 Validation 05 Enrichissement 06 Propositions MegaDetector localise les animaux, puis un second modèle propose l’espèce : classificateur PyTorch aujourd’hui, SpeciesNet en piste pour la suite. Le suivi relie les observations dans le temps. Une proposition d’espèce reste à vérifier par une personne. Classificateur PyTorch actuel · SpeciesNet reste une piste d’évolution Chaîne de traitement documentée · aucune inférence exécutée dans cette scène Sources et texte oral ↗

> DE LA VIDÉO À L’OBSERVATION VALIDÉE 1:07—1:27 L’IA détecte et propose. L’humain valide. Détection, proposition d’espèce et validation humaine restent trois étapes distinctes. Fonction documentée Une vidéo peut être importée, analysée puis examinée par une personne. La détection localise les animaux, la classification propose une espèce et le suivi relie les observations dans le temps. Ces fonctions restent distinctes. 01 Vidéo 02 Extraction 03 Reconnaissance 04 Validation 05 Enrichissement 06 Propositions Une personne confirme, corrige ou rejette l’espèce et le recadrage. Une prédiction seule ne confirme pas une présence. Une proposition d’espèce reste à vérifier par une personne. Classificateur PyTorch actuel · SpeciesNet reste une piste d’évolution Chaîne de traitement documentée · aucune inférence exécutée dans cette scène Sources et texte oral ↗

> DE LA VIDÉO À L’OBSERVATION VALIDÉE 1:07—1:27 L’IA détecte et propose. L’humain valide. Détection, proposition d’espèce et validation humaine restent trois étapes distinctes. Fonction documentée Une vidéo peut être importée, analysée puis examinée par une personne. La détection localise les animaux, la classification propose une espèce et le suivi relie les observations dans le temps. Ces fonctions restent distinctes. 01 Vidéo 02 Extraction 03 Reconnaissance 04 Validation 05 Enrichissement 06 Propositions Les observations confirmées sont rapprochées des données ouvertes et des publications, avec leur provenance. Une proposition d’espèce reste à vérifier par une personne. Classificateur PyTorch actuel · SpeciesNet reste une piste d’évolution Chaîne de traitement documentée · aucune inférence exécutée dans cette scène Sources et texte oral ↗

> DE LA VIDÉO À L’OBSERVATION VALIDÉE 1:07—1:27 L’IA détecte et propose. L’humain valide. Détection, proposition d’espèce et validation humaine restent trois étapes distinctes. Fonction documentée Une vidéo peut être importée, analysée puis examinée par une personne. La détection localise les animaux, la classification propose une espèce et le suivi relie les observations dans le temps. Ces fonctions restent distinctes. 01 Vidéo 02 Extraction 03 Reconnaissance 04 Validation 05 Enrichissement 06 Propositions Des alternatives conditionnelles sont reliées au projet, aux sources et aux vérifications encore nécessaires. Une proposition d’espèce reste à vérifier par une personne. Classificateur PyTorch actuel · SpeciesNet reste une piste d’évolution Chaîne de traitement documentée · aucune inférence exécutée dans cette scène Sources et texte oral ↗

</details>

<details>
<summary>underwater — textes et panneaux consultés</summary>

**Avant · jury**

> COMPRENDRE LE MILIEU 1:27—1:43 Reconnaître un animal ne suffit pas. Une présence observée ne dit pas encore ce qu’un aménagement pourrait changer. Sources et limites ↗

**Avant · exploration**

> COMPRENDRE LE MILIEU 1:27—1:43 Reconnaître un animal ne suffit pas. Une présence observée ne dit pas encore ce qu’un aménagement pourrait changer. Sources et texte oral ↗

**Après · jury**

> COMPRENDRE LE MILIEU 1:27—1:43 Reconnaître un animal ne suffit pas. Une présence observée ne dit pas encore ce qu’un aménagement pourrait changer. Sources et limites ↗

**Après · exploration**

> COMPRENDRE LE MILIEU 1:27—1:43 Reconnaître un animal ne suffit pas. Une présence observée ne dit pas encore ce qu’un aménagement pourrait changer. Identifier une espèce ne décrit ni ses déplacements, ni ses usages du milieu, ni l’effet d’un aménagement. Il faut examiner le contexte et compléter les informations par l’expertise et les vérifications de terrain. Sources et texte oral ↗

</details>

<details>
<summary>wetland — textes et panneaux consultés</summary>

**Avant · jury**

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. 1 / 4 Observations validées Une observation humaine validée constitue le point de départ ; les observations de la recette territoriale sont synthétiques. Résultats vérifiés · deux points normands Sources et limites ↗

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. 1 / 4 Observations validées Une observation humaine validée constitue le point de départ ; les observations de la recette territoriale sont synthétiques. Résultats vérifiés · deux points normands ARCHIVES IGN · 10 NOVEMBRE 2026 · AUCUN APPEL EN DIRECT Caen Carentan 49.316, -1.235 · WGS84 ZNIEFF I Aucun objet renvoyé ZNIEFF II 250008148 Natura · Habitats FR2500088 Natura · Oiseaux FR2510046 Ces réponses concernent seulement le point interrogé. Une réponse vide ne prouve pas l’absence d’enjeu écologique. Consulter les preuves et leurs limites ↗ Sources et limites ↗

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. 1 / 4 Observations validées Une observation humaine validée constitue le point de départ ; les observations de la recette territoriale sont synthétiques. Résultats vérifiés · deux points normands ARCHIVES IGN · 10 NOVEMBRE 2026 · AUCUN APPEL EN DIRECT Caen Carentan 49.1829, -0.3707 · WGS84 ZNIEFF I Aucun objet renvoyé ZNIEFF II Aucun objet renvoyé Natura · Habitats Aucun objet renvoyé Natura · Oiseaux Aucun objet renvoyé Ces réponses concernent seulement le point interrogé. Une réponse vide ne prouve pas l’absence d’enjeu écologique. Consulter les preuves et leurs limites ↗ Sources et limites ↗

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. 2 / 4 Cadastre · RPG 2024 Situer les parcelles et les usages documentés, avec les millésimes et les limites des données disponibles. Résultats vérifiés · deux points normands ARCHIVES IGN · 10 NOVEMBRE 2026 · AUCUN APPEL EN DIRECT Caen Carentan 49.316, -1.235 · WGS84 ZNIEFF I Aucun objet renvoyé ZNIEFF II 250008148 Natura · Habitats FR2500088 Natura · Oiseaux FR2510046 Ces réponses concernent seulement le point interrogé. Une réponse vide ne prouve pas l’absence d’enjeu écologique. Consulter les preuves et leurs limites ↗ Sources et limites ↗

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. 2 / 4 Cadastre · RPG 2024 Situer les parcelles et les usages documentés, avec les millésimes et les limites des données disponibles. Résultats vérifiés · deux points normands ARCHIVES IGN · 10 NOVEMBRE 2026 · AUCUN APPEL EN DIRECT Caen Carentan 49.1829, -0.3707 · WGS84 ZNIEFF I Aucun objet renvoyé ZNIEFF II Aucun objet renvoyé Natura · Habitats Aucun objet renvoyé Natura · Oiseaux Aucun objet renvoyé Ces réponses concernent seulement le point interrogé. Une réponse vide ne prouve pas l’absence d’enjeu écologique. Consulter les preuves et leurs limites ↗ Sources et limites ↗

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. 3 / 4 IGN · DREAL Normandie Consulter les zonages et les zones humides lorsque l’information existe ; les résultats normands affichés proviennent des archives du projet. Résultats vérifiés · deux points normands ARCHIVES IGN · 10 NOVEMBRE 2026 · AUCUN APPEL EN DIRECT Caen Carentan 49.316, -1.235 · WGS84 ZNIEFF I Aucun objet renvoyé ZNIEFF II 250008148 Natura · Habitats FR2500088 Natura · Oiseaux FR2510046 Ces réponses concernent seulement le point interrogé. Une réponse vide ne prouve pas l’absence d’enjeu écologique. Consulter les preuves et leurs limites ↗ Sources et limites ↗

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. 3 / 4 IGN · DREAL Normandie Consulter les zonages et les zones humides lorsque l’information existe ; les résultats normands affichés proviennent des archives du projet. Résultats vérifiés · deux points normands ARCHIVES IGN · 10 NOVEMBRE 2026 · AUCUN APPEL EN DIRECT Caen Carentan 49.1829, -0.3707 · WGS84 ZNIEFF I Aucun objet renvoyé ZNIEFF II Aucun objet renvoyé Natura · Habitats Aucun objet renvoyé Natura · Oiseaux Aucun objet renvoyé Ces réponses concernent seulement le point interrogé. Une réponse vide ne prouve pas l’absence d’enjeu écologique. Consulter les preuves et leurs limites ↗ Sources et limites ↗

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. 4 / 4 Publications scientifiques Rendre les sources consultables et distinguer les informations disponibles des vérifications encore nécessaires sur le terrain. Résultats vérifiés · deux points normands ARCHIVES IGN · 10 NOVEMBRE 2026 · AUCUN APPEL EN DIRECT Caen Carentan 49.316, -1.235 · WGS84 ZNIEFF I Aucun objet renvoyé ZNIEFF II 250008148 Natura · Habitats FR2500088 Natura · Oiseaux FR2510046 Ces réponses concernent seulement le point interrogé. Une réponse vide ne prouve pas l’absence d’enjeu écologique. Consulter les preuves et leurs limites ↗ Sources et limites ↗

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. 4 / 4 Publications scientifiques Rendre les sources consultables et distinguer les informations disponibles des vérifications encore nécessaires sur le terrain. Résultats vérifiés · deux points normands ARCHIVES IGN · 10 NOVEMBRE 2026 · AUCUN APPEL EN DIRECT Caen Carentan 49.1829, -0.3707 · WGS84 ZNIEFF I Aucun objet renvoyé ZNIEFF II Aucun objet renvoyé Natura · Habitats Aucun objet renvoyé Natura · Oiseaux Aucun objet renvoyé Ces réponses concernent seulement le point interrogé. Une réponse vide ne prouve pas l’absence d’enjeu écologique. Consulter les preuves et leurs limites ↗ Sources et limites ↗

**Avant · exploration**

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. Savoir ce que nous savons, d’où viennent les informations et ce qu’il reste à vérifier. Fonction documentée Observations validées Cadastre · RPG 2024 IGN · DREAL Normandie Publications scientifiques Résultats vérifiés · deux points normands Sources et texte oral ↗

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. Savoir ce que nous savons, d’où viennent les informations et ce qu’il reste à vérifier. Fonction documentée Observations validées Cadastre · RPG 2024 IGN · DREAL Normandie Publications scientifiques Résultats vérifiés · deux points normands ARCHIVES IGN · 10 NOVEMBRE 2026 · AUCUN APPEL EN DIRECT Caen Carentan 49.316, -1.235 · WGS84 ZNIEFF I Aucun objet renvoyé ZNIEFF II 250008148 Natura · Habitats FR2500088 Natura · Oiseaux FR2510046 Ces réponses concernent seulement le point interrogé. Une réponse vide ne prouve pas l’absence d’enjeu écologique. Consulter les preuves et leurs limites ↗ Sources et texte oral ↗

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. Savoir ce que nous savons, d’où viennent les informations et ce qu’il reste à vérifier. Fonction documentée Observations validées Cadastre · RPG 2024 IGN · DREAL Normandie Publications scientifiques Résultats vérifiés · deux points normands ARCHIVES IGN · 10 NOVEMBRE 2026 · AUCUN APPEL EN DIRECT Caen Carentan 49.1829, -0.3707 · WGS84 ZNIEFF I Aucun objet renvoyé ZNIEFF II Aucun objet renvoyé Natura · Habitats Aucun objet renvoyé Natura · Oiseaux Aucun objet renvoyé Ces réponses concernent seulement le point interrogé. Une réponse vide ne prouve pas l’absence d’enjeu écologique. Consulter les preuves et leurs limites ↗ Sources et texte oral ↗

**Après · jury**

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. 1 / 4 Observations validées Une observation humaine validée constitue le point de départ ; les observations de la recette territoriale sont synthétiques. Les consultations des deux points normands sont archivées. Les observations animales de la recette sont synthétiques ; elles ne constituent pas un inventaire de terrain. Résultats vérifiés · deux points normands Sources et limites ↗

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. 1 / 4 Observations validées Une observation humaine validée constitue le point de départ ; les observations de la recette territoriale sont synthétiques. Les consultations des deux points normands sont archivées. Les observations animales de la recette sont synthétiques ; elles ne constituent pas un inventaire de terrain. Résultats vérifiés · deux points normands ARCHIVES IGN · 10 NOVEMBRE 2026 · AUCUN APPEL EN DIRECT Caen Carentan 49.316, -1.235 · WGS84 ZNIEFF I Aucun objet renvoyé ZNIEFF II 250008148 Natura · Habitats FR2500088 Natura · Oiseaux FR2510046 Ces réponses concernent seulement le point interrogé. Une réponse vide ne prouve pas l’absence d’enjeu écologique. Consulter les preuves et leurs limites ↗ Sources et limites ↗

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. 1 / 4 Observations validées Une observation humaine validée constitue le point de départ ; les observations de la recette territoriale sont synthétiques. Les consultations des deux points normands sont archivées. Les observations animales de la recette sont synthétiques ; elles ne constituent pas un inventaire de terrain. Résultats vérifiés · deux points normands ARCHIVES IGN · 10 NOVEMBRE 2026 · AUCUN APPEL EN DIRECT Caen Carentan 49.1829, -0.3707 · WGS84 ZNIEFF I Aucun objet renvoyé ZNIEFF II Aucun objet renvoyé Natura · Habitats Aucun objet renvoyé Natura · Oiseaux Aucun objet renvoyé Ces réponses concernent seulement le point interrogé. Une réponse vide ne prouve pas l’absence d’enjeu écologique. Consulter les preuves et leurs limites ↗ Sources et limites ↗

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. 2 / 4 Cadastre · RPG 2024 Situer les parcelles et les usages documentés, avec les millésimes et les limites des données disponibles. Les consultations des deux points normands sont archivées. Les observations animales de la recette sont synthétiques ; elles ne constituent pas un inventaire de terrain. Résultats vérifiés · deux points normands ARCHIVES IGN · 10 NOVEMBRE 2026 · AUCUN APPEL EN DIRECT Caen Carentan 49.316, -1.235 · WGS84 ZNIEFF I Aucun objet renvoyé ZNIEFF II 250008148 Natura · Habitats FR2500088 Natura · Oiseaux FR2510046 Ces réponses concernent seulement le point interrogé. Une réponse vide ne prouve pas l’absence d’enjeu écologique. Consulter les preuves et leurs limites ↗ Sources et limites ↗

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. 2 / 4 Cadastre · RPG 2024 Situer les parcelles et les usages documentés, avec les millésimes et les limites des données disponibles. Les consultations des deux points normands sont archivées. Les observations animales de la recette sont synthétiques ; elles ne constituent pas un inventaire de terrain. Résultats vérifiés · deux points normands ARCHIVES IGN · 10 NOVEMBRE 2026 · AUCUN APPEL EN DIRECT Caen Carentan 49.1829, -0.3707 · WGS84 ZNIEFF I Aucun objet renvoyé ZNIEFF II Aucun objet renvoyé Natura · Habitats Aucun objet renvoyé Natura · Oiseaux Aucun objet renvoyé Ces réponses concernent seulement le point interrogé. Une réponse vide ne prouve pas l’absence d’enjeu écologique. Consulter les preuves et leurs limites ↗ Sources et limites ↗

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. 3 / 4 IGN · DREAL Normandie Consulter les zonages et les zones humides lorsque l’information existe ; les résultats normands affichés proviennent des archives du projet. Les consultations des deux points normands sont archivées. Les observations animales de la recette sont synthétiques ; elles ne constituent pas un inventaire de terrain. Résultats vérifiés · deux points normands ARCHIVES IGN · 10 NOVEMBRE 2026 · AUCUN APPEL EN DIRECT Caen Carentan 49.316, -1.235 · WGS84 ZNIEFF I Aucun objet renvoyé ZNIEFF II 250008148 Natura · Habitats FR2500088 Natura · Oiseaux FR2510046 Ces réponses concernent seulement le point interrogé. Une réponse vide ne prouve pas l’absence d’enjeu écologique. Consulter les preuves et leurs limites ↗ Sources et limites ↗

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. 3 / 4 IGN · DREAL Normandie Consulter les zonages et les zones humides lorsque l’information existe ; les résultats normands affichés proviennent des archives du projet. Les consultations des deux points normands sont archivées. Les observations animales de la recette sont synthétiques ; elles ne constituent pas un inventaire de terrain. Résultats vérifiés · deux points normands ARCHIVES IGN · 10 NOVEMBRE 2026 · AUCUN APPEL EN DIRECT Caen Carentan 49.1829, -0.3707 · WGS84 ZNIEFF I Aucun objet renvoyé ZNIEFF II Aucun objet renvoyé Natura · Habitats Aucun objet renvoyé Natura · Oiseaux Aucun objet renvoyé Ces réponses concernent seulement le point interrogé. Une réponse vide ne prouve pas l’absence d’enjeu écologique. Consulter les preuves et leurs limites ↗ Sources et limites ↗

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. 4 / 4 Publications scientifiques Rendre les sources consultables et distinguer les informations disponibles des vérifications encore nécessaires sur le terrain. Les consultations des deux points normands sont archivées. Les observations animales de la recette sont synthétiques ; elles ne constituent pas un inventaire de terrain. Résultats vérifiés · deux points normands ARCHIVES IGN · 10 NOVEMBRE 2026 · AUCUN APPEL EN DIRECT Caen Carentan 49.316, -1.235 · WGS84 ZNIEFF I Aucun objet renvoyé ZNIEFF II 250008148 Natura · Habitats FR2500088 Natura · Oiseaux FR2510046 Ces réponses concernent seulement le point interrogé. Une réponse vide ne prouve pas l’absence d’enjeu écologique. Consulter les preuves et leurs limites ↗ Sources et limites ↗

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. 4 / 4 Publications scientifiques Rendre les sources consultables et distinguer les informations disponibles des vérifications encore nécessaires sur le terrain. Les consultations des deux points normands sont archivées. Les observations animales de la recette sont synthétiques ; elles ne constituent pas un inventaire de terrain. Résultats vérifiés · deux points normands ARCHIVES IGN · 10 NOVEMBRE 2026 · AUCUN APPEL EN DIRECT Caen Carentan 49.1829, -0.3707 · WGS84 ZNIEFF I Aucun objet renvoyé ZNIEFF II Aucun objet renvoyé Natura · Habitats Aucun objet renvoyé Natura · Oiseaux Aucun objet renvoyé Ces réponses concernent seulement le point interrogé. Une réponse vide ne prouve pas l’absence d’enjeu écologique. Consulter les preuves et leurs limites ↗ Sources et limites ↗

**Après · exploration**

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. Savoir ce que nous savons, d’où viennent les informations et ce qu’il reste à vérifier. Fonction documentée Les observations confirmées peuvent être rapprochées des parcelles, des usages agricoles déclarés, des zonages disponibles et de publications consultables. La couverture et les millésimes varient ; ce rapprochement ne remplace pas une étude écologique. Observations validées Cadastre · RPG 2024 IGN · DREAL Normandie Publications scientifiques Les consultations des deux points normands sont archivées. Les observations animales de la recette sont synthétiques ; elles ne constituent pas un inventaire de terrain. Résultats vérifiés · deux points normands Sources et texte oral ↗

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. Savoir ce que nous savons, d’où viennent les informations et ce qu’il reste à vérifier. Fonction documentée Les observations confirmées peuvent être rapprochées des parcelles, des usages agricoles déclarés, des zonages disponibles et de publications consultables. La couverture et les millésimes varient ; ce rapprochement ne remplace pas une étude écologique. Observations validées Cadastre · RPG 2024 IGN · DREAL Normandie Publications scientifiques Les consultations des deux points normands sont archivées. Les observations animales de la recette sont synthétiques ; elles ne constituent pas un inventaire de terrain. Résultats vérifiés · deux points normands ARCHIVES IGN · 10 NOVEMBRE 2026 · AUCUN APPEL EN DIRECT Caen Carentan 49.316, -1.235 · WGS84 ZNIEFF I Aucun objet renvoyé ZNIEFF II 250008148 Natura · Habitats FR2500088 Natura · Oiseaux FR2510046 Ces réponses concernent seulement le point interrogé. Une réponse vide ne prouve pas l’absence d’enjeu écologique. Consulter les preuves et leurs limites ↗ Sources et texte oral ↗

> CROISER LES DONNÉES 1:43—2:15 Le vivant, replacé dans son territoire. Savoir ce que nous savons, d’où viennent les informations et ce qu’il reste à vérifier. Fonction documentée Les observations confirmées peuvent être rapprochées des parcelles, des usages agricoles déclarés, des zonages disponibles et de publications consultables. La couverture et les millésimes varient ; ce rapprochement ne remplace pas une étude écologique. Observations validées Cadastre · RPG 2024 IGN · DREAL Normandie Publications scientifiques Les consultations des deux points normands sont archivées. Les observations animales de la recette sont synthétiques ; elles ne constituent pas un inventaire de terrain. Résultats vérifiés · deux points normands ARCHIVES IGN · 10 NOVEMBRE 2026 · AUCUN APPEL EN DIRECT Caen Carentan 49.1829, -0.3707 · WGS84 ZNIEFF I Aucun objet renvoyé ZNIEFF II Aucun objet renvoyé Natura · Habitats Aucun objet renvoyé Natura · Oiseaux Aucun objet renvoyé Ces réponses concernent seulement le point interrogé. Une réponse vide ne prouve pas l’absence d’enjeu écologique. Consulter les preuves et leurs limites ↗ Sources et texte oral ↗

</details>

<details>
<summary>meadow — textes et panneaux consultés</summary>

**Avant · jury**

> UN PROJET D’ÉCLAIRAGE À EXAMINER 2:15—3:05 Observer, situer, décider : un seul parcours. 1 / 5 Un projet d’éclairage Scénario illustratif : une collectivité envisage d’éclairer un chemin près d’un bocage normand. Aucun projet réel ni dossier écologique calculé ici. Scénario illustratif en Normandie · sans relevé de terrain Aménageurs · Acteurs de l’environnement · Territoires Sources et limites ↗

> UN PROJET D’ÉCLAIRAGE À EXAMINER 2:15—3:05 Observer, situer, décider : un seul parcours. 2 / 5 Observer et situer Relier les observations disponibles aux caractéristiques du milieu. Les données de démonstration ne constituent pas un inventaire réel du site. Scénario illustratif en Normandie · sans relevé de terrain Sources et limites ↗

> UN PROJET D’ÉCLAIRAGE À EXAMINER 2:15—3:05 Observer, situer, décider : un seul parcours. 3 / 5 Examiner les vigilances Identifier les informations manquantes et les usages du milieu à vérifier avec un spécialiste ; aucun effet écologique n’est mesuré dans cette animation. Scénario illustratif en Normandie · sans relevé de terrain Sources et limites ↗

> UN PROJET D’ÉCLAIRAGE À EXAMINER 2:15—3:05 Observer, situer, décider : un seul parcours. 4 / 5 Discuter des adaptations Éviter ou déplacer certains points lumineux Réduire la durée de fonctionnement Cibler l’orientation sur les usages nécessaires Scénario illustratif en Normandie · sans relevé de terrain Sources et limites ↗

> UN PROJET D’ÉCLAIRAGE À EXAMINER 2:15—3:05 Observer, situer, décider : un seul parcours. 5 / 5 Consulter les justifications Le registre des douze alternatives documentées reste consultable avec ses sources et conditions. Cette illustration ne calcule ni autorisation ni recommandation personnalisée. Scénario illustratif en Normandie · sans relevé de terrain Consulter les justifications et leurs limites Inventaire du prototype et limites ↗ Efficacité écologique locale : non mesurée Explorer les 12 alternatives et leurs conditions Sources et limites ↗

> UN PROJET D’ÉCLAIRAGE À EXAMINER 2:15—3:05 Observer, situer, décider : un seul parcours. 5 / 5 Consulter les justifications Le registre des douze alternatives documentées reste consultable avec ses sources et conditions. Cette illustration ne calcule ni autorisation ni recommandation personnalisée. Scénario illustratif en Normandie · sans relevé de terrain Consulter les justifications et leurs limites Inventaire du prototype et limites ↗ Efficacité écologique locale : non mesurée Explorer les 12 alternatives et leurs conditions Options de conception conditionnelles, à examiner avec des spécialistes. Aucune efficacité sur ce site n’est établie. Clôture Modifier le tracé Limiter le périmètre clôturé Examiner une conception adaptée à la faune Repérer les éléments présents, confirmer les déplacements et vérifier les usages et la sécurité. Éclairage extérieur Éviter certains points lumineux Réduire la durée de fonctionnement Adapter l’orientation de l’éclairage Justifier les points et horaires nécessaires ; faire examiner visibilité, sécurité et éléments voisins réellement présents. Végétation Implanter le projet en préservant la végétation présente Réduire l’emprise de suppression de végétation Inventorier les arbres ou haies effectivement présents et vérifier les contraintes avant intervention. Terrassement Comparer une implantation différente Réduire l’emprise des terrassements Disposer d’un plan et d’une topographie ; vérifier les enjeux localisés et la faisabilité du chantier. Imperméabilisation Éviter des surfaces imperméabilisées non indispensables Examiner des revêtements perméables compatibles avec les usages Étudier le sol, l’infiltration, les usages, les charges et l’entretien avant tout choix technique. Références générales de conception, sans qualification scientifique locale : Ministère · Trame verte, bleue et noire OFB · Clôtures et faune Cerema · Désimperméabilisation Lire les preuves archivées et la documentation du prototype Sources et limites ↗

**Avant · exploration**

> UN PROJET D’ÉCLAIRAGE À EXAMINER 2:15—3:05 Observer, situer, décider : un seul parcours. Un cas illustratif pour repérer les vigilances et discuter des adaptations avec les spécialistes. Bénéfice attendu · non mesuré 12 alternatives documentées Clôture · éclairage · végétation · terrassement · imperméabilisation Inventaire du prototype et limites ↗ Efficacité écologique locale : non mesurée Explorer les 12 alternatives et leurs conditions Aménageurs Acteurs de l’environnement Territoires Sources et texte oral ↗

> UN PROJET D’ÉCLAIRAGE À EXAMINER 2:15—3:05 Observer, situer, décider : un seul parcours. Un cas illustratif pour repérer les vigilances et discuter des adaptations avec les spécialistes. Bénéfice attendu · non mesuré 12 alternatives documentées Clôture · éclairage · végétation · terrassement · imperméabilisation Inventaire du prototype et limites ↗ Efficacité écologique locale : non mesurée Explorer les 12 alternatives et leurs conditions Options de conception conditionnelles, à examiner avec des spécialistes. Aucune efficacité sur ce site n’est établie. Clôture Modifier le tracé Limiter le périmètre clôturé Examiner une conception adaptée à la faune Repérer les éléments présents, confirmer les déplacements et vérifier les usages et la sécurité. Éclairage extérieur Éviter certains points lumineux Réduire la durée de fonctionnement Adapter l’orientation de l’éclairage Justifier les points et horaires nécessaires ; faire examiner visibilité, sécurité et éléments voisins réellement présents. Végétation Implanter le projet en préservant la végétation présente Réduire l’emprise de suppression de végétation Inventorier les arbres ou haies effectivement présents et vérifier les contraintes avant intervention. Terrassement Comparer une implantation différente Réduire l’emprise des terrassements Disposer d’un plan et d’une topographie ; vérifier les enjeux localisés et la faisabilité du chantier. Imperméabilisation Éviter des surfaces imperméabilisées non indispensables Examiner des revêtements perméables compatibles avec les usages Étudier le sol, l’infiltration, les usages, les charges et l’entretien avant tout choix technique. Références générales de conception, sans qualification scientifique locale : Ministère · Trame verte, bleue et noire OFB · Clôtures et faune Cerema · Désimperméabilisation Lire les preuves archivées et la documentation du prototype Aménageurs Acteurs de l’environnement Territoires Sources et texte oral ↗

**Après · jury**

> UN PROJET D’ÉCLAIRAGE À EXAMINER 2:15—3:05 Observer, situer, décider : un seul parcours. 1 / 5 Un projet d’éclairage Scénario illustratif : une collectivité envisage d’éclairer un chemin près d’un bocage normand. Aucun projet réel ni dossier écologique calculé ici. Scénario illustratif en Normandie · sans relevé de terrain Aménageurs · Acteurs de l’environnement · Territoires Sources et limites ↗

> UN PROJET D’ÉCLAIRAGE À EXAMINER 2:15—3:05 Observer, situer, décider : un seul parcours. 2 / 5 Observer et situer Relier les observations disponibles aux caractéristiques du milieu. Les données de démonstration ne constituent pas un inventaire réel du site. Scénario illustratif en Normandie · sans relevé de terrain Sources et limites ↗

> UN PROJET D’ÉCLAIRAGE À EXAMINER 2:15—3:05 Observer, situer, décider : un seul parcours. 3 / 5 Examiner les vigilances Identifier les informations manquantes et les usages du milieu à vérifier avec un spécialiste ; aucun effet écologique n’est mesuré dans cette animation. Scénario illustratif en Normandie · sans relevé de terrain Sources et limites ↗

> UN PROJET D’ÉCLAIRAGE À EXAMINER 2:15—3:05 Observer, situer, décider : un seul parcours. 4 / 5 Discuter des adaptations Éviter ou déplacer certains points lumineux Réduire la durée de fonctionnement Cibler l’orientation sur les usages nécessaires Scénario illustratif en Normandie · sans relevé de terrain Sources et limites ↗

> UN PROJET D’ÉCLAIRAGE À EXAMINER 2:15—3:05 Observer, situer, décider : un seul parcours. 5 / 5 Consulter les justifications Le registre des douze alternatives documentées reste consultable avec ses sources et conditions. Cette illustration ne calcule ni autorisation ni recommandation personnalisée. Scénario illustratif en Normandie · sans relevé de terrain Consulter les justifications et leurs limites Inventaire du prototype et limites ↗ Efficacité écologique locale : non mesurée Explorer les 12 alternatives et leurs conditions Sources et limites ↗

> UN PROJET D’ÉCLAIRAGE À EXAMINER 2:15—3:05 Observer, situer, décider : un seul parcours. 5 / 5 Consulter les justifications Le registre des douze alternatives documentées reste consultable avec ses sources et conditions. Cette illustration ne calcule ni autorisation ni recommandation personnalisée. Scénario illustratif en Normandie · sans relevé de terrain Consulter les justifications et leurs limites Inventaire du prototype et limites ↗ Efficacité écologique locale : non mesurée Explorer les 12 alternatives et leurs conditions Options de conception conditionnelles, à examiner avec des spécialistes. Aucune efficacité sur ce site n’est établie. Clôture Modifier le tracé Limiter le périmètre clôturé Examiner une conception adaptée à la faune Repérer les éléments présents, confirmer les déplacements et vérifier les usages et la sécurité. Éclairage extérieur Éviter certains points lumineux Réduire la durée de fonctionnement Adapter l’orientation de l’éclairage Justifier les points et horaires nécessaires ; faire examiner visibilité, sécurité et éléments voisins réellement présents. Végétation Implanter le projet en préservant la végétation présente Réduire l’emprise de suppression de végétation Inventorier les arbres ou haies effectivement présents et vérifier les contraintes avant intervention. Terrassement Comparer une implantation différente Réduire l’emprise des terrassements Disposer d’un plan et d’une topographie ; vérifier les enjeux localisés et la faisabilité du chantier. Imperméabilisation Éviter des surfaces imperméabilisées non indispensables Examiner des revêtements perméables compatibles avec les usages Étudier le sol, l’infiltration, les usages, les charges et l’entretien avant tout choix technique. Références générales de conception, sans qualification scientifique locale : Ministère · Trame verte, bleue et noire OFB · Clôtures et faune Cerema · Désimperméabilisation Lire les preuves archivées et la documentation du prototype Sources et limites ↗

**Après · exploration**

> UN PROJET D’ÉCLAIRAGE À EXAMINER 2:15—3:05 Observer, situer, décider : un seul parcours. Un cas illustratif pour repérer les vigilances et discuter des adaptations avec les spécialistes. Bénéfice attendu · non mesuré Dans ce scénario illustratif, une collectivité envisage d’éclairer un chemin près d’un bocage normand. Parcourez les cinq étapes pour examiner le contexte, les informations manquantes et des adaptations à discuter avec des spécialistes. Un projet d’éclairage Observer et situer Examiner les vigilances Discuter des adaptations Consulter les justifications 1 / 5 Un projet d’éclairage Scénario illustratif : une collectivité envisage d’éclairer un chemin près d’un bocage normand. Aucun projet réel ni dossier écologique calculé ici. Scénario illustratif en Normandie · sans relevé de terrain Aménageurs · Acteurs de l’environnement · Territoires 12 alternatives documentées Clôture · éclairage · végétation · terrassement · imperméabilisation Inventaire du prototype et limites ↗ Efficacité écologique locale : non mesurée Explorer les 12 alternatives et leurs conditions Aménageurs Acteurs de l’environnement Territoires Sources et texte oral ↗

> UN PROJET D’ÉCLAIRAGE À EXAMINER 2:15—3:05 Observer, situer, décider : un seul parcours. Un cas illustratif pour repérer les vigilances et discuter des adaptations avec les spécialistes. Bénéfice attendu · non mesuré Dans ce scénario illustratif, une collectivité envisage d’éclairer un chemin près d’un bocage normand. Parcourez les cinq étapes pour examiner le contexte, les informations manquantes et des adaptations à discuter avec des spécialistes. Un projet d’éclairage Observer et situer Examiner les vigilances Discuter des adaptations Consulter les justifications 1 / 5 Un projet d’éclairage Scénario illustratif : une collectivité envisage d’éclairer un chemin près d’un bocage normand. Aucun projet réel ni dossier écologique calculé ici. Scénario illustratif en Normandie · sans relevé de terrain Aménageurs · Acteurs de l’environnement · Territoires 12 alternatives documentées Clôture · éclairage · végétation · terrassement · imperméabilisation Inventaire du prototype et limites ↗ Efficacité écologique locale : non mesurée Explorer les 12 alternatives et leurs conditions Options de conception conditionnelles, à examiner avec des spécialistes. Aucune efficacité sur ce site n’est établie. Clôture Modifier le tracé Limiter le périmètre clôturé Examiner une conception adaptée à la faune Repérer les éléments présents, confirmer les déplacements et vérifier les usages et la sécurité. Éclairage extérieur Éviter certains points lumineux Réduire la durée de fonctionnement Adapter l’orientation de l’éclairage Justifier les points et horaires nécessaires ; faire examiner visibilité, sécurité et éléments voisins réellement présents. Végétation Implanter le projet en préservant la végétation présente Réduire l’emprise de suppression de végétation Inventorier les arbres ou haies effectivement présents et vérifier les contraintes avant intervention. Terrassement Comparer une implantation différente Réduire l’emprise des terrassements Disposer d’un plan et d’une topographie ; vérifier les enjeux localisés et la faisabilité du chantier. Imperméabilisation Éviter des surfaces imperméabilisées non indispensables Examiner des revêtements perméables compatibles avec les usages Étudier le sol, l’infiltration, les usages, les charges et l’entretien avant tout choix technique. Références générales de conception, sans qualification scientifique locale : Ministère · Trame verte, bleue et noire OFB · Clôtures et faune Cerema · Désimperméabilisation Lire les preuves archivées et la documentation du prototype Aménageurs Acteurs de l’environnement Territoires Sources et texte oral ↗

> UN PROJET D’ÉCLAIRAGE À EXAMINER 2:15—3:05 Observer, situer, décider : un seul parcours. Un cas illustratif pour repérer les vigilances et discuter des adaptations avec les spécialistes. Bénéfice attendu · non mesuré Dans ce scénario illustratif, une collectivité envisage d’éclairer un chemin près d’un bocage normand. Parcourez les cinq étapes pour examiner le contexte, les informations manquantes et des adaptations à discuter avec des spécialistes. Un projet d’éclairage Observer et situer Examiner les vigilances Discuter des adaptations Consulter les justifications 2 / 5 Observer et situer Relier les observations disponibles aux caractéristiques du milieu. Les données de démonstration ne constituent pas un inventaire réel du site. Scénario illustratif en Normandie · sans relevé de terrain 12 alternatives documentées Clôture · éclairage · végétation · terrassement · imperméabilisation Inventaire du prototype et limites ↗ Efficacité écologique locale : non mesurée Explorer les 12 alternatives et leurs conditions Options de conception conditionnelles, à examiner avec des spécialistes. Aucune efficacité sur ce site n’est établie. Clôture Modifier le tracé Limiter le périmètre clôturé Examiner une conception adaptée à la faune Repérer les éléments présents, confirmer les déplacements et vérifier les usages et la sécurité. Éclairage extérieur Éviter certains points lumineux Réduire la durée de fonctionnement Adapter l’orientation de l’éclairage Justifier les points et horaires nécessaires ; faire examiner visibilité, sécurité et éléments voisins réellement présents. Végétation Implanter le projet en préservant la végétation présente Réduire l’emprise de suppression de végétation Inventorier les arbres ou haies effectivement présents et vérifier les contraintes avant intervention. Terrassement Comparer une implantation différente Réduire l’emprise des terrassements Disposer d’un plan et d’une topographie ; vérifier les enjeux localisés et la faisabilité du chantier. Imperméabilisation Éviter des surfaces imperméabilisées non indispensables Examiner des revêtements perméables compatibles avec les usages Étudier le sol, l’infiltration, les usages, les charges et l’entretien avant tout choix technique. Références générales de conception, sans qualification scientifique locale : Ministère · Trame verte, bleue et noire OFB · Clôtures et faune Cerema · Désimperméabilisation Lire les preuves archivées et la documentation du prototype Aménageurs Acteurs de l’environnement Territoires Sources et texte oral ↗

> UN PROJET D’ÉCLAIRAGE À EXAMINER 2:15—3:05 Observer, situer, décider : un seul parcours. Un cas illustratif pour repérer les vigilances et discuter des adaptations avec les spécialistes. Bénéfice attendu · non mesuré Dans ce scénario illustratif, une collectivité envisage d’éclairer un chemin près d’un bocage normand. Parcourez les cinq étapes pour examiner le contexte, les informations manquantes et des adaptations à discuter avec des spécialistes. Un projet d’éclairage Observer et situer Examiner les vigilances Discuter des adaptations Consulter les justifications 3 / 5 Examiner les vigilances Identifier les informations manquantes et les usages du milieu à vérifier avec un spécialiste ; aucun effet écologique n’est mesuré dans cette animation. Scénario illustratif en Normandie · sans relevé de terrain 12 alternatives documentées Clôture · éclairage · végétation · terrassement · imperméabilisation Inventaire du prototype et limites ↗ Efficacité écologique locale : non mesurée Explorer les 12 alternatives et leurs conditions Options de conception conditionnelles, à examiner avec des spécialistes. Aucune efficacité sur ce site n’est établie. Clôture Modifier le tracé Limiter le périmètre clôturé Examiner une conception adaptée à la faune Repérer les éléments présents, confirmer les déplacements et vérifier les usages et la sécurité. Éclairage extérieur Éviter certains points lumineux Réduire la durée de fonctionnement Adapter l’orientation de l’éclairage Justifier les points et horaires nécessaires ; faire examiner visibilité, sécurité et éléments voisins réellement présents. Végétation Implanter le projet en préservant la végétation présente Réduire l’emprise de suppression de végétation Inventorier les arbres ou haies effectivement présents et vérifier les contraintes avant intervention. Terrassement Comparer une implantation différente Réduire l’emprise des terrassements Disposer d’un plan et d’une topographie ; vérifier les enjeux localisés et la faisabilité du chantier. Imperméabilisation Éviter des surfaces imperméabilisées non indispensables Examiner des revêtements perméables compatibles avec les usages Étudier le sol, l’infiltration, les usages, les charges et l’entretien avant tout choix technique. Références générales de conception, sans qualification scientifique locale : Ministère · Trame verte, bleue et noire OFB · Clôtures et faune Cerema · Désimperméabilisation Lire les preuves archivées et la documentation du prototype Aménageurs Acteurs de l’environnement Territoires Sources et texte oral ↗

> UN PROJET D’ÉCLAIRAGE À EXAMINER 2:15—3:05 Observer, situer, décider : un seul parcours. Un cas illustratif pour repérer les vigilances et discuter des adaptations avec les spécialistes. Bénéfice attendu · non mesuré Dans ce scénario illustratif, une collectivité envisage d’éclairer un chemin près d’un bocage normand. Parcourez les cinq étapes pour examiner le contexte, les informations manquantes et des adaptations à discuter avec des spécialistes. Un projet d’éclairage Observer et situer Examiner les vigilances Discuter des adaptations Consulter les justifications 4 / 5 Discuter des adaptations Éviter ou déplacer certains points lumineux Réduire la durée de fonctionnement Cibler l’orientation sur les usages nécessaires Scénario illustratif en Normandie · sans relevé de terrain 12 alternatives documentées Clôture · éclairage · végétation · terrassement · imperméabilisation Inventaire du prototype et limites ↗ Efficacité écologique locale : non mesurée Explorer les 12 alternatives et leurs conditions Options de conception conditionnelles, à examiner avec des spécialistes. Aucune efficacité sur ce site n’est établie. Clôture Modifier le tracé Limiter le périmètre clôturé Examiner une conception adaptée à la faune Repérer les éléments présents, confirmer les déplacements et vérifier les usages et la sécurité. Éclairage extérieur Éviter certains points lumineux Réduire la durée de fonctionnement Adapter l’orientation de l’éclairage Justifier les points et horaires nécessaires ; faire examiner visibilité, sécurité et éléments voisins réellement présents. Végétation Implanter le projet en préservant la végétation présente Réduire l’emprise de suppression de végétation Inventorier les arbres ou haies effectivement présents et vérifier les contraintes avant intervention. Terrassement Comparer une implantation différente Réduire l’emprise des terrassements Disposer d’un plan et d’une topographie ; vérifier les enjeux localisés et la faisabilité du chantier. Imperméabilisation Éviter des surfaces imperméabilisées non indispensables Examiner des revêtements perméables compatibles avec les usages Étudier le sol, l’infiltration, les usages, les charges et l’entretien avant tout choix technique. Références générales de conception, sans qualification scientifique locale : Ministère · Trame verte, bleue et noire OFB · Clôtures et faune Cerema · Désimperméabilisation Lire les preuves archivées et la documentation du prototype Aménageurs Acteurs de l’environnement Territoires Sources et texte oral ↗

> UN PROJET D’ÉCLAIRAGE À EXAMINER 2:15—3:05 Observer, situer, décider : un seul parcours. Un cas illustratif pour repérer les vigilances et discuter des adaptations avec les spécialistes. Bénéfice attendu · non mesuré Dans ce scénario illustratif, une collectivité envisage d’éclairer un chemin près d’un bocage normand. Parcourez les cinq étapes pour examiner le contexte, les informations manquantes et des adaptations à discuter avec des spécialistes. Un projet d’éclairage Observer et situer Examiner les vigilances Discuter des adaptations Consulter les justifications 5 / 5 Consulter les justifications Le registre des douze alternatives documentées reste consultable avec ses sources et conditions. Cette illustration ne calcule ni autorisation ni recommandation personnalisée. Scénario illustratif en Normandie · sans relevé de terrain Consulter les justifications et leurs limites 12 alternatives documentées Clôture · éclairage · végétation · terrassement · imperméabilisation Inventaire du prototype et limites ↗ Efficacité écologique locale : non mesurée Explorer les 12 alternatives et leurs conditions Options de conception conditionnelles, à examiner avec des spécialistes. Aucune efficacité sur ce site n’est établie. Clôture Modifier le tracé Limiter le périmètre clôturé Examiner une conception adaptée à la faune Repérer les éléments présents, confirmer les déplacements et vérifier les usages et la sécurité. Éclairage extérieur Éviter certains points lumineux Réduire la durée de fonctionnement Adapter l’orientation de l’éclairage Justifier les points et horaires nécessaires ; faire examiner visibilité, sécurité et éléments voisins réellement présents. Végétation Implanter le projet en préservant la végétation présente Réduire l’emprise de suppression de végétation Inventorier les arbres ou haies effectivement présents et vérifier les contraintes avant intervention. Terrassement Comparer une implantation différente Réduire l’emprise des terrassements Disposer d’un plan et d’une topographie ; vérifier les enjeux localisés et la faisabilité du chantier. Imperméabilisation Éviter des surfaces imperméabilisées non indispensables Examiner des revêtements perméables compatibles avec les usages Étudier le sol, l’infiltration, les usages, les charges et l’entretien avant tout choix technique. Références générales de conception, sans qualification scientifique locale : Ministère · Trame verte, bleue et noire OFB · Clôtures et faune Cerema · Désimperméabilisation Lire les preuves archivées et la documentation du prototype Aménageurs Acteurs de l’environnement Territoires Sources et texte oral ↗

</details>

<details>
<summary>drone — textes et panneaux consultés</summary>

**Avant · jury**

> 06 BIS / L’ÉQUIPE ARQ Derrière Symbiose, l’équipe ARQ. Arden, Romain et Quentin réunissent intelligence artificielle, développement logiciel et données. Intelligence artificielle Réunir les compétences pour traiter les observations tout en gardant la validation humaine. Survol illustratif · le relevé par drone reste une piste d’évolution Poursuivre le voyage ↗

> 06 BIS / L’ÉQUIPE ARQ Derrière Symbiose, l’équipe ARQ. Arden, Romain et Quentin réunissent intelligence artificielle, développement logiciel et données. Développement logiciel Relier les étapes dans un démonstrateur local utilisable par les acteurs du territoire. Survol illustratif · le relevé par drone reste une piste d’évolution Poursuivre le voyage ↗

> 06 BIS / L’ÉQUIPE ARQ Derrière Symbiose, l’équipe ARQ. Arden, Romain et Quentin réunissent intelligence artificielle, développement logiciel et données. Exploitation des données Documenter les données et leurs limites pour rendre les informations examinables. Survol illustratif · le relevé par drone reste une piste d’évolution Poursuivre le voyage ↗

**Avant · exploration**

> 06 BIS / L’ÉQUIPE ARQ Derrière Symbiose, l’équipe ARQ. Arden, Romain et Quentin réunissent intelligence artificielle, développement logiciel et données. Intelligence artificielle Développement logiciel Exploitation des données Survol illustratif · le relevé par drone reste une piste d’évolution Poursuivre le voyage ↗

**Après · jury**

> 06 BIS / L’ÉQUIPE ARQ Derrière Symbiose, l’équipe ARQ. Arden, Romain et Quentin réunissent intelligence artificielle, développement logiciel et données. Intelligence artificielle Réunir les compétences pour traiter les observations tout en gardant la validation humaine. Survol illustratif · le relevé par drone reste une piste d’évolution Poursuivre le voyage ↗

> 06 BIS / L’ÉQUIPE ARQ Derrière Symbiose, l’équipe ARQ. Arden, Romain et Quentin réunissent intelligence artificielle, développement logiciel et données. Développement logiciel Relier les étapes dans un démonstrateur local utilisable par les acteurs du territoire. Survol illustratif · le relevé par drone reste une piste d’évolution Poursuivre le voyage ↗

> 06 BIS / L’ÉQUIPE ARQ Derrière Symbiose, l’équipe ARQ. Arden, Romain et Quentin réunissent intelligence artificielle, développement logiciel et données. Exploitation des données Documenter les données et leurs limites pour rendre les informations examinables. Survol illustratif · le relevé par drone reste une piste d’évolution Poursuivre le voyage ↗

**Après · exploration**

> 06 BIS / L’ÉQUIPE ARQ Derrière Symbiose, l’équipe ARQ. Arden, Romain et Quentin réunissent intelligence artificielle, développement logiciel et données. Intelligence artificielle Développement logiciel Exploitation des données ARQ réunit Arden, Romain et Quentin autour de l’intelligence artificielle, du développement logiciel et de l’exploitation des données. Les rôles individuels ne sont pas attribués ici. Le survol illustre le territoire ; il ne démontre pas un service de relevé par drone. Survol illustratif · le relevé par drone reste une piste d’évolution Poursuivre le voyage ↗

</details>

<details>
<summary>coast — textes et panneaux consultés</summary>

**Avant · jury**

> DU DÉMONSTRATEUR AU TERRAIN 3:35—3:48 Rendre l’expertise accessible au bon moment. Un parcours démontré ; un impact réel sur le terrain encore à mesurer. Sources et limites ↗

**Avant · exploration**

> DU DÉMONSTRATEUR AU TERRAIN 3:35—3:48 Rendre l’expertise accessible au bon moment. Un parcours démontré ; un impact réel sur le terrain encore à mesurer. Perspective · non opérationnelle Besoins proposés par l’équipe · aucun partenariat annoncé à ce jour. Sources et texte oral ↗

**Après · jury**

> DU DÉMONSTRATEUR AU TERRAIN 3:35—3:48 Rendre l’expertise accessible au bon moment. Un parcours démontré ; un impact réel sur le terrain encore à mesurer. Sources et limites ↗

**Après · exploration**

> DU DÉMONSTRATEUR AU TERRAIN 3:35—3:48 Rendre l’expertise accessible au bon moment. Un parcours démontré ; un impact réel sur le terrain encore à mesurer. Perspective · non opérationnelle Le démonstrateur permet d’examiner un parcours fonctionnel. Son utilité en situation réelle, ses gains éventuels et son coût numérique restent à évaluer avec les acteurs du terrain. Besoins proposés par l’équipe · aucun partenariat annoncé à ce jour. Sources et texte oral ↗

</details>

<details>
<summary>marine — textes et panneaux consultés</summary>

**Avant · jury**

> 07 BIS / CHANGER D’ÉCHELLE Ce qu’il reste à construire ensemble. Partenaires de terrain Collectivités, associations naturalistes et professionnels de l’aménagement : des partenaires recherchés, aucun partenariat annoncé. Évocation artistique du littoral · besoins proposés, aucun partenariat annoncé Poursuivre le voyage ↗

> 07 BIS / CHANGER D’ÉCHELLE Ce qu’il reste à construire ensemble. Données fiables et expertise scientifique Confronter les propositions à des données documentées et à l’expertise des spécialistes. Évocation artistique du littoral · besoins proposés, aucun partenariat annoncé Poursuivre le voyage ↗

> 07 BIS / CHANGER D’ÉCHELLE Ce qu’il reste à construire ensemble. Moyens d’expérimenter Évaluer les usages, les améliorations nécessaires et le coût numérique des traitements. Évocation artistique du littoral · besoins proposés, aucun partenariat annoncé Poursuivre le voyage ↗

**Avant · exploration**

> 07 BIS / CHANGER D’ÉCHELLE Ce qu’il reste à construire ensemble. Confronter Symbiose à de vrais usages avec des partenaires, des données fiables et des moyens d’expérimenter. Partenaires de terrain Données fiables et expertise scientifique Moyens d’expérimenter Évocation artistique du littoral · besoins proposés, aucun partenariat annoncé Poursuivre le voyage ↗

**Après · jury**

> 07 BIS / CHANGER D’ÉCHELLE Ce qu’il reste à construire ensemble. Partenaires de terrain Collectivités, associations naturalistes et professionnels de l’aménagement : des partenaires recherchés, aucun partenariat annoncé. Évocation artistique du littoral · besoins proposés, aucun partenariat annoncé Poursuivre le voyage ↗

> 07 BIS / CHANGER D’ÉCHELLE Ce qu’il reste à construire ensemble. Données fiables et expertise scientifique Confronter les propositions à des données documentées et à l’expertise des spécialistes. Évocation artistique du littoral · besoins proposés, aucun partenariat annoncé Poursuivre le voyage ↗

> 07 BIS / CHANGER D’ÉCHELLE Ce qu’il reste à construire ensemble. Moyens d’expérimenter Évaluer les usages, les améliorations nécessaires et le coût numérique des traitements. Évocation artistique du littoral · besoins proposés, aucun partenariat annoncé Poursuivre le voyage ↗

**Après · exploration**

> 07 BIS / CHANGER D’ÉCHELLE Ce qu’il reste à construire ensemble. Confronter Symbiose à de vrais usages avec des partenaires, des données fiables et des moyens d’expérimenter. Partenaires de terrain Données fiables et expertise scientifique Moyens d’expérimenter Les trois besoins sont complémentaires : des partenaires pour confronter l’outil aux usages, des données fiables et une expertise scientifique, puis des moyens pour expérimenter et mesurer les résultats. Aucun partenariat n’est présenté comme acquis. Évocation artistique du littoral · besoins proposés, aucun partenariat annoncé Poursuivre le voyage ↗

</details>

<details>
<summary>coast-return — textes et panneaux consultés</summary>

**Avant · jury**

> L’EXPERTISE AU BON MOMENT 4:18—4:30 Rendre l’expertise accessible au bon moment. Rendre l’expertise accessible lorsqu’une décision se prépare. Sources et limites ↗

**Avant · exploration**

> L’EXPERTISE AU BON MOMENT 4:18—4:30 Rendre l’expertise accessible au bon moment. Rendre l’expertise accessible lorsqu’une décision se prépare. Perspective · non opérationnelle Besoins proposés par l’équipe · aucun partenariat annoncé à ce jour. Sources et texte oral ↗

**Après · jury**

> L’EXPERTISE AU BON MOMENT 4:18—4:30 Rendre l’expertise accessible au bon moment. Rendre l’expertise accessible lorsqu’une décision se prépare. Sources et limites ↗

**Après · exploration**

> L’EXPERTISE AU BON MOMENT 4:18—4:30 Rendre l’expertise accessible au bon moment. Rendre l’expertise accessible lorsqu’une décision se prépare. Perspective · non opérationnelle Les informations, sources et propositions préparent une discussion au moment où le projet se dessine. Les spécialistes et les responsables du projet gardent la décision ; l’outil ne délivre ni autorisation ni validation écologique automatique. Sources et texte oral ↗

</details>

<details>
<summary>night-forest — textes et panneaux consultés</summary>

**Avant · jury**

> Vous reconnaissez cette forêt ? C’est ici que notre voyage a commencé.

> La même forêt, un autre regard Ce qui a changé, c’est ce que nous en savons.

> Comprendre le vivant avant d’aménager. Commencer l’expérience Symbiose ↗

**Avant · exploration**

> LA MÊME FORÊT, UN AUTRE REGARD 4:30—5:00 Comprendre le vivant avant d’aménager. La forêt est la même. Ce qui a changé, c’est ce que nous en savons. Commencer l’expérience Symbiose ↗ Sources et texte oral ↗

**Après · jury**

> Comprendre le vivant avant d’aménager. Vous reconnaissez cette forêt ? · C’est ici que notre voyage a commencé.

> Comprendre le vivant avant d’aménager. La même forêt, un autre regard · Ce qui a changé, c’est ce que nous en savons.

> Comprendre le vivant avant d’aménager. Commencer l’expérience Symbiose ↗

**Après · exploration**

> LA MÊME FORÊT, UN AUTRE REGARD 4:30—5:00 Comprendre le vivant avant d’aménager. La forêt est la même. Ce qui a changé, c’est ce que nous en savons. Le retour à la forêt invite à regarder autrement un même milieu. Comprendre les informations disponibles et leurs limites aide à préparer l’aménagement ; aucun bénéfice écologique réel n’a été mesuré dans ce récit. Commencer l’expérience Symbiose ↗ Sources et texte oral ↗

</details>

