# Symbiose — un voyage plus long

Le parcours immersif comprend trois explorations supplémentaires et un défilement
plus lent. Sa distance de scroll passe de **24 à 42 hauteurs d’écran**, soit
**×1,75**, bureau compris. Depuis le 19 novembre 2026, la lecture continue dure
**5 minutes**, hors prologue et vidéo d’introduction, calée sur le pitch à deux
voix (voir le [guide du présentateur](PRESENTER_GUIDE.md)).

Le [conducteur actuel](CONDUCTEUR_SYMBIOSE.md) fixe treize séquences exactes.
L’entrée `/jury/` utilise **39 hauteurs**, commence directement dans la forêt
et attend **Démarrer le pitch** ; l’entrée publique `/` garde le bureau et ses
trois hauteurs supplémentaires. Les pauses de caméra du jury ne suspendent pas
l’horloge. Les trois explorations conservent leurs géométries et le parcours
libre réversible.

## Les nouveaux passages

| Passage | Emplacement | Contenu |
| --- | --- | --- |
| Le sol vivant | Après le début de la forêt, avant le ciel | Descente dans une coupe de sol, horizons, racines et mycélium, lombric annelé, larve de coléoptère et carottier |
| Survol du bocage | Entre la prairie et le littoral | Drone avec caméra et rotors, trajectoire en bandes, cône lumineux vert et quadrillage suivant le relief |
| Plongée à Étretat | Dans le passage du littoral | Descente vers la Manche, franchissement de la surface à `y=0`, poissons, algues, fond marin, puis remontée face aux falaises |

Le lombric est identifié comme un annélide. Les organismes, horizons et tracés
sont des illustrations pédagogiques, sans score ni mesure inventée. Le carottage
et les relevés par drone ne sont pas présentés comme des traitements opérationnels
de Petection. Le passage marin est une évocation artistique, pas une captation.

Le scroll, le curseur et les commandes précédent/suivant parcourent les nouvelles
scènes dans les deux sens. Trois raccourcis permettent de les ouvrir directement.
**Poursuivre le voyage** retrouve le parcours principal. Dans le parcours public,
le bureau et sa vidéo officielle restent accessibles par `00` ; les huit chapitres d’origine gardent leurs
boutons. Les mouvements réduits utilisent un point de vue fixe par exploration.
Le repli sans WebGL fournit trois diagrammes explicitement signalés.

## Raccordement et ressources

Une seule timeline GSAP pilote le voyage. Les 210 unités du monde initial et ses
clés de caméra restent conservées. `excursions/route.ts` ajoute 35 unités de sol,
30 de survol et 40 de mer : le nouveau repère compte 315 unités. Les parties
historiques restent elles aussi plus lentes, car ces unités occupent 39 écrans de
scroll, auxquels s’ajoutent les trois du bureau.

Les explorations occupent 24, 30 et 30 secondes de l’horloge de présentation
(50 secondes chacune avant le recalage sur le pitch de cinq minutes). Les repères
horaires affichés par les chapitres et le curseur utilisent cette nouvelle
horloge ; les textes et les durées du script source ne sont pas réécrits.
Le mode debug des sept transitions garde son ancien repère pour les audits.

Les trois décors sont placés dans **le monde 3D initial**, avec sa caméra, son
éclairage, son ciel, ses falaises et sa surface d’eau. Aucun fondu, changement de
vue ou voile de raccord ne remplace le mouvement de caméra. Les ressources du
décor actif sont chargées à la demande puis libérées à sa sortie.

`connected-camera.ts` décrit des trajectoires continues pilotées par le scroll.
Leurs positions, cibles et focales aux deux extrémités correspondent exactement
au point d’insertion dans le parcours initial :

- Forêt : la caméra se penche vers une ouverture réelle dans le terrain, descend
  devant les horizons du sol puis remonte dans la forêt. Des parois et un fond
  ferment le volume souterrain ; le brouillard suit la profondeur.
- Bocage : la caméra tourne à droite, descend vers le drone et contourne sa zone
  d’étude, avant de reprendre la direction du littoral. Le quadrillage épouse
  le relief existant.
- Étretat : la caméra s’approche de la mer, franchit la surface à `y=0`, suit les
  poissons puis remonte face aux mêmes falaises. L’immersion et la réfraction
  suivent sa hauteur réelle.

Les animations du drone, des poissons et des organismes dépendent de la
progression locale : revenir en arrière reproduit le même déplacement, sans
horloge concurrente ni animation aléatoire par image.

Trois modèles de poissons se distinguent par leur silhouette et leurs couleurs :
**maquereau, lieu jaune et plie**. Jusqu’à cinq cadres sont projetés à partir des
dimensions et de la transformation de chaque poisson visible. Ils suivent les
individus et disparaissent hors champ ou après la remontée. Les étiquettes
portent la mention « illustration » : aucune inférence IA n’est exécutée dans
la landing.

Bois, sol, végétation et organismes sont procéduraux. Les falaises réutilisent
leur géométrie et les textures PBR locales déjà référencées dans
`frontend/public/experience-models/inventory.json`, avec une propriété et un
nettoyage séparés. Aucun téléchargement externe, modèle IA ou dépendance ajouté.
Les plans de coupe restent une représentation artistique ; ils ne reproduisent
pas une parcelle ou une biodiversité mesurées.

## Fichiers

Les nouveaux modules sont dans `frontend/src/experience/excursions/` :
`route.ts`, `connected-camera.ts`, `SoilScene.ts`, `DroneScene.ts`, `MarineScene.ts`,
`ExcursionOverlay.vue`, `ExcursionFallback.vue` et `excursions.css`.

Le raccordement concerne `LandingPage.vue`, `ExperienceCanvas.vue`,
`NarrativeTimeline.ts`, `PresentationControls.vue`, `NarrativeOverlay.vue`,
`telemetry.ts` et la conversion du préfixe dans `prologue/prologue.ts`.
Les clés de caméra et les huit atmosphères d’origine restent conservées.
`JourneyWorld.ts`, `world-terrain.ts` et les shaders raccordent l’ouverture du sol
et la surface marine au monde existant. Aucun changement métier, API, authentification,
worker, dépendance ou configuration de déploiement.

Tests dédiés : `expanded-route.test.ts`, `connected-camera.test.ts`,
`marine-fish.test.ts`, `expanded-journey.spec.ts` et `connected-excursions.spec.ts`.
Les tests navigateur du parcours
historique sont adaptés aux nouvelles coordonnées du curseur et à l’horloge,
en conservant leurs assertions sur les poses de caméra d’origine.

## Vérifications et limites

- TypeScript et build Vite : validés.
- Vingt-cinq tests unitaires dédiés : conversion réversible, horloge de 450
  secondes, longueur ×1,75, poses exactes aux raccords, trajectoires continues,
  franchissement du sol et de la mer, et projection des cadres sur les poissons.
- Sept parcours navigateur dédiés : validés sur Chrome/NVIDIA, incluant poses
  exactes aux raccords, trajet inverse, cadres des trois poissons, mobile 390 px,
  mouvements réduits, retour aux huit chapitres et CTA final.
- Trente-deux parcours navigateur du voyage complet : validés, incluant le bureau,
  YouTube, les huit chapitres, les sept transitions et les nouvelles explorations.
- Quatre contrôles du build de production : validés après installation et
  rechargement hors ligne, avec les trois nouvelles scènes 3D, les modèles,
  le prologue et les huit atmosphères disponibles sans réseau.
- Quinze états GPU et trois vues mobiles examinés : sol, drone et mer. Les erreurs
  de shader du halo et le chevauchement des étiquettes avec le pied de page ont été
  corrigés ; aucun défaut de shader dans la dernière série de captures.
- Suite unitaire complète : 194 réussites, un échec préexistant sur l’inventaire
  de `tree-atlas-metadata.json` (43 octets présents contre 44 annoncés). Ce fichier
  et son inventaire restent inchangés.

Les captures et rapports locaux sont conservés dans
`output/symbiose/expanded-review/` (dossier d’audit ignoré par Git).

## Lancement

```powershell
# Depuis la racine, si le socle est déjà lancé :
docker compose -f docker-compose.yml -f docker-compose.ngrok.yml up -d --no-deps --build --wait frontend

# Depuis frontend/ :
npm.cmd run dev -- --port 4173
npm.cmd run build
npm.cmd test
npm.cmd run test:e2e -- expanded-journey.spec.ts connected-excursions.spec.ts
```

La landing reste publique pour les visiteurs déconnectés. `/jury/` permet
d’explorer la présentation autonome. Les essais GPU nécessitent un navigateur
avec accélération matérielle ; les tests de repli fonctionnent sans GPU.
