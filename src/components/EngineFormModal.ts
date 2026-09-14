import { Engine, EngineConfiguration, FuelType, AspirationType } from '../types/engine';
import { store } from '../state/proxyStore';
import { EngineValidator } from '../utils/validator';
import { Toast } from './Toast';
import { escapeHtml } from '../utils/dom';

export class EngineFormModal {
  private backdrop: HTMLElement;
  private currentMode: 'create' | 'edit' = 'create';
  private currentEngineId: string | null = null;

  constructor() {
    this.backdrop = document.getElementById('engine-form-modal') || document.createElement('div');
    this.initEventListeners();
  }

  private initEventListeners(): void {
    document.addEventListener('open-engine-form', (e: any) => {
      const detail = e.detail || {};
      this.open(detail.mode || 'create', detail.engineId || null);
    });
  }

  public open(mode: 'create' | 'edit', engineId: string | null = null): void {
    this.currentMode = mode;
    this.currentEngineId = engineId;

    let initialData: Partial<Engine> = {
      name: '',
      manufacturer: '',
      configuration: 'V8',
      displacement: 4000,
      power: 500,
      torque: 550,
      maxRpm: 7500,
      aspiration: 'Bi-Turbo',
      fuel: 'Essence',
      yearStart: new Date().getFullYear(),
      yearEnd: null,
      vehicles: [],
      soundPitch: 500,
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800'
    };

    if (mode === 'edit' && engineId) {
      const existing = store.state.engines.find(e => e.id === engineId);
      if (existing) {
        initialData = { ...existing };
      }
    }

    this.render(initialData);
    this.backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  public close(): void {
    this.backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  private render(data: Partial<Engine>): void {
    const isEdit = this.currentMode === 'edit';
    this.backdrop.className = 'modal-backdrop';

    const configs: EngineConfiguration[] = [
      '4 en ligne', '5 en ligne', '6 en ligne', 'V6', 'V8', 'V10', 'V12', 'W16',
      'Flat-4', 'Flat-6', 'Rotatif', 'Électrique', 'Autre'
    ];

    const fuels: FuelType[] = ['Essence', 'Diesel', 'Hybride', 'Électrique', 'Hydrogène', 'E85'];

    const aspirations: AspirationType[] = ['Atmosphérique', 'Turbo', 'Bi-Turbo', 'Quad-Turbo', 'Compresseur', 'N/A'];

    this.backdrop.innerHTML = `
      <div class="modal-content" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2>${isEdit ? 'Modifier le moteur' : 'Ajouter un nouveau moteur'}</h2>
          <button class="btn-icon" id="btn-close-modal" aria-label="Fermer">✕</button>
        </div>

        <form id="engine-form" class="modal-body" novalidate>
          <div class="form-grid">
            <!-- Nom du moteur -->
            <div class="form-group">
              <label class="form-label" for="input-name">Nom du moteur <span class="required">*</span></label>
              <input 
                type="text" 
                id="input-name" 
                name="name" 
                class="form-input" 
                placeholder="Ex: 2JZ-GTE, S85B50..." 
                value="${escapeHtml(data.name || '')}" 
                required
              />
              <span class="field-error" id="error-name"></span>
            </div>

            <!-- Constructeur -->
            <div class="form-group">
              <label class="form-label" for="input-manufacturer">Constructeur / Marque <span class="required">*</span></label>
              <input 
                type="text" 
                id="input-manufacturer" 
                name="manufacturer" 
                class="form-input" 
                placeholder="Ex: Ferrari, Porsche, Toyota..." 
                value="${escapeHtml(data.manufacturer || '')}" 
                required
              />
              <span class="field-error" id="error-manufacturer"></span>
            </div>

            <!-- Configuration -->
            <div class="form-group">
              <label class="form-label" for="input-config">Architecture / Configuration <span class="required">*</span></label>
              <select id="input-config" name="configuration" class="form-select">
                ${configs.map(c => `<option value="${c}" ${data.configuration === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>

            <!-- Carburant -->
            <div class="form-group">
              <label class="form-label" for="input-fuel">Carburant <span class="required">*</span></label>
              <select id="input-fuel" name="fuel" class="form-select">
                ${fuels.map(f => `<option value="${f}" ${data.fuel === f ? 'selected' : ''}>${f}</option>`).join('')}
              </select>
            </div>

            <!-- Aspiration -->
            <div class="form-group">
              <label class="form-label" for="input-aspiration">Alimentation / Suralimentation <span class="required">*</span></label>
              <select id="input-aspiration" name="aspiration" class="form-select">
                ${aspirations.map(a => `<option value="${a}" ${data.aspiration === a ? 'selected' : ''}>${a}</option>`).join('')}
              </select>
            </div>

            <!-- Cylindrée -->
            <div class="form-group">
              <label class="form-label" for="input-displacement">Cylindrée (cm³) <span class="required">*</span></label>
              <input 
                type="number" 
                id="input-displacement" 
                name="displacement" 
                class="form-input" 
                placeholder="Ex: 3996" 
                value="${data.displacement ?? 0}"
                min="0"
                step="1"
              />
              <span class="field-error" id="error-displacement"></span>
            </div>

            <!-- Puissance -->
            <div class="form-group">
              <label class="form-label" for="input-power">Puissance (ch) <span class="required">*</span></label>
              <input 
                type="number" 
                id="input-power" 
                name="power" 
                class="form-input" 
                placeholder="Ex: 525" 
                value="${data.power || ''}"
                min="1"
                required
              />
              <span class="field-error" id="error-power"></span>
            </div>

            <!-- Couple -->
            <div class="form-group">
              <label class="form-label" for="input-torque">Couple maximal (Nm) <span class="required">*</span></label>
              <input 
                type="number" 
                id="input-torque" 
                name="torque" 
                class="form-input" 
                placeholder="Ex: 465" 
                value="${data.torque || ''}"
                min="1"
                required
              />
              <span class="field-error" id="error-torque"></span>
            </div>

            <!-- Régime Max (RPM) -->
            <div class="form-group">
              <label class="form-label" for="input-maxrpm">Régime Max (tr/min) <span class="required">*</span></label>
              <input 
                type="number" 
                id="input-maxrpm" 
                name="maxRpm" 
                class="form-input" 
                placeholder="Ex: 9000" 
                value="${data.maxRpm || ''}"
                min="2000"
                max="25000"
                required
              />
              <span class="field-error" id="error-maxRpm"></span>
            </div>

            <!-- Années de production -->
            <div class="form-group">
              <label class="form-label" for="input-yearstart">Année de lancement <span class="required">*</span></label>
              <input 
                type="number" 
                id="input-yearstart" 
                name="yearStart" 
                class="form-input" 
                value="${data.yearStart || new Date().getFullYear()}"
                min="1886"
                required
              />
              <span class="field-error" id="error-yearStart"></span>
            </div>

            <div class="form-group">
              <label class="form-label" for="input-yearend">Année de fin (Laisser vide si en cours)</label>
              <input 
                type="number" 
                id="input-yearend" 
                name="yearEnd" 
                class="form-input" 
                placeholder="En cours..." 
                value="${data.yearEnd || ''}"
                min="1886"
              />
              <span class="field-error" id="error-yearEnd"></span>
            </div>

            <!-- Véhicules emblématiques -->
            <div class="form-group-full form-group">
              <label class="form-label" for="input-vehicles">Véhicules équipés (séparés par des virgules)</label>
              <input 
                type="text" 
                id="input-vehicles" 
                name="vehicles" 
                class="form-input" 
                placeholder="Ex: Porsche 911 GT3, 718 Cayman GT4 RS..." 
                value="${escapeHtml((data.vehicles || []).join(', '))}" 
              />
            </div>

            <!-- URL Image -->
            <div class="form-group-full form-group">
              <label class="form-label" for="input-image">URL de l'image / illustration</label>
              <input 
                type="url" 
                id="input-image" 
                name="imageUrl" 
                class="form-input" 
                placeholder="https://..." 
                value="${escapeHtml(data.imageUrl || '')}" 
              />
            </div>

            <!-- Description -->
            <div class="form-group-full form-group">
              <label class="form-label" for="input-desc">Description & Spécificités techniques <span class="required">*</span></label>
              <textarea 
                id="input-desc" 
                name="description" 
                class="form-textarea" 
                rows="3" 
                placeholder="Décrivez l'histoire, la conception et les sensations de ce moteur..." 
                required
              >${escapeHtml(data.description || '')}</textarea>
              <span class="field-error" id="error-description"></span>
            </div>
          </div>
        </form>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="btn-cancel-form">Annuler</button>
          <button type="button" class="btn btn-primary" id="btn-submit-form">
            <span>💾</span>
            <span>${isEdit ? 'Enregistrer les modifications' : 'Créer le moteur'}</span>
          </button>
        </div>
      </div>
    `;

    this.attachFormEvents();
  }

  private attachFormEvents(): void {
    // Boutons de fermeture
    this.backdrop.querySelector('#btn-close-modal')?.addEventListener('click', () => this.close());
    this.backdrop.querySelector('#btn-cancel-form')?.addEventListener('click', () => this.close());

    // Clic extérieur pour fermer
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) {
        this.close();
      }
    });

    // Soumission du formulaire
    this.backdrop.querySelector('#btn-submit-form')?.addEventListener('click', () => {
      this.handleSubmit();
    });

    // Validation en direct sur chaque input
    const inputs = this.backdrop.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        const name = (input as HTMLInputElement).name;
        const errEl = this.backdrop.querySelector(`#error-${name}`);
        if (errEl) {
          errEl.textContent = '';
          input.classList.remove('has-error');
        }
      });
    });
  }

  private handleSubmit(): void {
    const form = this.backdrop.querySelector('#engine-form') as HTMLFormElement | null;
    if (!form) return;

    const formData = new FormData(form);
    const vehiclesStr = (formData.get('vehicles') as string || '').trim();
    const vehicles = vehiclesStr ? vehiclesStr.split(',').map(s => s.trim()).filter(Boolean) : [];

    const rawData: Partial<Engine> = {
      name: (formData.get('name') as string || '').trim(),
      manufacturer: (formData.get('manufacturer') as string || '').trim(),
      configuration: formData.get('configuration') as EngineConfiguration,
      displacement: Number(formData.get('displacement')),
      power: Number(formData.get('power')),
      torque: Number(formData.get('torque')),
      maxRpm: Number(formData.get('maxRpm')),
      aspiration: formData.get('aspiration') as AspirationType,
      fuel: formData.get('fuel') as FuelType,
      yearStart: Number(formData.get('yearStart')),
      yearEnd: formData.get('yearEnd') ? Number(formData.get('yearEnd')) : null,
      vehicles,
      description: (formData.get('description') as string || '').trim(),
      imageUrl: (formData.get('imageUrl') as string || '').trim() || 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800',
      soundPitch: 500
    };

    // Validation
    const validationErrors = EngineValidator.validate(rawData);

    // Réinitialiser les erreurs affichées
    this.backdrop.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    this.backdrop.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));

    if (Object.keys(validationErrors).length > 0) {
      // Afficher les erreurs
      for (const [field, message] of Object.entries(validationErrors)) {
        const errorEl = this.backdrop.querySelector(`#error-${field}`);
        const inputEl = this.backdrop.querySelector(`[name="${field}"]`);
        if (errorEl) errorEl.textContent = message;
        if (inputEl) inputEl.classList.add('has-error');
      }
      Toast.show('Veuillez corriger les erreurs dans le formulaire.', 'error');
      return;
    }

    // Sauvegarde
    if (this.currentMode === 'edit' && this.currentEngineId) {
      store.updateEngine(this.currentEngineId, rawData);
      Toast.show(`Moteur "${rawData.name}" mis à jour avec succès !`, 'success');
    } else {
      store.addEngine(rawData as any);
      Toast.show(`Moteur "${rawData.name}" ajouté au catalogue !`, 'success');
    }

    this.close();
  }
}
