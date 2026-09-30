import { Engine } from '../types/engine';
import { StorageService } from '../state/storage';

export class EngineService {
  private static DATA_URL = '/data/engines.json';

  // localstorage sinon fetch
  static async loadInitialEngines(): Promise<Engine[]> {
    const saved = StorageService.getEngines();
    if (saved && saved.length > 0) {
      return saved;
    }

    return this.fetchFromApi();
  }

  // fetch du json
  static async fetchFromApi(): Promise<Engine[]> {
    try {
      const response = await fetch(this.DATA_URL);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
      }
      const data: Engine[] = await response.json();
      
      // save
      StorageService.saveEngines(data);
      return data;
    } catch (error) {
      console.error('Erreur lors du Fetch des données moteurs:', error);
      throw error;
    }
  }

  // reset + re-fetch
  static async resetToDefault(): Promise<Engine[]> {
    StorageService.clearStorage();
    return this.fetchFromApi();
  }
}
