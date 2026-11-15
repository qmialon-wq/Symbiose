# Symbiose — Du bureau au vivant

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

`office-poster.webp` est une capture du vrai décor sur GPU, sans les contrôles HTML,
1440 × 900, qualité WebP 0,88, 93 568 octets. SHA-256 :
`cca5f76d0ae53923512ec4b892e9aadfabcf151c3d87462af35df6a20aee4588`.
La capture PNG source a pour empreinte
`f1586cc7030baa628d359514f2bdf68d4e941817bb3116157696f5e56b7c00ab`.
Cette ressource importée par Vite est incluse automatiquement dans le cache
hors ligne du jury, sans modification du système de packaging.

Le rendu est un décor 3D procédural cohérent avec l’étude spatiale actuelle ;
il ne s’agit pas d’une captation réelle ou d’un bureau scanné. Les limites visuelles
de la forêt existante restent celles du projet. Le vrai film de 90 secondes
n’a pas pu être validé puisqu’il n’est pas fourni.

Sans WebGL, le bureau devient explicitement une vue fixe de ce décor, avec un
lecteur HTML visible. Son raccord de secours atténue cette image avant la forêt ;
ce repli ne prétend pas reproduire un déplacement 3D. `prefers-reduced-motion`
conserve un point de vue fixe et permet de rejoindre la forêt immédiatement.

Le prologue partage le renderer existant. Ses ressources sont libérées après la
première partie de la forêt, puis recréées si le visiteur revient. Vidéo, textures,
géométries, écouteurs et URL temporaires sont nettoyés au démontage. Les animations
du bureau cessent hors du prologue et lorsque l’onglet ou le dialogue suspend le rendu.

## Fichiers et périmètre du diff

Créés :

- `frontend/src/experience/prologue/OfficeScene.ts` — décor, matériaux, écran vidéo.
- `frontend/src/experience/prologue/prologue.ts` — conversion du préfixe et caméra.
- `frontend/src/experience/prologue/PrologueOverlay.vue` — média et commandes.
- `frontend/src/experience/prologue/prologue.css` — styles isolés du prologue.
- `frontend/src/experience/prologue/PrologueFallback.vue` — repli explicite.
- `frontend/src/experience/prologue/office-poster.webp` — capture réelle du décor.
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

## Vérifications effectuées

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
