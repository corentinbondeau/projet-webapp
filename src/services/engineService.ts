import { Engine } from '../types/engine';
import { StorageService } from '../state/storage';

export class EngineService {
  // en dev : vraie route REST GET /api/engines (middleware vite)
  // en prod / fallback : fichier statique
  private static API_URL = '/api/engines';
  private static FALLBACK_URL = '/data/engines.json';

  // localstorage sinon fetch
  static async loadInitialEngines(): Promise<Engine[]> {
    const saved = StorageService.getEngines();
    if (saved && saved.length > 0) {
      return saved;
    }

    return this.fetchFromApi();
  }

  // GET sur l'api (fetch + async/await)
  static async fetchFromApi(): Promise<Engine[]> {
    try {
      const data = await this.getJson<Engine[]>(this.API_URL).catch(() =>
        this.getJson<Engine[]>(this.FALLBACK_URL)
      );

      StorageService.saveEngines(data);
      return data;
    } catch (error) {
      console.error('erreur fetch moteurs:', error);
      throw error;
    }
  }

  private static async getJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  // reset + re-fetch
  static async resetToDefault(): Promise<Engine[]> {
    StorageService.clearStorage();
    return this.fetchFromApi();
  }
}
