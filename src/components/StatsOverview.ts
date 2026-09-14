import { store } from '../state/proxyStore';
import { formatNumber } from '../utils/dom';

export class StatsOverview {
  private element: HTMLElement;

  constructor() {
    this.element = document.getElementById('stats-overview-container') || document.createElement('section');
    store.subscribe(() => this.render());
  }

  public render(): void {
    const stats = store.getStats();

    if (stats.total === 0) {
      this.element.innerHTML = '';
      return;
    }

    this.element.className = 'stats-banner anim-fade-in';
    this.element.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🏎️</div>
          <div class="stat-data">
            <h4>Moteurs répertoriés</h4>
            <div class="stat-value">${stats.total}</div>
            <div class="stat-sub">Thermiques, Hybrides & Électriques</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⚡</div>
          <div class="stat-data">
            <h4>Puissance moyenne</h4>
            <div class="stat-value">${formatNumber(stats.avgPower)} <span style="font-size: 0.9rem; font-weight: 500;">ch</span></div>
            <div class="stat-sub">Toutes architectures confondues</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-data">
            <h4>Le plus puissant</h4>
            <div class="stat-value">${stats.maxPowerEngine ? `${formatNumber(stats.maxPowerEngine.power)} ch` : '-'}</div>
            <div class="stat-sub">${stats.maxPowerEngine ? stats.maxPowerEngine.name : ''}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-data">
            <h4>Régime max record</h4>
            <div class="stat-value">${stats.highestRpmEngine ? `${formatNumber(stats.highestRpmEngine.maxRpm)} tr/min` : '-'}</div>
            <div class="stat-sub">${stats.highestRpmEngine ? stats.highestRpmEngine.name : ''}</div>
          </div>
        </div>
      </div>
    `;
  }
}
