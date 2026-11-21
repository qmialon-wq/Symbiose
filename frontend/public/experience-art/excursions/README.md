# Symbiose — décors photographiques du secours 2D

Ces quatre **évocations photoréalistes générées par IA** ont été créées avec
l’outil `image_gen` intégré à Codex, le 21 novembre 2026. Elles ne sont ni des
photographies de terrain, ni une captation par drone, ni un inventaire scientifique.
Les mentions de prudence du récit sont conservées.

| Ambiance | Fichier livré | Dimensions | Octets |
| --- | --- | --- | --- |
| Sol vivant | [soil.webp](soil.webp) | 1664 × 936 | 339 936 |
| Bocage aérien | [drone-bocage.webp](drone-bocage.webp) | 1664 × 936 | 290 606 |
| Littoral | [marine-surface.webp](marine-surface.webp) | 1664 × 936 | 243 836 |
| Immersion tempérée | [marine-underwater.webp](marine-underwater.webp) | 1664 × 936 | 241 484 |

Total : **1 115 862 octets**, environ 1,06 Mio. Les originaux générés mesurent
1672 × 941 pixels, comme les sources des paysages déjà présents dans le projet.
L’encodage WebP qualité 88 applique un recadrage minimal à 16:9 sans agrandissement.
Il n’ajoute aucun détail ni retouche créative. Les sources PNG restent dans leur
archive locale Codex, aux chemins enregistrés dans la provenance.

Les quatre prompts complets et les chemins des originaux sont dans
[provenance.json](provenance.json). Les dimensions, tailles, SHA-256 des fichiers
livrés et des originaux sont dans [runtime-assets.json](../runtime-assets.json),
rubrique `excursions`. La même rubrique est embarquée dans le frontend.

Pour reproduire l’encodage depuis les originaux présents localement :

```powershell
python frontend/scripts/prepare-excursion-art.py
```

Cette commande ne réencode aucun des huit paysages principaux ni le poster du
prologue. Le script général `optimize-experience.py` conserve la rubrique des
excursions lorsqu’il reconstruit son inventaire.
