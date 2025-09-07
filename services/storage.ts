import AsyncStorage from '@react-native-async-storage/async-storage';
import { Character } from '../context/types';

// Claves para AsyncStorage
const STORAGE_KEYS = {
  FAVORITES: '@multiversohub:favorites',
  THEME: '@multiversohub:theme',
  USER_PREFERENCES: '@multiversohub:preferences',
  OFFLINE_CACHE: '@multiversohub:cache',
  TELEMETRY: '@multiversohub:telemetry',
} as const;

// Interfaz para las preferencias del usuario
export interface UserPreferences {
  defaultFilter: 'all' | 'alive' | 'dead' | 'unknown';
  notificationsEnabled: boolean;
  cacheEnabled: boolean;
}

// Favoritos
export async function saveFavorites(favorites: Character[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  } catch (error) {
    console.error('Error saving favorites:', error);
    throw new Error('No se pudieron guardar los favoritos');
  }
}

export async function loadFavorites(): Promise<Character[]> {
  try {
    const favoritesJson = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
    return favoritesJson ? JSON.parse(favoritesJson) : [];
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
}

// Preferencias del usuario
export async function saveUserPreferences(preferences: UserPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving user preferences:', error);
    throw new Error('No se pudieron guardar las preferencias');
  }
}

export async function loadUserPreferences(): Promise<UserPreferences> {
  try {
    const preferencesJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    
    if (preferencesJson) {
      return JSON.parse(preferencesJson);
    }
    
    // Preferencias por defecto
    return {
      defaultFilter: 'all',
      notificationsEnabled: true,
      cacheEnabled: true,
    };
  } catch (error) {
    console.error('Error loading user preferences:', error);
    // Devolver preferencias por defecto en caso de error
    return {
      defaultFilter: 'all',
      notificationsEnabled: true,
      cacheEnabled: true,
    };
  }
}

// Cache offline
export async function saveToCache(key: string, data: any): Promise<void> {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(`${STORAGE_KEYS.OFFLINE_CACHE}:${key}`, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

export async function loadFromCache<T>(key: string, maxAgeMs: number = 300000): Promise<T | null> {
  try {
    const cacheJson = await AsyncStorage.getItem(`${STORAGE_KEYS.OFFLINE_CACHE}:${key}`);
    
    if (!cacheJson) {
      return null;
    }
    
    const cacheData = JSON.parse(cacheJson);
    const now = Date.now();
    
    // Verificar si el cache está expirado
    if (now - cacheData.timestamp > maxAgeMs) {
      // Limpiar cache expirado
      await AsyncStorage.removeItem(`${STORAGE_KEYS.OFFLINE_CACHE}:${key}`);
      return null;
    }
    
    return cacheData.data;
  } catch (error) {
    console.error('Error loading from cache:', error);
    return null;
  }
}

// Telemetría
export async function saveToTelemetry(events: any[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TELEMETRY, JSON.stringify(events));
  } catch (error) {
    console.error('Error saving telemetry:', error);
  }
}

export async function loadTelemetry(): Promise<any[]> {
  try {
    const telemetryJson = await AsyncStorage.getItem(STORAGE_KEYS.TELEMETRY);
    return telemetryJson ? JSON.parse(telemetryJson) : [];
  } catch (error) {
    console.error('Error loading telemetry:', error);
    return [];
  }
}

// Limpiar todos los datos
export async function clearAllData(): Promise<void> {
  try {
    const keys = Object.values(STORAGE_KEYS);
    
    // También limpiar claves que tienen prefijo
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToRemove = allKeys.filter(key => 
      keys.some(storageKey => key.startsWith(storageKey))
    );
    
    await AsyncStorage.multiRemove(keysToRemove);
    console.log('All app data cleared successfully');
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw new Error('No se pudieron eliminar todos los datos');
  }
}

// Obtener información de almacenamiento
export async function getStorageInfo(): Promise<{
  favoritesCount: number;
  cacheKeys: number;
  totalSize: string;
}> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const appKeys = allKeys.filter(key => key.startsWith('@multiversohub:'));
    
    let totalSizeBytes = 0;
    let favoritesCount = 0;
    let cacheKeys = 0;
    
    for (const key of appKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSizeBytes += value.length;
          
          if (key === STORAGE_KEYS.FAVORITES) {
            const favorites = JSON.parse(value);
            favoritesCount = Array.isArray(favorites) ? favorites.length : 0;
          } else if (key.startsWith(STORAGE_KEYS.OFFLINE_CACHE)) {
            cacheKeys++;
          }
        }
      } catch (error) {
        console.error(`Error reading key ${key}:`, error);
      }
    }
    
    const totalSizeKB = (totalSizeBytes / 1024).toFixed(2);
    
    return {
      favoritesCount,
      cacheKeys,
      totalSize: `${totalSizeKB} KB`,
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return {
      favoritesCount: 0,
      cacheKeys: 0,
      totalSize: '0 KB',
    };
  }
}