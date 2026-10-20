# Proposition de refonte — GYM OS

**Statut : proposition soumise à validation. Aucune ligne de code n'a été modifiée.**

Ce document suit la méthode demandée : diagnostic, direction visuelle, description page par page,
distinction visuel / fonctionnel, puis spécifications.

---

## 1. Diagnostic de l'interface actuelle

L'application s'appelle aujourd'hui **IronPath** (thème sombre). Analyse menée sur
`src/styles.css` (1 086 lignes), `src/App.tsx` et les cinq vues.

### 1.1 Ce qui contredit frontalement la direction artistique demandée

| Constat | Emplacement | Règle enfreinte |
|---|---|---|
| Fond quasi noir `#080b13` | `:root`, ligne 7 | « Fond principal : blanc ou gris très clair » |
| Accent orange `#ff7a1a` + rose `#ff3d7f` | `:root`, lignes 16-17 | « Couleur d'accent : bleu moderne » |
| `--grad: linear-gradient(135deg, …)` | `:root`, ligne 25 | « Aucun dégradé décoratif » |
| Deux `radial-gradient` orange et cyan sur `body` | lignes 44-48 | « Aucun effet lumineux ou néon » |
| `--shadow: 0 18px 40px -20px rgba(0,0,0,.9)` | ligne 24 | « Aucune ombre lourde » |
| Surfaces en `rgba(255,255,255,.035)` | lignes 9-13 | « Aucun effet de transparence excessive » |
| Rayon de 18 px généralisé | ligne 22 | Style « template », à resserrer |
| `--cyan: #22d3ee` utilisé dans les graphiques | `Stats.tsx`, ligne 94 | Cohérence chromatique |

Le thème sombre n'est pas en soi un défaut, mais il est ici **entièrement construit sur des
effets** : halos radiaux, dégradé d'accent, ombres portées lourdes, transparences empilées.
Retirer ces effets revient à refaire le système de design, pas à le repeindre.

### 1.2 Problèmes d'ergonomie identifiés

1. **Aucune icône, uniquement des emoji.** `🎯 🗓 🎬 📈 🏋️ 🔄 🏃 😴` servent de système
   d'icônes (`App.tsx` lignes 13-16, `Plan.tsx`, `Today.tsx`). Rendu incohérent d'un
   système à l'autre (Apple / Google / Windows), impossibles à aligner optiquement, et
   non contrôlables en couleur ou en épaisseur.

2. **Aucune gestion de `prefers-reduced-motion`.** Recherche exhaustive dans `src/` :
   **zéro occurrence**. Les animations sont donc imposées à tout le monde, y compris aux
   utilisateurs qui ont demandé à l'OS de les réduire. Manque également l'alternative
   statique demandée pour les démonstrations.

3. **Le lecteur de démonstration est diffusé hors de la bibliothèque.** `AnimatedFigure`
   apparaît à trois endroits : `ExerciseDetail.tsx` (légitime), `Onboarding.tsx` ligne 66
   (figure décorative du héros) et `Today.tsx` ligne 79 (en pleine séance). Les deux
   derniers contredisent la règle « uniquement dans le détail d'un exercice ».

4. **Pas de distinction claire entre « se préparer » et « s'entraîner ».** L'écran
   *Aujourd'hui* mélange trois états dans une même page : jour de repos, séance à venir,
   saisie en cours. Pendant l'effort, l'utilisateur conserve la sidebar et la navigation
   complète — autant de cibles parasites.

5. **Densité d'information mal calibrée sur le suivi.** Cinq indicateurs affichés
   d'un coup (série, séances, volume 7 j, temps total, volume cumulé) plus deux
   graphiques plus les records. Le brief demande explicitement de « ne pas afficher
   trop de statistiques simultanément ».

6. **Pas de tableau de bord.** L'application s'ouvre directement sur la séance du jour.
   Il n'existe aucun point d'entrée unique permettant de répondre à « où en suis-je ? ».

7. **Le typage visuel repose sur des styles en ligne.** De nombreux composants portent
   des `style={{ marginTop: 14 }}`, `style={{ fontSize: 17 }}`, `style={{ textAlign: 'center' }}`
   (`App.tsx`, `Plan.tsx`, `Today.tsx`). Cela empêche toute cohérence transversale et
   complique la refonte.

8. **Breakpoints non alignés sur les cibles.** Le CSS définit `max-width: 860px` et
   `min-width: 760px` (lignes 198, 453). Aucun palier à 768 px (tablette), 1 366 px ou
   1 440 px. Le contenu n'est pas plafonné en largeur sur grand écran.

9. **`Inter` est demandée mais jamais chargée.** `--font` la cite en premier (ligne 26)
   sans aucun `<link>` dans `index.html` : la police réellement utilisée est la pile
   système. Incohérence silencieuse entre l'intention et le rendu.

### 1.3 Ce qui fonctionne déjà et doit être préservé

- Le moteur de poses et de rendu SVG : 52 exercices validés, aucune dépendance.
- La logique de génération de programme à partir du profil.
- Le store React + persistance `localStorage`.
- Les 52 fiches d'exercices (exécution, erreurs, respiration).

---

## 2. Direction visuelle proposée

**Light-first, minimaliste, premium, orienté produit.** Sobriété et hiérarchie plutôt qu'effets.

### 2.1 Jetons de conception

Remplacement intégral du bloc `:root`. Les valeurs de contraste sont données sur fond blanc.

| Jeton | Sombre actuel | Clair proposé | Rôle | Contraste |
|---|---|---|---|---|
| `--bg` | `#080b13` | `#fbfcfd` | Fond de page | — |
| `--surface` | `rgba(255,255,255,.035)` | `#ffffff` | Cartes | — |
| `--surface-2` | `rgba(255,255,255,.06)` | `#f7f8fa` | Zones secondaires, en-têtes de tableau | — |
| `--border` | `rgba(255,255,255,.09)` | `#e5e7eb` | Bordure fine par défaut | — |
| `--border-strong` | `rgba(255,255,255,.16)` | `#d1d5db` | Bordure au survol / focus secondaire | — |
| `--text` | `#eef2fb` | `#0f172a` | Texte principal | 17,9:1 |
| `--muted` | `#93a0bd` | `#4b5563` | Texte secondaire | 7,5:1 |
| `--muted-2` | `#6c7a99` | `#6b7280` | Labels tertiaires, unités | 4,8:1 |
| `--accent` | `#ff7a1a` | `#2563eb` | Actions principales, actif, données | 4,7:1 |
| `--accent-hover` | — | `#1d4ed8` | Survol de l'accent | 6,0:1 |
| `--accent-soft` | `rgba(255,122,26,.14)` | `#eff4ff` | Fond d'accent discret | — |
| `--success` | `#34d399` | `#15803d` | Réussite | 4,9:1 |
| `--warning` | — | `#b45309` | Attention | 4,9:1 |
| `--danger` | `#f87171` | `#dc2626` | Erreur, suppression | 4,8:1 |

Tous les textes respectent **WCAG AA (4,5:1)**. Les couleurs de statut ne sont jamais
portées seules : elles sont systématiquement doublées d'un libellé ou d'une icône.

### 2.2 Suppressions nettes

- `--grad` (dégradé décoratif) — **supprimé**
- Les deux `radial-gradient` du `body` — **supprimés**, fond uni
- `--cyan` — **supprimé** des graphiques, remplacé par `--accent` et des gris
- Toute `box-shadow` à forte diffusion — remplacée par :
  - `shadow-sm: 0 1px 2px rgba(15,23,42,.04)` (repos)
  - `shadow-md: 0 1px 3px rgba(15,23,42,.06), 0 1px 2px rgba(15,23,42,.04)` (survol, menus)
  - `shadow-lg` réservée aux modales et au chronomètre de repos : `0 8px 24px -8px rgba(15,23,42,.16)`

### 2.3 Formes, typographie, mouvement

- **Rayons** : 6 px (chips, inputs), 10 px (cartes, boutons), 14 px (modales). Fin du 18 px.
- **Bordures** : 1 px, `var(--border)`. Jamais d'épaisseur supérieure.
- **Typographie** : conservation de la pile système déclarée dans `--font`, en retirant
  `Inter` de la déclaration puisqu'elle n'est pas chargée. Zéro requête réseau, zéro
  dépendance, rendu identique sur toutes les plateformes. Échelle : 12 / 13 / 14 / 16 /
  20 / 24 / 30 px, interligne 1,5 pour le corps de texte, `letter-spacing: -0.01em` sur
  les titres uniquement.
- **Mouvement** : 120 à 160 ms, `cubic-bezier(.2,0,0,1)`, uniquement sur `opacity` et
  `transform`. Aucune animation décorative. Sous `prefers-reduced-motion: reduce`,
  toutes les transitions d'interface passent à 0 ms et les figures se figent (§ 5).
- **Grille** : gouttières de 16 px (mobile) à 24 px (desktop), contenu plafonné à
  **1 200 px** sur grand écran pour éviter l'étirement.

### 2.4 Icônes

Remplacement des 14 emoji par un jeu d'icônes **SVG en trait** (grille 24 px, épaisseur
1,5, `stroke="currentColor"`, aucune dépendance externe).

Icônes nécessaires : tableau de bord, programmes, bibliothèque, suivi, paramètres,
lecture, pause, rejouer, recherche, fermer, flèche, validation, ajout, suppression,
archivage, mise en pause, poignée de réordonnancement, chronomètre.

Implémentation : un composant `<Icon name="…" size={20} />` unique, qui centralise les
tracés. Gain attendu : cohérence optique, alignement exact, héritage de couleur, et
accessibilité (`aria-hidden` par défaut, libellé porté par le parent).

---

## 3. Architecture et navigation cibles

### 3.1 Arborescence proposée

| # | Entrée | Origine | Nature du changement |
|---|---|---|---|
| — | **Onboarding** | existe | visuel |
| A | **Tableau de bord** | **nouveau** | fonctionnel |
| B | **Programmes** | évolution de *Planning* | fonctionnel (important) |
| C | **Bibliothèque** | évolution d'*Exercices* | visuel + recentrage |
| D | **Séance** | extrait d'*Aujourd'hui* | visuel + fonctionnel léger |
| E | **Suivi** | évolution de *Stats* | visuel + fonctionnel léger |
| F | **Paramètres** | **nouveau** | fonctionnel |

**La Séance n'est pas un onglet permanent.** C'est un écran dédié, en pleine largeur,
ouvert par l'action « Démarrer la séance » depuis le tableau de bord ou la fiche d'un jour.
La navigation latérale et la barre basse y sont masquées au profit d'un en-tête minimal
(nom de la séance, progression, bouton d'interruption). C'est la réponse directe à
l'exigence « ne pas encombrer l'écran pendant l'entraînement ».

Ordre retenu dans la navigation, du plus fréquent au plus ponctuel :
**Tableau de bord → Programmes → Bibliothèque → Suivi → Paramètres**.

### 3.2 Navigation

**Desktop (≥ 1 024 px)** — sidebar fixe de 248 px, fond `--bg`, bordure droite 1 px :
marque en haut, puis les cinq entrées, puis en bas la carte de profil compacte.
Page active signalée par : fond `--accent-soft`, libellé en `--accent`, et **un liseré
vertical de 2 px** à gauche (et non par la couleur seule, pour rester lisible en
déficience colorimétrique).

**Mobile** — barre basse fixe, cinq entrées, hauteur 56 px + zone de sécurité iOS
(`env(safe-area-inset-bottom)`, déjà déclarée via `--safe-b`). Icône 22 px au-dessus du
libellé 11 px. La sidebar disparaît complètement, sans tiroir : la barre basse suffit
pour cinq entrées.

Les raccourcis clavier `1` à `4` deviennent `1` à `5`, avec `g` puis une lettre en
alternative. Ils sont désactivés lorsqu'un champ est actif et à l'intérieur d'une modale.

---

## 4. Description page par page

### A. Tableau de bord — *nouvel écran*

Point d'entrée unique. Hiérarchie volontairement courte : **trois niveaux de lecture**.

1. **Bandeau de bienvenue** — « Bonjour {prénom} » + jour et date. Sans emoji, sans
   gadget. Une ligne.
2. **Bloc prochaine séance** — carte en évidence, accentuée : nom de la séance, jour,
   nombre d'exercices, durée estimée, et le bouton principal **« Démarrer la séance »**
   (pleine largeur sur mobile). Si le jour est un jour de repos, la carte affiche
   « Jour de repos » et propose la séance suivante, sans jamais rien inventer.
3. **Grille de quatre indicateurs** — séances réalisées cette semaine, volume de la
   semaine (kg), série en cours (jours d'affilée), et charge ou record récent le plus
   pertinent. Quatre maximum, comme demandé.
4. **Activité récente** — les trois dernières séances, avec date, nom, volume et durée.

Données affichées : **uniquement celles réellement présentes dans l'historique**. Aucune
valeur simulée, aucun graphique décoratif. Si l'historique est vide, chaque bloc affiche
un état vide explicite indiquant ce qui apparaîtra ici et après quoi.

### B. Programmes — *évolution de Planning*

L'écran actuel affiche une semaine générée, avec un unique bouton « Régénérer ».
Le brief demande **consulter, créer, modifier, mettre en pause, archiver, supprimer,
visualiser les jours, réorganiser les jours**.

C'est le **changement fonctionnel le plus lourd** de la proposition, et il touche au
modèle de données (§ 5.2). Il est donc soumis à validation séparée.

Si le périmètre est retenu, l'écran propose :
- une liste de programmes sous forme de cartes (nom, objectif, niveau, jours par
  semaine, statut : actif / en pause / archivé) ;
- pour le programme sélectionné, la semaine en sept colonnes, chaque jour étant
  **déplaçable** par glisser-déposer avec une poignée visible, plus un repli
  clavier équivalent (boutons monter / descendre) pour l'accessibilité ;
- les actions (modifier, mettre en pause, archiver, supprimer) dans un menu, avec
  **confirmation obligatoire avant toute suppression ou archivage**.

Si le périmètre n'est **pas** retenu dans un premier temps, l'écran conserve son
contenu actuel et ne reçoit que la refonte visuelle, en renommant l'entrée « Programmes ».

### C. Bibliothèque — *évolution d'Exercices*

Structure conservée (recherche, filtres par groupe musculaire et par matériel, grille
de fiches). Changements :

- La grille passe à des cartes sobres, bordure 1 px, sans ombre.
- Chaque carte affiche : nom, muscles principaux, matériel.
- **Les vignettes deviennent statiques** : une silhouette au repos, en trait fin.
  C'est le choix cohérent avec « le lecteur uniquement dans le détail » et avec
  « aucun élément décoratif sans utilité ». L'animation au survol actuelle
  (`FigureThumb`, `Library.tsx` ligne 82) est retirée. *Point soumis à validation.*
- La fiche détaillée est conservée et restructurée : en-tête (nom, matériel, muscles),
  puis **le lecteur**, puis l'exécution, les erreurs fréquentes et la respiration.

**Le lecteur de démonstration n'existe plus que dans cette fiche.** Il reçoit :
- des contrôles lisibles et dimensionnés : lecture / pause, rejouer, curseur de
  progression, et trois vitesses (0,5× / 1× / 1,75×) sous forme de puces ;
- une légende de consigne synchronisée avec le mouvement ;
- **une alternative statique** : sous `prefers-reduced-motion: reduce`, la figure se
  fige automatiquement sur la posture clé et les commandes d'animation sont remplacées
  par un sélecteur de postures (planche de 4 images clés). Un interrupteur explicite
  « Réduire les animations » dans les paramètres permet d'imposer ce comportement
  indépendamment de l'OS.

Les deux autres usages du lecteur sont retirés : la figure du héros de l'onboarding est
supprimée (gain de place, aucune perte fonctionnelle), et l'illustration en cours de
séance est remplacée par une vignette statique consultable à la demande.

### D. Séance — *extraction d'Aujourd'hui*

Écran plein écran, sans navigation latérale. Objectif : **tenir debout à bout de bras,
entre deux séries, avec les mains moites**.

- **En-tête collant** : nom de la séance, progression (`3/5 exercices` + barre de 4 px),
  et bouton « Interrompre » à droite, avec confirmation avant abandon.
- **Cartes d'exercice** : une par exercice, espacées de 16 px. Nom, consigne de
  répétitions, et le tableau de saisie.
- **Saisie rapide** : pour chaque série, un champ de répétitions, un champ de charge
  (pré-remplis à partir de la dernière séance, comme aujourd'hui), et une **cible de
  validation de 48 × 48 px minimum**. Les champs restent en `inputmode="decimal"` pour
  faire apparaître le bon clavier sur mobile.
- **Chronomètre de repos** : apparaît en bas de l'écran après validation d'une série,
  sous forme de bandeau discret et non de modale bloquante. Anneau de progression,
  temps restant, bouton « +15 s » et « Passer ». Son et vibration conservés.
- **Pied de page** : bouton « Terminer la séance » pleine largeur, actif dès qu'une
  série est validée.
- L'écran de fin affiche un récapitulatif factuel : durée, volume, séries effectuées.

### E. Suivi — *évolution de Stats*

Mêmes données, meilleure hiérarchie.

- **Sélecteur de période** en haut (7 jours / 30 jours / 90 jours / tout), appliqué à
  l'ensemble des graphiques. C'est l'ajout fonctionnel demandé (« périodes
  sélectionnables »).
- **Trois indicateurs** au lieu de cinq : séances sur la période, volume total, série
  en cours. Les deux autres sont relégués en lecture secondaire.
- **Graphiques sobres** : barres fines (8 px, rayon 2 px) en `--accent` sur fond
  `--surface-2`, axes en `--muted-2` 11 px, **unités explicites** (« kg », « séances »),
  ligne de référence en pointillés plutôt qu'aplats de couleur. Courbe de poids du
  corps en trait de 2 px, sans aire de remplissage.
- **Records personnels** et **historique** conservés, présentés en tableau à en-tête
  discret, avec message explicite lorsqu'aucune donnée n'existe.
- Export / import JSON conservé, replacé dans les paramètres plutôt qu'en plein écran.

### F. Paramètres — *nouvel écran*

Uniquement des réglages **réellement pris en charge**, organisés en sections :

1. **Profil** — nom, objectif, niveau, jours par semaine, poids, âge, sexe, cardio.
   Reprend le formulaire de l'onboarding existant, sans le re-développer.
2. **Affichage** — unités (kg / lb), réduction des animations, thème clair (unique
   à ce stade, donc non présenté comme un choix).
3. **Entraînement** — son du chronomètre, vibration, durée de repos par défaut.
4. **Données** — export JSON, import JSON, et **réinitialisation** avec double
   confirmation.

Aucun réglage décoratif ou non fonctionnel ne sera ajouté.

---

## 5. Distinction visuel / fonctionnel

### 5.1 Changements purement visuels (sans risque fonctionnel)

- Remplacement intégral des jetons de couleur et de forme.
- Suppression des dégradés, halos, ombres lourdes et transparences.
- Remplacement des 14 emoji par des icônes SVG.
- Restructuration de `styles.css` en primitives réutilisables (`.btn`, `.card`,
  `.chip`, `.input`, `.badge`, `.table`, `.empty`, `.skeleton`), et suppression
  progressive des styles en ligne.
- Refonte des états : repos, survol, focus visible, actif, désactivé.
- Mise en conformité responsive (§ 6).
- Réécriture des graphiques (barres fines, axes, unités, lignes de référence).

### 5.2 Changements fonctionnels (à valider explicitement)

| # | Changement | Impact modèle de données | Effort |
|---|---|---|---|
| F1 | Nouvel écran Tableau de bord | aucun — assemblage de données existantes | faible |
| F2 | Séance en écran dédié, sans navigation | aucun | faible |
| F3 | Sélecteur de période sur le Suivi | aucun | faible |
| F4 | Nouvel écran Paramètres | aucun — déplace le formulaire d'onboarding | moyen |
| F5 | Retrait du lecteur hors bibliothèque | aucun (retrait) | faible |
| F6 | `prefers-reduced-motion` + alternative statique | aucun | moyen |
| **F7** | **CRUD programmes, pause, archivage, réordonnancement des jours** | **oui — voir ci-dessous** | **élevé** |

**F7 est le seul changement qui touche au modèle de données.** Aujourd'hui, `AppState`
contient un unique champ `program: Program | null`, produit par `buildProgram(profile)`.
Supporter plusieurs programmes avec des statuts implique de passer à
`programs: Program[]` accompagné d'un `activeProgramId`, et d'ajouter un champ
`status` à `Program`.

Cela nécessite une **migration de la clé `localStorage`** (`ironpath.v2` → `v3`) avec
conversion de l'ancien format à la volée, pour ne perdre ni l'historique ni le programme
en cours. Cette migration est parfaitement faisable, mais le brief demande de ne pas
modifier le modèle de données « sans nécessité validée » : **je la soumets donc à
validation séparée** et propose de la traiter après le socle visuel.

---

## 6. Responsive

Approche mobile-first. Paliers proposés :

| Palier | Cible | Disposition |
|---|---|---|
| base | 360 – 430 px | une colonne, barre basse, cartes pleine largeur |
| ≥ 600 px | grandes phablettes | grilles à 2 colonnes |
| ≥ 768 px | tablette | grilles à 2-3 colonnes, sidebar encore masquée |
| ≥ 1 024 px | ordinateur portable | sidebar 248 px, contenu plafonné |
| ≥ 1 366 / 1 440 px | grand écran | contenu plafonné à **1 200 px**, centré, gouttières 24 px |

Engagements vérifiables sur mobile : aucun débordement horizontal, aucune troncature
gênante (les libellés longs passent à la ligne avec `text-wrap: balance` sur les
titres), cibles tactiles ≥ 44 px (48 px sur les contrôles de séance), graphiques
lisibles à 360 px de large, formulaires en pleine largeur avec clavier numérique adapté.

---

## 7. Accessibilité

Travaux prévus, tous vérifiables :

- **Focus visible** : anneau de 2 px en `--accent` avec décalage de 2 px, sur tous les
  éléments interactifs, jamais supprimé.
- **Navigation clavier complète** : ordre de tabulation logique, piège de focus dans les
  modales, `Échap` pour fermer, retour du focus à l'élément déclencheur.
- **Libellés** : `aria-label` sur les boutons icône, `aria-current="page"` sur l'entrée
  active, `role="status"` et `aria-live="polite"` pour le chronomètre de repos et les
  confirmations, balisage sémantique (`nav`, `main`, `h1` unique par page).
- **États vides** : message indiquant ce qui s'affichera ici et à quelle condition.
- **Chargement** : états de squelette sur les vues calculées, jamais de bloc vide.
- **Erreurs** : messages en clair, associés au champ concerné par `aria-describedby`.
- **Suppressions** : confirmation systématique, avec le nom de l'élément concerné.
- **`prefers-reduced-motion`** : honoré globalement, doublé d'un réglage manuel.
- Aucune information portée par la couleur seule.

---

## 8. Plan d'exécution proposé

Chaque phase est livrable et testable indépendamment.

| Phase | Contenu | Nature |
|---|---|---|
| **0** | Jetons clairs, primitives CSS, icônes SVG, suppression dégradés / halos / ombres | visuel |
| **1** | Coque applicative : sidebar desktop, barre basse mobile, états actifs et focus | visuel |
| **2** | Séance : écran dédié, cibles tactiles, chronomètre en bandeau | visuel + F2 |
| **3** | Tableau de bord | F1 |
| **4** | Bibliothèque et fiche : lecteur recentré, alternative statique | visuel + F5, F6 |
| **5** | Suivi : périodes, graphiques sobres | visuel + F3 |
| **6** | Paramètres | F4 |
| **7** | Programmes : CRUD et réordonnancement | **F7 — soumis à validation** |
| **8** | Accessibilité, responsive 360 → 1 440, tests, build | vérification |

---

## 9. Questions en attente de validation

| # | Question | Recommandation |
|---|---|---|
| Q1 | Le produit doit-il s'appeler **GYM OS** (renommage complet) ou conserver **IronPath** ? | Suivre ton choix |
| Q2 | Périmètre de la première passe ? | Socle visuel + séance + tableau de bord (phases 0 à 3) |
| Q3 | Faut-il engager **F7** (multi-programmes, pause, archivage, réordonnancement) avec sa migration de données ? | Oui, mais en dernier |
| Q4 | Vignettes de la bibliothèque : **statiques** ou conservées animées au survol ? | Statiques |

---

## 10. Critères d'acceptation et vérification

À l'issue de l'implémentation, je m'engage sur les vérifications suivantes, dont je
documenterai les résultats réels :

1. `npm run typecheck` — zéro erreur TypeScript.
2. `npm run build` — build de production réussi, avec taille des bundles.
3. `npm run smoke` — les tests de rendu existants (toutes les vues, 52 figures,
   624 images) continuent de passer.
4. `node /tmp/pv.mjs check` — les 52 exercices restent validés géométriquement.
5. Contrôle manuel des quatre largeurs cibles (360, 768, 1 366, 1 440 px) avec relevé
   des débordements horizontaux constatés.
6. Parcours clavier complet de chaque écran, en relevant l'ordre de tabulation réel.
7. Vérification des contrastes mesurés sur les paires de couleurs réellement utilisées.

Je ne prétendrai pas avoir effectué une vérification qui n'a pas eu lieu : tout point
non vérifié sera signalé comme tel.

---

*Proposition rédigée le 20 octobre 2026. Aucune modification de code n'a été apportée
dans l'attente de ton approbation.*
