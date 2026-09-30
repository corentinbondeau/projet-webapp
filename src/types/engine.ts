export type EngineConfiguration = 
  | '4 en ligne'
  | '5 en ligne'
  | '6 en ligne'
  | 'V6'
  | 'V8'
  | 'V10'
  | 'V12'
  | 'W16'
  | 'Flat-4'
  | 'Flat-6'
  | 'Rotatif'
  | 'Électrique'
  | 'Autre';

export type FuelType = 'Essence' | 'Diesel' | 'Hybride' | 'Électrique' | 'Hydrogène' | 'E85';

export type AspirationType = 'Atmosphérique' | 'Turbo' | 'Bi-Turbo' | 'Quad-Turbo' | 'Compresseur' | 'N/A';

export interface Engine {
  id: string;
  name: string;
  manufacturer: string;
  configuration: EngineConfiguration;
  displacement: number; // cm3 (0 si électrique)
  power: number; // ch
  torque: number; // nm
  maxRpm: number; // rpm
  aspiration: AspirationType;
  fuel: FuelType;
  yearStart: number;
  yearEnd: number | null; // null si encore produit
  vehicles: string[];
  soundPitch: number; // fréquence de base pour le tachymètre
  description: string;
  imageUrl: string;
  isFavorite: boolean;
  likes: number;
  createdAt?: string;
  updatedAt?: string;
}

export type SortField = 'power' | 'torque' | 'displacement' | 'maxRpm' | 'likes' | 'name' | 'manufacturer';
export type SortOrder = 'asc' | 'desc';

export interface FilterState {
  searchQuery: string;
  configuration: string; // 'ALL' ou une config précise
  fuel: string; // 'ALL' ou un carburant précis
  aspiration: string; // 'ALL' ou une aspiration précise
  onlyFavorites: boolean;
  minPower: number;
  maxPower: number;
  sortBy: SortField;
  sortOrder: SortOrder;
}

export type ThemeMode = 'dark' | 'light' | 'auto';

export interface AppState {
  engines: Engine[];
  filters: FilterState;
  theme: ThemeMode;
  selectedEngineId: string | null;
  compareEngineIds: string[]; // max 3
  isLoading: boolean;
  errorMessage: string | null;
  activeView: 'grid' | 'stats' | 'compare';
}

export type StoreListener = (state: AppState, changeKey?: string) => void;
