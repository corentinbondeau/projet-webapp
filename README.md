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

### Fetch — `src/services/engineService.ts`

Chargement de `/data/engines.json` en async/await. Le bouton reset re-fetch les données d'origine.

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
├── public/data/engines.json
├── maquettes/
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

## Soutenance — questions possibles

**Comment ça réagit sans framework ?**  
Proxy sur l'état global. Trap `set` → save LocalStorage + callbacks des abonnés → update DOM.

**Pourquoi pas que du `innerHTML` ?**  
Moins de XSS, on garde les listeners, et on rebuild pas tout le DOM pour rien.

**Validation ?**  
Classe `EngineValidator`, check à chaque `input`, erreurs sous le champ.

**Le son sans mp3 ?**  
Oscillateurs Web Audio, fréquence liée au RPM du compte-tours.
