# Étape 22 — quatre décors photoréalistes pour le secours 2D

La refonte remplace les SVG de `soil`, `drone` et des deux états de `marine` par
quatre fonds WebP locaux. Les textes présents sur la branche `a25b51d`, les
réserves scientifiques, les contrôles, la vidéo, les horaires et le routage
narratif sont conservés. Aucun fichier de scène Three.js, caméra, shader ou
post-traitement n’est modifié.

## Ressources et provenance

Les quatre décors sont de nouvelles générations photoréalistes réalisées avec
le skill `imagegen` et l’outil intégré `image_gen`. Leur nature artistique reste
explicite ; aucune captation réelle ou observation scientifique n’est annoncée.

- [Sol vivant](../frontend/public/experience-art/excursions/soil.webp).
- [Survol du bocage](../frontend/public/experience-art/excursions/drone-bocage.webp).
- [Littoral](../frontend/public/experience-art/excursions/marine-surface.webp).
- [Fond marin](../frontend/public/experience-art/excursions/marine-underwater.webp).

La [provenance détaillée](../frontend/public/experience-art/excursions/README.md)
donne les prompts, le format, les empreintes et la méthode d’encodage. Chaque
image mesure 1664 × 936 pixels, en 16:9 exact, sans texte ou bouton incrusté.
Les quatre WebP représentent ensemble environ 1,06 Mio.

## Affichage et transitions

Les images remplissent le même écran avec `object-fit: cover`, un cadrage
adapté et un léger assombrissement à gauche. Les titres et contrôles restent
des éléments HTML. Les images décoratives sont masquées aux technologies
d’assistance ; les erreurs de chargement disposent d’un statut accessible.

Pour la scène marine, deux images complètes sont superposées. L’opacité est
une fonction pure de `state.local`, avec des raccords à vitesse nulle :

| Position marine | Affichage | Horloge jury indicative |
| --- | --- | --- |
| 0–0,20 | Littoral complet | 3:48–3:54 |
| 0,20–0,40 | Fondu vers l’immersion | 3:54–4:00 |
| 0,40–0,70 | Fond marin complet | 4:00–4:09 |
| 0,70–0,90 | Fondu vers le littoral | 4:09–4:15 |
| 0,90–1 | Littoral complet | 4:15–4:18 |

Revenir en arrière restitue les mêmes opacités. Aucune ligne de partage,
translation d’image, animation indépendante ou modification des textes n’est
liée au changement de décor. Comme dans le secours précédent, les mouvements
réduits fixent la vue marine au cœur de l’immersion ; l’horloge reste utilisable.

## Chargements et mode hors ligne

Les images ne sont publiées qu’après décodage. Le paysage principal disponible
reste derrière le composant pendant le premier chargement ; le dernier décor
décodé est conservé lors d’un changement rapide. Si une image échoue, le récit
reste navigable et le paysage disponible demeure affiché.

Après le sol, le bocage est préchargé à faible priorité ; après le bocage,
les deux vues marines sont préparées. Le composant annule les demandes devenues
inutiles, ignore les retours de décodage périmés et nettoie les chargements au
démontage. Un délai maximal de huit secondes évite toute attente indéfinie.
Il ne suspend jamais l’horloge du récit.

Le manifeste hors ligne inclut les quatre WebP. Le build contient désormais
58 ressources de jury, environ 159,07 Mio avec la vidéo officielle. Après mise
à jour, utiliser **Préparation du jury → Vérifier / actualiser l’installation**
pour remplacer une ancienne édition en cache.

## Comparaisons visuelles

La [galerie avant/après](../output/symbiose/step22/comparaison.html) présente les
quatre états à 1600 × 900. Les captures sont réalisées sur le même récit, avec
les mêmes titres et contrôles.

| État | Avant | Après |
| --- | --- | --- |
| Sous nos pas, 0:18 | [SVG](../output/symbiose/step22/before/01-soil.png) | [Photographie générée](../output/symbiose/step22/after/01-soil.png) |
| Équipe ARQ, 3:16 | [SVG](../output/symbiose/step22/before/02-team.png) | [Bocage](../output/symbiose/step22/after/02-team.png) |
| Littoral, 3:54 | [SVG](../output/symbiose/step22/before/03-marine-surface.png) | [Falaises](../output/symbiose/step22/after/03-marine-surface.png) |
| Immersion, 4:03 | [SVG](../output/symbiose/step22/before/04-marine-underwater.png) | [Fond marin](../output/symbiose/step22/after/04-marine-underwater.png) |

La capture d’immersion est prise à 4:03 : à 4:16, la progression existante se
trouve déjà dans le retour au littoral. Le minutage n’est pas déplacé pour
modifier cette correspondance.

## Fichiers

- `frontend/src/experience/excursions/ExcursionFallback.vue` : images et affichage résilient.
- `frontend/src/experience/excursions/fallback-art.ts` : opacité réversible, cadrages et chargements annulables.
- `frontend/src/experience/excursions/excursions.css` : couverture, fondu d’entrée, contraste et mouvements réduits.
- `frontend/public/experience-art/excursions/` : quatre WebP et provenance.
- `frontend/src/experience/content/runtime-assets.json`, `frontend/public/experience-art/runtime-assets.json` : rubrique ajoutée ; les huit paysages et le poster existants restent identiques.
- `frontend/scripts/prepare-excursion-art.py`, `optimize-experience.py`, `jury-build.mjs` : encodage, préservation de la rubrique et cache hors ligne.
- `frontend/tests/unit/excursion-art.test.ts`, `fallback-excursion-motion.test.ts`, `jury-build.test.ts` : ressources, décodage, annulation, reprise et cache.
- `frontend/tests/e2e/expanded-journey.spec.ts` : photographie, rendu, contrôles et non-régression.
- Ce rapport et `output/symbiose/step22/` : captures et comparaison.

## Commandes

Depuis `frontend/` :

```powershell
npm.cmd test -- --maxWorkers=2 --testTimeout=15000
npm.cmd run build
node node_modules/@playwright/test/cli.js test expanded-journey.spec.ts jury-conductor.spec.ts fallback-transitions.spec.ts
```

Depuis la racine, pour reconstruire le frontend local :

```powershell
docker compose up -d --build --no-deps frontend
```

Ouvrir `http://localhost:8080/jury/?render=2d` ou le parcours public
`http://localhost:8080/?render=2d`. Pour les tests du cache, définir
`E2E_BASE_URL=http://127.0.0.1:8080` et `E2E_PRODUCTION=1` avant Playwright.

## Résultats de validation

- **34 scénarios navigateur distincts validés**, dont **10 sur la version Docker**.
  La recette couvre les deux modes, les trois explorations et quatre ambiances,
  les formats 1600 × 900, 1920 × 1080 et 390 × 844, la réversibilité du fondu,
  les mouvements réduits, les chargements tardifs ou indisponibles, les
  raccourcis, la lecture des cinq minutes et les retours en arrière.
- **Hors ligne :** quatre WebP décodés après installation, coupure réseau et
  rechargement ; les trois scènes WebGL restent elles aussi accessibles.
- **WebGL :** scènes, positions et effets existants vérifiés, un seul canvas,
  aucune demande de nouvelle photographie lors de la navigation 3D normale.
- **Tests unitaires : 273 réussis, un échec préexistant** sur
  `tree-atlas-metadata.json` : 43 octets contre 44 déclarés dans son inventaire.
  Ce fichier et les ressources 3D associées restent inchangés.
- **Compilation, TypeScript, Ruff et formatage : réussis.** Les deux exports du
  conducteur restent à jour : 543 mots et 300 secondes. Vite conserve son
  avertissement existant sur un paquet dépassant 500 Ko.
- **Contrôle visuel :** les quatre captures après refonte ont été inspectées.
  Le fond occupe tout l’écran, le texte HTML reste lisible et aucun SVG ne
  subsiste dans ces décors.

Les premiers contrôles effectués pendant une compilation concurrente ont
rencontré des délais d’attente. Ils ont été rejoués seuls avec succès. Le test
de fondu attend désormais la fin effective du déplacement manuel avant de
comparer l’opacité, en conservant sa précision. Aucun code WebGL n’a été changé
pour obtenir ces résultats.

Les quatre ressources et les quatre comparaisons sont livrées. Leur provenance
reste celle d’images générées, pas de prises de vue réelles.
