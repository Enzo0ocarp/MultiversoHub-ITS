import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFavorites } from '../../context/FavoritesContext';
import { useTheme } from '../../context/ThemeContext';
import { useConnectionStatus } from '../../hooks/useNetInfo';
import { api } from '../../services/api';
import { getTelemetryStats } from '../../services/telemetry';

interface HomeStats {
  totalCharacters: number;
  favoritesCount: number;
  aliveCharacters: number;
  deadCharacters: number;
  unknownCharacters: number;
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const { state: favoritesState } = useFavorites();
  const { isOnline } = useConnectionStatus();
  const [stats, setStats] = useState<HomeStats>({
    totalCharacters: 0,
    favoritesCount: 0,
    aliveCharacters: 0,
    deadCharacters: 0,
    unknownCharacters: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [telemetryStats, setTelemetryStats] = useState(getTelemetryStats());

  const loadStats = async () => {
    setIsLoading(true);
    try {
      if (isOnline) {
        // Cargar estadísticas básicas de la API
        const response = await api.getCharacters(1);
        setStats(prev => ({
          ...prev,
          totalCharacters: response.info.count,
        }));

        // Cargar estadísticas por estado (solo primera página para demo)
        const [aliveRes, deadRes, unknownRes] = await Promise.allSettled([
          api.getCharactersByStatus('alive', 1),
          api.getCharactersByStatus('dead', 1),
          api.getCharactersByStatus('unknown', 1),
        ]);

        setStats(prev => ({
          ...prev,
          aliveCharacters: aliveRes.status === 'fulfilled' ? aliveRes.value.info.count : 0,
          deadCharacters: deadRes.status === 'fulfilled' ? deadRes.value.info.count : 0,
          unknownCharacters: unknownRes.status === 'fulfilled' ? unknownRes.value.info.count : 0,
        }));
      }

      // Actualizar contador de favoritos
      setStats(prev => ({
        ...prev,
        favoritesCount: favoritesState.favorites.length,
      }));

      // Actualizar estadísticas de telemetría
      setTelemetryStats(getTelemetryStats());
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [isOnline, favoritesState.favorites.length]);

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color, 
    onPress 
  }: { 
    title: string; 
    value: number | string; 
    icon: string; 
    color: string; 
    onPress?: () => void; 
  }) => (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{title}</Text>
    </TouchableOpacity>
  );

  const QuickActionCard = ({ 
    title, 
    description, 
    icon, 
    color, 
    onPress 
  }: { 
    title: string; 
    description: string; 
    icon: string; 
    color: string; 
    onPress: () => void; 
  }) => (
    <TouchableOpacity
      style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.actionContent}>
        <Text style={[styles.actionTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.actionDescription, { color: theme.textSecondary }]}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={loadStats}
          tintColor={theme.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>MultiversoHub</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Explora el universo de Rick & Morty
        </Text>
        
        {!isOnline && (
          <View style={[styles.offlineNotice, { backgroundColor: theme.warning + '20', borderColor: theme.warning }]}>
            <Ionicons name="cloud-offline" size={16} color={theme.warning} />
            <Text style={[styles.offlineText, { color: theme.warning }]}>
              Modo offline - Datos limitados
            </Text>
          </View>
        )}
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Total Personajes"
          value={stats.totalCharacters || '?'}
          icon="people"
          color={theme.primary}
          onPress={() => router.push('/characters')}
        />
        <StatCard
          title="Favoritos"
          value={stats.favoritesCount}
          icon="heart"
          color={theme.error}
          onPress={() => router.push('/favorites')}
        />
        <StatCard
          title="Vivos"
          value={stats.aliveCharacters || '?'}
          icon="checkmark-circle"
          color={theme.success}
        />
        <StatCard
          title="Muertos"
          value={stats.deadCharacters || '?'}
          icon="close-circle"
          color={theme.error}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Acciones Rápidas</Text>
        
        <QuickActionCard
          title="Ver Personajes Vivos"
          description="Explora todos los personajes que siguen vivos"
          icon="pulse"
          color={theme.success}
          onPress={() => {
            router.push('/characters');
            // Aquí podrías pasar parámetros para filtrar
          }}
        />
        
        <QuickActionCard
          title="Personajes Desconocidos"
          description="Descubre personajes con estado misterioso"
          icon="help-circle"
          color={theme.warning}
          onPress={() => {
            router.push('/characters');
          }}
        />
        
        <QuickActionCard
          title="Mis Favoritos"
          description={`Tienes ${stats.favoritesCount} personajes favoritos`}
          icon="heart"
          color={theme.error}
          onPress={() => router.push('/favorites')}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Actividad</Text>
        
        <View style={[styles.activityCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.activityTitle, { color: theme.text }]}>Estadísticas de Uso</Text>
          <View style={styles.activityStats}>
            <View style={styles.activityStat}>
              <Text style={[styles.activityValue, { color: theme.primary }]}>
                {telemetryStats.totalEvents}
              </Text>
              <Text style={[styles.activityLabel, { color: theme.textSecondary }]}>
                Eventos totales
              </Text>
            </View>
            <View style={styles.activityStat}>
              <Text style={[styles.activityValue, { color: theme.success }]}>
                {telemetryStats.eventsByType.character_viewed || 0}
              </Text>
              <Text style={[styles.activityLabel, { color: theme.textSecondary }]}>
                Personajes vistos
              </Text>
            </View>
            <View style={styles.activityStat}>
              <Text style={[styles.activityValue, { color: theme.error }]}>
                {telemetryStats.eventsByType.favorite_added || 0}
              </Text>
              <Text style={[styles.activityLabel, { color: theme.textSecondary }]}>
                Favoritos añadidos
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  offlineText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
  },
  activityCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  activityStat: {
    alignItems: 'center',
  },
  activityValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  activityLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});