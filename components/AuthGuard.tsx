// components/AuthGuard.tsx - Versión corregida con exportación correcta
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LoginScreen } from './LoginScreen';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: theme.background 
      }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Si requiere autenticación pero no está autenticado, mostrar login
  if (requireAuth && !isAuthenticated) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}

// Exportación por defecto también
export default AuthGuard;