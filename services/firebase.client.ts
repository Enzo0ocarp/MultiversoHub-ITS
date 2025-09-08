// services/firebase.ts - Configuración robusta siguiendo mejores prácticas
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  getReactNativePersistence,
  initializeAuth
} from 'firebase/auth';
import {
  Firestore,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  setDoc
} from 'firebase/firestore';
import { Character } from '../context/types';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validar configuración
const validateConfig = () => {
  const requiredKeys = [
    'apiKey',
    'authDomain', 
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];
  
  for (const key of requiredKeys) {
    if (!firebaseConfig[key as keyof typeof firebaseConfig]) {
      console.warn(`⚠️ Missing Firebase config: ${key}`);
      return false;
    }
  }
  return true;
};

// Variables globales para Firebase
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let firebaseInitialized = false;

// Función de inicialización
const initializeFirebase = (): boolean => {
  try {
    console.log('🔥 Initializing Firebase...');
    
    // Validar configuración
    if (!validateConfig()) {
      console.error('❌ Firebase configuration is incomplete');
      return false;
    }

    // Inicializar Firebase App - una sola vez
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase App initialized');
    } else {
      app = getApp();
      console.log('✅ Firebase App already exists');
    }

    // Inicializar Auth con persistencia
    try {
      // Intentar obtener auth existente primero
      auth = getAuth(app);
      console.log('✅ Firebase Auth obtained');
    } catch (authError) {
      console.log('🔄 Initializing new Auth instance...');
      try {
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage)
        });
        console.log('✅ Firebase Auth initialized with persistence');
      } catch (persistenceError) {
        console.warn('⚠️ Auth persistence failed, using default:', persistenceError);
        auth = initializeAuth(app);
        console.log('✅ Firebase Auth initialized without persistence');
      }
    }

    // Inicializar Firestore
    try {
      db = getFirestore(app);
      console.log('✅ Firestore initialized');
    } catch (dbError) {
      console.error('❌ Firestore initialization failed:', dbError);
      return false;
    }

    firebaseInitialized = true;
    console.log('🎉 Firebase initialization completed successfully');
    return true;

  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    firebaseInitialized = false;
    app = null;
    auth = null;
    db = null;
    return false;
  }
};

// Inicializar Firebase
initializeFirebase();

// ID único del dispositivo
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

// Clase de servicio Firebase
export class FirebaseService {
  private deviceId: string | null = null;

  async initialize(): Promise<void> {
    try {
      this.deviceId = await getDeviceId();
      console.log('✅ Firebase service ready with device ID:', this.deviceId);
    } catch (error) {
      console.error('❌ Error initializing Firebase service:', error);
      throw error;
    }
  }

  private async getUserId(): Promise<string> {
    if (firebaseInitialized && auth?.currentUser) {
      return auth.currentUser.uid;
    }
    
    if (!this.deviceId) {
      await this.initialize();
    }
    return this.deviceId!;
  }

  isAvailable(): boolean {
    return firebaseInitialized && !!auth && !!db;
  }

  async saveFavorites(favorites: Character[]): Promise<void> {
    if (!this.isAvailable()) {
      console.log('⚠️ Firebase not available, skipping save');
      return;
    }

    try {
      const userId = await this.getUserId();
      const collectionName = auth!.currentUser ? 'user_favorites' : 'device_favorites';
      const favoritesRef = doc(db!, collectionName, userId);
      
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
        userEmail: auth!.currentUser?.email || null,
      }, { merge: true });
      
      console.log('✅ Favorites saved to Firebase');
    } catch (error) {
      console.error('❌ Error saving favorites:', error);
    }
  }

  async loadFavorites(): Promise<Character[]> {
    if (!this.isAvailable()) {
      console.log('⚠️ Firebase not available, returning empty favorites');
      return [];
    }

    try {
      const userId = await this.getUserId();
      const collectionName = auth!.currentUser ? 'user_favorites' : 'device_favorites';
      const favoritesRef = doc(db!, collectionName, userId);
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
      console.error('❌ Error loading favorites:', error);
      return [];
    }
  }

  async saveUserPreferences(preferences: any): Promise<void> {
    if (!this.isAvailable()) {
      console.log('⚠️ Firebase not available, skipping preferences save');
      return;
    }

    try {
      const userId = await this.getUserId();
      const collectionName = auth!.currentUser ? 'user_preferences' : 'device_preferences';
      const prefsRef = doc(db!, collectionName, userId);
      
      await setDoc(prefsRef, {
        ...preferences,
        lastUpdated: new Date().toISOString(),
        userEmail: auth!.currentUser?.email || null,
      }, { merge: true });
      
      console.log('✅ User preferences saved');
    } catch (error) {
      console.error('❌ Error saving preferences:', error);
    }
  }

  async loadUserPreferences(): Promise<any> {
    if (!this.isAvailable()) {
      console.log('⚠️ Firebase not available, returning null preferences');
      return null;
    }

    try {
      const userId = await this.getUserId();
      const collectionName = auth!.currentUser ? 'user_preferences' : 'device_preferences';
      const prefsRef = doc(db!, collectionName, userId);
      const docSnap = await getDoc(prefsRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error loading preferences:', error);
      return null;
    }
  }

  async clearUserData(): Promise<void> {
    if (!this.isAvailable()) {
      console.log('⚠️ Firebase not available, skipping clear');
      return;
    }

    try {
      const userId = await this.getUserId();
      
      const favoritesCollection = auth!.currentUser ? 'user_favorites' : 'device_favorites';
      const favoritesRef = doc(db!, favoritesCollection, userId);
      await deleteDoc(favoritesRef);
      
      const preferencesCollection = auth!.currentUser ? 'user_preferences' : 'device_preferences';
      const preferencesRef = doc(db!, preferencesCollection, userId);
      await deleteDoc(preferencesRef);
      
      console.log('✅ User data cleared');
    } catch (error) {
      console.error('❌ Error clearing user data:', error);
    }
  }

  async checkConnection(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const userId = await this.getUserId();
      const testRef = doc(db!, 'connection_test', userId);
      
      await setDoc(testRef, {
        timestamp: new Date().toISOString(),
        test: true,
      });
      
      await deleteDoc(testRef);
      return true;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }

  isInitialized(): boolean {
    return firebaseInitialized;
  }
}

// Instancia singleton
export const firebaseService = new FirebaseService();

// Exportaciones
export { auth, db, firebaseInitialized };
export const getFirebaseAuth = (): Auth | null => auth;
export const getFirebaseDB = (): Firestore | null => db;