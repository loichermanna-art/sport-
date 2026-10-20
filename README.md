# IronPath

Application web pour structurer tes séances de musculation. Elle te dit **quels exercices
faire aujourd'hui** en fonction de ton objectif, et te montre **chaque mouvement en
silhouette animée** pour que tu l'exécutes correctement.

> **Profil configuré** : sèche / perte de gras · niveau débutant · 3 à 6 jours par semaine ·
> démonstrations en silhouettes SVG animées dessinées dans le code.

## Fonctionnalités

| Écran | Ce qu'il fait |
|---|---|
| **Aujourd'hui** | La séance du jour déduite de ton programme. Chronomètre de repos, saisie des séries/reps/poids, barre de progression, récapitulatif à la fin. |
| **Plan** | La semaine complète, jour par jour, avec la liste des exercices de chaque séance. Bouton *Régénérer* pour tirer une nouvelle variante. |
| **Bibliothèque** | Les 52 exercices, en silhouettes **animées au survol**. Filtres par groupe musculaire et par matériel, recherche par nom. |
| **Stats** | Volume, régularité, séries, records personnels, courbe de poids du corps. Export / import JSON. |

Chaque exercice ouvre une fiche avec : la démonstration animée (**lecture/pause,
scrub manuel, vitesse 0,5× / 1× / 1,75×**), les muscles sollicités mis en évidence en
orange pulsé, l'exécution pas à pas, les points de vigilance, les erreurs fréquentes et la
respiration.

## Démarrer

```bash
npm install
npm run dev        # serveur de dev sur http://localhost:5173
```

Autres commandes :

```bash
npm run build      # tsc -b && vite build  -> dossier dist/
npm run preview    # sert le build de production
npm run typecheck  # tsc --noEmit
npm run smoke      # test de rendu : toutes les vues + les 52 figures
npm run check      # typecheck + smoke
```

## Comment ça marche

### Génération du programme — `src/data/programs.ts`

`buildProgram(profile)` compose la semaine à partir de ton objectif, de ton niveau et du
nombre de jours choisi (3 à 6). Chaque séance pioche dans des **bassins d'exercices**
(`POOL`) ordonnés du plus accessible au plus avancé ; `pick(level, pool, offset)` choisit
la variante adaptée à ton niveau, ce qui permet de *régénérer* une semaine différente sans
jamais sortir de ta progression.

Schémas de séries / reps / repos par objectif :

| | Sèche | Prise de masse | Remise en forme |
|---|---|---|---|
| Principal | 4 × 10-12 · 75 s | 4 × 6-8 · 150 s | 3 × 10-12 · 90 s |
| Accessoire | 3 × 12-15 · 60 s | 3 × 10-12 · 90 s | 3 × 10-12 · 60 s |
| Isolation | 3 × 15 · 45 s | 3 × 12-15 · 60 s | 3 × 15 · 45 s |
| Gainage | 3 × 30 s · 45 s | 3 × 30 s · 60 s | 3 × 30 s · 45 s |

Les débutants font une série de moins sur le mouvement principal (`tune`).

### Le moteur de poses — `src/lib/pose.ts`

Un exercice est une liste de **postures clés** (`Pose`) décrites en angles, en unités
« monde » où **le torse vaut 1,0** et **y pointe vers le haut** (0° = vers la droite,
90° = vers le haut). `solve()` transforme ces angles en squelette :

- cinématique directe pour le tronc, la tête et les pieds ;
- **cinématique inverse à deux segments** (`ik2`) pour les bras et les jambes dès qu'une
  cible est donnée (`handNear`, `ankleFar`, …) — les coudes et les genoux reçoivent une
  indication `'up' | 'down' | 'auto'` pour choisir la bonne solution ;
- `mirrorPose()` déduit les membres opposés en vue de face.

`buildTimeline()` / `sampleTimeline(frames, u)` interpolent les postures en une animation
continue (aller-retour, easing, temps de pause `hold`), et propagent le **texte de
coaching** (`cue`) affiché sous la silhouette au bon moment.

### Le moteur de rendu — `src/lib/render.ts`

`renderFigure({ pose, view, gear, highlight, pulse, floor })` traduit une posture en formes
SVG : membres en capsules fuselées, tête, **matériel** (barres, haltères, banc, poulie,
machines, tapis…), sol, ombre. `highlight` colore en orange pulsé les 20 groupes musculaires
du vocabulaire (`MUSCLE_LABEL`), et les membres du côté opposé sont automatiquement
atténués pour donner du relief.

Tout est dessiné en code : **aucune image, aucun GIF, aucun appel réseau**. L'app est donc
légère (~100 ko gzip), fonctionne hors ligne en salle, et reste nette à toute taille.

### Données

- `src/data/exercises.ts` — les 52 exercices, avec leurs images clés, leur matériel, leurs
  muscles, l'exécution pas à pas, les erreurs fréquentes et la respiration.
- `src/data/types.ts` — profil, programme, séance, historique.
- `src/state/store.tsx` — état React + persistance `localStorage` (clé `ironpath.v2`).

## Vérifier les figures

```bash
# 1. Valide la géométrie des 52 exercices (portée des membres, pieds au sol, …)
npx esbuild tools/preview.ts --bundle --platform=node --format=esm --outfile=/tmp/pv.mjs
node /tmp/pv.mjs check

# 2. Génère une planche ou une série d'instants pour un exercice
node /tmp/pv.mjs sheet /tmp/sheet.svg 8     # planche complète
node /tmp/pv.mjs one /tmp/squat.svg squat-barre 6
```

Le validateur attrape les postures dont une cible de main ou de pied dépasse la portée du
membre — ces erreurs sont invisibles à l'œil (le solveur tronque silencieusement) mais
donnent un mouvement cassé.

## PWA

`manifest.webmanifest` + service worker : l'app est installable sur téléphone et se lance
sans réseau.
