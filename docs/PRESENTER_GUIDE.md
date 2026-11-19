# Symbiose — guide du présentateur

> Decors actualises : revision **31c94db9b955178c**, pack `Symbiose-jury-2026.zip`. Apres un changement de version, recharger en ligne et actualiser l'installation hors ligne, puis refaire le test de rechargement hors connexion. Le mode `?render=2d` et le PDF restent les secours sans GPU.


## Avant la séance

1. Construire la production et ouvrir `http://localhost:8080/jury/` dans le profil
   Chromium préparé pour la séance. Cette entrée n'attend pas la connexion métier.
2. Vérifier la vidéo d'ouverture (environ une minute) jouée sur l'écran du
   bureau. Le film YouTube configuré demande Internet ; un fichier local
   fonctionne hors ligne. Il n'y a plus de créneau de démonstration vidéo
   pendant le récit.
3. Pour un fichier local, le placer dans `frontend/public/experience-media/`,
   reconstruire puis actualiser l'installation. Vérifier son cadrage, sa durée,
   ses sous-titres et les sources visibles. Le son est muet par défaut ; le
   réactiver seulement si nécessaire, par un geste explicite.
4. Dans **Préparation du jury**, cliquer **Installer hors ligne**. Attendre la
   réussite. Une configuration média explicite dont le fichier manque n'est pas
   acceptée par le build. L'absence du montage non configuré reste signalée.
5. Couper le réseau dans le navigateur et recharger la page. Visiter les huit
   chapitres et les trois explorations, puis ouvrir les sources. Garder le même navigateur, le même profil et la même adresse.
6. Ouvrir **Régie du récit → Recommencer le récit**. Tester le plein écran sur le
   vidéoprojecteur réel ; régler son contraste et la mise à l'échelle de Windows.
7. Répéter le pitch à deux voix sur la lecture continue. Le compteur indique une
   position dans le récit, pas la durée réelle de parole : Espace met en pause,
   les flèches recalent l'étape si la parole prend de l'avance ou du retard.

## Pendant les cinq minutes

Déroulé : vidéo d'ouverture au bureau (environ une minute), **Entrer dans le
vivant**, travelling de 14 secondes, puis récit de cinq minutes. En mode
présentation, la lecture continue démarre seule à l'arrivée en forêt.

| Créneau | Scène 3D | Pitch | Panneau |
|---|---|---|---|
| 0:00–0:17 | Forêt | Ce que nous ne voyons pas · A | Une forêt ordinaire. Vraiment ? |
| 0:17–0:41 | Sous nos pas (sol vivant) | Ce que nous ne voyons pas · B | Ce qui vit ici nous échappe. |
| 0:41–0:50 | Forêt, remontée | Ce que nous ne voyons pas · A | (panneau Forêt) |
| 0:50–1:07 | Ciel | Rendre l'invisible visible · B | Rendre l'invisible visible. |
| 1:07–1:27 | Rivières | Détection, espèce, validation · B | L'IA détecte et propose. L'humain valide. |
| 1:27–1:43 | Monde sous-marin | « Non… » · A | Reconnaître un animal ne suffit pas. |
| 1:43–2:15 | Zone humide | Données officielles, éclairage · B puis A | Le vivant, replacé dans son territoire. |
| 2:15–3:05 | Prairie et bocage | De l'observation à la décision | Observer, situer, décider : un seul parcours. |
| 3:05–3:35 | L'équipe ARQ (survol du bocage) | Ceux qui ont imaginé Symbiose | Derrière Symbiose, l'équipe ARQ. |
| 3:35–3:47 | Littoral — Étretat | Et demain ? · A | Rendre l'expertise accessible au bon moment. |
| 3:47–4:17 | Changer d'échelle (plongée) | Les trois besoins · B | Ce qu'il nous manque. |
| 4:17–4:30 | Littoral, remontée | « …pas remplacer les experts » · B | (panneau Littoral) |
| 4:30–5:00 | Forêt nocturne | Épilogue — la même forêt | Logo, Comprendre le vivant avant d'aménager. |

Les fins de section du pitch tombent sur 0:50, 2:15, 3:05, 3:35 et 4:30. Le
pitch à deux voix (`pitch-presentation.txt`, à la racine du dépôt) est la
référence orale ; **Sources et texte oral → Pitch chronométré** en reprend les
repères étape par étape. Les indications visuelles du pitch, antérieures à la
scène 3D, ne s'appliquent pas. Le [tableau du jury](PITCH_DATATHON_2026.md)
reste disponible pour les critères.
La validation d'une espèce et l'efficacité d'un aménagement ne sont pas déduites
des illustrations ou des résultats de tests techniques.

## Commandes

| Commande | Comportement |
|---|---|
| Flèches gauche/droite, Page précédente/suivante | Changer de chapitre en présentation |
| Début / Fin | Début ou conclusion |
| Espace hors contrôle interactif | Lecture/pause du récit jusqu'au prochain arrêt |
| Les huit repères latéraux | Retour immédiat au chapitre dans le mode jury |
| Entrer dans le vivant (mode présentation) | Travelling puis lecture continue de cinq minutes |
| Plein écran | Entrer/sortir explicitement du plein écran |
| Régie → Passer l'animation | Avancer immédiatement, sans attendre le déplacement |
| Régie → Recommencer | Rembobiner et réinitialiser le lecteur, sans relancer de modèle |
| Régie → Reprendre | Rejoindre le point sauvegardé avant le rechargement |
| Régie → Secours sans WebGL | Libérer le monde 3D et continuer avec les images 2D |

Les formulaires, le lecteur vidéo, les dialogues et les menus gardent leurs
touches natives. Échap ferme le carnet et ne doit pas changer le chapitre ni
effacer le fichier vidéo ouvert. Avec les mouvements réduits du système, les
points de vue sont fixes et la lecture animée est désactivée.

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
- **Navigateur inutilisable** : ouvrir la galerie de captures depuis
  `output/symbiose/final/` ou le [PDF fixe de huit pages](../output/symbiose/final/secours-symbiose.pdf), lire le script écrit et lancer le montage dans le
  lecteur local du PC lorsqu'il sera fourni. Les captures sont un support fixe,
  pas une démonstration réelle ni une mesure écologique.
- **Application finale indisponible** : terminer le récit et nommer la limite.
  L'accès à Symbiose exige ses services ; le pack du jury ne les simule pas.

Le test hors ligne automatisé ne remplace pas cette répétition sur le matériel
de la salle. Firefox, Safari, lecteur d'écran humain et vidéoprojecteur doivent
faire l'objet d'une recette distincte si ces conditions seront utilisées.

Pour la projection, la version 2D reprend les compositions d'intention et évite
la reconstruction 3D encore schématique. Elle constitue aujourd'hui le choix
le plus proche de la planche artistique. Les deux modes restent accessibles ;
tester et choisir celui de la séance avant l'arrivée du jury.
