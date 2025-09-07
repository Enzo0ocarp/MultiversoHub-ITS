import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { CharacterCard } from '../../components/CharacterCard';
import { FilterButtons } from '../../components/FilterButtons';
import { useTheme } from '../../context/ThemeContext';
import { Character, CharacterStatus } from '../../context/types';
import { useConnectionStatus } from '../../hooks/useNetInfo';
import { api } from '../../services/api';
import { loadFromCache, saveToCache } from '../../services/storage';
import { TelemetryEvents } from '../../services/telemetry';

export default function CharactersScreen() {
  const { theme } = useTheme();
  const { isOnline } = useConnectionStatus();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [filteredCharacters, setFilteredCharacters] = useState<Character[]>([]);
  const [currentFilter, setCurrentFilter] = useState<CharacterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  // Cargar personajes
  const loadCharacters = async (page: number = 1, filter: CharacterStatus = 'all', reset: boolean = true) => {
    if (!isOnline && page === 1) {
      // Intentar cargar desde cache si estamos offline
      try {
        const cachedCharacters = await loadFromCache<Character[]>('characters');
        if (cachedCharacters) {
          setCharacters(cachedCharacters);
          applyFilters(cachedCharacters, filter, searchQuery);
          return;
        }
      } catch (error) {
        console.error('Error loading from cache:', error);
      }
      setError('Sin conexión y sin datos en cache');
      return;
    }

    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    setError(null);

    try {
      const response = await api.getCharactersByStatus(filter, page);
      const newCharacters = response.results;

      if (reset || page === 1) {
        setCharacters(newCharacters);
        setCurrentPage(1);
        // Guardar en cache
        await saveToCache('characters', newCharacters);
      } else {
        setCharacters(prev => [...prev, ...newCharacters]);
      }

      setHasNextPage(!!response.info.next);
      setCurrentPage(page);
      
      // Aplicar filtros después de cargar
      const allChars = reset || page === 1 ? newCharacters : [...characters, ...newCharacters];
      applyFilters(allChars, filter, searchQuery);
      
    } catch (error) {
      console.error('Error loading characters:', error);
      setError('Error al cargar personajes');
      
      // Si es la primera página y hay error, intentar cargar desde cache
      if (page === 1) {
        try {
          const cachedCharacters = await loadFromCache<Character[]>('characters');
          if (cachedCharacters) {
            setCharacters(cachedCharacters);
            applyFilters(cachedCharacters, filter, searchQuery);
            setError('Mostrando datos guardados (sin conexión)');
          }
        } catch (cacheError) {
          console.error('Error loading from cache:', cacheError);
        }
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Aplicar filtros y búsqueda
  const applyFilters = (chars: Character[], filter: CharacterStatus, search: string) => {
    let filtered = chars;

    // Aplicar filtro de estado (si no es 'all')
    if (filter !== 'all') {
      filtered = filtered.filter(char => char.status.toLowerCase() === filter);
    }

    // Aplicar búsqueda por nombre
    if (search.trim()) {
      filtered = filtered.filter(char => 
        char.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredCharacters(filtered);
  };

  // Cambiar filtro
  const handleFilterChange = (filter: CharacterStatus) => {
    setCurrentFilter(filter);
    setCurrentPage(1);
    setHasNextPage(true);
    loadCharacters(1, filter, true);
  };

  // Cambiar búsqueda
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    applyFilters(characters, currentFilter, query);
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchQuery('');
    applyFilters(characters, currentFilter, '');
  };

  // Cargar más personajes
  const loadMore = () => {
    if (!isLoadingMore && hasNextPage && isOnline) {
      loadCharacters(currentPage + 1, currentFilter, false);
    }
  };

  // Refresh
  const onRefresh = () => {
    setCurrentPage(1);
    setHasNextPage(true);
    loadCharacters(1, currentFilter, true);
  };

  // Efecto inicial
  useEffect(() => {
    loadCharacters();
    TelemetryEvents.FILTER_APPLIED('initial_load', 'all');
  }, []);

  // Renderizar item de la lista
  const renderCharacter = ({ item }: { item: Character }) => (
    <CharacterCard character={item} />
  );

  // Renderizar footer de carga
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Cargando más personajes...
        </Text>
      </View>
    );
  };

  // Renderizar componente vacío
  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Cargando personajes...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={onRefresh}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Ionicons name="search" size={48} color={theme.textSecondary} />
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          {searchQuery ? 'No se encontraron personajes' : 'No hay personajes disponibles'}
        </Text>
        {searchQuery && (
          <TouchableOpacity
            style={[styles.clearButton, { backgroundColor: theme.primary }]}
            onPress={clearSearch}
          >
            <Text style={styles.clearButtonText}>Limpiar búsqueda</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Barra de búsqueda */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="search" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Buscar personajes..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={handleSearchChange}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros */}
      <FilterButtons
        activeFilter={currentFilter}
        onFilterChange={handleFilterChange}
      />

      {/* Lista de personajes */}
      <FlatList
        data={filteredCharacters}
        renderItem={renderCharacter}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={filteredCharacters.length === 0 ? styles.emptyContainer : undefined}
      />

      {/* Indicador de estado de conexión */}
      {!isOnline && (
        <View style={[styles.offlineIndicator, { backgroundColor: theme.warning }]}>
          <Ionicons name="cloud-offline" size={16} color="white" />
          <Text style={styles.offlineText}>Modo offline</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
  errorText: {
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
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
  clearButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
  offlineIndicator: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  offlineText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});