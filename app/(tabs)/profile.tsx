// app/(tabs)/profile.tsx - Actualizado con funciones de auth
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useTheme } from '../../context/ThemeContext';
import { useConnectionStatus } from '../../hooks/useNetInfo';
import { firebaseService } from '../../services/firebase.client';
import {
  clearAllData,
  getStorageInfo,
  loadUserPreferences,
  saveUserPreferences,
  UserPreferences
} from '../../services/storage';
import {
  getTelemetryStats
} from '../../services/telemetry';

export default function ProfileScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { state: favoritesState, clearFavorites } = useFavorites();
  const { user, userProfile, signOut, isLoading } = useAuth();
  const { isOnline } = useConnectionStatus();
  
  const [storageInfo, setStorageInfo] = useState({
    favoritesCount: 0,
    cacheKeys: 0,
    totalSize: '0 KB',
  });
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    defaultFilter: 'all',
    notificationsEnabled: true,
    cacheEnabled: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [storage, preferences] = await Promise.all([
        getStorageInfo(),
        loadUserPreferences(),
      ]);
      
      setStorageInfo(storage);
      setUserPreferences(preferences);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const updatePreference = async (key: keyof UserPreferences, value: any) => {
    const newPreferences = { ...userPreferences, [key]: value };
    setUserPreferences(newPreferences);
    
    try {
      await saveUserPreferences(newPreferences);
      if (isOnline) {
        await firebaseService.saveUserPreferences(newPreferences);
      }
    } catch (error) {
      console.error('Error saving preference:', error);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          },
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Limpiar Todos los Datos',
      'Esta acción eliminará todos los datos de la aplicación incluyendo favoritos, cache y preferencias. ¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Todo',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              await clearAllData();
              if (isOnline) {
                await firebaseService.clearUserData();
              }
              await loadInitialData();
              Alert.alert('Éxito', 'Todos los datos han sido eliminados');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'No se pudieron eliminar todos los datos');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const telemetryStats = getTelemetryStats();

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement,
    danger = false 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, { borderColor: theme.border }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <View style={[
          styles.settingIcon, 
          { backgroundColor: danger ? theme.error + '20' : theme.primary + '20' }
        ]}>
          <Ionicons 
            name={icon as any} 
            size={20} 
            color={danger ? theme.error : theme.primary} 
          />
        </View>
        <View style={styles.settingContent}>
          <Text style={[
            styles.settingTitle, 
            { color: danger ? theme.error : theme.text }
          ]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightElement || (
        onPress && <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* User Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <View style={[styles.avatarContainer, { backgroundColor: theme.primary + '20' }]}>
          <Ionicons name="person" size={32} color={theme.primary} />
        </View>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {userProfile?.displayName || user?.email || 'Usuario'}
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          {user?.email}
        </Text>
        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: theme.error + '20' }]}
          onPress={handleSignOut}
          disabled={isLoading}
        >
          <Ionicons name="log-out" size={16} color={theme.error} />
          <Text style={[styles.signOutText, { color: theme.error }]}>
            Cerrar Sesión
          </Text>
        </TouchableOpacity>
      </View>

      {/* Estadísticas */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Estadísticas</Text>
        
        <View style={[styles.statsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {favoritesState.favorites.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Favoritos
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.success }]}>
                {telemetryStats.eventsByType.character_viewed || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Personajes Vistos
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.warning }]}>
                {storageInfo.totalSize}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Almacenamiento
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Apariencia */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Apariencia</Text>
        
        <SettingItem
          icon="moon"
          title="Tema Oscuro"
          subtitle={isDark ? 'Activado' : 'Desactivado'}
          rightElement={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="white"
            />
          }
        />
      </View>

      {/* Cuenta */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Cuenta</Text>
        
        <SettingItem
          icon="person-circle"
          title="Información de la cuenta"
          subtitle={`Miembro desde ${userProfile?.createdAt ? new Date(userProfile.createdAt).getFullYear() : 'Desconocido'}`}
        />
        
        <SettingItem
          icon="time"
          title="Último acceso"
          subtitle={userProfile?.lastLoginAt ? new Date(userProfile.lastLoginAt).toLocaleDateString() : 'Desconocido'}
        />
      </View>

      {/* Zona de Peligro */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.error }]}>Zona de Peligro</Text>
        
        <SettingItem
          icon="heart-dislike"
          title="Limpiar Favoritos"
          subtitle={`Eliminar ${favoritesState.favorites.length} favoritos`}
          onPress={() => {
            Alert.alert(
              'Limpiar Favoritos',
              '¿Estás seguro de que quieres eliminar todos tus favoritos?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: clearFavorites },
              ]
            );
          }}
          danger
        />
        
        <SettingItem
          icon="nuclear"
          title="Limpiar Todos los Datos"
          subtitle="Restablecer la aplicación por completo"
          onPress={handleClearAllData}
          danger
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 8,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  statsContainer: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
});