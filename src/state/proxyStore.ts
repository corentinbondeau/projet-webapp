import { AppState, Engine, FilterState, StoreListener, ThemeMode } from '../types/engine';
import { StorageService } from './storage';

/**
 * Création d'un Proxy réactif profond (Deep Reactive Proxy)
 * Intercepte toutes les modifications de propriétés et tableaux
 * pour déclencher automatiquement la synchronisation DOM et LocalStorage.
 */
function createReactiveObject<T extends object>(target: T, onChange: (key: string, value: any) => void): T {
  return new Proxy(target, {
    set(obj: any, prop: string | symbol, value: any, receiver: any): boolean {
      const stringProp = String(prop);
      const oldValue = obj[prop];
      
      // Si la valeur est un objet et n'est pas encore un Proxy, on la rend réactive
      const valToSet = (typeof value === 'object' && value !== null && !value._isProxy)
        ? createReactiveObject(value, onChange)
        : value;

      const result = Reflect.set(obj, prop, valToSet, receiver);

      if (oldValue !== value) {
        onChange(stringProp, value);
      }
      return result;
    },
    deleteProperty(obj: any, prop: string | symbol): boolean {
      const stringProp = String(prop);
      const hadProp = prop in obj;
      const result = Reflect.deleteProperty(obj, prop);
      if (hadProp) {
        onChange(stringProp, undefined);
      }
      return result;
    },
    get(obj: any, prop: string | symbol, receiver: any): any {
      if (prop === '_isProxy') return true;
      return Reflect.get(obj, prop, receiver);
    }
  });
}

class Store {
  private rawState: AppState;
  public state: AppState;
  private listeners: Set<StoreListener> = new Set();

  constructor() {
    const savedTheme = StorageService.getTheme();
    const savedCompare = StorageService.getCompareIds();

    this.rawState = {
      engines: [],
      filters: {
        searchQuery: '',
        configuration: 'ALL',
        fuel: 'ALL',
        aspiration: 'ALL',
        onlyFavorites: false,
        minPower: 0,
        maxPower: 2000,
        sortBy: 'power',
        sortOrder: 'desc'
      },
      theme: savedTheme,
      selectedEngineId: null,
      compareEngineIds: savedCompare,
      isLoading: true,
      errorMessage: null,
      activeView: 'grid'
    };

    // Initialisation du Proxy Réactif
    this.state = createReactiveObject(this.rawState, (key, value) => {
      this.handleStateChange(key, value);
    });
  }

  /**
   * Traite les changements interceptés par le Proxy
   */
  private handleStateChange(key: string, _value: any): void {
    // Persistance automatique dans LocalStorage
    if (key === 'engines' || !isNaN(Number(key))) {
      StorageService.saveEngines(this.state.engines);
    }
    if (key === 'theme') {
      StorageService.saveTheme(this.state.theme);
    }
    if (key === 'compareEngineIds') {
      StorageService.saveCompareIds(this.state.compareEngineIds);
    }

    // Notification des écouteurs du DOM
    this.notify(key);
  }

  /**
   * Abonnement aux mutations d'état (Pattern Observateur / PubSub)
   */
  public subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener);
    // Exécution initiale immédiate
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notifie tous les abonnés
   */
  private notify(changeKey?: string): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state, changeKey);
      } catch (err) {
        console.error('Erreur dans un listener de store:', err);
      }
    });
  }

  // ================= ACTIONS ================= //

  public setEngines(engines: Engine[]): void {
    this.state.engines = engines;
    this.state.isLoading = false;
    this.state.errorMessage = null;
  }

  public addEngine(engineData: Omit<Engine, 'id' | 'createdAt' | 'likes' | 'isFavorite'>): Engine {
    const newEngine: Engine = {
      ...engineData,
      id: 'eng-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      isFavorite: false,
      likes: 0,
      createdAt: new Date().toISOString()
    };
    // Déclenche le trap 'set' du Proxy
    this.state.engines = [newEngine, ...this.state.engines];
    return newEngine;
  }

  public updateEngine(id: string, updatedFields: Partial<Engine>): boolean {
    const index = this.state.engines.findIndex(e => e.id === id);
    if (index === -1) return false;

    const current = this.state.engines[index];
    const updated: Engine = {
      ...current,
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };

    const newEngines = [...this.state.engines];
    newEngines[index] = updated;
    this.state.engines = newEngines;
    return true;
  }

  public deleteEngine(id: string): boolean {
    const initialLength = this.state.engines.length;
    this.state.engines = this.state.engines.filter(e => e.id !== id);
    // Retirer aussi des comparaisons si présent
    if (this.state.compareEngineIds.includes(id)) {
      this.state.compareEngineIds = this.state.compareEngineIds.filter(item => item !== id);
    }
    return this.state.engines.length < initialLength;
  }

  public toggleFavorite(id: string): void {
    const engine = this.state.engines.find(e => e.id === id);
    if (engine) {
      this.updateEngine(id, { isFavorite: !engine.isFavorite });
    }
  }

  public incrementLikes(id: string): void {
    const engine = this.state.engines.find(e => e.id === id);
    if (engine) {
      this.updateEngine(id, { likes: (engine.likes || 0) + 1 });
    }
  }

  public setFilters(filters: Partial<FilterState>): void {
    this.state.filters = {
      ...this.state.filters,
      ...filters
    };
  }

  public resetFilters(): void {
    this.state.filters = {
      searchQuery: '',
      configuration: 'ALL',
      fuel: 'ALL',
      aspiration: 'ALL',
      onlyFavorites: false,
      minPower: 0,
      maxPower: 2000,
      sortBy: 'power',
      sortOrder: 'desc'
    };
  }

  public setTheme(theme: ThemeMode): void {
    this.state.theme = theme;
  }

  public setSelectedEngine(id: string | null): void {
    this.state.selectedEngineId = id;
  }

  public toggleCompare(id: string): boolean {
    const current = [...this.state.compareEngineIds];
    const index = current.indexOf(id);
    if (index >= 0) {
      current.splice(index, 1);
      this.state.compareEngineIds = current;
      return true;
    } else {
      if (current.length >= 3) {
        return false; // Limité à 3 moteurs pour une comparaison lisible
      }
      current.push(id);
      this.state.compareEngineIds = current;
      return true;
    }
  }

  public clearCompare(): void {
    this.state.compareEngineIds = [];
  }

  public setActiveView(view: 'grid' | 'stats' | 'compare'): void {
    this.state.activeView = view;
  }

  /**
   * Calcul des moteurs filtrés et triés (Computed State)
   */
  public getFilteredEngines(): Engine[] {
    const { searchQuery, configuration, fuel, aspiration, onlyFavorites, minPower, maxPower, sortBy, sortOrder } = this.state.filters;
    const query = searchQuery.trim().toLowerCase();

    return this.state.engines.filter(engine => {
      // Recherche textuelle multi-champs
      if (query) {
        const matchesName = engine.name.toLowerCase().includes(query);
        const matchesBrand = engine.manufacturer.toLowerCase().includes(query);
        const matchesDesc = engine.description.toLowerCase().includes(query);
        const matchesVehicles = engine.vehicles.some(v => v.toLowerCase().includes(query));
        if (!matchesName && !matchesBrand && !matchesDesc && !matchesVehicles) {
          return false;
        }
      }

      // Filtre configuration
      if (configuration !== 'ALL' && engine.configuration !== configuration) {
        return false;
      }

      // Filtre carburant
      if (fuel !== 'ALL' && engine.fuel !== fuel) {
        return false;
      }

      // Filtre aspiration
      if (aspiration !== 'ALL' && engine.aspiration !== aspiration) {
        return false;
      }

      // Filtre favoris
      if (onlyFavorites && !engine.isFavorite) {
        return false;
      }

      // Filtre puissance
      if (engine.power < minPower || engine.power > maxPower) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'power') comparison = a.power - b.power;
      else if (sortBy === 'torque') comparison = a.torque - b.torque;
      else if (sortBy === 'displacement') comparison = a.displacement - b.displacement;
      else if (sortBy === 'maxRpm') comparison = a.maxRpm - b.maxRpm;
      else if (sortBy === 'likes') comparison = a.likes - b.likes;
      else if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'manufacturer') comparison = a.manufacturer.localeCompare(b.manufacturer);

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Calcul des métriques globales pour le tableau de bord
   */
  public getStats() {
    const list = this.state.engines;
    const total = list.length;
    if (total === 0) {
      return {
        total: 0,
        avgPower: 0,
        maxPowerEngine: null,
        highestRpmEngine: null,
        topLikedEngine: null,
        fuelBreakdown: {} as Record<string, number>,
        configBreakdown: {} as Record<string, number>
      };
    }

    const totalPower = list.reduce((sum, e) => sum + e.power, 0);
    const avgPower = Math.round(totalPower / total);

    const maxPowerEngine = [...list].sort((a, b) => b.power - a.power)[0];
    const highestRpmEngine = [...list].sort((a, b) => b.maxRpm - a.maxRpm)[0];
    const topLikedEngine = [...list].sort((a, b) => b.likes - a.likes)[0];

    const fuelBreakdown = list.reduce((acc, e) => {
      acc[e.fuel] = (acc[e.fuel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const configBreakdown = list.reduce((acc, e) => {
      acc[e.configuration] = (acc[e.configuration] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      avgPower,
      maxPowerEngine,
      highestRpmEngine,
      topLikedEngine,
      fuelBreakdown,
      configBreakdown
    };
  }
}

export const store = new Store();
