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
  displacement: number; // in cm3 (0 for electric)
  power: number; // in horsepower (ch)
  torque: number; // in Nm
  maxRpm: number; // in RPM
  aspiration: AspirationType;
  fuel: FuelType;
  yearStart: number;
  yearEnd: number | null; // null if still in production
  vehicles: string[];
  soundPitch: number; // Hz base frequency for Web Audio tachometer
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
  configuration: string; // 'ALL' or specific config
  fuel: string; // 'ALL' or specific fuel
  aspiration: string; // 'ALL' or specific aspiration
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
