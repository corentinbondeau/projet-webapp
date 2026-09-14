import { store } from '../state/proxyStore';
import { EngineCard } from './EngineCard';
import { emptyElement } from '../utils/dom';

export class EngineGrid {
  private element: HTMLElement;

  constructor() {
    this.element = document.getElementById('engine-grid-container') || document.createElement('main');
    store.subscribe(() => this.render());
  }

  public render(): void {
    emptyElement(this.element);
    this.element.className = 'engines-container';

    if (store.state.isLoading) {
      this.element.innerHTML = `
        <div style="text-align: center; padding: 5rem 0; color: var(--text-secondary);">
          <div style="font-size: 2.5rem; animation: spin 1.2s linear infinite; display: inline-block;">⚙️</div>
          <p style="margin-top: 1rem; font-weight: 600;">Chargement des moteurs via Fetch API...</p>
        </div>
      `;
      return;
    }

    const filteredEngines = store.getFilteredEngines();

    if (filteredEngines.length === 0) {
      this.element.innerHTML = `
        <div style="text-align: center; padding: 4rem 1.5rem; background: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-lg); max-width: 600px; margin: 2rem auto;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
          <h3 style="font-size: 1.3rem; margin-bottom: 0.5rem; color: var(--text-primary);">Aucun moteur trouvé</h3>
          <p style="color: var(--text-secondary); margin-bottom: 1.5rem; font-size: 0.9rem;">
            Aucun moteur ne correspond à vos critères de recherche ou de filtre actuels.
          </p>
          <div style="display: flex; justify-content: center; gap: 0.75rem;">
            <button class="btn btn-secondary" id="empty-reset-filters">Réinitialiser les filtres</button>
            <button class="btn btn-primary" id="empty-add-engine">Créer un nouveau moteur</button>
          </div>
        </div>
      `;

      const resetBtn = this.element.querySelector('#empty-reset-filters');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          store.resetFilters();
          const searchInput = document.getElementById('global-search-input') as HTMLInputElement | null;
          if (searchInput) searchInput.value = '';
        });
      }

      const addBtn = this.element.querySelector('#empty-add-engine');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          document.dispatchEvent(new CustomEvent('open-engine-form', { detail: { mode: 'create' } }));
        });
      }

      return;
    }

    const grid = document.createElement('div');
    grid.className = 'engines-grid';

    filteredEngines.forEach((engine, index) => {
      const card = EngineCard.render(engine);
      card.style.animationDelay = `${Math.min(index * 40, 400)}ms`;
      grid.appendChild(card);
    });

    this.element.appendChild(grid);
  }
}
