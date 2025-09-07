// services/firebase.ts - Configuración segura con variables de entorno
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { deleteDoc, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { Character } from '../context/types';

// Configuración de Firebase usando variables de entorno
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validar que todas las variables de entorno estén presentes
const requiredEnvVars = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Variable de entorno faltante: ${envVar}`);
  }
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Generar un ID único para el dispositivo
const getDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await AsyncStorage.getItem('@multiversohub:device_id');
    
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      await AsyncStorage.setItem('@multiversohub:device_id', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return `temp_${Date.now()}`;
  }
};

export class FirebaseService {
  private deviceId: string | null = null;

  async initialize(): Promise<void> {
    try {
      this.deviceId = await getDeviceId();
      console.log('✅ Firebase initialized with device ID:', this.deviceId);
    } catch (error) {
      console.error('❌ Error initializing Firebase:', error);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<string> {
    if (!this.deviceId) {
      await this.initialize();
    }
    return this.deviceId!;
  }

  // Guardar favoritos en Firebase
  async saveFavorites(favorites: Character[]): Promise<void> {
    try {
      const deviceId = await this.ensureInitialized();
      const favoritesRef = doc(db, 'user_data', deviceId);
      
      await setDoc(favoritesRef, {
        favorites: favorites.map(char => ({
          id: char.id,
          name: char.name,
          status: char.status,
          species: char.species,
          image: char.image,
          savedAt: new Date().toISOString(),
        })),
        lastUpdated: new Date().toISOString(),
      }, { merge: true });
      
      console.log('✅ Favorites saved to Firebase successfully');
    } catch (error) {
      console.error('❌ Error saving favorites to Firebase:', error);
      throw new Error('Error al sincronizar favoritos con la nube');
    }
  }

  // Cargar favoritos desde Firebase
  async loadFavorites(): Promise<Character[]> {
    try {
      const deviceId = await this.ensureInitialized();
      const favoritesRef = doc(db, 'user_data', deviceId);
      const docSnap = await getDoc(favoritesRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const favorites = data.favorites || [];
        
        // Convertir datos simplificados a objetos Character completos
        return favorites.map((fav: any) => ({
          id: fav.id,
          name: fav.name,
          status: fav.status,
          species: fav.species,
          type: '',
          gender: 'unknown' as const,
          origin: { name: 'Unknown', url: '' },
          location: { name: 'Unknown', url: '' },
          image: fav.image,
          episode: [],
          url: `https://rickandmortyapi.com/api/character/${fav.id}`,
          created: fav.savedAt || new Date().toISOString(),
        }));
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error loading favorites from Firebase:', error);
      // No lanzar error para permitir funcionamiento offline
      return [];
    }
  }

  // Guardar preferencias del usuario
  async saveUserPreferences(preferences: any): Promise<void> {
    try {
      const deviceId = await this.ensureInitialized();
      const prefsRef = doc(db, 'user_preferences', deviceId);
      
      await setDoc(prefsRef, {
        ...preferences,
        lastUpdated: new Date().toISOString(),
      }, { merge: true });
      
      console.log('✅ User preferences saved to Firebase');
    } catch (error) {
      console.error('❌ Error saving preferences to Firebase:', error);
      // No lanzar error para permitir funcionamiento offline
    }
  }

  // Cargar preferencias del usuario
  async loadUserPreferences(): Promise<any> {
    try {
      const deviceId = await this.ensureInitialized();
      const prefsRef = doc(db, 'user_preferences', deviceId);
      const docSnap = await getDoc(prefsRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error loading preferences from Firebase:', error);
      return null;
    }
  }

  // Sincronizar datos (favoritos y preferencias)
  async syncData(localFavorites: Character[], localPreferences: any): Promise<{
    favorites: Character[];
    preferences: any;
  }> {
    try {
      // Intentar cargar datos remotos
      const [remoteFavorites, remotePreferences] = await Promise.all([
        this.loadFavorites(),
        this.loadUserPreferences(),
      ]);

      // Por simplicidad, usar datos locales si existen, sino remotos
      const syncedFavorites = localFavorites.length > 0 ? localFavorites : remoteFavorites;
      const syncedPreferences = localPreferences ? localPreferences : remotePreferences;

      // Guardar los datos sincronizados
      await Promise.all([
        this.saveFavorites(syncedFavorites),
        this.saveUserPreferences(syncedPreferences),
      ]);

      return {
        favorites: syncedFavorites,
        preferences: syncedPreferences,
      };
    } catch (error) {
      console.error('❌ Error syncing data:', error);
      // Devolver datos locales si falla la sincronización
      return {
        favorites: localFavorites,
        preferences: localPreferences,
      };
    }
  }

  // Limpiar todos los datos del usuario
  async clearUserData(): Promise<void> {
    try {
      const deviceId = await this.ensureInitialized();
      
      await Promise.all([
        deleteDoc(doc(db, 'user_data', deviceId)),
        deleteDoc(doc(db, 'user_preferences', deviceId)),
      ]);
      
      console.log('✅ User data cleared from Firebase');
    } catch (error) {
      console.error('❌ Error clearing user data from Firebase:', error);
      throw new Error('Error al limpiar datos de la nube');
    }
  }

  // Verificar conectividad con Firebase
  async checkConnection(): Promise<boolean> {
    try {
      const deviceId = await this.ensureInitialized();
      const testRef = doc(db, 'connection_test', deviceId);
      
      await setDoc(testRef, {
        timestamp: new Date().toISOString(),
        test: true,
      });
      
      // Limpiar el documento de prueba
      await deleteDoc(testRef);
      
      return true;
    } catch (error) {
      console.error('❌ Firebase connection test failed:', error);
      return false;
    }
  }
}

// Instancia singleton
export const firebaseService = new FirebaseService();