# Vidéos locales Symbiose

`manifesto-review.png` est l'image embarquée de l'écran de validation humaine du
manifeste ARQ fourni par l'utilisateur, page 7 (objet PDF 41, 1907 × 895).
Elle est extraite sans retouche ; les nombres visibles sont ceux de la capture,
pas des résultats scientifiques annoncés par le pitch. Aucun droit ou partenariat
supplémentaire n'est déduit des logos présents dans le document.

## Introduction officielle

`intro.mp4` est la copie sans conversion du fichier `Symbiose_Intro.mp4` fourni
par l'équipe : **137 717 625 octets**, **74,234 secondes**, H.264 1920 × 1080 à
60 images/s, audio AAC 44,1 kHz. Son SHA-256 est
`dd30597636fc44e2c9d754c283610ac847710c526bd350d01de20527552d3a32`.
La durée de 90 secondes ne s'applique pas à cette introduction.

Ce fichier volumineux est installé localement et ignoré par Git (`*.mp4`).
Après un clonage ou sur une autre machine, le fournir avant de reconstruire :

```powershell
# Depuis la racine du dépôt ; adapter le chemin de la source sur une autre machine.
Copy-Item -LiteralPath "$env:USERPROFILE\Downloads\Symbiose_Intro.mp4" -Destination frontend/public/experience-media/intro.mp4
Get-FileHash -LiteralPath frontend/public/experience-media/intro.mp4 -Algorithm SHA256
docker compose up -d --build --no-deps frontend
```

Le Dockerfile copie `frontend/`, et `.dockerignore` inclut ce répertoire :
le fichier présent au build est copié par Vite dans `dist/experience-media/`
puis dans l'image Nginx. Il n'est pas récupéré depuis YouTube. Un build distant
doit recevoir le MP4 dans son contexte avant la construction ; un clone Git seul
ne contient pas cette vidéo. Le serveur local permet sa lecture sans Internet.

Le pack autonome `/jury/` inclut l'introduction et la recense dans
`jury/offline-manifest.json` sous `intro`, séparément de `demo`.
Le téléchargement complet pour le cache du navigateur commence uniquement
après le clic **Installer hors ligne** ; la landing page conserve son chargement
de métadonnées à la demande. Attendre la fin de cette installation avant de
couper le réseau. YouTube n'est jamais inclus dans ce cache.

Configuration dédiée du prologue dans `frontend/.env.local`, au build Vite :

```dotenv
VITE_SYMBIOSE_INTRO_VIDEO_URL=/experience-media/intro.mp4
VITE_SYMBIOSE_INTRO_YOUTUBE_URL=https://youtu.be/O4J-Na3stKY
# Facultatif, uniquement après fourniture d'une vraie piste WebVTT :
# VITE_SYMBIOSE_INTRO_CAPTIONS_URL=/experience-media/intro.fr.vtt
```

Le MP4 est prioritaire. Le lien officiel YouTube est proposé si aucun MP4
n'est configuré, ou sur action explicite après un échec de chargement du fichier.
Le lecteur YouTube n'est chargé qu'après une action du visiteur et demande
une connexion Internet. La lecture locale est à la demande, sans autoplay,
avec `preload="metadata"`. Aucune piste de sous-titres de l'introduction
n'a été fournie ; celle de la démonstration n'est pas réutilisée.

## Anciennes ressources de démonstration produit

Le lecteur produit `DemoVideo.vue` et son visuel ont été supprimés sur `main`.
La présentation actuelle dure cinq minutes hors prologue et ne comporte plus
ce lecteur de démonstration de 90 secondes. Les noms `demo.mp4`, `demo.webm`,
`VITE_SYMBIOSE_DEMO_URL` et `VITE_SYMBIOSE_DEMO_CAPTIONS_URL` restent des références
historiques indépendantes de l'introduction ; ils ne configurent pas le prologue
et ne réactivent pas ce lecteur. Ne pas copier l'introduction sous ces noms.

Les fichiers de test générés par Playwright ne sont pas des démonstrations produit.
