import { store } from '../state/proxyStore';
import { formatNumber, escapeHtml } from '../utils/dom';
import { Toast } from './Toast';

export class CompareDrawer {
  private drawerElement: HTMLElement;
  private modalElement: HTMLElement;

  constructor() {
    this.drawerElement = document.getElementById('compare-drawer') || document.createElement('aside');
    this.modalElement = document.getElementById('compare-modal') || document.createElement('div');
    store.subscribe((_state, key) => {
      if (!key || key === 'compareEngineIds' || key === 'engines') {
        this.renderDrawer();
      }
    });
  }

  public renderDrawer(): void {
    const compareIds = store.state.compareEngineIds;
    const comparedEngines = store.state.engines.filter(e => compareIds.includes(e.id));

    this.drawerElement.className = `compare-drawer ${comparedEngines.length > 0 ? 'open' : ''}`;
    this.drawerElement.innerHTML = `
      <div class="compare-inner">
        <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">
            ⚖️ Comparateur (${comparedEngines.length}/3) :
          </div>

          <div class="compare-chips">
            ${comparedEngines.map(e => `
              <div class="compare-chip">
                <span>${escapeHtml(e.name)}</span>
                <span class="compare-chip-remove" data-remove="${e.id}" title="Retirer">✕</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <button class="btn btn-secondary" id="btn-clear-compare" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">
            Tout effacer
          </button>

          <button class="btn btn-primary" id="btn-launch-compare" ${comparedEngines.length < 2 ? 'disabled' : ''}>
            <span>Comparer côte à côte (${comparedEngines.length})</span>
          </button>
        </div>
      </div>
    `;

    this.attachDrawerEvents();
  }

  private attachDrawerEvents(): void {
    // Retirer un élément individuel
    this.drawerElement.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-remove');
        if (id) store.toggleCompare(id);
      });
    });

    // Effacer tout
    this.drawerElement.querySelector('#btn-clear-compare')?.addEventListener('click', () => {
      store.clearCompare();
      Toast.show('Comparateur réinitialisé', 'info');
    });

    // Lancer la comparaison modale
    this.drawerElement.querySelector('#btn-launch-compare')?.addEventListener('click', () => {
      this.openCompareModal();
    });
  }

  public openCompareModal(): void {
    const compareIds = store.state.compareEngineIds;
    const engines = store.state.engines.filter(e => compareIds.includes(e.id));
    if (engines.length < 2) return;

    this.modalElement.className = 'modal-backdrop open';
    this.modalElement.innerHTML = `
      <div class="modal-content" style="max-width: 960px;" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2>⚖️ Comparatif Technique Face-à-Face</h2>
          <button class="btn-icon" id="btn-close-compare-modal">✕</button>
        </div>

        <div class="modal-body" style="overflow-x: auto;">
          <div style="display: grid; grid-template-columns: repeat(${engines.length}, 1fr); gap: 1.5rem; min-width: 600px;">
            ${engines.map(e => `
              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; display: flex; flex-direction: column;">
                <div style="height: 140px; border-radius: var(--radius-sm); overflow: hidden; margin-bottom: 1rem; background: #000;">
                  <img src="${escapeHtml(e.imageUrl)}" alt="${escapeHtml(e.name)}" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
                <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-primary);">${escapeHtml(e.name)}</h3>
                <div style="font-size: 0.8rem; color: var(--accent-secondary); font-weight: 600; margin-bottom: 1rem;">${escapeHtml(e.manufacturer)}</div>

                <div style="display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.88rem;">
                  <div>
                    <div style="color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase;">Architecture</div>
                    <strong>${escapeHtml(e.configuration)}</strong>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase;">Puissance</div>
                    <strong style="color: var(--accent-primary); font-size: 1.1rem;">${formatNumber(e.power)} ch</strong>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase;">Couple</div>
                    <strong>${formatNumber(e.torque)} Nm</strong>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase;">Cylindrée</div>
                    <strong>${e.displacement > 0 ? `${formatNumber(e.displacement)} cm³` : 'N/A'}</strong>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase;">Régime Max</div>
                    <strong>${formatNumber(e.maxRpm)} tr/min</strong>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase;">Alimentation</div>
                    <strong>${escapeHtml(e.aspiration)}</strong>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase;">Carburant</div>
                    <strong>${escapeHtml(e.fuel)}</strong>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-close-compare-footer">Fermer</button>
        </div>
      </div>
    `;

    const close = () => {
      this.modalElement.classList.remove('open');
    };

    this.modalElement.querySelector('#btn-close-compare-modal')?.addEventListener('click', close);
    this.modalElement.querySelector('#btn-close-compare-footer')?.addEventListener('click', close);
    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) close();
    });
  }
}
