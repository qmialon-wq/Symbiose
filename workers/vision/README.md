# Package `biosentinelle_vision`

Le [guide d'inférence](INFERENCE.md) décrit le couple MegaDetector testé,
le provisionnement des poids, les diagnostics image, l'API asynchrone,
les seuils indépendants et le schéma des rapports vidéo v2.

Le [guide d'entraînement](TRAINING.md) décrit les runs reprenables, AMP,
l'accumulation, les métriques SQL/JSON et l'interface distincte pour le détecteur.

Extraction modulaire du notebook historique V3. La correspondance des **27 cellules**
et les divergences fonctionnelles sont dans [NOTEBOOK_MIGRATION.md](NOTEBOOK_MIGRATION.md).
Le notebook original reste à la racine et n'est pas exécuté par ce package.

Les commandes Make `prepare-training`, `train`, `analyze` et `watch`, leurs prérequis et dossiers
sont décrits dans le [parcours Make ci-dessous](#entraînement-et-vidéos-annotées-avec-make).
Elles correspondent aux commandes CLI du même nom (`train --check-only` pour le
diagnostic). Les modèles sont chargés uniquement sur demande. Le fichier
Compose ML construit une image supplémentaire complète ; l'image CPU de base
conserve ses dépendances légères.

## Classes et compatibilité

Après confirmation utilisateur, conserver les **10 classes réellement présentes
dans le code**, sans ajouter le merle mentionné dans le texte :

```text
0 chevreuil, 1 sanglier, 2 buse, 3 pigeons, 4 martres,
5 renards, 6 blaireaux, 7 chouette, 8 geai, 9 faisans
```

Le manifeste embarqué `manifests/classes-v3-10.json` porte la version `v3-10.1`.
Les alias « pigeon ramier », « martre », « faisan », etc. reconnaissent les noms
locaux sans modifier les identifiants historiques. Les checkpoints V3 à dix sorties
sont acceptés seulement si leur liste `classes` a exactement cet ordre ; les nouveaux
checkpoints enregistrent aussi la version du manifeste. Aucune permutation automatique.

## CLI CPU dans Docker

Depuis la racine du monorepo, construire l'image vision mise à jour :

```sh
docker compose build vision
docker compose run --rm vision biosentinelle-vision --help
docker compose run --rm vision biosentinelle-vision inventory /storage/datasets --output /storage/results/vision/inventory.json
docker compose run --rm vision biosentinelle-vision extract-frames --inventory /storage/results/vision/inventory.json --output-dir /storage/results/vision
```

Placer explicitement les vidéos dans `data/datasets/`, ou fournir un montage
Docker additionnel en lecture seule. `make classify-videos` copie les vidéos
historiques par espèce. `inventory` calcule les empreintes SHA-256, vérifie le décodage de
la première image et sépare les groupes avant extraction. `--no-probe` désactive
uniquement le contrôle vidéo, pas les empreintes. Les espèces inconnues ou
ambiguës restent dans le manifeste avec `species_candidate=null`.

`extract-frames` produit des JPEG sous `frames/<video_id>/` et `frames.json`.
Les clés image sont relatives à la racine de stockage. L'inventaire conserve la
racine du dataset : pour le réutiliser dans un autre environnement, adapter
explicitement `dataset_root` au montage local. Les fichiers source sont revérifiés
par empreinte avant extraction. Les échecs sont dans `issues`, même si d'autres
vidéos ont réussi. Les fichiers manifestes sont écrits atomiquement.

Codes de retour CLI : 0 succès ; 1 configuration/entrée invalide ; 2 résultat
partiel ou aucun élément exploitable. Un manifeste partiel est conservé pour diagnostic.

## Installation Python locale

Python 3.11 à 3.13 (3.12 recommandé), dans un environnement dédié ; l'ancien
venv du monorepo peut utiliser une version différente. Pour les outils CPU :

```sh
python -m pip install -r workers/vision/requirements.txt
python -m pip install --no-deps -e workers/vision
biosentinelle-vision inventory "video datathon" --output data/results/vision/inventory.json
biosentinelle-vision extract-frames --inventory data/results/vision/inventory.json --output-dir data/results/vision
```

Les mêmes commandes sont accessibles via `python -m biosentinelle_vision`.
Sous Linux, OpenCV requiert `libgl1` et `libglib2.0-0` ; les images concernées les
installent. Un seul fournisseur OpenCV est utilisé (`opencv-python==4.11.0.86`),
également déclaré par MegaDetector : ne pas installer simultanément le paquet
`opencv-python-headless` qui écrit lui aussi dans `cv2`.

## Détection et classification réelles, facultatives

Les images par défaut installent le package CPU et **ne contiennent pas les
dépendances ML optionnelles**, même si l'image GPU préexistante contient PyTorch.
Dans un environnement Python dédié, installation explicite de la pile ML verrouillée :

```sh
python -m pip install -r workers/vision/requirements-ml.txt
python -m pip install --no-deps -e workers/vision
biosentinelle-vision detect --frames data/results/vision/frames.json --storage-root data/results/vision --weights data/models/md_v5a.0.0.pt
```

Cette installation télécharge des **bibliothèques**, potentiellement volumineuses ;
elle ne provisionne aucun poids. La commande exige un fichier `.pt` déjà présent,
issu d'une source de confiance. Aucun nom tel que `MDV5A` n'est transmis au chargeur
comme raccourci téléchargeable, et aucun détecteur COCO de remplacement n'est prévu.
Les signatures utilisées sont celles du
[chargeur officiel MegaDetector](https://github.com/agentmorris/MegaDetector/blob/main/megadetector/detection/run_detector.py)
et de son
[détecteur PyTorch](https://github.com/agentmorris/MegaDetector/blob/main/megadetector/detection/pytorch_detector.py).
Les erreurs par image sont conservées dans `detections.json`, distinctement d'une
détection réussie sans animal. Les détections ne sont pas mises en cache entre exécutions.

`TorchClassifier` charge explicitement un checkpoint local avec
`torch.load(..., weights_only=True)`, valide les classes, crée l'architecture
`timm` avec `pretrained=False`, puis charge ses poids. Aucune lecture de poids à
l'import. Le modèle et ses transformations utilisent la taille d'image du checkpoint.

## Utilisation depuis un worker ou un script

Les fonctions métier ne dépendent ni de la CLI ni de Redis :

```python
from pathlib import Path

from biosentinelle_vision.classes import load_classes
from biosentinelle_vision.config import VisionSettings
from biosentinelle_vision.datasets.inventory import inventory
from biosentinelle_vision.datasets.split import split_videos
from biosentinelle_vision.datasets.frames import extract_frames
from biosentinelle_vision.storage import LocalStorage

settings = VisionSettings(dataset_root=Path("data/datasets"))
classes = load_classes(settings.classes_manifest)
videos = split_videos(inventory(settings.dataset_root, classes), settings.split, settings.seed)
frames = extract_frames(videos, LocalStorage(settings.output_root), settings.frames)
```

Autres points d'entrée réutilisables :

- `detection.batch.detect_frames` accepte le protocole `Detector`.
- `datasets.crops.build_crops` construit seulement de vrais crops de détection.
- `datasets.review.apply_review` confirme/corrige/rejette, régénère le crop dans
  `reviewed/` et écrit `review.json` sans modifier le split.
- `training.dataset.select_samples` exclut par défaut les crops non validés et vérifie
  l'absence de groupes partagés entre ensembles.
- `training.engine.train` entraîne explicitement en deux phases, avec sauvegarde
  du meilleur macro-F1 et historique ; les labels sont humains ou explicitement provisoires,
  chaque classe doit être présente en train et une validation doit exister.
- `evaluation.predict.predict_test_crops` produit `predictions.json` sur les
  crops test validés avec un vrai `Classifier`.
- `inference.video.analyze_video` reçoit séparément `Detector`, `Classifier` et
  un `Tracker` neuf ; traite les frames séquentiellement et exporte un MP4 et un rapport.

Les modèles sans checkpoint initial sont initialisés aléatoirement : le transfert
ImageNet automatique du notebook est volontairement supprimé pour éviter le
téléchargement implicite. `train(..., initial_checkpoint=Path(...))` accepte un
checkpoint local compatible. Le batch par défaut est 4, la précision est complète,
et les checkpoints sont dans `checkpoint_root`, séparés des résultats.
Ce n'est pas une garantie de tenir en VRAM pour toutes les architectures.

Les opérations CLI GPU et les fonctions `train`/`analyze_video` utilisent un verrou
interprocessus. Tous les appels doivent partager `gpu_lock_path`. Si un appelant
construit lui-même des modèles CUDA avant ces fonctions, il doit sérialiser aussi
cette construction ; ne pas imbriquer deux acquisitions du verrou. Aucun modèle
n'est construit à l'import. Le worker Redis consomme les tâches lorsque le fichier
additionnel ML est activé ; les [parcours HTTP et de revue web](../../WEB_CONSOLE.md)
réutilisent ces modules. Une correction humaine ne déclenche aucun entraînement.

## Évaluation

```sh
biosentinelle-vision evaluate --predictions data/results/vision/predictions.json --output data/results/vision/metrics.json
```

Cette commande évalue des **probabilités existantes**, elle ne prétend pas inférer
sans checkpoint. Schéma minimal de `predictions.json` (dix probabilités dans l'ordre) :

```json
{
  "schema_version": "1",
  "class_manifest_version": "v3-10.1",
  "classes": ["chevreuil", "sanglier", "buse", "pigeons", "martres", "renards", "blaireaux", "chouette", "geai", "faisans"],
  "predictions": [{
    "crop_id": "crop-1", "video_id": "video-1",
    "truth": "renards", "human_validated": true,
    "probabilities": [0, 0, 0, 0, 0, 1, 0, 0, 0, 0]
  }],
  "video_truth": {"video-1": "renards"}
}
```

Les labels humains doivent effectivement provenir d'une revue ; le booléen est
une attestation fournie par l'appelant, pas une preuve automatiquement vérifiable.
Sans vérité vidéo humaine unique, la métrique vidéo est omise pour cette vidéo
et son identifiant est signalé. Aucune majorité de crops ne devient une vérité.
Le macro-F1 est calculé sur toutes les dix classes, y compris les classes absentes
dont le support est explicitement affiché. Les pistes IoU restent des estimations,
sans garantie de dénombrer des individus distincts.

L'export annoté ne conserve pas l'audio ; le codec `mp4v` n'est pas garanti lisible
dans tous les navigateurs. Les annotations image montrent le label de cette image ;
la consolidation temporelle figure dans le rapport. Les frames non analysées ne
reçoivent pas de boîtes périmées maintenues artificiellement.

## Configuration

Pour le dataset nommé par espèce, lancer depuis la racine :
`make prepare-training DEVICE=cuda`, puis `make train DEVICE=cuda BATCH_SIZE=2`.
Les poids MegaDetector locaux sont requis avant la préparation (voir le parcours Make ci-dessous).
`DEVICE=cpu` fonctionne aussi. La CLI de préparation est
`biosentinelle-vision prepare-training --inventory <videos.json>`.

Les recadrages sans revue restent `review=pending` même si `label` reprend
`frame.species_candidate`. La sélection autorise ces labels seulement avec
`training.allow_filename_labels=true` ou `train --allow-filename-labels`.
Make passe explicitement cette option (désactivation : `ALLOW_FILENAME_LABELS=0`).
Les corrections humaines sont prioritaires ; les refus et les candidats inconnus
sont exclus. Les scores de validation et checkpoints indiquent si les labels
sont humains. `evaluate` et `predict_test_crops` gardent leur exigence de vérité
humaine. Aucun score sur noms de fichiers n'est présenté comme vérifié.

`VisionSettings` utilise Pydantic Settings, sans instance globale. Préfixe
`BIOSENTINELLE_VISION_` et séparateur imbriqué `__`, par exemple :

```sh
docker compose run --rm -e BIOSENTINELLE_VISION_FRAMES__MAX_PER_VIDEO=8 vision biosentinelle-vision extract-frames --inventory /storage/results/vision/inventory.json
```

Les champs et valeurs par défaut sont dans `config.py` : racines dataset/résultats/
checkpoints, chemin de verrou GPU, manifeste de classes, poids détecteur et
checkpoint classificateur, `device`, graine, seuils et pas d'inférence ; sections
`frames`, `crops`, `split`, `tracking` et `training`. Les variables doivent être
exportées ou passées au conteneur : la CLI ne lit pas automatiquement le `.env`
Compose. Compose définit les racines `/storage/...` et le mode CPU ; son fichier
GPU impose `device=cuda`. Ces chemins sont indépendants du chemin hôte.

## Tests

```sh
docker compose --profile test run --build --rm tests
docker compose --profile test run --rm tests ruff check backend shared workers tests infra/init_storage.py
docker build --target vision-test-ml -f backend/Dockerfile -t biosentinelle/vision-test-ml:local .
docker run --rm --network none biosentinelle/vision-test-ml:local
```

La suite par défaut fonctionne sans PyTorch ni GPU. Le test ML facultatif est
ignoré si PyTorch/timm sont absents ; sa cible dédiée installe les roues **CPU**
verrouillées et exécute un véritable petit entraînement et rechargement de modèle
sur données synthétiques, sans réseau à l'exécution. Aucun poids entraîné sur
ces fixtures n'est distribué ni présenté comme un modèle biodiversité.
Les tests de contrats utilisent aussi des fixtures détecteur/classificateur
strictement internes aux tests. Les modèles MegaDetector réels et les performances
scientifiques nécessitent des poids et données validés qui ne sont pas fournis ici.

Validation du 22 octobre 2026 : inventaire réel des 343 vidéos (aucune erreur de
lecture), extraction de 24 JPEG et d'un manifeste sur une vidéo locale. Le test
ML CPU effectue réellement les deux phases sur un petit modèle et recharge son
checkpoint, sans réseau. Il ne mesure aucune performance biodiversité.

Vérification de la préparation automatique : 52 tests sans GPU réussis et deux
tests ML CPU réussis (labels humains et provisoires). MegaDetector MDv5a réel,
poids officiels contrôlés par empreinte MD5, a traité deux images de
`Chevreuil-Scene-010.mp4` et produit deux recadrages sans erreur, hors réseau.
Ce test limité est conservé sous `data/results/vision/real-preparation-smoke/` ;
la préparation complète des 343 vidéos et l'entraînement du dataset ne sont
pas exécutés par les tests. L'inférence GPU a depuis été vérifiée avec la vidéo
réelle et le checkpoint local : voir [les résultats de validation](INFERENCE.md#validation-locale).

## Parcours Make

### Classer les vidéos du dépôt

```sh
make classify-videos
```

Cette commande copie les vidéos de `video datathon/` dans
`data/datasets/classified/<espèce>/`, sans déplacer les originaux. Les fichiers
déjà identiques sont conservés et les destinations différentes ne sont pas écrasées.
Les noms inconnus, ambigus ou les vidéos illisibles sont rangés dans `_a_verifier/`.
Pour changer le dossier source, définir `SOURCE_VIDEOS` dans `.env`.

L'inventaire et le tableau CSV se trouvent dans
`data/results/vision/classification/` (`videos.json`, `classement.csv`,
`classification.json`). Les espèces sont des **candidats déduits des noms de fichiers**.
Le classement ne crée pas de `review.json` et ne valide pas les labels de chaque
animal visible. Les séparations proposées regroupent les copies identiques ;
les scènes issues d'une même prise restent à identifier avant une évaluation fiable.

### Entraînement et vidéos annotées avec Make

Depuis la racine du projet, utiliser GNU Make (sous Windows, WSL est recommandé).
Docker doit être démarré ; le venv Python de l'hôte n'a pas d'effet sur ces commandes.

```sh
make prepare-training DEVICE=cuda
make train-check
make train DEVICE=cuda BATCH_SIZE=2
```

`DEVICE=cpu` est la valeur par défaut, utilisable sans NVIDIA. `DEVICE=cuda`
convient à la RTX 3050 avec Docker/NVIDIA configuré. `ml-build` installe les
bibliothèques ML dans une image facultative ; aucun poids n'est téléchargé.
`train` vérifie d'abord les données, puis construit si nécessaire et lance
l'entraînement explicitement. Les autres services n'ont pas besoin d'être démarrés.

`prepare-training` classe les vidéos si nécessaire, extrait jusqu'à 24 images par
vidéo, lance **MegaDetector** et recadre les animaux. Le résultat est
`data/results/vision/training.json`, accompagné de `frames.json`, `detections.json`,
`crops.json` et `preparation.json`. Les erreurs de lecture/détection sont rapportées ;
une préparation partielle retourne un code non nul. Relancer recalcule les images
et détections, sans cache implicite.

Les poids réels du détecteur doivent être présents dans `data/models/md_v5a.0.0.pt`.
[Télécharger MDv5a depuis sa publication officielle](https://github.com/agentmorris/MegaDetector/releases/download/v5.0/md_v5a.0.0.pt)
et y enregistrer le fichier. Aucun téléchargement n'est lancé par les imports
ou par la préparation.

**Par défaut, Make autorise les labels provisoires issus des noms** pour démarrer
sur ce dataset majoritairement mono-espèce. MegaDetector localise les animaux ;
il ne détermine pas ces dix espèces. Les labels inconnus sont exclus. Les refus
humains sont toujours exclus et les corrections humaines priment sur le nom et
sur le quota de 18 recadrages par vidéo. `review.json`, lorsqu'il existe, est lu
lors de la préparation et n'est jamais remplacé par une fausse validation humaine.
Après une correction, relancer la préparation pour actualiser `training.json`.

Les ensembles sont séparés **par vidéo avant extraction** et les copies identiques
restent ensemble. Chaque classe doit avoir des exemples en train et val doit être
non vide. Le score de validation sert au choix du checkpoint ; il est **provisoire
si ses labels proviennent des noms**, avec `human_validated=false` dans l'historique
et `label_provenance` dans le checkpoint. Il ne constitue pas une évaluation
scientifique vérifiée. Les prises issues d'une même scène doivent être regroupées
pour une évaluation indépendante. La commande `evaluate` reste réservée aux labels
humains. Les imports Python restent stricts par défaut ; Make active explicitement
`training.allow_filename_labels`.

Pour entraîner uniquement sur une revue humaine :

```sh
make train DEVICE=cuda ALLOW_FILENAME_LABELS=0 MANIFEST=/storage/results/vision/review.json
```

Chaque run écrit `data/checkpoints/<run_id>/best.pt` et `last.pt` (reprise complète),
avec son historique sous `data/results/vision/training/<run_id>/`. Le fichier
historique `classifier_v3_best.pt` n'est pas remplacé automatiquement : sélectionner
le nouveau `best.pt` avec `CHECKPOINT=...` pour l'inférence. Le parcours `train`
sur CUDA soumet maintenant sa tâche à Redis et nécessite le worker ML démarré.
Sans checkpoint initial, les poids sont initialisés aléatoirement ; aucun transfert
ImageNet n'est téléchargé automatiquement. Exemple avec un checkpoint compatible :

```sh
make train DEVICE=cuda BATCH_SIZE=2 EPOCHS_HEAD=6 EPOCHS_FINETUNE=18 INITIAL_CHECKPOINT=/storage/checkpoints/initial.pt
```

Pour l'analyse, placer explicitement les poids MegaDetector dans
`data/models/md_v5a.0.0.pt`, puis déposer les vidéos dans **`data/datasets/inbox/`** :

```sh
make analyze DEVICE=cuda
make analyze DEVICE=cuda VIDEO="ma video.mp4"
make watch DEVICE=cuda
```

`analyze` traite les fichiers déjà déposés. `watch` reste actif au premier plan et
traite automatiquement les nouveaux dépôts ; arrêter avec **Ctrl+C**. Il attend
dix secondes sans changement de taille/mtime, réglables avec `STABLE_SECONDS=30`.
Pour une copie longue, copier sous un nom `video.mp4.part`, puis renommer en `.mp4`
une fois terminé : le suffixe `.part` est ignoré. La stabilité seule ne garantit
pas qu'une copie temporairement suspendue soit terminée.

Les résultats sont dans :

```text
data/results/vision/analyses/<nom>-<identifiant>/annotated.mp4
data/results/vision/analyses/<nom>-<identifiant>/report.json
data/results/vision/analyses/<nom>-<identifiant>/state.json
```

Les originaux restent dans inbox. `state.json` distingue `completed` et `error`.
Les analyses déjà terminées sont ignorées ; une modification du contenu vidéo,
des poids ou des paramètres produit une nouvelle identité. Les erreurs enregistrées
ne sont pas relancées en boucle. Pour réessayer explicitement :

```sh
make analyze DEVICE=cuda VIDEO="ma video.mp4" FORCE=1
```

Le verrou GPU couvre le chargement, le calcul et la libération des modèles. Une
analyse ponctuelle échoue si le GPU est déjà occupé par ces commandes ; `watch`
attend et réessaie. Les modèles sont libérés après chaque lot, pour permettre
l'entraînement pendant que la surveillance reste en attente. Redémarrer `watch`
après modification des paramètres ; les fichiers de poids sont relus pour chaque lot.

Variables Make : `DEVICE`, `VIDEO` (chemin relatif à inbox), `MANIFEST`, `DETECTOR`,
`CHECKPOINT`, `INITIAL_CHECKPOINT`, `ALLOW_FILENAME_LABELS` (1 par défaut),
`BATCH_SIZE`, `EPOCHS_HEAD`, `EPOCHS_FINETUNE`,
`FORCE`, `POLL_SECONDS` et `STABLE_SECONDS`. Les chemins de modèles/manifeste sont
ceux **dans le conteneur**, donc préfixés par `/storage/`. `DATA_ROOT` dans `.env`
permet de changer leur racine hôte. Le dossier inbox autorise le dépôt depuis un
compte hôte Linux avec un mode sticky ; il reste monté en lecture seule dans vision.
Les vidéos déposées doivent être lisibles par l'UID 10001.

L'export MP4 ne conserve pas l'audio et le codec `mp4v` n'est pas garanti dans
tous les navigateurs. Les observations restent des prédictions à valider.
