# Symbiose — guide du présentateur

> Conducteur de référence : [CONDUCTEUR_SYMBIOSE.md](CONDUCTEUR_SYMBIOSE.md), généré depuis `frontend/src/experience/narrative-cues.ts`. Après un changement de version, recharger en ligne et actualiser l’installation hors ligne. Le mode `?render=2d` reste le secours sans GPU.


## Avant la séance

1. Construire la production et ouvrir `http://localhost:8080/jury/` dans le profil
   Chromium préparé pour la séance. Cette entrée n'attend pas la connexion métier.
2. Vérifier que `/jury/` ouvre directement la forêt, avec le compteur à
   **0:00 / 5:00** et le bouton **Démarrer le pitch**. Aucun bureau, lecteur vidéo
   ni travelling ne précède les cinq minutes dans ce mode. Attendre la fin du chargement.
3. Vérifier séparément le parcours public `/` : bureau, MP4 officiel
   `frontend/public/experience-media/intro.mp4`, secours YouTube manuel et
   travelling de 14 secondes. Aucun son ne démarre automatiquement. Ces médias
   sont indépendants du déroulé jury et restent accessibles en découverte.
4. Dans **Préparation du jury**, cliquer **Installer hors ligne**. Attendre la
   réussite : l’installateur vérifie la présence des paysages, du récit et des
   sources. Le pitch jury ne dépend pas d’un montage vidéo produit ; le MP4
   introductif reste réservé au parcours public.
5. Couper le réseau dans le navigateur et recharger la page. Visiter les huit
   chapitres et les trois explorations, puis ouvrir les sources. Garder le même navigateur, le même profil et la même adresse.
6. Ouvrir **Régie du récit → Recommencer le récit**. Tester le plein écran sur le
   vidéoprojecteur réel ; régler son contraste et la mise à l'échelle de Windows.
7. Répéter le pitch à deux voix sur la lecture continue. Le compteur indique une
   position dans le récit, pas la durée réelle de parole : Espace met en pause,
   les flèches recalent l'étape si la parole prend de l'avance ou du retard.

## Pendant les cinq minutes

Cliquer **Démarrer le pitch** en même temps que la première réplique. L’horloge
unique pilote ensuite les treize séquences, les démonstrations et le rendu,
jusqu’à l’arrêt à **5:00**. Les paroles restent prononcées en direct par A et B.
Aucune synthèse vocale, voix off ou reconnaissance audio n’est utilisée.

Le [conducteur complet](CONDUCTEUR_SYMBIOSE.md) donne les horaires exacts, titres,
paroles, déclenchements et mouvements de caméra. Les pauses de caméra sont des
temps de stabilité visuelle ; le compteur continue. Les démonstrations de
reconnaissance, de sources et d’éclairage évoluent seules pendant la lecture.
Le logo et l’accès final apparaissent dans les dernières secondes.

Le pitch à deux voix (`pitch-presentation.txt`) et le carnet **Pitch chronométré**
sont issus de la même source. Pour ajuster une répétition, modifier
`frontend/src/experience/narrative-cues.ts`, puis exécuter depuis `frontend/` :

```powershell
node scripts/export-conducteur.mjs
node scripts/export-conducteur.mjs --check
```

Le [tableau du jury](PITCH_DATATHON_2026.md) reste disponible pour les critères.
La validation d'une espèce et l'efficacité d'un aménagement ne sont pas déduites
des illustrations ou des résultats de tests techniques.

## Commandes

| Commande | Comportement |
|---|---|
| Flèches gauche/droite, Page précédente/suivante | Changer de chapitre en présentation |
| Début / Fin | Début ou conclusion |
| Démarrer le pitch, puis Lecture/Pause | Lancer les cinq minutes, suspendre ou reprendre la même horloge |
| Espace hors contrôle interactif | Lecture/pause sans décalage des démonstrations |
| Les huit repères latéraux | Retour immédiat au chapitre dans le mode jury |
| Entrer dans le vivant (parcours public) | Quitter le bureau par le travelling ; continuer ensuite à son rythme |
| Plein écran | Entrer/sortir explicitement du plein écran |
| Régie → Passer l'animation | Avancer immédiatement, sans attendre le déplacement |
| Régie → Recommencer | Rembobiner et réinitialiser le lecteur, sans relancer de modèle |
| Régie → Reprendre | Rejoindre le point sauvegardé avant le rechargement |
| Régie → Secours sans WebGL | Libérer le monde 3D et continuer avec les images 2D |

Les formulaires, le lecteur vidéo, les dialogues et les menus gardent leurs
touches natives. Échap ferme le carnet et ne doit pas changer le chapitre ni
effacer le fichier vidéo ouvert. Le carnet et le masquage de l’onglet suspendent
la lecture ; reprendre explicitement au même point. Avec les mouvements réduits,
les points de vue sont fixes et les fondus sont supprimés, mais l’horloge jury et
ses informations restent utilisables. Les flèches atteignent aussi les retours
en forêt et sur le littoral. La navigation libre garde ses six étapes détaillées.

## Ce que montre la démonstration

Les schémas de reconnaissance et d’éclairage sont explicitement illustratifs :
aucune prédiction, observation de terrain ou étude écologique n’est calculée dans
la landing. Les deux points normands proviennent des archives existantes et les
douze adaptations sont des options conditionnelles du catalogue du projet.

Le code actif emploie un classificateur PyTorch. SpeciesNet, cité dans le brief
initial, n’est pas intégré : le script généré emploie donc la formulation exacte
du démonstrateur existant. Les références générales ne prouvent pas l’efficacité
locale d’une adaptation. Les géométries forestières de jour et de nuit restent
les décors existants ; le cadrage final reprend hauteur, direction et focale
initiales, sans prétendre à une superposition documentaire du même lieu.

## Incident pendant le pitch

- **GPU ou WebGL défaillant** : le repli 2D se déclenche automatiquement après une
  perte de contexte. Pour l'imposer, utiliser la régie ou `/jury/?render=2d`.
  Le texte, les étapes et les sources restent accessibles.
- **Navigateur fermé ou page rechargée** : ouvrir la même adresse et le même profil,
  puis **Régie → Reprendre**. La sauvegarde porte sur le chapitre et le mode ; une
  lecture vidéo ne reprend jamais seule. Un fichier choisi temporairement doit
  être sélectionné à nouveau ; le montage embarqué reste disponible.
- **Installation incomplète ou données navigateur effacées** : garder le serveur
  local actif. Le message d'échec n'est pas transformé en réussite. Réinstaller
  avant la séance, pas pendant la parole.
- **Navigateur inutilisable** : lire le script écrit et utiliser les captures
  de la répétition courante. La galerie `output/symbiose/final/` et le
  [PDF fixe de huit pages](../output/symbiose/final/secours-symbiose.pdf) sont des
  supports antérieurs à cette harmonisation : vérifier leurs textes avant de
  les projeter. Le MP4 officiel peut être lu séparément dans le lecteur local.
  Les captures sont un support fixe, pas une démonstration réelle ni une mesure
  écologique.
- **Application finale indisponible** : terminer le récit et nommer la limite.
  L'accès à Symbiose exige ses services ; le pack du jury ne les simule pas.

Le test hors ligne automatisé ne remplace pas cette répétition sur le matériel
de la salle. Firefox, Safari, lecteur d'écran humain et vidéoprojecteur doivent
faire l'objet d'une recette distincte si ces conditions seront utilisées.

Pour la projection, la version 2D reprend les compositions d'intention et évite
la reconstruction 3D encore schématique. Elle constitue aujourd'hui le choix
le plus proche de la planche artistique. Les deux modes restent accessibles ;
tester et choisir celui de la séance avant l'arrivée du jury.

## Fichiers de l’harmonisation

Les chemins de cette table sont relatifs à `frontend/`, sauf indication contraire.

| Fichiers | Rôle |
| --- | --- |
| `src/experience/narrative-cues.ts` | Source des treize scènes, horaires, paroles A/B, textes, événements et pauses de caméra. |
| `src/experience/pitch.ts`, `src/experience/excursions/copy.ts` | Contenus des chapitres et sous-scènes dérivés du conducteur. |
| `src/experience/excursions/route.ts`, `src/experience/NarrativeTimeline.ts` | Conversion entre coordonnées de défilement et secondes ; lecture, pause, reprise et navigation sur les treize repères. |
| `src/pages/LandingPage.vue`, `src/jury/JuryApp.vue`, `src/experience/PresentationControls.vue` | Entrées public/jury, départ manuel, contrôles et compteur. |
| `src/experience/presentation-camera.ts`, `src/experience/ExperienceCanvas.vue` | Caméra jury réversible avec poses stables, distincte du parcours libre conservé. |
| `src/experience/JourneyWorld.ts`, `src/experience/world-observation.ts` | Accessoire illustratif près du piège et apparition du logo selon le conducteur. |
| `src/experience/NarrativeOverlay.vue`, `PitchVisual.vue`, `JuryDemonstration.vue`, `narrative-cues.css` | Démonstrations, révélations progressives, inventaire consultable et composition lisible. Les trois derniers fichiers sont dans le même répertoire `src/experience/`. |
| `src/experience/excursions/ExcursionOverlay.vue`, `ExcursionFallback.vue` | Présentation de l’équipe et des besoins ; poses 2D stables en mouvements réduits. |
| `src/experience/PitchSources.vue` | Carnet oral des treize séquences et preuves consultables. |
| `scripts/export-conducteur.mjs`, `scripts/export-pitch.mjs` | Génération du conducteur, du script oral et du guide du Datathon ; compatibilité de l’ancienne commande d’export. |
| `scripts/jury-build.mjs`, `scripts/package-jury.mjs`, `src/experience/content/source-documents.json` | Paquet et sources hors ligne ; retrait des messages obsolètes sur une vidéo produit de 90 secondes. |
| `tests/unit/narrative-cues.test.ts`, `presentation-camera.test.ts`, `jury-demonstration.test.ts`, `jury-playback.test.ts`, `fallback-excursion-motion.test.ts`, `expanded-route.test.ts` | Horloge exacte, bornes, stabilité, reprise, illustrations réduites et composants. Tous sont dans `tests/unit/`. |
| `tests/e2e/jury-conductor.spec.ts`, `public-landing.ts`, suites `jury`, `pitch`, `expanded-journey`, `connected-excursions`, `fallback-transitions` et `prologue*` | Déroulé complet, captures, navigation, médias publics, accessibilité et cache hors ligne. |
| `../pitch-presentation.txt`, `../docs/CONDUCTEUR_SYMBIOSE.md`, `PITCH_DATATHON_2026.md`, `PRESENTER_GUIDE.md`, `EXPERIENCE_SYMBIOSE.md`, `EXPLORATIONS_SYMBIOSE.md`, `PROLOGUE_SYMBIOSE.md` | Script et documentation harmonisés ; les cinq derniers fichiers se trouvent dans `../docs/`. |

Les dépendances, traitements IA, routes métier, photographies et modèles 3D
fournis ne sont pas modifiés. Le MP4 officiel reste local et ignoré par Git.

## Commandes de validation

Pour reconstruire et relancer uniquement le frontend, depuis la racine du dépôt :

```powershell
docker compose up -d --build --no-deps frontend
```

Ouvrir ensuite `http://localhost:8080/jury/` pour le pitch ou
`http://localhost:8080/` pour la découverte publique.

Depuis `frontend/` :

```powershell
npm.cmd test -- --maxWorkers=2 --testTimeout=15000
npm.cmd run build
node scripts/export-conducteur.mjs --check
node scripts/export-pitch.mjs --check
node node_modules/@playwright/test/cli.js test jury-conductor.spec.ts
```

Après reconstruction du frontend Docker, pour inclure les vérifications du cache :

```powershell
$env:E2E_BASE_URL = 'http://127.0.0.1:8080'
$env:E2E_PRODUCTION = '1'
node node_modules/@playwright/test/cli.js test jury-conductor.spec.ts jury.spec.ts prologue.spec.ts expanded-journey.spec.ts --grep "jury-conductor|paquet jury|hors ligne|network offline"
```

## Résultats de la recette

- **Compilation et TypeScript : réussis**, y compris dans la reconstruction
  Docker finale. Vite conserve son avertissement sur un paquet dépassant 500 Ko.
- **Tests unitaires : 262 réussis, un échec préexistant.**
  `tree-atlas-metadata.json` contient 43 octets contre 44 déclarés dans son
  inventaire ; ces fichiers sont identiques à ceux du dépôt avant cette mission.
- **Navigateur : douze tests de production réussis**, couvrant notamment les
  cinq minutes complètes, les treize séquences, la pause et la reprise, les
  démonstrations, les poses WebGL, les mouvements réduits et le cache hors ligne.
  Les cinq contrôles concernés ont également été relancés après la dernière
  correction de disposition mobile : tous réussis.
- **Régressions publiques vérifiées :** prologue, lecture et commandes du MP4
  officiel, secours YouTube manuel, navigation libre, carnet et accès final.
- **Contrôle visuel :** compositions à 1600 × 900, 1280 × 720 et 390 × 844 ;
  les titres et petits libellés restent sous la navigation. Les pauses caméra
  gardent le rendu WebGL actif ; un seul canevas WebGL est conservé.
- **Exports et format : à jour**, vérifiés par les deux commandes `--check`,
  Prettier et `git diff --check`. Aucun conflit Git non résolu.

La répétition à deux voix et la projection dans la salle restent à effectuer.
