import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useFavorites } from '../../context/FavoritesContext';
import { useTheme } from '../../context/ThemeContext';
import { Character, Episode } from '../../context/types';
import { useConnectionStatus } from '../../hooks/useNetInfo';
import { api } from '../../services/api';
import { loadFromCache, saveToCache } from '../../services/storage';
import { TelemetryEvents } from '../../services/telemetry';

const { width } = Dimensions.get('window');

export default function CharacterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { isOnline } = useConnectionStatus();
  
  const [character, setCharacter] = useState<Character | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const characterId = parseInt(id || '0');
  const isCharacterFavorite = character ? isFavorite(character.id) : false;

  // Cargar datos del personaje
  const loadCharacterData = async () => {
    if (!characterId) {
      setError('ID de personaje inválido');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let characterData: Character;

      if (isOnline) {
        // Cargar desde API
        characterData = await api.getCharacter(characterId);
        // Guardar en cache
        await saveToCache(`character_${characterId}`, characterData);
      } else {
        // Intentar cargar desde cache
        const cachedCharacter = await loadFromCache<Character>(`character_${characterId}`);
        if (!cachedCharacter) {
          throw new Error('Personaje no disponible offline');
        }
        characterData = cachedCharacter;
      }

      setCharacter(characterData);
      
      // Registrar telemetría
      TelemetryEvents.CHARACTER_VIEWED(characterData.id, characterData.name);

      // Cargar episodios si hay conexión
      if (isOnline && characterData.episode.length > 0) {
        loadEpisodes(characterData.episode);
      } else if (!isOnline) {
        // Intentar cargar episodios desde cache
        const cachedEpisodes = await loadFromCache<Episode[]>(`episodes_${characterId}`);
        if (cachedEpisodes) {
          setEpisodes(cachedEpisodes);
        }
      }

    } catch (error) {
      console.error('Error loading character:', error);
      setError('Error al cargar el personaje');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar episodios
  const loadEpisodes = async (episodeUrls: string[]) => {
    setIsLoadingEpisodes(true);
    try {
      const episodeData = await api.getEpisodesFromUrls(episodeUrls.slice(0, 10)); // Limitar a 10 episodios
      setEpisodes(episodeData);
      
      // Guardar en cache
      await saveToCache(`episodes_${characterId}`, episodeData);
    } catch (error) {
      console.error('Error loading episodes:', error);
    } finally {
      setIsLoadingEpisodes(false);
    }
  };

  // Manejar favorito
  const handleFavoriteToggle = () => {
    if (!character) return;

    if (isCharacterFavorite) {
      removeFavorite(character.id);
    } else {
      addFavorite(character);
    }
  };

  // Obtener color según estado
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'alive':
        return theme.success;
      case 'dead':
        return theme.error;
      default:
        return theme.warning;
    }
  };

  // Obtener icono según género
  const getGenderIcon = (gender: string) => {
    switch (gender.toLowerCase()) {
      case 'male':
        return 'male';
      case 'female':
        return 'female';
      default:
        return 'help';
    }
  };

  useEffect(() => {
    loadCharacterData();
  }, [characterId, isOnline]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Cargando personaje...
        </Text>
      </View>
    );
  }

  if (error || !character) {
    return (
      <View style={[styles.container, styles.centerContainer, { backgroundColor: theme.background }]}>
        <Ionicons name="alert-circle" size={64} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.error }]}>
          {error || 'Personaje no encontrado'}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={loadCharacterData}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Imagen y botón de favorito */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: character.image }}
          style={styles.characterImage}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={[styles.favoriteButton, { backgroundColor: theme.surface }]}
          onPress={handleFavoriteToggle}
        >
          <Ionicons
            name={isCharacterFavorite ? "heart" : "heart-outline"}
            size={24}
            color={isCharacterFavorite ? theme.error : theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Información básica */}
      <View style={[styles.infoContainer, { backgroundColor: theme.surface }]}>
        <Text style={[styles.characterName, { color: theme.text }]}>
          {character.name}
        </Text>

        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(character.status) }]} />
          <Text style={[styles.statusText, { color: theme.text }]}>
            {character.status} - {character.species}
          </Text>
        </View>

        {/* Detalles del personaje */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Ionicons name={getGenderIcon(character.gender) as any} size={20} color={theme.primary} />
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Género</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>{character.gender}</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="location" size={20} color={theme.primary} />
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Origen</Text>
              <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={2}>
                {character.origin.name}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="pin" size={20} color={theme.primary} />
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Ubicación</Text>
              <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={2}>
                {character.location.name}
              </Text>
            </View>
          </View>

          {character.type && (
            <View style={styles.detailItem}>
              <Ionicons name="information-circle" size={20} color={theme.primary} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Tipo</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{character.type}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Episodios */}
      <View style={[styles.episodesContainer, { backgroundColor: theme.surface }]}>
        <View style={styles.episodesHeader}>
          <Text style={[styles.episodesTitle, { color: theme.text }]}>
            Episodios ({character.episode.length})
          </Text>
          {isLoadingEpisodes && (
            <ActivityIndicator size="small" color={theme.primary} />
          )}
        </View>

        {episodes.length > 0 ? (
          <View style={styles.episodesList}>
            {episodes.map((episode, index) => (
              <View
                key={episode.id}
                style={[
                  styles.episodeItem,
                  { borderColor: theme.border },
                  index === episodes.length - 1 && styles.lastEpisodeItem
                ]}
              >
                <View style={styles.episodeInfo}>
                  <Text style={[styles.episodeNumber, { color: theme.primary }]}>
                    {episode.episode}
                  </Text>
                  <Text style={[styles.episodeName, { color: theme.text }]} numberOfLines={2}>
                    {episode.name}
                  </Text>
                  <Text style={[styles.episodeDate, { color: theme.textSecondary }]}>
                    {episode.air_date}
                  </Text>
                </View>
              </View>
            ))}
            
            {character.episode.length > episodes.length && (
              <View style={styles.moreEpisodesContainer}>
                <Text style={[styles.moreEpisodesText, { color: theme.textSecondary }]}>
                  +{character.episode.length - episodes.length} episodios más
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noEpisodesContainer}>
            {!isOnline ? (
              <Text style={[styles.noEpisodesText, { color: theme.textSecondary }]}>
                Episodios no disponibles offline
              </Text>
            ) : (
              <Text style={[styles.noEpisodesText, { color: theme.textSecondary }]}>
                {isLoadingEpisodes ? 'Cargando episodios...' : 'No hay episodios disponibles'}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Estado de conexión */}
      {!isOnline && (
        <View style={[styles.offlineNotice, { backgroundColor: theme.warning + '20', borderColor: theme.warning }]}>
          <Ionicons name="cloud-offline" size={16} color={theme.warning} />
          <Text style={[styles.offlineText, { color: theme.warning }]}>
            Información limitada en modo offline
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    paddingTop: 20,
  },
  characterImage: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  favoriteButton: {
    position: 'absolute',
    top: 30,
    right: 30,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  infoContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  characterName: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
  },
  episodesContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  episodesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  episodesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  episodesList: {
    gap: 0,
  },
  episodeItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  lastEpisodeItem: {
    borderBottomWidth: 0,
  },
  episodeInfo: {
    gap: 4,
  },
  episodeNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  episodeName: {
    fontSize: 16,
    fontWeight: '500',
  },
  episodeDate: {
    fontSize: 14,
  },
  moreEpisodesContainer: {
    paddingTop: 12,
    alignItems: 'center',
  },
  moreEpisodesText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  noEpisodesContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noEpisodesText: {
    fontSize: 16,
    textAlign: 'center',
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  offlineText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});