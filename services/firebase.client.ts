// services/firebase.client.ts - Bypass del problema Auth Component
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Character } from '../context/types';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

// Variables globales
let firebaseApp: FirebaseApp | null = null;
let firebaseDB: Firestore | null = null;
let firebaseAuth: any = null; // Lo inicializaremos de forma diferida
let isInitialized = false;
let authInitialized = false;

// Función para inicializar solo App y Firestore (sin Auth inicialmente)
function initializeFirebaseCore(): boolean {
  if (isInitialized) {
    return true;
  }

  try {
    console.log('Initializing Firebase Core (without Auth)...');
    
    // Verificar configuración
    const configValid = Object.entries(firebaseConfig).every(([key, value]) => {
      if (!value || value === '') {
        console.warn(`Firebase config missing: ${key}`);
        return false;
      }
      return true;
    });

    if (!configValid) {
      console.error('Firebase config incomplete');
      return false;
    }

    // Inicializar App
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
      console.log('Firebase App initialized');
    } else {
      firebaseApp = getApps()[0];
      console.log('Using existing Firebase App');
    }

    // Inicializar solo Firestore (sin Auth por ahora)
    firebaseDB = getFirestore(firebaseApp);
    console.log('Firestore initialized');

    isInitialized = true;
    console.log('Firebase Core initialization successful (Auth will be lazy-loaded)');
    return true;

  } catch (error) {
    console.error('Firebase Core initialization failed:', error);
    firebaseApp = null;
    firebaseDB = null;
    isInitialized = false;
    return false;
  }
}

// Función para inicializar Auth SOLO cuando se necesite
async function initializeAuthLazy(): Promise<any> {
  if (authInitialized && firebaseAuth) {
    return firebaseAuth;
  }

  if (!isInitialized) {
    initializeFirebaseCore();
  }

  if (!firebaseApp) {
    console.error('Firebase App not available for Auth');
    return null;
  }

  try {
    console.log('Lazy-loading Firebase Auth...');
    
    // ESTRATEGIA: Cargar Auth dinámicamente y usar múltiples métodos de inicialización
    const authModule = await import('firebase/auth');
    
    // Método 1: initializeAuth con persistencia
    try {
      firebaseAuth = authModule.initializeAuth(firebaseApp, {
        persistence: authModule.getReactNativePersistence(AsyncStorage)
      });
      console.log('Auth initialized with AsyncStorage persistence');
      authInitialized = true;
      return firebaseAuth;
    } catch (error: any) {
      console.log('Method 1 failed:', error.code);
    }

    // Método 2: getAuth directo
    try {
      firebaseAuth = authModule.getAuth(firebaseApp);
      console.log('Auth initialized with getAuth');
      authInitialized = true;
      return firebaseAuth;
    } catch (error: any) {
      console.log('Method 2 failed:', error.code);
    }

    // Método 3: Crear nueva app instance para Auth
    try {
      const authApp = initializeApp(firebaseConfig, `auth-app-${Date.now()}`);
      firebaseAuth = authModule.getAuth(authApp);
      console.log('Auth initialized with separate app instance');
      authInitialized = true;
      return firebaseAuth;
    } catch (error: any) {
      console.log('Method 3 failed:', error.code);
    }

    // Método 4: Mock Auth para desarrollo
    console.warn('All Auth methods failed, creating mock auth');
    firebaseAuth = createMockAuth();
    authInitialized = true;
    return firebaseAuth;

  } catch (error) {
    console.error('Lazy Auth initialization failed completely:', error);
    firebaseAuth = createMockAuth();
    authInitialized = true;
    return firebaseAuth;
  }
}

// Mock Auth para casos donde Firebase Auth no funciona
function createMockAuth() {
  console.log('Creating mock auth for development');
  
  let currentUser: any = null;
  let authStateCallback: ((user: any) => void) | null = null;

  return {
    get currentUser() {
      return currentUser;
    },
    onAuthStateChanged: (callback: any) => {
      console.log('Mock: onAuthStateChanged called');
      authStateCallback = callback;
      // Simular que no hay usuario inicialmente
      callback(null);
      // Retornar función de unsubscribe
      return () => {
        console.log('Mock: unsubscribe called');
        authStateCallback = null;
      };
    },
    signInWithEmailAndPassword: async (email: string, password: string) => {
      console.log('Mock: signInWithEmailAndPassword', email);
      // Simular usuario autenticado
      const mockUser = {
        uid: `mock_${Date.now()}`,
        email: email,
        displayName: email.split('@')[0],
        photoURL: null,
      };
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Actualizar usuario actual
      currentUser = mockUser;
      
      // Disparar callback de cambio de estado
      if (authStateCallback) {
        setTimeout(() => {
          if (authStateCallback) {
            authStateCallback(mockUser);
          }
        }, 100);
      }
      
      return { user: mockUser };
    },
    createUserWithEmailAndPassword: async (email: string, password: string) => {
      console.log('Mock: createUserWithEmailAndPassword', email);
      const mockUser = {
        uid: `mock_new_${Date.now()}`,
        email: email,
        displayName: email.split('@')[0],
        photoURL: null,
      };
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Actualizar usuario actual
      currentUser = mockUser;
      
      // Disparar callback de cambio de estado
      if (authStateCallback) {
        setTimeout(() => {
          if (authStateCallback) {
            authStateCallback(mockUser);
          }
        }, 100);
      }
      
      return { user: mockUser };
    },
    signOut: async () => {
      console.log('Mock: signOut');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Limpiar usuario actual
      currentUser = null;
      
      // Disparar callback de cambio de estado
      if (authStateCallback) {
        setTimeout(() => {
          if (authStateCallback) {
            authStateCallback(null);
          }
        }, 100);
      }
    },
    sendPasswordResetEmail: async (email: string) => {
      console.log('Mock: sendPasswordResetEmail', email);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };
}

// Exports que inicializan bajo demanda
export const getFirebaseAuth = async () => {
  return await initializeAuthLazy();
};

export const getFirebaseDB = (): Firestore | null => {
  if (!isInitialized) {
    initializeFirebaseCore();
  }
  return firebaseDB;
};

export const getFirebaseApp = (): FirebaseApp | null => firebaseApp;

export const isFirebaseReady = (): boolean => {
  return isInitialized && firebaseDB !== null;
};

export const isAuthReady = (): boolean => {
  return authInitialized && firebaseAuth !== null;
};

export const retryFirebaseInit = (): boolean => {
  if (isInitialized) return true;
  console.log('Retrying Firebase Core initialization...');
  return initializeFirebaseCore();
};

// Clase de servicio adaptada
export class FirebaseService {
  private deviceId: string | null = null;

  async initialize(): Promise<void> {
    console.log('FirebaseService initializing...');
    this.deviceId = await this.getDeviceId();
    
    // Inicializar Core (App + Firestore)
    const coreSuccess = initializeFirebaseCore();
    if (coreSuccess) {
      console.log('FirebaseService Core ready');
      // NO inicializar Auth aquí - se hará bajo demanda
    } else {
      console.warn('FirebaseService Core in limited mode');
    }
  }

  private async getDeviceId(): Promise<string> {
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
  }

  private async getUserId(): Promise<string> {
    try {
      const auth = await getFirebaseAuth();
      if (auth?.currentUser) {
        return auth.currentUser.uid;
      }
    } catch (error) {
      console.log('Error getting current user:', error);
    }
    
    if (!this.deviceId) {
      this.deviceId = await this.getDeviceId();
    }
    return this.deviceId!;
  }

  isAvailable(): boolean {
    return isFirebaseReady();
  }

  async saveFavorites(favorites: Character[]): Promise<void> {
    if (!this.isAvailable()) {
      console.log('Firebase not available, skipping save');
      return;
    }

    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const userId = await this.getUserId();
      
      let collectionName = 'device_favorites';
      try {
        const auth = await getFirebaseAuth();
        if (auth?.currentUser) {
          collectionName = 'user_favorites';
        }
      } catch (error) {
        console.log('Using device_favorites due to auth error');
      }
      
      const favoritesRef = doc(firebaseDB!, collectionName, userId);
      
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
        userEmail: null, // Se actualizará cuando Auth funcione
      }, { merge: true });
      
      console.log('Favorites saved to Firebase');
    } catch (error) {
      console.error('Error saving favorites:', error);
      throw error;
    }
  }

  async loadFavorites(): Promise<Character[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const userId = await this.getUserId();
      
      let collectionName = 'device_favorites';
      try {
        const auth = await getFirebaseAuth();
        if (auth?.currentUser) {
          collectionName = 'user_favorites';
        }
      } catch (error) {
        console.log('Using device_favorites due to auth error');
      }
      
      const favoritesRef = doc(firebaseDB!, collectionName, userId);
      const docSnap = await getDoc(favoritesRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const favorites = data.favorites || [];
        
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
      console.error('Error loading favorites:', error);
      return [];
    }
  }

  async saveUserPreferences(preferences: any): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const userId = await this.getUserId();
      
      let collectionName = 'device_preferences';
      try {
        const auth = await getFirebaseAuth();
        if (auth?.currentUser) {
          collectionName = 'user_preferences';
        }
      } catch (error) {
        console.log('Using device_preferences due to auth error');
      }
      
      const prefsRef = doc(firebaseDB!, collectionName, userId);
      
      await setDoc(prefsRef, {
        ...preferences,
        lastUpdated: new Date().toISOString(),
        userEmail: null,
      }, { merge: true });
      
      console.log('Preferences saved');
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }

  async loadUserPreferences(): Promise<any> {
    if (!this.isAvailable()) return null;

    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const userId = await this.getUserId();
      
      let collectionName = 'device_preferences';
      try {
        const auth = await getFirebaseAuth();
        if (auth?.currentUser) {
          collectionName = 'user_preferences';
        }
      } catch (error) {
        console.log('Using device_preferences due to auth error');
      }
      
      const prefsRef = doc(firebaseDB!, collectionName, userId);
      const docSnap = await getDoc(prefsRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      
      return null;
    } catch (error) {
      console.error('Error loading preferences:', error);
      return null;
    }
  }

  async clearUserData(): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const userId = await this.getUserId();
      
      // Limpiar ambas colecciones por si acaso
      const collections = ['user_favorites', 'device_favorites', 'user_preferences', 'device_preferences'];
      
      for (const collection of collections) {
        try {
          const docRef = doc(firebaseDB!, collection, userId);
          await deleteDoc(docRef);
        } catch (error) {
          console.log(`Could not delete from ${collection}:`, error);
        }
      }
      
      console.log('User data cleared');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  async checkConnection(): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const { doc, setDoc, deleteDoc } = await import('firebase/firestore');
      const userId = await this.getUserId();
      const testRef = doc(firebaseDB!, 'connection_test', userId);
      
      await setDoc(testRef, {
        timestamp: new Date().toISOString(),
        test: true,
      });
      
      await deleteDoc(testRef);
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  isInitialized(): boolean {
    return isInitialized;
  }
}

export const firebaseService = new FirebaseService();