import './styles/main.css';
import { store } from './state/proxyStore';
import { EngineService } from './services/engineService';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { FilterBar } from './components/FilterBar';
import { EngineGrid } from './components/EngineGrid';
import { EngineFormModal } from './components/EngineFormModal';
import { EngineDetailModal } from './components/EngineDetailModal';
import { CompareDrawer } from './components/CompareDrawer';
import { Toast } from './components/Toast';

class App {
  private formModal!: EngineFormModal;
  private detailModal!: EngineDetailModal;

  public async init(): Promise<void> {
    console.log('apexengine démarré');

    // composants
    new Navbar();
    new StatsOverview();
    new FilterBar();
    new EngineGrid();
    this.formModal = new EngineFormModal();
    this.detailModal = new EngineDetailModal();
    new CompareDrawer();

    // raccourcis clavier
    this.initKeyboardShortcuts();

    // chargement données
    try {
      const initialEngines = await EngineService.loadInitialEngines();
      store.setEngines(initialEngines);
      Toast.show(`${initialEngines.length} moteurs chargés avec succès !`, 'success');
    } catch (error) {
      console.error('Erreur lors du démarrage :', error);
      store.state.isLoading = false;
      store.state.errorMessage = 'Impossible de charger la base de données.';
      Toast.show('Erreur de chargement des données.', 'error');
    }
  }

  private initKeyboardShortcuts(): void {
    window.addEventListener('keydown', (e) => {
      // ignore si on tape dans un champ
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      // / -> recherche
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input') as HTMLInputElement | null;
        searchInput?.focus();
        searchInput?.select();
      }

      // n -> nouveau moteur
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        this.formModal.open('create');
      }

      // escape -> ferme les modales
      if (e.key === 'Escape') {
        this.formModal.close();
        this.detailModal.close();
      }
    });
  }
}

// go
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();

  document.getElementById('hero-cta-listen')?.addEventListener('click', () => {
    document.getElementById('engine-grid-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('hero-cta-add')?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('open-engine-form', { detail: { mode: 'create' } }));
  });
});
