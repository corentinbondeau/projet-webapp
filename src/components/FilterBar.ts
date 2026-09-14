import { store } from '../state/proxyStore';
import { SortField, SortOrder } from '../types/engine';

export class FilterBar {
  private element: HTMLElement;

  constructor() {
    this.element = document.getElementById('filter-bar-container') || document.createElement('section');
    store.subscribe((_state, key) => {
      // Re-rendre si les filtres changent
      if (!key || key === 'filters' || key === 'engines') {
        this.render();
      }
    });
  }

  public render(): void {
    const { configuration, fuel, aspiration, onlyFavorites, sortBy, sortOrder } = store.state.filters;

    const configs = [
      { id: 'ALL', label: 'Toutes les architectures' },
      { id: 'V8', label: 'V8' },
      { id: 'V12', label: 'V12' },
      { id: 'V10', label: 'V10' },
      { id: 'Flat-6', label: 'Flat-6 Boxer' },
      { id: '6 en ligne', label: '6 en ligne (L6)' },
      { id: '4 en ligne', label: '4 en ligne (L4)' },
      { id: 'W16', label: 'W16 Quad-Turbo' },
      { id: 'Rotatif', label: 'Wankel Rotatif' },
      { id: 'Électrique', label: 'Électrique' }
    ];

    this.element.className = 'filter-section anim-fade-in';
    this.element.innerHTML = `
      <div class="filter-bar">
        <!-- Ligne 1 : Pilules d'architectures rapides -->
        <div class="filter-pills">
          ${configs.map(c => `
            <button 
              class="pill-btn ${configuration === c.id ? 'active' : ''}" 
              data-config="${c.id}"
            >
              ${c.label}
            </button>
          `).join('')}
        </div>

        <!-- Ligne 2 : Sélecteurs avancés et tri -->
        <div class="filter-row">
          <div class="filter-selects">
            <!-- Carburant -->
            <select class="custom-select" id="filter-fuel">
              <option value="ALL" ${fuel === 'ALL' ? 'selected' : ''}>⛽ Tous les carburants</option>
              <option value="Essence" ${fuel === 'Essence' ? 'selected' : ''}>Essence</option>
              <option value="Diesel" ${fuel === 'Diesel' ? 'selected' : ''}>Diesel</option>
              <option value="Hybride" ${fuel === 'Hybride' ? 'selected' : ''}>Hybride</option>
              <option value="Électrique" ${fuel === 'Électrique' ? 'selected' : ''}>Électrique</option>
            </select>

            <!-- Aspiration -->
            <select class="custom-select" id="filter-aspiration">
              <option value="ALL" ${aspiration === 'ALL' ? 'selected' : ''}>🌪️ Toute alimentation</option>
              <option value="Atmosphérique" ${aspiration === 'Atmosphérique' ? 'selected' : ''}>Atmosphérique</option>
              <option value="Turbo" ${aspiration === 'Turbo' ? 'selected' : ''}>Turbo</option>
              <option value="Bi-Turbo" ${aspiration === 'Bi-Turbo' ? 'selected' : ''}>Bi-Turbo</option>
              <option value="Quad-Turbo" ${aspiration === 'Quad-Turbo' ? 'selected' : ''}>Quad-Turbo</option>
              <option value="Compresseur" ${aspiration === 'Compresseur' ? 'selected' : ''}>Compresseur</option>
            </select>

            <!-- Bouton Favoris -->
            <button class="pill-btn ${onlyFavorites ? 'active' : ''}" id="btn-toggle-favs">
              <span>❤️ Favoris uniquement</span>
            </button>
          </div>

          <!-- Tri -->
          <div class="filter-selects">
            <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Trier par :</span>
            <select class="custom-select" id="sort-by-select">
              <option value="power" ${sortBy === 'power' ? 'selected' : ''}>⚡ Puissance (ch)</option>
              <option value="torque" ${sortBy === 'torque' ? 'selected' : ''}>⚙️ Couple (Nm)</option>
              <option value="displacement" ${sortBy === 'displacement' ? 'selected' : ''}>🧪 Cylindrée (cm³)</option>
              <option value="maxRpm" ${sortBy === 'maxRpm' ? 'selected' : ''}>⏱️ Régime max (RPM)</option>
              <option value="likes" ${sortBy === 'likes' ? 'selected' : ''}>❤️ Likes</option>
              <option value="name" ${sortBy === 'name' ? 'selected' : ''}>🔤 Nom</option>
              <option value="manufacturer" ${sortBy === 'manufacturer' ? 'selected' : ''}>🏷️ Marque</option>
            </select>

            <button class="btn-icon" id="btn-toggle-sort-order" title="Inverser l'ordre (${sortOrder === 'asc' ? 'Croissant' : 'Décroissant'})">
              <span>${sortOrder === 'asc' ? '↑' : '↓'}</span>
            </button>

            <button class="btn btn-secondary" id="btn-reset-filters" style="font-size: 0.8rem; padding: 0.45rem 0.75rem;">
              <span>Effacer</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents(): void {
    // Clic sur les pilules d'architecture
    const pillButtons = this.element.querySelectorAll('.pill-btn[data-config]');
    pillButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const conf = btn.getAttribute('data-config') || 'ALL';
        store.setFilters({ configuration: conf });
      });
    });

    // Sélecteur Carburant
    const fuelSelect = this.element.querySelector('#filter-fuel') as HTMLSelectElement | null;
    if (fuelSelect) {
      fuelSelect.addEventListener('change', () => {
        store.setFilters({ fuel: fuelSelect.value });
      });
    }

    // Sélecteur Aspiration
    const aspSelect = this.element.querySelector('#filter-aspiration') as HTMLSelectElement | null;
    if (aspSelect) {
      aspSelect.addEventListener('change', () => {
        store.setFilters({ aspiration: aspSelect.value });
      });
    }

    // Bouton Favoris
    const favBtn = this.element.querySelector('#btn-toggle-favs');
    if (favBtn) {
      favBtn.addEventListener('click', () => {
        store.setFilters({ onlyFavorites: !store.state.filters.onlyFavorites });
      });
    }

    // Sélecteur de Tri
    const sortSelect = this.element.querySelector('#sort-by-select') as HTMLSelectElement | null;
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        store.setFilters({ sortBy: sortSelect.value as SortField });
      });
    }

    // Ordre de Tri (Asc / Desc)
    const orderBtn = this.element.querySelector('#btn-toggle-sort-order');
    if (orderBtn) {
      orderBtn.addEventListener('click', () => {
        const newOrder: SortOrder = store.state.filters.sortOrder === 'asc' ? 'desc' : 'asc';
        store.setFilters({ sortOrder: newOrder });
      });
    }

    // Bouton Réinitialiser les filtres
    const resetBtn = this.element.querySelector('#btn-reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        store.resetFilters();
        const globalSearch = document.getElementById('global-search-input') as HTMLInputElement | null;
        if (globalSearch) globalSearch.value = '';
      });
    }
  }
}
