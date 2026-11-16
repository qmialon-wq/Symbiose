# Installer et lancer Symbiose sur un ordinateur

> Guide pour les membres de l'équipe Symbiose — dépôt : https://github.com/qmialon-wq/Photosynthese
>
> Les dix premières sections décrivent le **démarrage local CPU**. La référence d’exploitation qui suit rassemble les services, le GPU, le stockage, les tests et la maintenance.

## 1. Prérequis

- Une connexion Internet lors du premier lancement (téléchargement des images et dépendances).
- **Git** : https://git-scm.com/downloads
- **Docker Desktop** pour Windows/macOS : https://www.docker.com/products/docker-desktop/ ; ou Docker Engine avec le plugin Compose sur Linux.
- Docker Compose **v2.24 ou plus récent** ; Docker Desktop récent convient.
- Plusieurs Go d'espace disque disponibles ; les ports **8080** (interface) et **8000** (API) doivent être libres.
- **Aucun Python, Node.js, GNU Make ni GPU NVIDIA requis** pour le lancement CPU de base.

**Windows :** utiliser Windows 10/11 compatible WSL2, Docker Desktop avec le moteur Linux/WSL2, et **PowerShell**. Démarrer Docker Desktop avant de lancer les commandes.

**macOS/Linux :** utiliser un terminal ; sur Linux, vérifier que le service Docker fonctionne et que votre utilisateur peut exécuter `docker` (selon la configuration, `sudo` peut être nécessaire).

Vérifier les outils :

```sh
git --version
docker --version
docker compose version
docker info
```

Si `docker info` échoue, démarrer Docker Desktop (ou le démon Docker sous Linux) avant de continuer.

## 2. Télécharger le projet (une seule fois par ordinateur)

Ouvrir un terminal dans le dossier où vous souhaitez installer le projet, puis exécuter :

```sh
git clone https://github.com/qmialon-wq/Photosynthese.git
cd Photosynthese
```

**Important :** `git clone` récupère le dépôt pour la première fois ; `git pull` sert à mettre à jour une copie déjà existante. **Ne pas relancer `git clone` dans un dossier Photosynthese déjà présent.**

Sous Windows, on peut aussi ouvrir l'Explorateur de fichiers dans le dossier `Photosynthese`, saisir `powershell` dans sa barre d'adresse et appuyer sur Entrée.

Vérifier que `docker-compose.yml`, `.env.example`, `frontend/` et `backend/` sont présents.

## 3. Préparer la configuration locale

Le fichier `.env` est facultatif selon le dépôt : Docker Compose possède des valeurs par défaut. Il est néanmoins pratique pour personnaliser les ports et conserver la configuration locale.

**Windows (PowerShell)** :

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

**macOS / Linux** :

```sh
[ -f .env ] || cp .env.example .env
```

Les valeurs par défaut exposent l'interface sur `http://localhost:8080` et l'API sur `http://localhost:8000`.

**Ne pas publier son `.env` ni ses jetons d'initialisation sur GitHub.** Pour un usage exposé à Internet, il faut revoir les mots de passe, les paramètres de sécurité et l'architecture réseau : ce guide ne traite que du local.

## 4. Créer le réseau Docker `web` (une seule fois)

Le projet utilise un réseau Docker externe appelé `web`. Il doit exister avant le lancement.

**Windows (PowerShell)** :

```powershell
docker network inspect web
```

Si la commande indique que le réseau n'existe pas :

```powershell
docker network create web
```

**macOS / Linux** :

```sh
docker network inspect web >/dev/null 2>&1 || docker network create web
```

Si le réseau existe déjà, ne pas le recréer.

## 5. Construire et démarrer Symbiose

Depuis la **racine du dépôt** (le dossier contenant `docker-compose.yml`) :

```sh
docker compose up -d --build --wait
```

Cette commande construit les images nécessaires, lance les conteneurs en arrière-plan et attend les contrôles de santé. Le premier lancement peut prendre plusieurs minutes.

Pour voir l'état des services :

```sh
docker compose ps -a
```

Les services persistants (`frontend`, `backend`, `postgres`, `redis`, `vision`, `documents`) doivent être en état **healthy**. Les tâches ponctuelles `storage-init` et `migrate` doivent s'être terminées avec le **code 0**.

## 6. Ouvrir l'application

- **Interface Symbiose** : http://localhost:8080
- **État de l'API** : http://localhost:8000/health
- **Documentation interactive de l'API** : http://localhost:8000/docs

Ces adresses désignent **l'ordinateur qui exécute Docker**. `localhost` sur un autre PC ne pointe pas vers le premier PC.

### Première utilisation : créer un administrateur

Sur une installation neuve, ouvrir :

http://localhost:8080/initialisation

L'application demande un **jeton d'initialisation** créé localement. Depuis le dossier `Photosynthese` :

**Windows (PowerShell)** :

```powershell
Get-Content .\data\results\auth\bootstrap-token
```

**macOS / Linux** :

```sh
cat data/results/auth/bootstrap-token
```

Saisir le jeton **dans le formulaire local**, puis choisir une adresse e-mail et un mot de passe administrateur. **Ne pas envoyer ce jeton dans une discussion ni le publier.** Une fois le compte créé, se connecter depuis l'interface.

> Chaque installation neuve possède sa propre base de données et ses propres comptes. `git clone` ne transfère **pas** les utilisateurs, les données ni les volumes Docker d'un autre ordinateur.

## 7. Utilisation quotidienne

Ouvrir Docker Desktop (Windows/macOS), puis un terminal dans `Photosynthese`.

**Démarrer sans reconstruire** :

```sh
docker compose up -d
```

**Afficher les services** :

```sh
docker compose ps -a
```

**Arrêter sans effacer les données** :

```sh
docker compose down
```

**Voir les journaux** :

```sh
docker compose logs --tail=100
```

**Suivre les journaux en direct** (`Ctrl+C` pour quitter l'affichage) :

```sh
docker compose logs -f --tail=100
```

**Attention :** ne pas utiliser `docker compose down -v` sans avoir sauvegardé les données : l'option `-v` supprime les volumes Docker du projet, dont les données persistantes de PostgreSQL et Redis.

## 8. Mettre à jour l'application

Depuis le dossier du projet :

```sh
git status
git pull
```

Si Git signale des modifications locales, les sauvegarder ou demander conseil avant de poursuivre ; ne pas les écraser automatiquement.

Reconstruire et relancer ensuite les services :

```sh
docker compose up -d --build --wait
```

Le fichier `.env` et les données locales ne sont pas destinés à être synchronisés via Git.

## 9. Dépannage

### Le navigateur n'ouvre pas `http://localhost:8080`

1. Vérifier que Docker fonctionne : `docker info`.
2. Vérifier les conteneurs : `docker compose ps -a`.
3. Relancer : `docker compose up -d --build --wait`.
4. Lire les erreurs : `docker compose logs --tail=100`.
5. Tester l'API séparément : http://localhost:8000/health.

### Erreur « network web declared as external, but could not be found »

```sh
docker network create web
```

Puis relancer la commande de l'étape 5.

### Le port 8080 ou 8000 est déjà utilisé

Modifier les valeurs dans `.env`, par exemple :

```dotenv
FRONTEND_PORT=8081
BACKEND_PORT=8001
```

Puis redémarrer :

```sh
docker compose up -d --build --wait
```

L'interface devient alors `http://localhost:8081`. **Si le port du frontend change, mettre également à jour `AUTH_ALLOWED_ORIGINS` dans `.env` pour autoriser la nouvelle origine**, par exemple `http://localhost:8081` et `http://127.0.0.1:8081`, tout en conservant les autres origines nécessaires.

### `docker compose` n'est pas reconnu

Installer ou mettre à jour Docker Desktop (ou le plugin Compose sous Linux), puis rouvrir le terminal.

### Un service est `unhealthy` ou `exited`

```sh
docker compose ps -a
docker compose logs --tail=100
```

Identifier le service concerné dans les journaux. Le premier démarrage peut être long ; vérifier aussi la mémoire et l'espace disque disponibles.

### La page de connexion apparaît, mais les identifiants de l'autre PC ne fonctionnent pas

C'est normal sur une **nouvelle installation** : la base PostgreSQL locale ne contient pas automatiquement les comptes de l'autre PC. Utiliser la procédure d'initialisation de la section 6, si aucun administrateur n'existe encore. Si l'installation a déjà un administrateur, suivre la procédure de gestion des comptes du projet plutôt que réinitialiser les volumes.

## 10. Récapitulatif rapide

Pour un **nouvel ordinateur**, après installation de Git et Docker :

**Windows PowerShell** :

```powershell
git clone https://github.com/qmialon-wq/Photosynthese.git
cd Photosynthese
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
if (-not (docker network ls --format '{{.Name}}' | Where-Object { $_ -eq 'web' })) { docker network create web }
docker compose up -d --build --wait
docker compose ps -a
```

**macOS / Linux** :

```sh
git clone https://github.com/qmialon-wq/Photosynthese.git
cd Photosynthese
[ -f .env ] || cp .env.example .env
docker network inspect web >/dev/null 2>&1 || docker network create web
docker compose up -d --build --wait
docker compose ps -a
```

Puis ouvrir **http://localhost:8080**.

---

## Référence d’exploitation

Les informations techniques auparavant présentes dans le README principal sont
rassemblées ci-dessous. Toutes les commandes s’exécutent depuis la racine du dépôt,
sauf indication contraire. Les commandes de vision et leurs garde-fous ont été
déplacés dans le [guide vision](workers/vision/README.md#classer-les-vidéos-du-dépôt).

### Services et guides associés

La [présentation autonome du jury](frontend/README.md) dispose d'une entrée `/jury/`,
d'une installation hors ligne et d'un [guide du présentateur](docs/PRESENTER_GUIDE.md).
Le [bilan de finition](docs/FINAL_DELIVERY.md) distingue les vérifications exécutées
des limites visuelles et du montage vidéo encore à fournir.

Un [accès HTTPS via ngrok avec une URL stable](docs/NGROK.md) est disponible
pour partager la plateforme exécutée sur le PC : configurer `NGROK_URL` et
`NGROK_AUTHTOKEN` dans `.env`, puis lancer `make ngrok-up` après le démarrage local.

Le [guide d’hébergement et de CI/CD](docs/HEBERGEMENT_CICD.md) décrit un déploiement
entièrement distant sur CPU, sans dépendance au PC, avec conservation des modèles
entraînés, migration vérifiée et sauvegardes distantes. Le budget cible est de
10 €/mois, sous réserve du tarif final, des volumes et de la recette mémoire.

La plateforme dispose de comptes **client** (inscription libre) et **administrateur**,
d’un profil, d’un export personnel et d’une suppression douce avec suivi des demandes
d’effacement. Au premier lancement, créer l’administrateur depuis `/initialisation`
avec le jeton du fichier local `data/results/auth/bootstrap-token`.
Voir le [guide d’authentification](docs/AUTHENTICATION.md) pour l’accès, les droits
et les limites de la suppression. Les appels API métier exigent désormais une
session ; les écritures exigent également un jeton CSRF.

Le [parcours vidéo → parcelle → dossier biodiversité](docs/PARCEL_DOSSIERS.md)
permet de sélectionner plusieurs vidéos d'une même parcelle, de renseigner une seule
fois surface, terrain et projet, puis de retrouver les vidéos annotées et un dossier
textuel commun dans **Mes dossiers**. Les recommandations restent
conditionnelles lorsque les espèces ne sont pas confirmées ; aucun pourcentage de
terrain vert n'est inventé.

L’[analyse préliminaire territoriale](docs/TERRITORIAL_CONTEXT.md) relie les
interventions du projet, un point WGS84, les quatre couches IGN et les observations
humaines. Elle fournit des vérifications déterministes sourcées et un export
révisé, indépendamment du rapport scientifique. La couche [Adapter mon projet](docs/PROJECT_DESIGN.md)
ajoute des alternatives de conception pour les cinq interventions, avec leurs changements
concrets, leurs conditions et leur niveau de justification. Voir la [recette et les preuves
IGN](docs/TERRITORIAL_VALIDATION.md).

Le [module RAG local](docs/RAG.md) propose une recherche documentaire hybride et
des dossiers territoriaux de quatre pages rédigés par un modèle local. Les dossiers
examinent tous les textes extractibles associés aux espèces, puis proposent des
aménagements adaptés au formulaire, avec références, conditions et suivi.
Les documents en attente de validation restent identifiés dans l'audit.
La recherche de passages validés reste disponible avec `make rag-up`,
`make rag-prepare`, puis `make rag-index` ; voir le guide pour préparer Ollama.

Le moteur de classification alternatif (CNN préentraîné local, embeddings et
classifieurs classiques, comparaisons, promotion et rollback) est documenté dans
[CLASSIFICATION_ALTERNATIVE.md](workers/vision/CLASSIFICATION_ALTERNATIVE.md).
Les dix classes et le champion existant sont conservés ; aucun entraînement ni
remplacement de modèle n'est déclenché au démarrage.

Campagne complète des quatre CNN puis benchmark commun, sur le corpus de base
avec labels de noms explicitement autorisés pour le POC :
`make train-benchmark DEVICE=cuda BENCHMARK_WEAK_LABELS=1` (ou `DEVICE=cpu`).
Suivi dans Administration → Entraînements ; comparaison dans Évaluation → Benchmarks.

Socle local Docker : FastAPI, Vue 3 + TypeScript + Vite, PostgreSQL 16 avec
pgvector 0.8.1, Redis et deux workers Python indépendants. Les modules vision
extraits du notebook V3 sont utilisables explicitement depuis Python ou la CLI :
voir le [guide vision](workers/vision/README.md) et la
[correspondance des cellules](workers/vision/NOTEBOOK_MIGRATION.md).
Aucun poids ni modèle entraîné n'est distribué dans Git. Le mode ML active
l'analyse vidéo asynchrone, sans chargement de modèle avant une tâche.
La [veille et l'ingestion scientifiques](workers/documents/README.md) utilisent
OpenAlex, Crossref et Europe PMC dans un worker documentaire indépendant.
La synthèse territoriale locale est décrite dans [le guide RAG](docs/RAG.md).

```sh
make documents-up
make documents-search ARGS='--species "Vulpes vulpes" --focus human_activities --activity transport --limit 5'
```

Les collectes globales ou ciblées, imports, traductions locales en français et retraits multiples sont disponibles
directement dans [Documents scientifiques](http://localhost:8080/documents).

La commande renvoie une tâche asynchrone consultable dans `/documents/tasks/{id}`
et dans la documentation API http://localhost:8000/docs. Le téléchargement de texte
intégral est optionnel (`--download-fulltext`) et limité aux copies explicitement autorisées.

Pour la validation humaine des recadrages, l'historique des corrections et les
exports reproductibles, consulter [HUMAN_REVIEW.md](HUMAN_REVIEW.md).

L'interface web sépare l'espace observation (import, analyse et validation)
de l'administration (datasets, entraînements, modèles et évaluation). Ses parcours sont décrits dans
[WEB_CONSOLE.md](WEB_CONSOLE.md).

L'[inférence vidéo et son API](workers/vision/INFERENCE.md) incluent le
téléchargement explicite vérifié de MegaDetector, le diagnostic de son API,
un test image avec boîtes et une intégration facultative avec modèles réels.

```sh
make detector-fetch
make inference-up DEVICE=cuda
```

Déposer les vidéos dans `data/datasets/inbox/`, puis soumettre
`POST /vision/analyses` (exemples PowerShell dans le guide). Les tâches passent
par Redis ; les MP4, rapports et statistiques sont récupérables depuis l'API.
Le démarrage CPU du socle reste `docker compose up -d`, sans modèles requis.

Le [guide d'entraînement local](workers/vision/TRAINING.md) décrit les phases
ConvNeXt/EfficientNetV2, AMP, reprise, métriques PostgreSQL et garde-fous du
fine-tuning du détecteur. Le manifeste conserve les **10 classes confirmées**.

```sh
make training-up DEVICE=cuda
make train-classifier BATCH_SIZE=2 ACCUMULATION_STEPS=4
```

## Prérequis

- Docker Engine et plugin Compose v2.24 ou supérieur, ou Docker Desktop récent,
  en mode conteneurs Linux. Docker doit pouvoir télécharger les images et les
  dépendances pendant la construction ; les services fonctionnent ensuite localement.
- Ports locaux 8000 et 8080 disponibles (modifiables dans `.env`).
- Aucun Python, Node, Make ou GPU nécessaire sur l'hôte pour le démarrage CPU.
- Prévoir plusieurs Go pour les images CPU, et au moins 15 Go supplémentaires
  disponibles pour télécharger et construire l'image PyTorch GPU, hors datasets.

Pour NVIDIA sous Linux : installer un pilote NVIDIA compatible, puis le
[NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html).
Configurer le runtime Docker avec `sudo nvidia-ctk runtime configure --runtime=docker`,
puis redémarrer Docker avec `sudo systemctl restart docker`.

Sous Windows : Windows 11 ou Windows 10 compatible WSL2, pilote NVIDIA Windows
avec support WSL, distribution WSL2 à jour (`wsl --update`), Docker Desktop avec
backend WSL2 et intégration de la distribution activés. Utiliser les conteneurs
Linux. Ne pas installer de pilote NVIDIA Linux dans WSL : le pilote est fourni
par Windows. Les commandes Docker ci-dessous fonctionnent aussi dans PowerShell ;
Make est facultatif. Pour les performances et permissions Linux, préférer un
checkout dans le système de fichiers WSL (`~/biosentinelle`) à `/mnt/c/...`.
Voir les [prérequis GPU Docker Desktop](https://docs.docker.com/desktop/features/gpu/)
et les [consignes NVIDIA WSL](https://docs.nvidia.com/cuda/wsl-user-guide/index.html).

L'image GPU est `pytorch/pytorch:2.6.0-cuda12.4-cudnn9-runtime`, figée par digest ;
la [matrice officielle PyTorch](https://docs.pytorch.org/get-started/previous-versions/)
confirme la combinaison PyTorch 2.6 / CUDA 12.4. Utiliser un pilote récent ; comme
base conservatrice CUDA 12.4, NVIDIA indique Linux >= 550.54.14 et Windows >= 551.61
dans ses [notes CUDA 12.4](https://docs.nvidia.com/cuda/archive/12.4.0/cuda-toolkit-release-notes/index.html).
Un pilote plus récent peut exécuter ce runtime. Le CUDA Toolkit n'est pas requis
sur l'hôte. La RTX 3050 est compatible ; aucun modèle n'est chargé dans ses 4 Go.

## Démarrage CPU

Depuis la racine, facultativement copier `.env.example` vers `.env` :

```sh
cp .env.example .env
docker network inspect web || docker network create web
docker compose up -d --build --wait
docker compose ps -a
```

PowerShell : utiliser `Copy-Item .env.example .env` pour la copie. Sans `.env`,
`docker compose up -d` fonctionne avec les mêmes valeurs locales par défaut et
construit les images manquantes. Après modification du code, ajouter `--build`.

- Interface : <http://localhost:8080> ; elle affiche le statut réel de l'API.
- API : <http://localhost:8000/health> ; documentation : <http://localhost:8000/docs>.
- Depuis le navigateur : `/api/health` est relayé par Nginx vers `photosynthese-backend:8000/health`,
  sans URL Docker dans le navigateur ni configuration CORS supplémentaire.
- `storage-init` et `migrate` doivent terminer avec le code 0 ; les six services
  persistants doivent être `healthy`. La migration Alembic active `vector` avant
  le démarrage de l'API. `/health` renvoie 503 si PostgreSQL/pgvector ou Redis échoue.

### Accès depuis le réseau local

Le réseau Docker `web` est externe et partagé avec Caddy dans le projet
`../internal-server`. Le frontend utilise l'alias `photosynthese` et l'API
`photosynthese-backend` pour éviter les collisions avec les autres projets.
PostgreSQL et Redis restent sur le réseau privé `services`, avec les alias
`photosynthese-postgres` et `photosynthese-redis` utilisés par les services.

Le `Caddyfile` de ce projet voisin expose <https://photosynthese.local> :

```caddyfile
photosynthese.local {
    reverse_proxy photosynthese:80
    tls internal
}
```

Après modification, valider et recharger Caddy depuis `../internal-server` :

```sh
docker compose exec -T caddy caddy validate --config /etc/caddy/Caddyfile
docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile
```

Les machines clientes doivent résoudre `photosynthese.local` vers l'adresse LAN
du serveur (actuellement `192.168.129.220`), via leur DNS local ou cette entrée
dans leur fichier `hosts` :

```text
192.168.129.220 photosynthese.local
```

Le certificat utilise l'autorité locale de Caddy, comme les autres sites du
serveur ; cette autorité doit être approuvée sur les machines clientes.
L'origine `https://photosynthese.local` est autorisée par défaut ; la conserver
si `AUTH_ALLOWED_ORIGINS` est redéfini dans `.env`.
Si le port local 8080 est occupé, définir `FRONTEND_PORT=8081` dans `.env` et
adapter les origines locales autorisées à ce port. Cela ne change pas l'URL Caddy.

## Démarrage et diagnostic GPU

### Priorité des tâches

Les workers choisissent les tâches dans cet ordre : opérations client (analyses,
imports vidéo, dossiers et recherches interactives), entraînements et évaluations,
préparation/téléchargement/indexation des ressources RAG, puis traductions.
À priorité égale, l'ordre d'arrivée est conservé, y compris pour les messages déjà
en attente dans Redis. Le terminal de l'administration affiche cette priorité.

Un entraînement CNN cède la place à une opération client et reprend depuis le
dernier checkpoint d'époque ; une époque incomplète est rejouée. Les traductions
cèdent entre deux pages et les collectes entre deux articles, sans épuiser leur
budget de tentatives. Une opération indivisible déjà engagée termine son étape.
Les workers indépendants peuvent travailler en parallèle ; le GPU reste protégé
par le verrou partagé et un entraînement attend la fin d'un dossier interactif.

Pour une RTX 50 (Blackwell), utiliser CUDA 12.8 avec le fichier additionnel :

```sh
docker compose -f docker-compose.yml -f docker-compose.gpu.yml -f docker-compose.ml.yml -f docker-compose.blackwell.yml up -d --build --wait
make train-benchmark DEVICE=cuda BLACKWELL=1 BENCHMARK_WEAK_LABELS=1
```

`infra/prepare_platform.py` permet une préparation explicite et reprenable dans
les conteneurs. Le mode `vision` vérifie les poids préentraînés, enregistre le
classificateur existant (activé seulement si aucun modèle n'est actif), lance les
quatre CNN et leur benchmark, puis les embeddings, les classifieurs logistique,
k-NN, SVM linéaire/RBF et les regroupements exploratoires. Le mode `documents`
prépare les embeddings RAG et la traduction, collecte jusqu'à 20 notices par source
et par espèce avec téléchargement des textes accessibles, puis indexe les sources
éligibles. Il conserve la validation humaine des documents et n'entraîne pas de LLM.

Après démarrage du worker ML adapté et d'Ollama (profil `rag-generation`) :

```sh
docker compose exec -T ollama ollama pull qwen3:4b-instruct-2507-q4_K_M
docker compose cp infra/prepare_platform.py vision:/tmp/prepare_platform.py
docker compose cp infra/prepare_platform.py documents:/tmp/prepare_platform.py
docker compose exec -d vision python /tmp/prepare_platform.py vision
docker compose exec -d documents python /tmp/prepare_platform.py documents
```

Les deux processus continuent après fermeture du terminal. Leur progression et
leurs identifiants sont conservés dans `data/results/platform-setup/{vision,documents}.json`
et les journaux `.log` voisins ; les tâches apparaissent dans l'administration.
Après recréation d'un conteneur, recopier le script et relancer uniquement son mode
pour reprendre les tâches existantes. Un échec est conservé et demande un examen.
Ne pas lancer deux préparations du même mode simultanément, ni lancer en parallèle
une autre campagne d'entraînement. Les nouvelles campagnes utilisent les labels
provisoires des noms de vidéos ; leurs métriques restent exploratoires et les
nouveaux candidats ne remplacent pas automatiquement le modèle actif.

Le fichier additionnel remplace uniquement l'image du worker vision et réserve
un GPU NVIDIA selon la [configuration Compose officielle](https://docs.docker.com/compose/how-tos/gpu-support/).
L'API, l'interface, PostgreSQL, Redis et le worker documentaire restent sur CPU.

```sh
docker compose -f docker-compose.yml -f docker-compose.gpu.yml up -d --build --wait
docker compose -f docker-compose.yml -f docker-compose.gpu.yml exec vision nvidia-smi
docker compose -f docker-compose.yml -f docker-compose.gpu.yml exec vision python -m workers.vision.cuda_check
```

Diagnostic indépendant du démarrage des services (construit l'image si nécessaire) :

```sh
docker compose -f docker-compose.yml -f docker-compose.gpu.yml run --build --rm --no-deps vision nvidia-smi
docker compose -f docker-compose.yml -f docker-compose.gpu.yml run --build --rm --no-deps vision python -m workers.vision.cuda_check
```

Le second diagnostic teste `torch.cuda.is_available()`, alloue deux valeurs,
effectue un calcul CUDA et synchronise le GPU. Il échoue explicitement si CUDA
est absent, et imprime les versions et le nom du GPU en cas de succès.
Le worker effectue ce même contrôle une seule fois au démarrage GPU ; ses sondes
suivantes vérifient son signal de vie Redis, sans calcul périodique sur le GPU.
`nvidia-smi` seul ne prouve pas que PyTorch peut exécuter un calcul CUDA.

Pour vérifier uniquement la transmission du GPU à Docker avec une image plus légère :

```sh
docker run --rm --gpus all nvidia/cuda:12.4.1-base-ubuntu22.04 nvidia-smi
```

Retour CPU : `docker compose up -d --build --wait vision`. Ne pas augmenter
le nombre de répliques vision : la configuration prévoit un seul processus.
Sans le fichier additionnel ML, ce worker reste en attente supervisée.
Le fichier `docker-compose.ml.yml` active le consommateur Redis existant
(`VISION_CONSUME_JOBS=1`) ; `make review-up DEVICE=cpu` ou `DEVICE=cuda`
active ce parcours, avec verrou interprocessus pour les opérations GPU.

## Stockage et réseau

```text
backend/                 API, configuration et migrations Alembic
frontend/                Vue, TypeScript, Vite ; Nginx dans l'image finale
workers/vision/          vision modulaire ; consommateur Redis avec le fichier ML
workers/documents/       collecte, recherche et dossiers ; consommateur indépendant
shared/                  contrats, persistance, tâches, règles territoriales et supervision
infra/                   Nginx, initialisation des répertoires, dépendances de test
tests/                   tests CPU, intégration et test GPU facultatif
data/                    fichiers persistants, ignorés par Git et les builds
```

Les montages locaux sont distincts sous `DATA_ROOT` :

| Répertoire hôte | Chemin conteneur | Usage prévu |
| --- | --- | --- |
| `datasets/` | `/storage/datasets` | Vidéos et images ; lecture seule pour API et vision |
| `models/` | `/storage/models` | Poids et caches ; lecture seule dans l'API |
| `checkpoints/` | `/storage/checkpoints` | Checkpoints ; lecture seule dans l'API |
| `documents/` | `/storage/documents` | Documents ; API et worker documentaire |
| `results/` | `/storage/results` | Résultats ; API et workers |

`storage-init` crée seulement ces répertoires et les caches, avec UID/GID 10001
pour les processus Python non root. Il ne parcourt pas les données existantes.
Sous Linux, les fichiers ajoutés manuellement doivent être lisibles par cet UID ;
les répertoires où une écriture est attendue doivent lui être accessibles.
Les vidéos existantes dans `video datathon/` et le notebook restent intacts ;
aucune copie ni ingestion automatique n'est effectuée.

PostgreSQL et Redis utilisent respectivement les volumes Docker nommés
`biosentinelle_postgres-data` et `biosentinelle_redis-data` (préfixe personnalisable).
Le réseau `services` est interne et aucune publication de leurs ports n'est définie.
Le réseau `web` relie le frontend à l'API. Seuls les ports frontend et API sont
publiés, sur `127.0.0.1`. Le worker vision de base reste sur le réseau interne. Le worker documentaire
accède aux services publics via le réseau `web`. Les modèles doivent être
provisionnés explicitement ; les imports et le démarrage ne les téléchargent pas.

Redis utilise AOF avec synchronisation chaque seconde et `noeviction` pour ne pas
évincer les tâches. Une panne brutale peut perdre environ une seconde
d'écritures ; cette configuration ne garantit pas l'exécution exactement une fois.
La politique n'est pas un plafond mémoire : prévoir une limite adaptée selon les
volumes des files réellement utilisées. Les sondes des workers sont des
clés temporaires distinctes des files de tâches et des résultats d'analyse.

Les chemins de stockage sont centralisés dans l'environnement et les montages.
Le package vision expose un contrat de stockage et un adaptateur local avec
écritures atomiques ; aucun accès S3 n'est implémenté.

## Variables d'environnement

Le fichier `.env` sert à l'interpolation Compose ; il n'est pas copié dans les images.
Les valeurs locales d'exemple conviennent uniquement à un poste de développement.

| Variable | Défaut | Description |
| --- | --- | --- |
| `COMPOSE_PROJECT_NAME` | `biosentinelle` | Préfixe des ressources Docker |
| `BACKEND_PORT` | `8000` | Port hôte de FastAPI |
| `FRONTEND_PORT` | `8080` | Port hôte du frontend |
| `POSTGRES_DB` | `biosentinelle` | Base applicative |
| `POSTGRES_USER` | `biosentinelle` | Utilisateur local et propriétaire des migrations |
| `POSTGRES_PASSWORD` | `biosentinelle_local` | Mot de passe local ; changer avant la première initialisation |
| `DATA_ROOT` | `./data` | Racine persistante hôte, relative au fichier Compose |
| `WORKER_HEARTBEAT_SECONDS` | `5` | Intervalle du signal de vie |
| `WORKER_HEARTBEAT_MAX_AGE_SECONDS` | `30` | Délai de santé, strictement supérieur à deux intervalles |
| `VISION_DEVICE` | `cpu` | Périphérique des opérations explicites vision ; le fichier GPU impose `cuda` |

Variables internes définies par Compose : `POSTGRES_HOST=postgres`,
`POSTGRES_PORT=5432`, `REDIS_URL=redis://redis:6379/0`, `STORAGE_ROOT=/storage`,
`TORCH_HOME=/storage/models/cache/torch`, `HF_HOME=/storage/models/cache/huggingface`,
`XDG_CACHE_HOME=/storage/models/cache`. `REQUIRE_CUDA` vaut 0 sur CPU et 1 sur GPU ;
`NVIDIA_DRIVER_CAPABILITIES=compute,utility` est limité au worker GPU.
Les tests d'intégration utilisent `BASE_URL` et `FRONTEND_URL` vers les services Docker.

Changer les identifiants PostgreSQL dans `.env` ne modifie pas un volume déjà
initialisé : faire une rotation SQL explicite, sans supprimer les données.

## Vérifications et tests

Les tests unitaires ne nécessitent ni services actifs ni GPU :

```sh
docker compose config --quiet
docker compose -f docker-compose.yml -f docker-compose.gpu.yml config --quiet
docker compose --profile test run --build --rm tests
docker compose --profile test run --build --rm tests ruff check backend shared workers tests infra/init_storage.py
```

Après un démarrage avec `--wait`, tests réels PostgreSQL/pgvector/Alembic,
persistance Redis configurée, signaux de vie des deux workers et proxy HTTP :

```sh
docker compose --profile test run --build --rm tests pytest -m integration
docker compose exec redis redis-cli ping
```

Vérification PostgreSQL avec les identifiants par défaut (adapter en cas de changement) :

```sh
docker compose exec postgres psql -U biosentinelle -d biosentinelle -c "SELECT extname, extversion FROM pg_extension;"
```

Le diagnostic CUDA est le test GPU autonome recommandé. Pour une exécution pytest
dans un environnement Python disposant déjà de PyTorch CUDA et des dépendances
de test : `pytest -m gpu`. Les tests CPU excluent explicitement les marqueurs
`integration` et `gpu` ; un test GPU demandé explicitement échoue si CUDA est absent.
Le build frontend exécute `vue-tsc --noEmit` avant Vite.

Raccourcis Make (Linux/WSL avec GNU Make) : `make up`, `make gpu`, `make test`,
`make integration`, `make lint`, `make gpu-check`, `make nvidia-smi`, `make down`.

## Maintenance locale

```sh
docker compose logs --tail=100 backend migrate vision documents
docker compose run --rm migrate
docker compose exec backend alembic -c backend/alembic.ini current
docker compose down
```

`down` préserve les volumes et `data/`. `down -v` détruit les volumes PostgreSQL
et Redis : réserver cette option à une réinitialisation volontaire après sauvegarde.
Après une nouvelle migration, exécuter `docker compose run --rm migrate` puis
redémarrer l'API. Les dépendances de santé ordonnent le démarrage ; elles ne
redémarrent pas automatiquement les autres services quand une dépendance devient
malade. L'API reflète alors la panne dans `/health`, et les workers redémarrent
si leur connexion Redis provoque une sortie du processus.

Les dépendances directes sont dans les fichiers `requirements.in`, les versions
transitives figées dans `requirements.txt`, et les dépendances frontend dans
`package-lock.json` (`npm ci` au build). Pour une mise à jour Python volontaire,
utiliser `uv==0.8.22`, puis `uv pip compile <fichier.in> --python-version 3.12
--universal --output-file <fichier.txt>` et relancer les tests. Ne pas éditer
les verrous à la main. Les images ont des versions explicites ; pgvector et
PyTorch ont aussi un digest pour figer leurs composants embarqués.

Le notebook reste une référence fonctionnelle, avec des dépendances Colab/Drive
qui ne sont pas exécutées par cette infrastructure. Aucun score ML sur des labels provisoires n'est
présenté comme une évaluation scientifique validée. Les 10 espèces de la consigne utilisateur font foi ;
les noms de vidéos ne constituent pas des labels fiables pour chaque animal.

## Validation historique réalisée le 21 octobre 2026

Ce relevé est conservé depuis le premier socle ; il ne décrit pas une nouvelle
recette de la version actuelle. Les validations ultérieures de vision figurent dans
[le guide d’inférence](workers/vision/INFERENCE.md#validation-locale).

- Démarrage CPU réel sous Docker Desktop : six services persistants sains,
  initialisation du stockage et migrations terminées avec le code 0.
- 12 tests unitaires et 3 tests d'intégration réussis ; Ruff et formatage validés.
- Build Vue/TypeScript/Vite réussi ; audit npm sans vulnérabilité signalée.
- Après redémarrage PostgreSQL/Redis : migration conservée, clé témoin Redis
  conservée puis supprimée, retour de tous les services à l'état sain.
- `nvidia-smi` dans le conteneur CUDA léger : RTX 3050 de 4 Go visible,
  pilote hôte 592.00.
- Image PyTorch GPU non construite et calcul PyTorch CUDA non exécuté ici :
  environ 11 Go libres sur le disque hôte, sous le budget de 15 Go retenu pour
  ce build. La configuration GPU fusionnée est validée par `docker compose config` ;
  la commande `workers.vision.cuda_check` reste à exécuter après libération d'espace.
