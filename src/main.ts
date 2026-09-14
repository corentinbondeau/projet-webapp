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
    console.log('🏎️ Initialisation de ApexEngine (Vanilla TS + Proxy Store)...');

    // Instanciation des composants UI (s'attachent automatiquement aux conteneurs DOM)
    new Navbar();
    new StatsOverview();
    new FilterBar();
    new EngineGrid();
    this.formModal = new EngineFormModal();
    this.detailModal = new EngineDetailModal();
    new CompareDrawer();

    // Raccourcis clavier ergonomiques
    this.initKeyboardShortcuts();

    // Chargement initial des données via Fetch API ou LocalStorage
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
      // Ignorer si l'utilisateur est en train d'écrire dans un champ input/textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      // Raccourci '/' : focus recherche
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input') as HTMLInputElement | null;
        searchInput?.focus();
        searchInput?.select();
      }

      // Raccourci 'n' : ouvrir le formulaire nouveau moteur
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        this.formModal.open('create');
      }

      // Raccourci 'Escape' : fermer toutes les modales ouvertes
      if (e.key === 'Escape') {
        this.formModal.close();
        this.detailModal.close();
      }
    });
  }
}

// Démarrage au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
