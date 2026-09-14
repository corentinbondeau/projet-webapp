import { Engine, ThemeMode } from '../types/engine';

const STORAGE_KEYS = {
  ENGINES: 'apex_engines_data_v1',
  THEME: 'apex_theme_mode_v1',
  COMPARE: 'apex_compare_ids_v1'
};

export class StorageService {
  /**
   * Sauvegarde la liste des moteurs dans le LocalStorage
   */
  static saveEngines(engines: Engine[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ENGINES, JSON.stringify(engines));
    } catch (e) {
      console.error('Erreur lors de la sauvegarde dans LocalStorage:', e);
    }
  }

  /**
   * Récupère la liste des moteurs depuis le LocalStorage
   */
  static getEngines(): Engine[] | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ENGINES);
      if (!data) return null;
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : null;
    } catch (e) {
      console.error('Erreur lors de la lecture du LocalStorage:', e);
      return null;
    }
  }

  /**
   * Sauvegarde le thème (dark, light, auto)
   */
  static saveTheme(theme: ThemeMode): void {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      console.error('Erreur lors de la sauvegarde du thème:', e);
    }
  }

  /**
   * Récupère le thème sauvegardé
   */
  static getTheme(): ThemeMode {
    try {
      const theme = localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode | null;
      if (theme === 'dark' || theme === 'light' || theme === 'auto') {
        return theme;
      }
    } catch (e) {
      console.error('Erreur lors de la lecture du thème:', e);
    }
    return 'auto';
  }

  /**
   * Sauvegarde la liste de comparaison
   */
  static saveCompareIds(ids: string[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPARE, JSON.stringify(ids));
    } catch (e) {
      console.error('Erreur lors de la sauvegarde des comparaisons:', e);
    }
  }

  /**
   * Récupère la liste de comparaison
   */
  static getCompareIds(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPARE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Exporte les données sous forme de fichier JSON téléchargeable
   */
  static exportToJsonFile(engines: Engine[]): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(engines, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `apex_engines_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  /**
   * Réinitialise les données du LocalStorage
   */
  static clearStorage(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.ENGINES);
      localStorage.removeItem(STORAGE_KEYS.COMPARE);
    } catch (e) {
      console.error('Erreur lors du nettoyage du LocalStorage:', e);
    }
  }
}
