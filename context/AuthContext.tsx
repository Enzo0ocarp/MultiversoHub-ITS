import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithCredential,
    signInWithEmailAndPassword,
    updateProfile,
    User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { firebaseInitialized, getFirebaseAuth, getFirebaseDB } from '../services/firebase.client';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLoginAt: string;
  favoriteCharacters: number[];
}

interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Función helper para logging
const logAuthEvent = (eventType: string, details: Record<string, any>) => {
  console.log(`🔐 [AUTH] ${eventType}:`, details);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    userProfile: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Cargar perfil del usuario desde Firestore
  const loadUserProfile = async (user: User): Promise<UserProfile | null> => {
    const db = getFirebaseDB();
    
    if (!firebaseInitialized || !db) {
      console.log('⚠️ Firebase not initialized, skipping user profile load');
      return null;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  };

  // Crear perfil de usuario en Firestore
  const createUserProfile = async (user: User): Promise<UserProfile> => {
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      favoriteCharacters: [],
    };

    const db = getFirebaseDB();
    
    if (!firebaseInitialized || !db) {
      console.log('⚠️ Firebase not initialized, returning profile without saving');
      return profile;
    }

    try {
      await setDoc(doc(db, 'users', user.uid), profile);
      return profile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return profile; // Devolver perfil aunque falle el guardado
    }
  };

  // Actualizar último login
  const updateLastLogin = async (uid: string) => {
    const db = getFirebaseDB();
    
    if (!firebaseInitialized || !db) {
      console.log('⚠️ Firebase not initialized, skipping last login update');
      return;
    }

    try {
      await setDoc(
        doc(db, 'users', uid),
        { lastLoginAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  };

  // Manejar cambios de autenticación
  useEffect(() => {
    const auth = getFirebaseAuth();
    
    if (!firebaseInitialized || !auth) {
      console.log('⚠️ Firebase not initialized, auth disabled');
      setState({
        user: null,
        userProfile: null,
        isLoading: false,
        isAuthenticated: false,
      });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Usuario autenticado
        let profile = await loadUserProfile(user);
        
        if (!profile) {
          // Crear perfil si no existe
          profile = await createUserProfile(user);
        } else {
          // Actualizar último login
          await updateLastLogin(user.uid);
        }

        setState({
          user,
          userProfile: profile,
          isLoading: false,
          isAuthenticated: true,
        });

        // Guardar sesión localmente
        await AsyncStorage.setItem('@multiversohub:auth', JSON.stringify({
          uid: user.uid,
          email: user.email,
        }));

        logAuthEvent('user_login', { 
          uid: user.uid, 
          email: user.email,
          provider: user.providerData[0]?.providerId || 'unknown'
        });
      } else {
        // Usuario no autenticado
        setState({
          user: null,
          userProfile: null,
          isLoading: false,
          isAuthenticated: false,
        });

        // Limpiar sesión local
        await AsyncStorage.removeItem('@multiversohub:auth');
      }
    });

    return unsubscribe;
  }, []);

  // Iniciar sesión con email y contraseña
  const signIn = async (email: string, password: string): Promise<void> => {
    const auth = getFirebaseAuth();
    
    if (!firebaseInitialized || !auth) {
      throw new Error('Autenticación no disponible - Firebase no configurado');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await signInWithEmailAndPassword(auth, email, password);
      logAuthEvent('auth_sign_in', { method: 'email', email });
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(getAuthErrorMessage(error.code));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Registrarse con email y contraseña
  const signUp = async (email: string, password: string, displayName?: string): Promise<void> => {
    const auth = getFirebaseAuth();
    
    if (!firebaseInitialized || !auth) {
      throw new Error('Registro no disponible - Firebase no configurado');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Actualizar perfil con nombre si se proporciona
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }

      logAuthEvent('auth_sign_up', { method: 'email', email, hasDisplayName: !!displayName });
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(getAuthErrorMessage(error.code));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Cerrar sesión
  const signOut = async (): Promise<void> => {
    const auth = getFirebaseAuth();
    
    if (!firebaseInitialized || !auth) {
      throw new Error('Cerrar sesión no disponible - Firebase no configurado');
    }

    try {
      await firebaseSignOut(auth);
      logAuthEvent('auth_sign_out', {});
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // Iniciar sesión con Google
  const signInWithGoogle = async (idToken: string): Promise<void> => {
    const auth = getFirebaseAuth();
    
    if (!firebaseInitialized || !auth) {
      throw new Error('Google Sign-In no disponible - Firebase no configurado');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      logAuthEvent('auth_sign_in', { method: 'google' });
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw new Error(getAuthErrorMessage(error.code));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Resetear contraseña
  const resetPassword = async (email: string): Promise<void> => {
    const auth = getFirebaseAuth();
    
    if (!firebaseInitialized || !auth) {
      throw new Error('Recuperación de contraseña no disponible - Firebase no configurado');
    }

    try {
      await sendPasswordResetEmail(auth, email);
      logAuthEvent('auth_password_reset', { email });
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  // Actualizar perfil de usuario
  const updateUserProfile = async (data: Partial<UserProfile>): Promise<void> => {
    if (!state.user) throw new Error('User not authenticated');
    
    const db = getFirebaseDB();
    
    if (!firebaseInitialized || !db) {
      console.log('⚠️ Firebase not initialized, skipping profile update');
      return;
    }

    try {
      await setDoc(
        doc(db, 'users', state.user.uid),
        { ...data, lastUpdated: new Date().toISOString() },
        { merge: true }
      );

      // Actualizar estado local
      setState(prev => ({
        ...prev,
        userProfile: prev.userProfile ? { ...prev.userProfile, ...data } : null,
      }));

      logAuthEvent('user_profile_updated', { fields: Object.keys(data) });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  // Refrescar perfil de usuario
  const refreshUserProfile = async (): Promise<void> => {
    if (!state.user) return;

    try {
      const profile = await loadUserProfile(state.user);
      setState(prev => ({ ...prev, userProfile: profile }));
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      resetPassword,
      updateUserProfile,
      refreshUserProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Mensajes de error amigables
function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No existe una cuenta con este email';
    case 'auth/wrong-password':
      return 'Contraseña incorrecta';
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con este email';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres';
    case 'auth/invalid-email':
      return 'Email inválido';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Intenta más tarde';
    case 'auth/network-request-failed':
      return 'Error de conexión. Verifica tu internet';
    default:
      return 'Error de autenticación. Intenta nuevamente';
  }
}