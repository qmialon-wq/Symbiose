# Symbiose — voyage continu et transitions

Le [parcours étendu](EXPLORATIONS_SYMBIOSE.md) ajoute désormais le sol vivant,
un survol par drone et une plongée à Étretat : 42 hauteurs de scroll, soit ×1,75,
et une lecture continue de 5 minutes, calée sur le pitch à deux voix. Le repère des huit scènes décrit ci-dessous
reste la référence interne conservée pour leurs caméras et leurs transitions.

Le [pitch du Datathon 2026](PITCH_DATATHON_2026.md) ajoute désormais huit chapitres sourcés, un script de cinq minutes avec créneau vidéo de 90 secondes, un carnet local des sources, la navigation de présentation avec arrêts, le plein écran et un CTA configurable. Le moteur spatial ci-dessous conserve son repère de 210 unités ; ces unités ne sont plus la durée de la présentation. Le règlement, la trame de descriptif et les cinq questions fournis sont intégrés au carnet. La vidéo produit sera montée ultérieurement par l’équipe.

La landing publique de `/` présente huit environnements dans **un même monde 3D**, parcouru par une caméra pilotée par le scroll natif. Les sept raccords partagent leurs poses de sortie et d’entrée. La rotation suit une cible interpolée, le champ reste entre 57 et 59 degrés environ : aucun fondu entre deux fonds photographiques ne remplace le déplacement.

Le rendu est une **étude spatiale et artistique provisoire**, signalée dans l’interface. Les ressources existantes sont huit compositions générées et huit premiers plans alpha ; ces derniers sont réutilisés dans le monde. Les cleanplates, profondeurs calibrées, arbres et falaises de production restent absents : les 41 manques du [manifest artistique](../frontend/public/experience-art/manifest.json) ne sont pas masqués ou déclarés résolus. La finition naturaliste de la référence National Geographic n’est pas atteinte. Le [rapport de validation](TRANSITIONS_VALIDATION.md) distingue les résultats techniques et cette limite visuelle.

## Lancement avec le Compose habituel

Le service frontend existant inclut le moteur, les shaders et les fichiers locaux dans son build Vite/Nginx. Aucun service, volume, worker ou override supplémentaire n’est requis. Le GPU utilisé est celui du navigateur ; le Compose GPU des workers IA n’intervient pas dans le rendu.

```powershell
# Depuis la racine ; actualiser uniquement le frontend si le socle tourne déjà.
docker compose up -d --build --no-deps frontend
```

Ouvrir <http://localhost:8080/> sans session connectée. Si le socle est arrêté, utiliser le lancement habituel `docker compose up -d --build --wait` ; le réseau externe `web` doit exister, comme dans la configuration actuelle du dépôt. Avec une session connectée, `/` conserve l’accueil métier. Les fonctions métier nécessitent leur backend habituel.

Pour travailler hors Docker :

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev -- --port 4173
```

Aucun CDN, police distante, modèle téléchargé ou service graphique n’est nécessaire au lancement après installation. La vérification de session existante reste active. Les ressources sont servies par le même serveur local.

## Chargement et fluidité — 16 novembre 2026

Le chevreuil vectoriel de connexion accompagne maintenant l’ouverture de la
landing, y compris pendant le téléchargement de son composant. La barre suit
les étapes terminées du moteur : création du monde, lumière, bureau, compilation
et premier affichage. Ce sont des jalons de préparation, pas un pourcentage
fictif des octets téléchargés. Aucun délai minimum ne retient une scène prête.
Une sortie vers la version sans 3D reste disponible pendant l’initialisation.
Les mouvements réduits affichent le chevreuil immobile.

Le bureau s’ouvre avant les modèles extérieurs. Ceux-ci se préparent ensuite
pendant une période inactive du navigateur ; avec l’économie de données activée,
ils attendent le départ du bureau. Les assets restent locaux et partagés avec
le mode jury. L’installation hors ligne explicite conserve le pack complet,
y compris les ressources détaillées.

Dans **Régie du récit → Qualité visuelle**, le visiteur peut choisir
**Automatique**, **3D légère** ou **3D détaillée**. Ce choix est mémorisé ; le
changement conserve la position dans le récit. `?quality=eco` et
`?quality=standard` permettent aussi un essai direct. Le mode automatique démarre
léger sur mobile, avec peu de mémoire/cœurs signalés, une connexion limitée ou
l’économie de données. Ces indications servent à choisir une qualité initiale,
elles ne constituent pas un benchmark matériel.

Le mode léger utilise l’atlas existant pour les arbres proches et lointains,
évite les GLB de décors les plus lourds et les cartes PBR secondaires, réduit
la taille des textures décodées et plafonne le rendu à 900 000 pixels. Les ombres
dynamiques et le reflet planaire sont désactivés. La mer, le drone, la coupe du
sol, les animaux et leurs cadres restent parcourables dans le même monde 3D.
Les cadres légers sont enveloppants, avec des bornes animées rafraîchies, afin
d’éviter de reparcourir chaque sommet à chaque image.

Le bureau immobile ne conserve plus de boucle de rendu permanente. Le moteur
se réveille pour le scroll, l’approche de l’écran, une vidéo locale active, un
redimensionnement ou un asset terminé. Les limites du défilement sont mesurées
au rafraîchissement, plutôt qu’à chaque image. La télémétrie Vue reste superficielle.
Deux fenêtres de déplacement lent réduisent la qualité ; si le mode léger reste
durablement sous 16 images/s, le parcours passe automatiquement au rendu 2D.
Les sauts ponctuels entre chapitres et les périodes inactives sont exclus de
cette mesure.

Mesure locale du début du parcours `/jury/`, cache navigateur neuf, indications
de 4 threads/4 Go simulées et CPU Chrome ralenti ×4. Le GPU reste la NVIDIA
matérielle de la machine de test ; ce protocole ne simule pas un GPU ancien.

| Mesure | Avant | Après, mode léger automatique |
| --- | ---: | ---: |
| Transfert observé jusqu’au début de la forêt | 22,1 Mo | 5,3 Mo |
| Premier affichage prêt | 4,42 s | 1,44 s |
| Triangles dans la forêt | 2 670 173 | 55 318 |
| Soumission CPU médiane par image | 6,4 ms | 3,9 ms |
| Soumission CPU au 95e percentile | 10,1 ms | 6,0 ms |

Ces mesures correspondent à ce scénario, pas à une promesse de cadence sur tous
les appareils. Les rapports, profils CPU et captures de contrôle sont conservés
dans `output/symbiose/performance-review/`, ignoré par Git.

Vérifications dédiées : `render-quality.test.ts` (18 tests) et
`landing-performance.spec.ts` (5 scénarios). Le contrôle de fuite de ressources
parcourt plusieurs fois les huit chapitres en qualité détaillée et légère.
TypeScript, le build et 42 scénarios navigateur sont validés, dont quatre
contrôles hors ligne du build déployé. La suite unitaire compte 212 réussites et
retrouve l’échec préexistant de l’inventaire de
`tree-atlas-metadata.json` : 43 octets présents contre 44 déclarés. Ni ce fichier
ni son inventaire ne sont modifiés ici.

```powershell
docker compose -f docker-compose.yml -f docker-compose.ngrok.yml up -d --no-deps --build --wait frontend
# Landing publique : http://localhost:8081/ ; présentation autonome : /jury/

cd frontend
npm.cmd test -- tests/unit/render-quality.test.ts
npm.cmd run test:e2e -- landing-performance.spec.ts spatial.spec.ts
```

## Architecture et isolation

`App.vue` garde sa condition d’accueil public et son import asynchrone de `LandingPage.vue`. Le moteur se monte uniquement sur cette landing. Ses styles sont sous `.sx-experience`, sans mutation des styles `body`, des gardes de routes ou des appels métier. Aucun fichier backend, base de données, stockage vidéo ou worker n’est modifié par cette phase.

Les modules se trouvent dans `frontend/src/experience/` :

| Module | Rôle |
| --- | --- |
| `config.ts` | Huit chapitres, durées, textes, ressources locales, clés de caméra et ancres |
| `journey.ts` / `TransitionManager.ts` | Sept plages contiguës, conversion local/global, effets purs et masques de couches |
| `NarrativeTimeline.ts` | GSAP/ScrollTrigger, scroll natif, curseurs, lecture et redimensionnement |
| `CameraController.ts` | Hermite temporel pour position, cible et focale ; continuité des vitesses aux clés |
| `ExperienceCanvas.vue` | Renderer, taille, chargement, perte de contexte, télémétrie et nettoyage |
| `JourneyWorld.ts` / `world-*.ts` | Relief et lit de rivière, eau, végétation instanciée, observation, côte, atmosphère et particules |
| `AtmosphereController.ts` | Exposition liée au passage jour/nuit |
| `RefractionPass.ts` / `shaders.ts` | Déformation de l’unique rendu du monde, surface aquatique, ciel et brume |
| `NarrativeOverlay.vue` / `JourneyAnnotations.vue` | Texte, cadre projeté sur le chevreuil, transformation pédagogique et logo officiel |
| `DebugControls.vue` | Choix du raccord, progression locale, couches et inspection de caméra/performance |
| `FallbackScene.vue` | Repli 2D explicitement annoncé, images locales et masques spatiaux réversibles |
| `AssetPreloader.ts` | Chargements parallèles, délai maximal, annulation, erreurs visibles et précompilation |
| `PerformanceMonitor.ts` | Mesure pendant le mouvement continu et réduction de résolution en cas de lenteur |

L’état rendu dépend de `p` global, entre 0 et 1. La position du scroll vaut `p × hauteurScrollable`, sur 21 hauteurs de scroll. Le repère spatial reste de 0 à 210. `pitch.ts` le relie à un script de **300 secondes**, avec 90 secondes réservées à la démonstration manuelle. La lecture du récit s’arrête à chaque chapitre ; elle ne démarre jamais la vidéo. Ce compteur représente une position éditoriale, pas un chronomètre de parole. Le fichier produit reste à fournir ; une capture issue du manifeste le remplace explicitement et un fichier local peut être choisi sans téléversement.

Pour un raccord : `p = (début + u × (fin − début)) / 210`, avec `u` normalisé entre 0 et 1. Les effets n’utilisent ni horloge murale ni animation aléatoire à chaque image. Bulles, eau, signaux cartographiques, éclairage et particules sont échantillonnés à partir du même temps narratif. Les tirages du décor sont initialisés par graine fixe.

## Les sept raccords

| Identifiant DEBUG | Temps | Mouvement et état intermédiaire |
| --- | --- | --- |
| `ascent` | 0–35 s | Départ à 0,70 m, montée entre troncs et plans de fougères, regard levé, passage des couronnes, sortie à 65 m |
| `territory-dive` | 35–60 s | Descente de la canopée vers le relief, parcelles tracées dans l’espace du terrain et courbe de rivière suivie par le regard |
| `immersion` | 60–95 s | Approche de l’eau à y=0 puis caméra jusqu’à −5 m ; ligne d’eau, réfraction, teinte, turbidité et particules |
| `emergence` | 95–115 s | Remontée depuis le fond, bulles, franchissement de la même surface et apparition des roseaux |
| `observation-data` | 115–150 s | Chevreuil géométrique sur un îlot, cadre projeté à partir de son volume 3D, élargissement en panneau puis recul ascendant vers le bocage |
| `territory-coast` | 150–180 s | Survol illustratif, tracé territorial puis ouverture sur une arche et une Aiguille 3D distinctes évoquant Étretat |
| `living-cycle` | 180–210 s | Courbe vers la forêt, diminution de lumière, ciel nocturne/étoiles et particules convergeant vers la silhouette du logo officiel |

Le trajet rivière → milieu marin et le survol vers Étretat sont des **ellipses de récit**, sans localisation ou distance réelle revendiquée. Les parcelles ne sont pas des données cadastrales. Le chevreuil, les poissons et les dispositifs sont des illustrations. L’identification est candidate, la confiance explicitement « non calculée » ; aucune inférence, observation réelle ou recommandation écologique n’est produite par la landing.

## Shaders et effets

Le ciel utilise un dôme centré sur la caméra : gradient atmosphérique, bruit cohérent, soleil, étoiles et lune. Des volumes transparents doux complètent les nuages ; ce n’est pas du ray marching volumétrique. La brume combine le fog exponentiel du monde et quelques nappes transparentes. Les couronnes provisoires sont des instances de plans feuillus ; leurs silhouettes obliques restent une limite connue.

L’eau est une surface à y=0, à largeur progressive. Son shader utilise des ondulations et des reflets graphiques, sans reflection probe ou simulation physique. `RefractionPass` rend **une seule scène** dans une texture, puis déforme ses coordonnées UV pendant le passage en immersion. La ligne d’eau visible provient uniquement du maillage à y=0 : aucun deuxième bandeau d’écran ne simule son passage. La teinte, la turbidité et les rayons dépendent du même `u`. Ce procédé est une réfraction d’écran simplifiée : il ne reconstruit pas les objets occultés et ne calcule pas Snell/Fresnel. La sortie applique tone mapping et conversion sRGB une seule fois.

Les bulles suivent des cycles déterministes avec extinction aux points de recyclage. Les particules de conclusion convergent vers des points échantillonnés dans l’alpha du **logo existant**, sans redessiner sa marque. Le logo PNG officiel est ensuite lisible dans l’interface. Les données sont symboliques. Aucun son, signal acoustique mesuré, bande sonore ou lecture vidéo n’est inventé.

## DEBUG, contrôles et repli

Ouvrir <http://localhost:8080/?debug=transitions>. Un lien direct accepte aussi `&transition=immersion&p=0.5`. Le panneau est repliable pour examiner le rendu et utiliser les éléments situés derrière lui.

- Sélecteur des sept raccords et slider local 0–1 ; boutons 0/25/50/75/100 %.
- Couches indépendantes : relief, végétation, eau/réfraction, atmosphère, cartographie, observation et particules. La référence générée est une vignette fixe identifiée, jamais un remplacement du déplacement.
- Position, cible, champ de vision, progression, draw calls, triangles, DPR, qualité et cadence mesurés pendant le déplacement.

La molette, le tactile et les touches PageUp/PageDown/Home/End conservent leur comportement natif. Les contrôles sont des boutons, sliders et liens accessibles au clavier. Un geste utilisateur interrompt la lecture. Il n’y a pas de `preventDefault` sur le scroll. `prefers-reduced-motion` affiche huit points de vue fixes et désactive la lecture automatique ; l’utilisateur peut aussi demander cette réduction dans le dialogue du projet.

Sans WebGL, ou après perte de contexte, le repli utilise les compositions générées avec des **masques 2D**, clairement annoncés. Il conserve les textes, les contrôles et les liens vers l’application. Il ne revendique pas une caméra physique. Pendant un chargement de nouvelle paire, l’état déjà affiché est conservé ; une erreur reste visible. Les ressources WebGL sont toutes décodées avant révélation, avec délai de huit secondes par fichier et compilation préalable. Un calque indisponible est signalé, sa géométrie provisoire reste utilisable.

Au démontage Vue : GSAP context/tweens/ScrollTrigger, écouteurs, ResizeObserver, RAF, requêtes, bitmaps, textures, instances, matériaux, géométries, framebuffer et renderer sont libérés. Le redimensionnement reconstruit projection, résolution et longueur de scroll ; une destination explicitement demandée survit aussi au rafraîchissement différé de GSAP.

## Vérifier et produire les captures

```powershell
cd frontend
npm.cmd run assets:check
npm.cmd run build
npm.cmd run test
npm.cmd run test:e2e -- narrative.spec.ts art-direction.spec.ts authenticated-workspace.spec.ts logo-navigation.spec.ts
# Avec un serveur déjà actif (4173 par défaut)
npm.cmd run audit:transitions -- --gpu
npm.cmd run audit:transitions -- --fallback
```

Pour viser Nginx, définir `$env:E2E_BASE_URL = 'http://127.0.0.1:8080'` avant les tests/audits. `--gpu` demande ANGLE D3D11 sous Windows ; le rapport consigne le renderer réellement utilisé, sans supposer une RTX. L’audit logiciel sans cette option est aussi disponible. Éviter d’exécuter plusieurs audits à la fois pour mesurer la cadence.

Chaque audit produit 35 captures, sept captures de rejeu, un `report.json` et une galerie `index.html` dans `output/symbiose/transitions/{gpu,software,fallback}/`. Les états couvrent les cinq positions imposées, puis le parcours inverse. Le rapport conserve les poses réelles et compare les pixels du rejeu à 50 %. Les chiffres de cadence correspondent à un aller-retour scripté par raccord ; ils ne garantissent pas les performances de tous les appareils.

L’ancien script `audit:narrative` est un alias vers cet audit : les anciennes captures du prototype à deux environnements restent des archives. Les documents `docs/art-direction/` décrivent la livraison artistique de phase 2 ; leurs verrous de production ne constituent pas une approbation des modèles provisoires de cette phase.
