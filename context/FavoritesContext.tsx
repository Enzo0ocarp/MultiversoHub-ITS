import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { loadFavorites, saveFavorites } from '../services/storage';
import { Character, FavoritesAction, FavoritesState } from './types';

const initialState: FavoritesState = {
  favorites: [],
  isLoading: false,
  error: null,
};

// Función de logging local para evitar errores de tipos
const logFavoritesEvent = (eventType: string, details: Record<string, any>) => {
  console.log(`💝 [FAVORITES] ${eventType}:`, details);
};

function favoritesReducer(state: FavoritesState, action: FavoritesAction): FavoritesState {
  switch (action.type) {
    case 'ADD_FAVORITE':
      const newFavorites = [...state.favorites, action.payload];
      saveFavorites(newFavorites);
      logFavoritesEvent('favorite_added', { 
        characterId: action.payload.id, 
        characterName: action.payload.name 
      });
      return {
        ...state,
        favorites: newFavorites,
      };
    
    case 'REMOVE_FAVORITE':
      const filteredFavorites = state.favorites.filter(char => char.id !== action.payload);
      saveFavorites(filteredFavorites);
      logFavoritesEvent('favorite_removed', { characterId: action.payload });
      return {
        ...state,
        favorites: filteredFavorites,
      };
    
    case 'SET_FAVORITES':
      return {
        ...state,
        favorites: action.payload,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    
    default:
      return state;
  }
}

interface FavoritesContextType {
  state: FavoritesState;
  addFavorite: (character: Character) => void;
  removeFavorite: (characterId: number) => void;
  isFavorite: (characterId: number) => boolean;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(favoritesReducer, initialState);

  useEffect(() => {
    // Cargar favoritos al inicializar
    const loadInitialFavorites = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const savedFavorites = await loadFavorites();
        dispatch({ type: 'SET_FAVORITES', payload: savedFavorites });
        logFavoritesEvent('favorites_loaded', { count: savedFavorites.length });
      } catch (error) {
        console.error('Error loading favorites:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Error al cargar favoritos' });
        logFavoritesEvent('favorites_load_error', { error: String(error) });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadInitialFavorites();
  }, []);

  const addFavorite = (character: Character) => {
    if (!isFavorite(character.id)) {
      dispatch({ type: 'ADD_FAVORITE', payload: character });
    }
  };

  const removeFavorite = (characterId: number) => {
    dispatch({ type: 'REMOVE_FAVORITE', payload: characterId });
  };

  const isFavorite = (characterId: number): boolean => {
    return state.favorites.some(char => char.id === characterId);
  };

  const clearFavorites = () => {
    const previousCount = state.favorites.length;
    dispatch({ type: 'SET_FAVORITES', payload: [] });
    saveFavorites([]);
    logFavoritesEvent('favorites_cleared', { previousCount });
  };

  return (
    <FavoritesContext.Provider value={{
      state,
      addFavorite,
      removeFavorite,
      isFavorite,
      clearFavorites,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}