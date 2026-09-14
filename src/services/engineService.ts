import { Engine } from '../types/engine';
import { StorageService } from '../state/storage';

export class EngineService {
  private static DATA_URL = '/data/engines.json';

  /**
   * Charge les moteurs depuis le LocalStorage si disponibles, sinon effectue un Fetch
   */
  static async loadInitialEngines(): Promise<Engine[]> {
    const saved = StorageService.getEngines();
    if (saved && saved.length > 0) {
      return saved;
    }

    return this.fetchFromApi();
  }

  /**
   * Effectue un appel Fetch vers le fichier JSON ou l'API REST
   */
  static async fetchFromApi(): Promise<Engine[]> {
    try {
      const response = await fetch(this.DATA_URL);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
      }
      const data: Engine[] = await response.json();
      
      // Sauvegarde initiale dans LocalStorage
      StorageService.saveEngines(data);
      return data;
    } catch (error) {
      console.error('Erreur lors du Fetch des données moteurs:', error);
      throw error;
    }
  }

  /**
   * Réinitialise les données en re-téléchargeant les moteurs par défaut
   */
  static async resetToDefault(): Promise<Engine[]> {
    StorageService.clearStorage();
    return this.fetchFromApi();
  }
}
