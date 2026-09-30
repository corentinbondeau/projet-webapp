# ApexEngine

Encyclopédie et comparateur de moteurs de voitures — projet web avancé (AP4).

Fait en TypeScript + Vite, sans React/Vue. Le state est géré avec un `Proxy` JS, les données passent par Fetch + LocalStorage, et y a un petit simulateur sonore via la Web Audio API.

## Lancer le projet

```bash
npm install
npm run dev
```

Build : `npm run build`

## Ce qu'il y a

- catalogue de moteurs (V8, V10, V12, flat-6, électrique, etc.)
- ajout / modif / suppression (CRUD) avec màj du DOM en direct
- validation du formulaire à la saisie
- filtres, recherche, tri, favoris
- comparateur 2–3 moteurs
- compte-tours + son généré (pas de fichier mp3)
- import / export JSON
- thème dark / light / auto
- maquettes dans `maquettes/`

## Notions du cours

### Proxy réactif — `src/state/proxyStore.ts`

Le store est wrappé dans un `Proxy`. Quand une propriété change (trap `set`), on sauvegarde dans le LocalStorage et on notifie les abonnés pour refresh le DOM.

### DOM natif — `src/utils/dom.ts` + composants

Tout est créé avec `createElement`, `querySelector`, etc. Les strings utilisateur passent par `escapeHtml()` pour éviter le XSS.

### Events

Délégation avec `closest()`, custom events entre composants (`open-engine-form`, …), raccourcis clavier :
- `/` → focus recherche
- `n` → nouveau moteur
- `Escape` → ferme les modales

### Fetch / API — `src/services/engineService.ts`

En dev, `GET /api/engines` (middleware Vite) renvoie le JSON. Fallback sur `/data/engines.json`. Reset = clear LocalStorage + re-fetch.

### LocalStorage — `src/state/storage.ts`

Persistance des moteurs, du thème et de la liste de comparaison. Export JSON possible.

### Thème

`data-theme` sur `<html>`. En mode auto, écoute de `prefers-color-scheme`.

### CSS

Animations (stagger des cartes, heartbeat favoris, toasts), grille responsive (`auto-fill` + flexbox).

### Web Audio — `src/services/audioEngine.ts`

Son synthétisé selon l'architecture (V12, V10, flat-6, rotatif, électrique…). Fréquence liée au régime : f ≈ RPM/60 × cylindres/2. Turbo + wave shaper pour l'échappement.

## Structure

```
projet/
├── index.html
├── vite.config.ts      # endpoint GET /api/engines en dev
├── public/data/engines.json
├── maquettes/          # wireframes (rendu)
├── src/
│   ├── main.ts
│   ├── types/engine.ts
│   ├── state/          # proxy + storage
│   ├── services/       # fetch + audio
│   ├── components/
│   ├── utils/
│   └── styles/
└── README.md
```

> pour le rendu zip : code + maquettes, **sans** `node_modules` ni `dist`.

## Soutenance — questions possibles

**Comment ça réagit sans framework ?**  
Proxy sur l'état global. Trap `set` → save LocalStorage + callbacks des abonnés → update DOM.

**Pourquoi pas que du `innerHTML` ?**  
Moins de XSS, on garde les listeners, et on rebuild pas tout le DOM pour rien.

**Validation ?**  
Classe `EngineValidator`, check à chaque `input`, erreurs sous le champ.

**Le son sans mp3 ?**  
Oscillateurs Web Audio, fréquence liée au RPM du compte-tours.
