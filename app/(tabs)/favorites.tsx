import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { CharacterCard } from '../../components/CharacterCard';
import { useFavorites } from '../../context/FavoritesContext';
import { useTheme } from '../../context/ThemeContext';
import { Character } from '../../context/types';
import { TelemetryEvents } from '../../services/telemetry';

export default function FavoritesScreen() {
  const { theme } = useTheme();
  const { state, clearFavorites } = useFavorites();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'dateAdded' | 'status'>('name');

  // Filtrar y ordenar favoritos
  const getFilteredAndSortedFavorites = (): Character[] => {
    let filtered = state.favorites;

    // Aplicar búsqueda
    if (searchQuery.trim()) {
      filtered = filtered.filter(char => 
        char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        char.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
        char.status.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Aplicar ordenamiento
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'dateAdded':
          // Ordenar por fecha de creación como proxy para fecha de agregado
          return new Date(b.created).getTime() - new Date(a.created).getTime();
        default:
          return 0;
      }
    });

    return sorted;
  };

  const filteredFavorites = getFilteredAndSortedFavorites();

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchQuery('');
  };

  // Confirmar limpieza de favoritos
  const handleClearFavorites = () => {
    if (state.favorites.length === 0) return;

    Alert.alert(
      'Limpiar Favoritos',
      '¿Estás seguro de que quieres eliminar todos tus personajes favoritos? Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            clearFavorites();
            TelemetryEvents.FILTER_APPLIED('clear_favorites', 'all');
          },
        },
      ]
    );
  };

  // Cambiar ordenamiento
  const toggleSort = () => {
    const sortOptions: Array<typeof sortBy> = ['name', 'status', 'dateAdded'];
    const currentIndex = sortOptions.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    setSortBy(sortOptions[nextIndex]);
    TelemetryEvents.FILTER_APPLIED('sort_favorites', sortOptions[nextIndex]);
  };

  // Obtener texto de ordenamiento
  const getSortText = () => {
    switch (sortBy) {
      case 'name':
        return 'Nombre A-Z';
      case 'status':
        return 'Estado';
      case 'dateAdded':
        return 'Recientes';
      default:
        return 'Nombre A-Z';
    }
  };

  // Renderizar item de la lista
  const renderCharacter = ({ item }: { item: Character }) => (
    <CharacterCard character={item} />
  );

  // Renderizar componente vacío
  const renderEmpty = () => {
    if (state.isLoading) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Cargando favoritos...
          </Text>
        </View>
      );
    }

    if (searchQuery.trim() && filteredFavorites.length === 0 && state.favorites.length > 0) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="search" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Sin resultados
          </Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No se encontraron favoritos que coincidan con "{searchQuery}"
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={clearSearch}
          >
            <Text style={styles.actionButtonText}>Limpiar búsqueda</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Ionicons name="heart-outline" size={64} color={theme.textSecondary} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          Sin favoritos aún
        </Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          Explora personajes y toca el corazón para agregarlos a tus favoritos
        </Text>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={() => {
            // Navegar a la pantalla de personajes
            // router.push('/characters');
          }}
        >
          <Text style={styles.actionButtonText}>Explorar Personajes</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Obtener estadísticas de favoritos
  const getStats = () => {
    const alive = state.favorites.filter(char => char.status === 'Alive').length;
    const dead = state.favorites.filter(char => char.status === 'Dead').length;
    const unknown = state.favorites.filter(char => char.status === 'unknown').length;
    
    return { alive, dead, unknown };
  };

  const stats = getStats();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header con estadísticas */}
      {state.favorites.length > 0 && (
        <View style={[styles.statsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {state.favorites.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Total
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.success }]}>
                {stats.alive}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Vivos
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.error }]}>
                {stats.dead}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Muertos
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.warning }]}>
                {stats.unknown}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Desconocidos
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Controles de búsqueda y ordenamiento */}
      {state.favorites.length > 0 && (
        <View style={styles.controlsContainer}>
          {/* Barra de búsqueda */}
          <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="search" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Buscar en favoritos..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Controles de ordenamiento y acciones */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.sortButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={toggleSort}
            >
              <Ionicons name="swap-vertical" size={16} color={theme.primary} />
              <Text style={[styles.sortText, { color: theme.primary }]}>
                {getSortText()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.clearButton, { borderColor: theme.error }]}
              onPress={handleClearFavorites}
            >
              <Ionicons name="trash" size={16} color={theme.error} />
              <Text style={[styles.clearText, { color: theme.error }]}>
                Limpiar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Lista de favoritos */}
      <FlatList
        data={filteredFavorites}
        renderItem={renderCharacter}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={filteredFavorites.length === 0 ? styles.emptyContainer : styles.listContainer}
      />

      {/* Información adicional */}
      {state.favorites.length > 0 && filteredFavorites.length > 0 && (
        <View style={[styles.infoContainer, { backgroundColor: theme.surface }]}>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Mostrando {filteredFavorites.length} de {state.favorites.length} favoritos
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  controlsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 16,
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
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
  },
});