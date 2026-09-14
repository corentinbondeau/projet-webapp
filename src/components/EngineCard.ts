import { Engine } from '../types/engine';
import { store } from '../state/proxyStore';
import { formatNumber, escapeHtml } from '../utils/dom';
import { AudioEngineSimulator } from '../services/audioEngine';
import { Toast } from './Toast';

export class EngineCard {
  public static render(engine: Engine): HTMLElement {
    const card = document.createElement('article');
    card.className = 'engine-card anim-card-item';
    card.setAttribute('data-id', engine.id);

    const isCompared = store.state.compareEngineIds.includes(engine.id);

    // Détermination de la classe de badge de configuration
    let badgeClass = 'badge-default';
    if (engine.configuration.includes('V8')) badgeClass = 'badge-v8';
    else if (engine.configuration.includes('V12') || engine.configuration.includes('W16')) badgeClass = 'badge-v12';
    else if (engine.aspiration.includes('Turbo')) badgeClass = 'badge-turbo';
    else if (engine.configuration === 'Électrique') badgeClass = 'badge-electric';
    else if (engine.configuration === 'Rotatif') badgeClass = 'badge-rotary';

    card.innerHTML = `
      <div class="card-header-img">
        <img 
          src="${escapeHtml(engine.imageUrl || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800')}" 
          alt="${escapeHtml(engine.name)}" 
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800'"
        />
        <div class="card-overlay-badges">
          <span class="badge ${badgeClass}">${escapeHtml(engine.configuration)}</span>
          <span class="badge badge-default">${escapeHtml(engine.fuel)}</span>
        </div>
        <button 
          class="card-favorite-btn ${engine.isFavorite ? 'is-favorite' : ''}" 
          title="${engine.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}"
          data-action="toggle-fav"
        >
          <span>${engine.isFavorite ? '❤️' : '🤍'}</span>
        </button>
      </div>

      <div class="card-body">
        <div class="card-title-row">
          <h3>${escapeHtml(engine.name)}</h3>
        </div>
        <div class="card-brand">${escapeHtml(engine.manufacturer)} • ${engine.yearStart}${engine.yearEnd ? `-${engine.yearEnd}` : ' - Présent'}</div>

        <div class="card-metrics-grid">
          <div class="metric-item">
            <span class="metric-label">Puissance</span>
            <span class="metric-val" style="color: var(--accent-primary);">${formatNumber(engine.power)} <small style="font-size:0.7rem;">ch</small></span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Couple</span>
            <span class="metric-val">${formatNumber(engine.torque)} <small style="font-size:0.7rem;">Nm</small></span>
          </div>
          <div class="metric-item">
            <span class="metric-label">${engine.configuration === 'Électrique' ? 'Régime max' : 'Cylindrée'}</span>
            <span class="metric-val">${engine.configuration === 'Électrique' ? `${formatNumber(engine.maxRpm)}` : `${formatNumber(engine.displacement)} <small style="font-size:0.7rem;">cm³</small>`}</span>
          </div>
        </div>

        <p class="card-desc">${escapeHtml(engine.description)}</p>

        <div class="card-actions">
          <div class="card-actions-left">
            <button class="like-btn" data-action="like" title="Liker ce moteur">
              <span>🔥</span>
              <span>${engine.likes || 0}</span>
            </button>

            <button class="btn-icon" data-action="play-sound" title="Écouter le son du moteur (Web Audio)">
              <span>🔊</span>
            </button>
          </div>

          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <button 
              class="btn ${isCompared ? 'btn-primary' : 'btn-secondary'}" 
              data-action="compare" 
              style="padding: 0.35rem 0.65rem; font-size: 0.78rem;"
              title="Comparer ce moteur"
            >
              <span>${isCompared ? '✓ Comparé' : '+ Comparer'}</span>
            </button>

            <button class="btn-icon" data-action="edit" title="Modifier ce moteur">
              <span>✏️</span>
            </button>

            <button class="btn-icon" data-action="delete" title="Supprimer ce moteur" style="color: var(--accent-primary);">
              <span>🗑️</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.attachEvents(card, engine);
    return card;
  }

  private static attachEvents(card: HTMLElement, engine: Engine): void {
    // Clic global sur la carte pour ouvrir la modale détails
    card.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      // Ignorer si clic sur un bouton d'action
      if (target.closest('button') || target.closest('[data-action]')) {
        return;
      }
      document.dispatchEvent(new CustomEvent('open-engine-detail', { detail: { engineId: engine.id } }));
    });

    // Action Favori
    const favBtn = card.querySelector('[data-action="toggle-fav"]');
    if (favBtn) {
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        store.toggleFavorite(engine.id);
        Toast.show(
          engine.isFavorite ? `"${engine.name}" retiré des favoris` : `"${engine.name}" ajouté aux favoris !`,
          'info'
        );
      });
    }

    // Action Like
    const likeBtn = card.querySelector('[data-action="like"]');
    if (likeBtn) {
      likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        store.incrementLikes(engine.id);
        likeBtn.classList.add('anim-heartbeat');
        setTimeout(() => likeBtn.classList.remove('anim-heartbeat'), 400);
      });
    }

    // Action Play Sound (Aperçu sonore Web Audio)
    const soundBtn = card.querySelector('[data-action="play-sound"]');
    if (soundBtn) {
      soundBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (AudioEngineSimulator.getActiveStatus()) {
          AudioEngineSimulator.stop();
          Toast.show('Son moteur arrêté', 'info');
        } else {
          AudioEngineSimulator.start(engine.soundPitch, engine.maxRpm);
          AudioEngineSimulator.revUp();
          Toast.show(`Rugissement du ${engine.name} ! 🔊`, 'info');
          setTimeout(() => {
            AudioEngineSimulator.stop();
          }, 2400);
        }
      });
    }

    // Action Comparer
    const compareBtn = card.querySelector('[data-action="compare"]');
    if (compareBtn) {
      compareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const success = store.toggleCompare(engine.id);
        if (!success) {
          Toast.show('Vous pouvez comparer jusqu\'à 3 moteurs simultanément.', 'error');
        } else {
          const isNowIn = store.state.compareEngineIds.includes(engine.id);
          Toast.show(isNowIn ? `"${engine.name}" ajouté au comparateur` : `"${engine.name}" retiré`, 'info');
        }
      });
    }

    // Action Modifier
    const editBtn = card.querySelector('[data-action="edit"]');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.dispatchEvent(new CustomEvent('open-engine-form', { 
          detail: { mode: 'edit', engineId: engine.id } 
        }));
      });
    }

    // Action Supprimer avec animation d'exit
    const deleteBtn = card.querySelector('[data-action="delete"]');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Êtes-vous sûr de vouloir supprimer le moteur "${engine.name}" ?`)) {
          card.style.transition = 'all 0.3s ease';
          card.style.opacity = '0';
          card.style.transform = 'scale(0.85) translateY(20px)';
          setTimeout(() => {
            store.deleteEngine(engine.id);
            Toast.show(`Moteur "${engine.name}" supprimé.`, 'error');
          }, 300);
        }
      });
    }
  }
}
