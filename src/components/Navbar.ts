import { store } from '../state/proxyStore';
import { StorageService } from '../state/storage';
import { EngineService } from '../services/engineService';
import { Toast } from './Toast';
import { ThemeMode } from '../types/engine';

export class Navbar {
  private element: HTMLElement;

  constructor() {
    this.element = document.getElementById('app-navbar') || document.createElement('header');
    this.render();
    this.initThemeWatcher();
  }

  private initThemeWatcher(): void {
    // Appliquer le thème initial au document
    this.applyTheme(store.state.theme);

    // Écouteur de changement de préférence système si mode 'auto'
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (store.state.theme === 'auto') {
        this.applyTheme('auto');
      }
    });
  }

  private applyTheme(mode: ThemeMode): void {
    const root = document.documentElement;
    if (mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', mode);
    }
  }

  public render(): void {
    const currentTheme = store.state.theme;

    const themeIcons: Record<ThemeMode, string> = {
      dark: '🌙',
      light: '☀️',
      auto: '💻'
    };

    const nextTheme: Record<ThemeMode, ThemeMode> = {
      dark: 'light',
      light: 'auto',
      auto: 'dark'
    };

    this.element.className = 'app-header';
    this.element.innerHTML = `
      <div class="header-inner">
        <div class="brand-container" id="brand-home-btn">
          <div class="brand-logo">🏎️</div>
          <div class="brand-info">
            <h1>Apex<span>Engine</span></h1>
            <p>Encyclopédie & Comparateur de Moteurs</p>
          </div>
        </div>

        <div class="nav-center">
          <div class="search-input-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              class="search-input" 
              id="global-search-input" 
              placeholder="Rechercher un moteur, V8, Ferrari, 2JZ, Turbo..." 
              value="${store.state.filters.searchQuery}"
              autocomplete="off"
            />
          </div>
        </div>

        <div class="nav-actions">
          <button class="btn btn-secondary" id="btn-theme-toggle" title="Changer le thème (${currentTheme})">
            <span>${themeIcons[currentTheme]}</span>
            <span class="btn-text" style="text-transform: capitalize;">${currentTheme}</span>
          </button>

          <button class="btn btn-secondary" id="btn-export-json" title="Exporter les données en JSON">
            <span>💾</span>
            <span class="btn-text">Export</span>
          </button>

          <button class="btn btn-secondary" id="btn-reset-data" title="Réinitialiser la base par défaut">
            <span>🔄</span>
            <span class="btn-text">Reset</span>
          </button>

          <button class="btn btn-primary" id="btn-add-engine">
            <span>➕</span>
            <span class="btn-text">Ajouter un moteur</span>
          </button>
        </div>
      </div>
    `;

    this.attachEvents(nextTheme[currentTheme]);
  }

  private attachEvents(nextThemeMode: ThemeMode): void {
    // Recherche en direct
    const searchInput = this.element.querySelector('#global-search-input') as HTMLInputElement | null;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const val = (e.target as HTMLInputElement).value;
        store.setFilters({ searchQuery: val });
      });
    }

    // Basculeur de thème
    const themeBtn = this.element.querySelector('#btn-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        store.setTheme(nextThemeMode);
        this.applyTheme(nextThemeMode);
        this.render();
        Toast.show(`Thème basculé sur : ${nextThemeMode}`, 'info');
      });
    }

    // Export JSON
    const exportBtn = this.element.querySelector('#btn-export-json');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        StorageService.exportToJsonFile(store.state.engines);
        Toast.show('Fichier JSON exporté avec succès !', 'success');
      });
    }

    // Reset base par défaut (Fetch API)
    const resetBtn = this.element.querySelector('#btn-reset-data');
    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        if (confirm('Voulez-vous recharger la base de données de moteurs initiale ? Toutes vos modifications locales seront réinitialisées.')) {
          try {
            const engines = await EngineService.resetToDefault();
            store.setEngines(engines);
            Toast.show('Base de données réinitialisée via Fetch API !', 'success');
          } catch (err) {
            Toast.show('Erreur lors du rechargement des données.', 'error');
          }
        }
      });
    }

    // Bouton Ajouter un moteur
    const addBtn = this.element.querySelector('#btn-add-engine');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('open-engine-form', { detail: { mode: 'create' } }));
      });
    }

    // Logo click (reset filters)
    const brandHome = this.element.querySelector('#brand-home-btn');
    if (brandHome) {
      brandHome.addEventListener('click', () => {
        store.resetFilters();
        if (searchInput) searchInput.value = '';
      });
    }
  }
}
