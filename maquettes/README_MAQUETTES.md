# Maquettes et Guide de Conception Graphique UX/UI — ApexEngine

Ce dossier contient les éléments de conception et les maquettes vectorielles de l'application **ApexEngine**, conçue pour l'évaluation du projet de Web Avancé.

---

## 1. Fichiers Disponibles

- **`wireframes.svg`** : Maquette vectorielle haute fidélité regroupant :
  1. **Vue Desktop Principale (Dark Mode)** : Barre de navigation, tableau de bord de statistiques en direct, filtres par pilules/selects, grille de cartes de moteurs avec actions interactives.
  2. **Vue Mobile Responsive** : Adaptation sur écran smartphone avec drawer, disposition compacte et navigation optimisée au pouce.
  3. **Modale Fiche Détaillée & Tachomètre Audio** : Compte-tours interactif relié à la Web Audio API pour jouer le son de chaque moteur.
  4. **Tiroir & Modale de Comparaison Face-à-Face** : Comparaison technique de 2 à 3 moteurs simultanément.

---

## 2. Charte Graphique & Design Tokens

### Palette de Couleurs
- **Racing Red (Primaire)** : `#ff3838` — Dynamisme automobile, puissance et sportivité.
- **Amber Orange (Secondaire)** : `#ff9f1a` — Éléments d'accentuation, badges et likes.
- **Cyan Turbo** : `#00d2d3` — Suralimentation, surpresseurs et haut régime.
- **Carbon Dark (Background Sombre)** : `#0d0f12` et surfaces `#16191f`.
- **Pure White (Background Clair)** : `#f1f5f9` et surfaces `#ffffff`.

### Typographie
- **Titres & Identité** : Inter / Sans-serif moderne (800 / 900 extra-bold).
- **Chiffres du Compte-tours (RPM)** : JetBrains Mono / Monospace à chasse fixe pour éviter les décalages visuels lors de l'accélération.

---

## 3. Démarche Ergonomique
- **Zéro Rechargement de Page (SPA fluide)** grâce à l'interception des mutations d'état par `Proxy`.
- **Validation en direct (Real-time form validation)** avec affichage contextuel des erreurs.
- **Micro-interactions sonores et visuelles** : Le compte-tours interactif et le synthétiseur audio Web Audio API permettent à l'évaluateur de tester une fonctionnalité originale et ludique.
