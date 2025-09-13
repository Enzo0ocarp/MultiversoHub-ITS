// context/AuthContext.tsx - Con bypass del problema Auth
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { firebaseService, getFirebaseAuth, getFirebaseDB, isFirebaseReady } from '../services/firebase.client';

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
  user: any | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isMockAuth: boolean; // Nuevo: indica si estamos usando auth simulado
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    userProfile: null,
    isLoading: true,
    isAuthenticated: false,
    isMockAuth: false,
  });

  // Detectar si estamos usando Mock Auth
  const checkIfMockAuth = async (): Promise<boolean> => {
    try {
      const auth = await getFirebaseAuth();
      if (!auth) return true;
      
      // Si el auth tiene currentUser como getter (Mock) vs propiedad normal (Firebase)
      const descriptor = Object.getOwnPropertyDescriptor(auth, 'currentUser');
      return !!(descriptor && typeof descriptor.get === 'function');
    } catch (error) {
      return true; // Si hay error, probablemente sea mock
    }
  };

  // Cargar perfil del usuario desde Firestore
  const loadUserProfile = async (user: any): Promise<UserProfile | null> => {
    try {
      if (!isFirebaseReady()) {
        console.log('Firebase not ready for profile load');
        return null;
      }

      const db = getFirebaseDB();
      if (!db) {
        console.log('Firestore not available');
        return null;
      }

      const { doc, getDoc } = await import('firebase/firestore');
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
  const createUserProfile = async (user: any): Promise<UserProfile> => {
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      favoriteCharacters: [],
    };

    try {
      if (!isFirebaseReady()) {
        console.log('Firebase not ready, returning profile without saving');
        return profile;
      }

      const db = getFirebaseDB();
      if (!db) {
        console.log('Firestore not available, returning profile without saving');
        return profile;
      }

      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'users', user.uid), profile);
      return profile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return profile;
    }
  };

  // Configurar listener de autenticación con manejo de Mock
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let timeoutId: ReturnType<typeof setTimeout>;

    const setupAuthListener = async () => {
      try {
        console.log('Setting up auth listener with bypass...');
        
        // Inicializar Firebase Service
        await firebaseService.initialize();

        if (!isFirebaseReady()) {
          console.log('Firebase Core not ready, waiting...');
          
          timeoutId = setTimeout(() => {
            setupAuthListener(); // Reintentar
          }, 3000);
          return;
        }

        console.log('Firebase Core is ready, setting up Auth listener...');

        // Intentar obtener Auth (puede ser real o mock)
        const auth = await getFirebaseAuth();
        if (!auth) {
          console.log('Auth not available');
          setState({
            user: null,
            userProfile: null,
            isLoading: false,
            isAuthenticated: false,
            isMockAuth: false,
          });
          return;
        }

        // Detectar si es mock auth
        const isMock = await checkIfMockAuth();
        console.log('Auth type:', isMock ? 'Mock' : 'Real');

        // Configurar el listener
        unsubscribe = auth.onAuthStateChanged(async (user: any) => {
          try {
            console.log('Auth state changed:', user ? `User: ${user.email}` : 'No user');
            
            if (user) {
              let profile = await loadUserProfile(user);
              if (!profile) {
                profile = await createUserProfile(user);
              }

              setState({
                user,
                userProfile: profile,
                isLoading: false,
                isAuthenticated: true,
                isMockAuth: isMock,
              });

              // Guardar sesión localmente
              await AsyncStorage.setItem('@multiversohub:auth', JSON.stringify({
                uid: user.uid,
                email: user.email,
                isMock: isMock,
              }));

            } else {
              setState({
                user: null,
                userProfile: null,
                isLoading: false,
                isAuthenticated: false,
                isMockAuth: isMock,
              });

              // Limpiar sesión local
              await AsyncStorage.removeItem('@multiversohub:auth');
            }
          } catch (error) {
            console.error('Error in auth state change:', error);
            setState({
              user: null,
              userProfile: null,
              isLoading: false,
              isAuthenticated: false,
              isMockAuth: isMock,
            });
          }
        });

        console.log('Auth listener set up successfully');

      } catch (error) {
        console.error('Error setting up auth listener:', error);
        setState({
          user: null,
          userProfile: null,
          isLoading: false,
          isAuthenticated: false,
          isMockAuth: false,
        });
      }
    };

    setupAuthListener();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Funciones de autenticación con manejo de Mock
  const signIn = async (email: string, password: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const auth = await getFirebaseAuth();
      if (!auth) {
        throw new Error('Authentication service not available');
      }

      // Funciona tanto con Auth real como mock
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      console.log('Sign in successful');

      // Para mock auth, simular el cambio de estado manualmente
      const isMock = await checkIfMockAuth();
      if (isMock && userCredential.user) {
        // El listener se encargará del resto
      }
      
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(getAuthErrorMessage(error.code || error.message));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const signUp = async (email: string, password: string, displayName?: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const auth = await getFirebaseAuth();
      if (!auth) {
        throw new Error('Registration service not available');
      }

      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      console.log('Registration successful');

      // Para auth real, actualizar displayName
      const isMock = await checkIfMockAuth();
      if (!isMock && displayName && userCredential.user) {
        // Solo para Firebase real
        try {
          const { updateProfile } = await import('firebase/auth');
          await updateProfile(userCredential.user, { displayName });
        } catch (updateError) {
          console.log('Could not update profile:', updateError);
        }
      }

    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(getAuthErrorMessage(error.code || error.message));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      const auth = await getFirebaseAuth();
      if (!auth) {
        throw new Error('Sign out service not available');
      }

      await auth.signOut();
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async (idToken: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Solo funciona con Firebase real, no con mock
      const isMock = await checkIfMockAuth();
      if (isMock) {
        throw new Error('Google Sign-In not available in development mode');
      }

      const auth = await getFirebaseAuth();
      if (!auth) {
        throw new Error('Google Sign-In not available');
      }

      const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      console.log('Google Sign-In successful');
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      throw new Error(getAuthErrorMessage(error.code || error.message));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      const auth = await getFirebaseAuth();
      if (!auth) {
        throw new Error('Password reset service not available');
      }

      await auth.sendPasswordResetEmail(email);
      console.log('Password reset email sent');
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(getAuthErrorMessage(error.code || error.message));
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>): Promise<void> => {
    if (!state.user) throw new Error('User not authenticated');
    
    try {
      if (!isFirebaseReady()) {
        console.log('Firebase not ready, skipping profile update');
        return;
      }

      const db = getFirebaseDB();
      if (!db) {
        console.log('Firestore not available, skipping profile update');
        return;
      }

      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(
        doc(db, 'users', state.user.uid),
        { ...data, lastUpdated: new Date().toISOString() },
        { merge: true }
      );

      setState(prev => ({
        ...prev,
        userProfile: prev.userProfile ? { ...prev.userProfile, ...data } : null,
      }));

      console.log('Profile updated');
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const refreshUserProfile = async (): Promise<void> => {
    if (!state.user) return;

    try {
      const profile = await loadUserProfile(state.user);
      setState(prev => ({ ...prev, userProfile: profile }));
    } catch (error) {
      console.error('Error refreshing profile:', error);
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

function getAuthErrorMessage(errorCode: string): string {
  // Manejar errores de mock auth también
  if (typeof errorCode === 'string') {
    if (errorCode.includes('Mock:')) {
      return 'Error en autenticación de desarrollo';
    }
  }

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