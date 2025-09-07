// Tipos para la API de Rick and Morty
export interface Character {
  id: number;
  name: string;
  status: 'Alive' | 'Dead' | 'unknown';
  species: string;
  type: string;
  gender: 'Female' | 'Male' | 'Genderless' | 'unknown';
  origin: {
    name: string;
    url: string;
  };
  location: {
    name: string;
    url: string;
  };
  image: string;
  episode: string[];
  url: string;
  created: string;
}

export interface Episode {
  id: number;
  name: string;
  air_date: string;
  episode: string;
  characters: string[];
  url: string;
  created: string;
}

export interface ApiResponse<T> {
  info: {
    count: number;
    pages: number;
    next: string | null;
    prev: string | null;
  };
  results: T[];
}

// Tipos para el contexto de favoritos
export interface FavoritesState {
  favorites: Character[];
  isLoading: boolean;
  error: string | null;
}

export type FavoritesAction =
  | { type: 'ADD_FAVORITE'; payload: Character }
  | { type: 'REMOVE_FAVORITE'; payload: number }
  | { type: 'SET_FAVORITES'; payload: Character[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// Tipos para el tema
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface ThemeContextType {
  theme: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

// Tipos para filtros
export type CharacterStatus = 'all' | 'alive' | 'dead' | 'unknown';

// Tipos para telemetría
export interface TelemetryEvent {
  timestamp: string;
  type: 'character_viewed' | 'favorite_added' | 'favorite_removed' | 'filter_applied' | 'app_launched';
  details: Record<string, any>;
}