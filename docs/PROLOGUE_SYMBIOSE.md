# Symbiose — Du bureau au vivant

Avec les [trois explorations supplémentaires](EXPLORATIONS_SYMBIOSE.md), le bureau
occupe toujours trois hauteurs de scroll, sur un total de 42. Son raccord à la
forêt et son lecteur restent conservés ; la présentation complète dure désormais
5 minutes hors prologue.

Le prologue ajoute un bureau d’études en amont des huit atmosphères existantes.
Le mobilier, les parois, la baie, les équipements et l’écran sont des objets
Three.js. Le travelling passe par une ouverture réelle entre les vitrages,
puis rejoint exactement la pose initiale de la forêt : position `[0, 2.1, 18]`,
cible `[-2, 6, -28]`, focale de champ `57°`.

## Parcours et contrôles

- `00` ouvre le bureau ; `01` à `08` conservent les chapitres d’origine.
- **Découvrir Symbiose**, ou un clic sur l’écran du bureau, approche la caméra.
  Le lecteur YouTube se charge une fois cette approche terminée ; la lecture
  démarre ensuite par un clic sur le lecteur ou **Lire la vidéo**. Aucun autoplay.
- Le lecteur officiel est projeté sur les quatre coins de l’écran 3D par une
  matrice de perspective CSS synchronisée avec la caméra. Il conserve ses
  contrôles natifs, le plein écran et les sous-titres disponibles sur YouTube.
  Les fichiers locaux continuent d’utiliser une vraie `VideoTexture`.
- Pendant la lecture, molette et gestes tactiles ne déplacent pas le récit.
  La pause et la fin de lecture libèrent le défilement. Les boutons de chapitre
  permettent aussi de quitter le film en le mettant en pause.
- **Entrer dans le vivant** met le film en pause, recule d’abord de l’écran,
  puis lance le travelling de 14 secondes. Le scroll rend ensuite la main au visiteur.
  En mode présentation, la lecture continue de cinq minutes démarre à l’arrivée
  en forêt ; une molette, une touche ou un clic l’interrompt.
- **Passer l’introduction** rejoint directement la forêt. Le défilement inverse,
  `00`, le chapitre précédent depuis la forêt et `Home` en présentation permettent
  de revenir au bureau. Recommencer repart du prologue.
- Le dialogue des sources ou un onglet masqué met le film en pause.
- Plein écran et modes exploration/présentation conservent leurs commandes.

Les trois écrans de scroll supplémentaires précèdent les 21 existants. Une seule
`NarrativeTimeline`/`ScrollTrigger` pilote l’ensemble. Les coordonnées 0–1 des huit
chapitres restent inchangées après conversion du préfixe ; leurs durées et leur
horloge de cinq minutes sont conservées. Le prologue manuel est hors de cette
horloge. Les sauvegardes du jury restent dans leur format antérieur.
Le mode debug des sept transitions conserve volontairement son repère d’origine
sans prologue, pour permettre la comparaison avec les audits précédents.

## Vidéo YouTube et fichier local

La vidéo YouTube fournie par l’utilisateur (`J-cDr27eVC0`) est utilisée par défaut.
Il s’agit du film **provisoire** « AUBE présentation » (64 secondes au moment de
la vérification), pas d’une démonstration Symbiose. L’interface l’indique.
Pour remplacer ce lien, définir au build du frontend :

```dotenv
VITE_SYMBIOSE_INTRO_YOUTUBE_URL=https://www.youtube.com/embed/J-cDr27eVC0
```

L’[API IFrame officielle YouTube](https://developers.google.com/youtube/iframe_api_reference)
transmet les états lecture, mise en mémoire tampon, pause et fin. Elle n’est
chargée qu’après le choix du visiteur. Le défilement est bloqué pendant la
lecture et la mise en mémoire tampon, puis libéré à la pause ou à la fin.
Les erreurs d’intégration ou de réseau laissent une option de nouvelle tentative,
le passage de l’introduction et un lien vers YouTube. Une connexion Internet est
nécessaire pour ce film ; les paysages et le prologue restent utilisables hors ligne.

Pour une vidéo locale, déposer `demo.mp4` ou `demo.webm` dans `frontend/public/experience-media/`, puis
reconstruire le frontend. MP4 est déjà ignoré par Git. Le format conseillé est
16:9, environ 90 secondes. Les variables Vite existantes peuvent également être
utilisées dans la configuration locale du frontend :

```dotenv
VITE_SYMBIOSE_DEMO_URL=/experience-media/demo.mp4
VITE_SYMBIOSE_DEMO_CAPTIONS_URL=/experience-media/demo.fr.vtt
```

Les URL de fichiers média de cette configuration doivent rester locales. Fournir une piste WebVTT française pour un film
commenté. La même configuration continue d’alimenter le lecteur du chapitre
Démonstration existant, qui n’a pas été modifié. Un fichier peut aussi être choisi
depuis le bureau : il reste sur l’appareil, sans téléversement ni persistance.

## Ressources et limites visuelles

Le décor et ses textures de bois, normales, rugosité et enduit sont construits
par le nouveau module. Géométrie statique regroupée par matériau, lumière
indirecte chaude, verre, mobilier détaillé, carnet et équipements d’observation
complètent la scène. Les cartes sont des **schémas illustratifs non géolocalisés**,
sans faux résultat scientifique ni relevé cadastral. Le logo officiel est réutilisé
depuis son emplacement existant. Aucune dépendance supplémentaire. Le lecteur
YouTube externe est celui demandé par l’utilisateur ; les ressources du décor restent locales.

Le [poster du prologue 2D](../frontend/src/experience/prologue/office-poster.webp)
est désormais une **image générée photoréaliste**, et non une photographie de terrain
ou une capture du décor WebGL. Il représente un bureau naturaliste devant une forêt,
avec un espace sombre à gauche pour le texte et les éléments de travail à droite.
La forêt reste le sujet dominant ; aucun texte ni logo n’est intégré au visuel.

Génération avec l’outil intégré `image_gen`, puis préparation WebP avec Pillow :
source PNG native **1672 × 941**, normalisée à **2560 × 1440** par redimensionnement
Lanczos et recadrage infime au ratio 16:9. Ce traitement n’ajoute pas de détail natif.
Qualité WebP 88, méthode 6, **383 180 octets**. SHA-256 du WebP :
`fb26f5c1930d5fd75d5db8f4535b08cc57fbfefe1298f55e955c218e25db6bff`.
SHA-256 de la source PNG :
`ebdbfc5220483debc13c958eccfc5fb5b778bba4802e8588a7a3ab7d5362c8a3`.
Cette ressource importée par Vite est incluse automatiquement dans le cache
hors ligne du jury, sans modification du système de packaging.

Le rendu est un décor 3D procédural cohérent avec l’étude spatiale actuelle ;
il ne s’agit pas d’une captation réelle ou d’un bureau scanné. Les limites visuelles
de la forêt existante restent celles du projet. Le vrai film de 90 secondes
n’a pas pu être validé puisqu’il n’est pas fourni.

Sans WebGL, le prologue utilise cette image fixe avec un lecteur HTML visible.
Le paysage de forêt existant est préchargé et affiché derrière le poster. Sur les
derniers 10 % du prologue, le poster s’atténue pour révéler ce paysage déjà chargé ;
la timeline et la durée du travelling restent inchangées. Le repli ne prétend pas
reproduire un déplacement 3D. `prefers-reduced-motion`
conserve un point de vue fixe et permet de rejoindre la forêt immédiatement.

La typographie du seul mode 2D reprend la famille Georgia, la taille, la couleur
et l’approche du titre de `01 — Le problème`, avec le même ajustement mobile.
Un cadrage à 72 % conserve la baie et le bureau en portrait. Le lecteur conserve
son emplacement et ses styles compacts ; les textes, actions, contrôles média et
scène `OfficeScene.ts` restent inchangés. Le voile commun du récit est conservé.

Le prologue partage le renderer existant. Ses ressources sont libérées après la
première partie de la forêt, puis recréées si le visiteur revient. Vidéo, textures,
géométries, écouteurs et URL temporaires sont nettoyés au démontage. Les animations
du bureau cessent hors du prologue et lorsque l’onglet ou le dialogue suspend le rendu.

<details>
<summary>Prompt de génération du poster 2D</summary>

Use case: photorealistic-natural. Asset type: full-screen 16:9 photographic backdrop for the opening slide of Symbiose, a local biodiversity project. Generate one final image at 2560 x 1440 or higher, true 16:9 landscape. Ultra photorealistic cinematic environmental photography of a contemporary wildlife ecology research workspace opening onto an ancient lush temperate forest. Nature must dominate the scene, occupying most of the view. On the right, an understated beautifully weathered wooden desk partly visible in the foreground, an open field observation notebook with indistinct blank marks but NO legible writing, a discreet small wildlife trail camera, a few unmarked study sheets. Expansive floor-to-ceiling glass with very slim realistic frames looks into dense, deep green woodland, mossy trunks and ferns, with soft golden morning sunlight filtering through the leaves and subtle atmospheric mist. The room and desk must have believable architectural construction, tactile materials and natural proportions; avoid the symmetrical empty showroom look. The left approximately 45% of the frame is a visually quiet, darker area with deep emerald shadows and low-detail forest or interior silhouettes, reserved for a large off-white HTML editorial title; no bright windows, glaring rays or desk objects behind this left text area. The principal window, sunlit forest depth and desk are on the right half, but leave some breathing room so an HTML video player can be placed there without confusion. Shot like premium nature documentary photography, grounded natural texture, cinematic dynamic range, restrained golden highlights, rich green shadows, peaceful and immersive mood, organic asymmetrical composition, deep layered perspective. No people, no visible screens, no text, no lettering, no logos, no watermark, no UI, no drawn lines, no scientific chart. Must look like a genuine photographic scene aesthetically, not like a game environment, not an architectural CGI visualization, not a 3D render, not an illustration.

</details>

## Recette de la refonte artistique 2D

- Compilation TypeScript et production Vite réussies.
- **22 tests unitaires ciblés réussis** : caméra et horloge du prologue,
  contrôles vidéo, lecteur YouTube et projection de l’écran.
- **13 scénarios navigateur réussis sur le build de production**, sans scénario
  ignoré : nouvelle composition 2D, comparaison typographique exacte avec le titre
  de la diapositive 01, contrôles de contraste Axe sur les textes visibles,
  fondu sur la forêt préchargée à la molette et retour à 00, vidéo locale,
  états et erreurs YouTube, travelling, clavier, mouvements réduits et chapitres.
- La projection du lecteur dans le bureau WebGL, y compris en portrait, reste
  vérifiée par le scénario existant. `OfficeScene.ts`, `LandingPage.vue`,
  `PrologueOverlay.vue`, la timeline, le rendu de la forêt et les styles des
  autres chapitres n’ont pas été modifiés (contrôle Git).
- Installation hors ligne, réseau coupé puis rechargement : le nouveau poster
  de 2560 pixels est disponible ; le passage à la forêt et le retour restent possibles.
- Captures comparatives 00/01 à **1920 × 1080**, **1600 × 900** et **390 × 844**
  conservées dans `output/symbiose/prologue-2d-art/`, avec le rapport JSON de production.

Les tests YouTube utilisent une API et une iframe de test ; la vidéo locale est
la fixture `media-signal.webm`. Ils vérifient les commandes, pas la disponibilité
actuelle du film distant ni une démonstration produit. La nouvelle illustration
ne documente aucun lieu réel ni résultat scientifique. Le poster cible 2560 × 1440
est redimensionné depuis la source native plus petite, comme indiqué ci-dessus.

Reproduire la recette depuis `frontend/` :

```powershell
npm.cmd test -- tests/unit/prologue.test.ts tests/unit/prologue-video.test.ts tests/unit/youtube-screen.test.ts tests/unit/screen-projection.test.ts
npm.cmd run build
# Dans un terminal séparé :
node scripts/serve-jury.mjs dist 4188
# Puis, dans le terminal des tests :
$env:E2E_PRODUCTION = '1'
$env:E2E_BASE_URL = 'http://127.0.0.1:4188'
npm.cmd run test:e2e -- prologue-art.spec.ts prologue.spec.ts prologue-youtube.spec.ts
```

## Historique : intégration du prologue WebGL et du lecteur

Les listes et validations qui suivent décrivent l’intégration initiale du prologue.
La recette de la refonte 2D actuelle est celle de la section précédente.

Créés :

- `frontend/src/experience/prologue/OfficeScene.ts` — décor, matériaux, écran vidéo.
- `frontend/src/experience/prologue/prologue.ts` — conversion du préfixe et caméra.
- `frontend/src/experience/prologue/PrologueOverlay.vue` — média et commandes.
- `frontend/src/experience/prologue/prologue.css` — styles isolés du prologue.
- `frontend/src/experience/prologue/PrologueFallback.vue` — repli explicite.
- `frontend/src/experience/prologue/office-poster.webp` — image générée du prologue 2D.
- `frontend/src/experience/prologue/YouTubeScreen.vue` — lecteur officiel et cycle de vie.
- `frontend/src/experience/prologue/youtube-player.ts` — source configurable et chargement API.
- `frontend/src/experience/prologue/screen-projection.ts` — projection exacte du lecteur sur l’écran.
- `frontend/tests/unit/prologue.test.ts` — caméra, ouverture et horloge conservée.
- `frontend/tests/unit/prologue-video.test.ts` — états média et ressources.
- `frontend/tests/e2e/prologue.spec.ts` — parcours, vidéo et cache hors ligne.
- `frontend/tests/unit/youtube-screen.test.ts` — chargement manuel et états du lecteur.
- `frontend/tests/unit/screen-projection.test.ts` — perspective, coins et cadrage.
- `frontend/tests/e2e/prologue-youtube.spec.ts` — approche, lecture, retour et erreurs.
- `docs/PROLOGUE_SYMBIOSE.md` — ce document.

Modifiés :

- `frontend/src/pages/LandingPage.vue` — orchestration du préfixe et média.
- `frontend/src/experience/ExperienceCanvas.vue` — montage conditionnel du bureau
  dans le même monde et cadrage vidéo.
- `frontend/src/experience/NarrativeTimeline.ts` — conversion optionnelle du
  préfixe pendant la présentation ; comportement historique par défaut conservé.
- `frontend/src/experience/PresentationControls.vue` — bouton `00` et navigation.
- Tests navigateur `narrative.spec.ts`, `pitch.spec.ts`, `jury.spec.ts` et
  `spatial.spec.ts` — passage du prologue avant les assertions historiques,
  nouvelle numérotation et retour au prologue. Le test de présentation vérifie
  désormais la lecture continue déjà présente dans le moteur, plutôt qu’un ancien
  arrêt automatique. Le test spatial attend la pose finale exacte avant comparaison.

Aucun fichier de scène, shader, asset existant, texte narratif, route métier,
backend, authentification, dépendance ou configuration de déploiement modifié.
Git était propre au début de l’intervention.

## Vérifications historiques

- Build Vite et vérification TypeScript : réussis.
- Dix tests unitaires dédiés au prologue : réussis.
- Suite unitaire complète : **157 réussis, un échec préexistant** dans le contrôle
  d’intégrité des assets. `tree-atlas-metadata.json` fait 43 octets contre 44 annoncés
  par son inventaire. Le blob Git initial fait également 43 octets ; ni ce fichier
  ni son inventaire n’ont été modifiés dans ce périmètre.
- Tests navigateur sur Chrome/NVIDIA : **21 réussis**, couvrant le nouveau prologue,
  les sept transitions historiques, le pitch, les médias et le jury.
- Trois tests supplémentaires sur le build de production : **réussis**, avec
  installation hors ligne, rechargement sans réseau, poster du prologue, huit
  chapitres et modèles 3D disponibles.
- Captures GPU des six phases du bureau, version mobile 390 × 844, focus vidéo,
  perte réelle de contexte WebGL et retour à un seul canvas : vérifiés visuellement.
- Avant/après des huit scènes : mêmes nombres de triangles et appels de rendu,
  poses identiques à `2 × 10⁻¹³` près. Quatre images sont identiques pixel par pixel ;
  l’écart RGB moyen maximal des autres vaut `0,084/255`. Empreintes des modules
  caméra, monde, transitions et contenu d’origine inchangées.
- Sur la machine de l’audit : environ 57 images/s, 93 appels de rendu au bureau
  sur ordinateur et 67 en qualité mobile. Ces mesures ne garantissent pas les
  performances d’autres matériels.

Les captures et rapports locaux sont dans `output/symbiose/prologue-baseline/`
et `output/symbiose/prologue-validation/` ; ces dossiers d’audit sont ignorés par Git.

## Lancement

```powershell
# Socle déjà démarré : reconstruire uniquement le frontend.
docker compose up -d --build --no-deps frontend

# Développement et vérifications, depuis frontend/ :
npm.cmd ci
npm.cmd run dev -- --port 4173
npm.cmd run build
npm.cmd test
npm.cmd run test:e2e -- prologue.spec.ts narrative.spec.ts pitch.spec.ts jury.spec.ts spatial.spec.ts
```

Les tests GPU nécessitent un navigateur avec accélération matérielle. Pour les
tests du service worker, servir le build de production et définir
`E2E_PRODUCTION=1` ainsi que `E2E_BASE_URL`. Le Compose ngrok existant peut toujours
être utilisé sans modifier ses fichiers. La landing publique reste réservée aux
visites déconnectées ; `/jury/` permet de consulter la présentation autonome.
