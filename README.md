# 🏎️ ApexEngine — Encyclopédie & Comparateur de Moteurs de Voitures

> **Projet de Web Avancé (AP4)** — Développé en **Vanilla TypeScript + Vite**, sans framework externe (ni React, ni Vue, ni jQuery), avec un **State Manager réactif propulsé par `JavaScript Proxy`**, persistance **LocalStorage**, chargement via **API Fetch**, synthétiseur sonore avec **Web Audio API** et **Design System Responsive** (Dark/Light/Auto).

---

## 📋 Table des Matières
1. [Aperçu & Fonctionnalités Clés](#-aperçu--fonctionnalités-clés)
2. [Lancement Rapide](#-lancement-rapide)
3. [Démonstration des Notions du Cours (Grille d'Évaluation)](#-démonstration-des-notions-du-cours)
   - [1. Réactivité par Proxy JavaScript](#1-réactivité-par-proxy-javascript)
   - [2. Manipulation du DOM via l'API DOM Standard](#2-manipulation-du-dom-via-lapi-dom-standard)
   - [3. Gestion Avancée des Événements & Custom Events](#3-gestion-avancée-des-événements--custom-events)
   - [4. API Fetch & Gestion Asynchrone](#4-api-fetch--gestion-asynchrone)
   - [5. Persistance & LocalStorage](#5-persistance--localstorage)
   - [6. Thème Sombre / Clair / Auto](#6-thème-sombre--clair--auto)
   - [7. Animations CSS & Micro-interactions](#7-animations-css--micro-interactions)
   - [8. Responsive Design (CSS Grid & Flexbox)](#8-responsive-design-css-grid--flexbox)
   - [9. Simulateur Sonore & Compte-Tours (Web Audio API)](#9-simulateur-sonore--compte-tours-web-audio-api)
4. [Architecture des Fichiers](#-architecture-des-fichiers)
5. [Guide de Soutenance Orale (Questions / Réponses Types)](#-guide-de-soutenance-orale)

---

## 🌟 Aperçu & Fonctionnalités Clés

- **Catalogue riche** : Moteurs V8, V10, V12, Flat-6 Boxer, 6 en ligne, W16 Quad-Turbo, Wankel Rotatif et Propulsion Électrique.
- **CRUD Réactif Complet** : Ajout, modification et suppression de moteurs en temps réel avec synchronisation instantanée du DOM.
- **Validation de Formulaire en Direct** : Détection des erreurs de saisie sur chaque champ (puissance, régime, cylindrée, regex).
- **Filtres Multi-critères & Recherche Instantanée** : Filtrage par architecture, carburant, suralimentation, puissance, tri dynamique et favoris.
- **Comparateur Face-à-Face** : Sélection de 2 ou 3 moteurs pour une confrontation directe de leurs courbes et fiches techniques.
- **Simulateur Sonore & Tachomètre Interactif** : Compte-tours interactif générant en temps réel les harmoniques acoustiques du moteur via les oscillateurs de la `Web Audio API`.
- **Import / Export JSON** : Téléchargement et sauvegarde externe de la base de données.
- **Maquettes UX/UI Vectorielles** incluses dans le dossier `maquettes/`.

---

## 🚀 Lancement Rapide

### Prérequis
- **Node.js** (version 18+ recommandée)
- **npm**

### Commandes

```bash
# 1. Se placer dans le dossier du projet
cd projet

# 2. Installer les dépendances (uniquement Vite et TypeScript)
npm install

# 3. Lancer le serveur de développement local
npm run dev

# 4. Compiler le bundle de production
npm run build
```

L'application s'ouvrira à l'adresse locale : `http://localhost:5173/`.

---

## 🎓 Démonstration des Notions du Cours

### 1. Réactivité par Proxy JavaScript
*Fichier : `src/state/proxyStore.ts`*

Plutôt que d'utiliser un framework lourd, le projet implémente un **Store réactif natif** à l'aide de l'objet standard `new Proxy(target, handler)`.
- **Trap `set`** : Intercepte toute assignation de propriété ou modification de tableau. Dès qu'une valeur change, le Proxy déclenche automatiquement :
  1. La persistance dans `LocalStorage` via `StorageService.saveEngines()`.
  2. La notification de tous les écouteurs abonnés (`this.notify(key)`).
- **Trap `deleteProperty`** : Intercepte la suppression d'une clé.

```typescript
function createReactiveObject<T extends object>(target: T, onChange: (key: string, value: any) => void): T {
  return new Proxy(target, {
    set(obj, prop, value, receiver) {
      const oldValue = obj[prop];
      const result = Reflect.set(obj, prop, value, receiver);
      if (oldValue !== value) {
        onChange(String(prop), value); // Notifie les composants DOM abonnés
      }
      return result;
    }
  });
}
```

### 2. Manipulation du DOM via l'API DOM Standard
*Fichiers : `src/utils/dom.ts`, `src/components/*.ts`*

Toute l'interface est générée et mise à jour dynamiquement avec les APIs natives du navigateur :
- `document.createElement()`, `appendChild()`, `removeChild()`, `querySelector()`.
- `setAttribute()`, `classList.add()`, `classList.remove()`, `classList.toggle()`.
- Échappement anti-XSS systématique des entrées utilisateurs via `escapeHtml()`.

### 3. Gestion Avancée des Événements & Custom Events
- **Délégation d'événements** : Gestion des clics sur les cartes via `closest()` pour optimiser les performances mémoires.
- **Custom Events** : Communication découplée entre composants (ex: `open-engine-form`, `open-engine-detail`).
- **Raccourcis Clavier** :
  - Touche `/` : Activer et cibler la barre de recherche.
  - Touche `n` ou `N` : Ouvrir le formulaire de création d'un moteur.
  - Touche `Escape` : Fermer instantanément les modales ouvertes.

### 4. API Fetch & Gestion Asynchrone
*Fichier : `src/services/engineService.ts`*

L'application utilise `fetch('/data/engines.json')` avec `async / await` pour charger la base initiale de moteurs.
Un bouton **Reset** dans la barre de navigation permet à tout moment de re-télécharger les données d'origine via Fetch et de réinitialiser l'état réactif.

### 5. Persistance & LocalStorage
*Fichier : `src/state/storage.ts`*

- Synchronisation continue des moteurs créés, modifiés ou supprimés.
- Sauvegarde du thème sélectionné (`dark`, `light`, `auto`) et de la liste de comparaison active.
- Export direct de la base au format JSON téléchargeable (`StorageService.exportToJsonFile()`).

### 6. Thème Sombre / Clair / Auto
*Fichiers : `src/styles/variables.css`, `src/components/Navbar.ts`*

- Attribut `data-theme="dark|light"` appliqué dynamiquement sur `<html>`.
- En mode `auto`, l'application écoute la media query système `window.matchMedia('(prefers-color-scheme: dark)')` et s'adapte en temps réel aux préférences de l'OS.

### 7. Animations CSS & Micro-interactions
*Fichiers : `src/styles/animations.css`, `src/components/Toast.ts`*

- **Animations d'entrée décalées (Stagger)** : Chaque carte de la grille apparaît avec un léger délai d'animation calculé (`animation-delay`).
- **Suppression animée** : Animation de réduction et fondu avant le retrait effectif du DOM.
- **Pulsation cardiaque (Heartbeat)** sur le bouton Like et le cœur des favoris.
- **Toasts flottants animés** avec barre latérale colorée et disparition douce.

### 8. Responsive Design (CSS Grid & Flexbox)
*Fichiers : `src/styles/responsive.css`, `src/styles/components.css`*

- **CSS Grid dynamique** : `grid-template-columns: repeat(auto-fill, minmax(340px, 1fr))` pour une adaptation fluide sur toutes les résolutions.
- **Flexbox** pour l'alignement des éléments de navigation, barres de recherche et actions de cartes.
- Adaptation mobile complète (collapse des barres de filtres, drawer de comparaison plein écran, boutons tactiles larges).

### 9. Simulateur Sonore & Compte-Tours (Web Audio API)
*Fichier : `src/services/audioEngine.ts`*

Fonctionnalité originale et immersive :
- Utilise un `AudioContext` natif avec 3 oscillateurs (`sawtooth` et `triangle`) et un filtre `BiquadFilterNode` passe-bas.
- Lorsque l'utilisateur augmente le régime sur le compte-tours (slider ou bouton accélération), la fréquence fondamentale et l'ouverture du filtre augmentent, reproduisant l'échappement d'un moteur de course.

---

## 📂 Architecture des Fichiers

```text
projet/
├── index.html                  # Page HTML5 principale sémantique
├── package.json                # Dépendances Vite & TS
├── tsconfig.json               # Config TypeScript
├── vite.config.ts              # Config Vite
├── public/
│   ├── favicon.svg             # Favicon dynamique
│   └── data/
│       └── engines.json        # Base JSON chargée via Fetch API
├── maquettes/
│   ├── wireframes.svg          # Maquettes vectorielles Desktop & Mobile
│   └── README_MAQUETTES.md     # Spécifications UX/UI
├── src/
│   ├── main.ts                 # Point d'entrée de l'application
│   ├── types/
│   │   └── engine.ts           # Typage TypeScript strict
│   ├── state/
│   │   ├── proxyStore.ts       # Store réactif avec JS Proxy
│   │   └── storage.ts          # Service LocalStorage & Export JSON
│   ├── services/
│   │   ├── engineService.ts    # Fetch API asynchrone
│   │   └── audioEngine.ts      # Web Audio API Sound Synthesizer
│   ├── components/
│   │   ├── Navbar.ts           # Navigation, Thème, Recherche, Actions
│   │   ├── StatsOverview.ts    # Métriques clés en temps réel
│   │   ├── FilterBar.ts        # Filtres & Tri
│   │   ├── EngineCard.ts       # Carte moteur avec actions & micro-interactions
│   │   ├── EngineGrid.ts       # Grille de cartes & états vides
│   │   ├── EngineFormModal.ts  # Modale CRUD & validation en direct
│   │   ├── EngineDetailModal.ts# Fiche technique & Tachomètre interactif
│   │   ├── CompareDrawer.ts    # Comparateur côte à côte
│   │   └── Toast.ts            # Notifications toast animées
│   ├── utils/
│   │   ├── dom.ts              # Utilitaires de création DOM
│   │   └── validator.ts        # Règles de validation de formulaires
│   └── styles/
│       ├── main.css            # Point d'entrée CSS
│       ├── variables.css       # Tokens de couleurs Dark/Light
│       ├── components.css      # Styles des composants
│       ├── animations.css      # Keyframes et transitions
│       └── responsive.css      # Media Queries
└── README.md                   # Ce document
```

---

## 🎙️ Guide de Soutenance Orale

Voici les réponses préparées aux questions susceptibles d'être posées par l'évaluateur :

### Q1 : Comment fonctionne la réactivité sans React ni Vue ?
> **Réponse** : Nous utilisons l'objet natif `Proxy` de JavaScript dans `proxyStore.ts`. Le Proxy enveloppe notre objet d'état global (`AppState`). Dès qu'une propriété est modifiée (trap `set`), le Proxy intercepte l'opération, sauvegarde automatiquement la nouvelle valeur dans `LocalStorage` et appelle tous les callbacks d'abonnés enregistrés via le pattern PubSub/Observer pour mettre à jour le DOM ciblé.

### Q2 : Pourquoi utiliser l'API DOM plutôt que du `innerHTML` partout ?
> **Réponse** : L'API DOM (`createElement`, `addEventListener`) offre une meilleure sécurité contre les failles XSS, permet de conserver les écouteurs d'événements attachés sans détruire l'arborescence DOM inutilement et améliore les performances de rendu.

### Q3 : Comment gérez-vous la validation des formulaires ?
> **Réponse** : La classe `EngineValidator` applique des règles de validation métier (bornes de puissance, format de régime, champs obligatoires). Les erreurs sont détectées en direct lors de la saisie (`input` event) et affichées immédiatement sous le champ concerné avec un style visuel distinct.

### Q4 : Comment est géré le son sans fichier MP3 ?
> **Réponse** : Le son est généré en temps réel par la **Web Audio API** grâce à trois oscillateurs couplés à un filtre passe-bas dynamique. Cela évite le chargement de fichiers audio externes lourds et permet de faire varier la fréquence sonore proportionnellement au régime (RPM) du compte-tours interactif.
