import { Engine } from '../types/engine';
import { store } from '../state/proxyStore';
import { formatNumber, escapeHtml } from '../utils/dom';
import { AudioEngineSimulator } from '../services/audioEngine';
import { Toast } from './Toast';

export class EngineDetailModal {
  private backdrop: HTMLElement;
  private currentEngine: Engine | null = null;
  private isAudioRunning: boolean = false;

  constructor() {
    this.backdrop = document.getElementById('engine-detail-modal') || document.createElement('div');
    this.initEventListeners();
  }

  private initEventListeners(): void {
    document.addEventListener('open-engine-detail', (e: any) => {
      const id = e.detail?.engineId;
      if (id) {
        const engine = store.state.engines.find(item => item.id === id);
        if (engine) {
          this.open(engine);
        }
      }
    });
  }

  public open(engine: Engine): void {
    this.currentEngine = engine;
    this.render();
    this.backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  public close(): void {
    if (this.isAudioRunning) {
      AudioEngineSimulator.stop();
      this.isAudioRunning = false;
    }
    this.backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  private render(): void {
    if (!this.currentEngine) return;
    const e = this.currentEngine;
    this.backdrop.className = 'modal-backdrop';

    const specificPower = e.displacement > 0 ? (e.power / (e.displacement / 1000)).toFixed(1) : 'N/A';
    const idleRpm = Math.round(e.maxRpm * 0.12);

    this.backdrop.innerHTML = `
      <div class="modal-content" style="max-width: 800px;" role="dialog" aria-modal="true">
        <div class="modal-header">
          <div>
            <h2>${escapeHtml(e.name)}</h2>
            <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(e.manufacturer)} • ${e.yearStart}${e.yearEnd ? `-${e.yearEnd}` : ' - Présent'}</p>
          </div>
          <button class="btn-icon" id="btn-close-detail" aria-label="Fermer">✕</button>
        </div>

        <div class="modal-body">
          <div style="height: 240px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 1.5rem; background: #000; position: relative;">
            <img 
              src="${escapeHtml(e.imageUrl)}" 
              alt="${escapeHtml(e.name)}" 
              style="width: 100%; height: 100%; object-fit: cover;"
              onerror="this.src='https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800'"
            />
            <div style="position: absolute; bottom: 1rem; left: 1rem; display: flex; gap: 0.5rem;">
              <span class="badge badge-v8">${escapeHtml(e.configuration)}</span>
              <span class="badge badge-turbo">${escapeHtml(e.aspiration)}</span>
              <span class="badge badge-default">${escapeHtml(e.fuel)}</span>
            </div>
          </div>

          <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem;">
            ${escapeHtml(e.description)}
          </p>

          <!-- Tachomètre & Simulateur Sonore Web Audio -->
          <div class="tachometer-widget">
            <h4 style="color: var(--text-primary); font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem;">
              Simulateur de Régime & Sonorité Moteur (Web Audio API)
            </h4>
            <p style="color: var(--text-muted); font-size: 0.8rem; margin: 0;">
              Activez le démarreur pour entendre le moteur et jouez avec l'accélérateur !
            </p>

            <div class="tacho-dial">
              <div class="tacho-dial-inner">
                <div class="rpm-number" id="tacho-rpm-display">${idleRpm}</div>
                <div class="rpm-unit">TR / MIN</div>
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">RUPTEUR: ${formatNumber(e.maxRpm)}</div>
              </div>
            </div>

            <div class="tacho-controls">
              <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted);">
                <span>Ralenti</span>
                <span>Plein régime (Rupteur)</span>
              </div>
              <input 
                type="range" 
                class="rpm-slider" 
                id="rpm-range-slider" 
                min="${idleRpm}" 
                max="${e.maxRpm}" 
                value="${idleRpm}"
                disabled
              />

              <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 0.5rem;">
                <button class="btn btn-primary" id="btn-audio-toggle">
                  <span>🔑</span>
                  <span id="btn-audio-text">Démarrer le moteur</span>
                </button>

                <button class="btn btn-secondary" id="btn-audio-rev" disabled>
                  <span>🔥</span>
                  <span>Coup d'accélérateur !</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Spécifications Détaillées -->
          <h4 style="color: var(--text-primary); font-size: 1.05rem; font-weight: 700; margin: 1.5rem 0 0.75rem;">
            Fiche Technique Complète
          </h4>
          <div class="card-metrics-grid" style="grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));">
            <div class="metric-item">
              <span class="metric-label">Puissance</span>
              <span class="metric-val" style="color: var(--accent-primary);">${formatNumber(e.power)} ch</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Couple</span>
              <span class="metric-val">${formatNumber(e.torque)} Nm</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Cylindrée</span>
              <span class="metric-val">${e.displacement > 0 ? `${formatNumber(e.displacement)} cm³` : 'N/A'}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Rendement</span>
              <span class="metric-val">${specificPower} ${e.displacement > 0 ? 'ch/L' : ''}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Régime Max</span>
              <span class="metric-val">${formatNumber(e.maxRpm)} tr/min</span>
            </div>
          </div>

          <!-- Véhicules équipés -->
          ${e.vehicles && e.vehicles.length > 0 ? `
            <h4 style="color: var(--text-primary); font-size: 1.05rem; font-weight: 700; margin: 1.5rem 0 0.75rem;">
              Véhicules Mythiques Équipés
            </h4>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
              ${e.vehicles.map(v => `<span class="badge badge-default" style="font-size: 0.82rem; padding: 0.35rem 0.75rem;">🚗 ${escapeHtml(v)}</span>`).join('')}
            </div>
          ` : ''}
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-close-detail-footer">Fermer</button>
          <button class="btn btn-primary" id="btn-edit-from-detail">
            <span>✏️ Modifier</span>
          </button>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents(): void {
    if (!this.currentEngine) return;
    const e = this.currentEngine;
    const idleRpm = Math.round(e.maxRpm * 0.12);

    // Boutons de fermeture
    this.backdrop.querySelector('#btn-close-detail')?.addEventListener('click', () => this.close());
    this.backdrop.querySelector('#btn-close-detail-footer')?.addEventListener('click', () => this.close());

    this.backdrop.addEventListener('click', (event) => {
      if (event.target === this.backdrop) this.close();
    });

    // Passer en mode édition
    this.backdrop.querySelector('#btn-edit-from-detail')?.addEventListener('click', () => {
      const id = e.id;
      this.close();
      document.dispatchEvent(new CustomEvent('open-engine-form', { detail: { mode: 'edit', engineId: id } }));
    });

    // Contrôles Audio & Tachomètre
    const audioToggleBtn = this.backdrop.querySelector('#btn-audio-toggle') as HTMLButtonElement | null;
    const audioText = this.backdrop.querySelector('#btn-audio-text');
    const revBtn = this.backdrop.querySelector('#btn-audio-rev') as HTMLButtonElement | null;
    const slider = this.backdrop.querySelector('#rpm-range-slider') as HTMLInputElement | null;
    const rpmDisplay = this.backdrop.querySelector('#tacho-rpm-display');

    if (audioToggleBtn && slider && revBtn && rpmDisplay) {
      audioToggleBtn.addEventListener('click', () => {
        if (this.isAudioRunning) {
          AudioEngineSimulator.stop();
          this.isAudioRunning = false;
          if (audioText) audioText.textContent = 'Démarrer le moteur';
          slider.disabled = true;
          revBtn.disabled = true;
          rpmDisplay.textContent = `${idleRpm}`;
          slider.value = `${idleRpm}`;
          Toast.show('Contact coupé.', 'info');
        } else {
          AudioEngineSimulator.start(e);
          this.isAudioRunning = true;
          if (audioText) audioText.textContent = 'Couper le contact';
          slider.disabled = false;
          revBtn.disabled = false;
          rpmDisplay.textContent = `${idleRpm}`;
          const isElectric = e.configuration === 'Électrique' || e.fuel === 'Électrique';
          const startMsg = isElectric
            ? `Système électrique ${e.name} sous tension ! ⚡🔊`
            : `Moteur ${e.name} (${e.configuration}) démarré au ralenti ! 🔊`;
          Toast.show(startMsg, 'success');
        }
      });

      slider.addEventListener('input', () => {
        const val = Number(slider.value);
        rpmDisplay.textContent = `${formatNumber(val)}`;
        AudioEngineSimulator.setRpm(val);
      });

      revBtn.addEventListener('click', () => {
        AudioEngineSimulator.revUp((currentRpm) => {
          rpmDisplay.textContent = `${formatNumber(Math.round(currentRpm))}`;
          slider.value = `${Math.round(currentRpm)}`;
        });
      });
    }
  }
}
