import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    Share,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useFavorites } from '../../context/FavoritesContext';
import { useTheme } from '../../context/ThemeContext';
import { useConnectionStatus } from '../../hooks/useNetInfo';
import { firebaseService } from '../../services/firebase';
import {
    clearAllData,
    getStorageInfo,
    loadUserPreferences,
    saveUserPreferences,
    UserPreferences
} from '../../services/storage';
import {
    clearTelemetryEvents,
    exportTelemetryEvents,
    getTelemetryStats
} from '../../services/telemetry';

export default function ProfileScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { state: favoritesState, clearFavorites } = useFavorites();
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
  const [isLoading, setIsLoading] = useState(false);

  // Cargar información inicial
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

  // Actualizar preferencia
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

  // Limpiar todos los datos
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
            setIsLoading(true);
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
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Sincronizar datos con Firebase
  const handleSyncData = async () => {
    if (!isOnline) {
      Alert.alert('Sin conexión', 'Necesitas conexión a internet para sincronizar');
      return;
    }

    setIsLoading(true);
    try {
      await firebaseService.syncData(favoritesState.favorites, userPreferences);
      Alert.alert('Éxito', 'Datos sincronizados correctamente');
    } catch (error) {
      console.error('Error syncing data:', error);
      Alert.alert('Error', 'No se pudieron sincronizar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  // Exportar datos de telemetría
  const handleExportTelemetry = async () => {
    try {
      const telemetryData = exportTelemetryEvents();
      await Share.share({
        message: 'Datos de telemetría de MultiversoHub',
        title: 'Telemetría - MultiversoHub',
        url: `data:application/json;base64,${Buffer.from(telemetryData).toString('base64')}`,
      });
    } catch (error) {
      console.error('Error exporting telemetry:', error);
      Alert.alert('Error', 'No se pudieron exportar los datos');
    }
  };

  // Limpiar telemetría
  const handleClearTelemetry = () => {
    Alert.alert(
      'Limpiar Telemetría',
      '¿Estás seguro de que quieres eliminar todos los datos de telemetría?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await clearTelemetryEvents();
            Alert.alert('Éxito', 'Datos de telemetría eliminados');
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
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <View style={[styles.avatarContainer, { backgroundColor: theme.primary + '20' }]}>
          <Ionicons name="person" size={32} color={theme.primary} />
        </View>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Mi Perfil</Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          MultiversoHub v{Constants.expoConfig?.version || '1.0.0'}
        </Text>
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

      {/* Preferencias */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferencias</Text>
        
        <SettingItem
          icon="notifications"
          title="Notificaciones"
          subtitle={userPreferences.notificationsEnabled ? 'Activadas' : 'Desactivadas'}
          rightElement={
            <Switch
              value={userPreferences.notificationsEnabled}
              onValueChange={(value) => updatePreference('notificationsEnabled', value)}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="white"
            />
          }
        />
        
        <SettingItem
          icon="save"
          title="Cache Automático"
          subtitle={userPreferences.cacheEnabled ? 'Activado' : 'Desactivado'}
          rightElement={
            <Switch
              value={userPreferences.cacheEnabled}
              onValueChange={(value) => updatePreference('cacheEnabled', value)}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="white"
            />
          }
        />
      </View>

      {/* Datos y Sincronización */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Datos</Text>
        
        {isOnline && (
          <SettingItem
            icon="cloud-upload"
            title="Sincronizar Datos"
            subtitle="Respaldar favoritos y preferencias"
            onPress={handleSyncData}
          />
        )}
        
        <SettingItem
          icon="share"
          title="Exportar Telemetría"
          subtitle={`${telemetryStats.totalEvents} eventos registrados`}
          onPress={handleExportTelemetry}
        />
        
        <SettingItem
          icon="trash"
          title="Limpiar Telemetría"
          subtitle="Eliminar datos de uso"
          onPress={handleClearTelemetry}
          danger
        />
      </View>

      {/* Información */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Información</Text>
        
        <SettingItem
          icon="information-circle"
          title="Versión de la App"
          subtitle={Constants.expoConfig?.version || '1.0.0'}
        />
        
        <SettingItem
          icon="wifi"
          title="Estado de Conexión"
          subtitle={isOnline ? 'Conectado' : 'Sin conexión'}
          rightElement={
            <Ionicons 
              name={isOnline ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={isOnline ? theme.success : theme.error} 
            />
          }
        />
        
        <SettingItem
          icon="server"
          title="Cache Local"
          subtitle={`${storageInfo.cacheKeys} elementos en cache`}
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

      {/* Estado de carga */}
      {isLoading && (
        <View style={[styles.loadingOverlay, { backgroundColor: theme.background + 'CC' }]}>
          <View style={[styles.loadingContainer, { backgroundColor: theme.surface }]}>
            <Text style={[styles.loadingText, { color: theme.text }]}>
              Procesando...
            </Text>
          </View>
        </View>
      )}
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});