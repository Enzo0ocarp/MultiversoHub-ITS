import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFavorites } from '../context/FavoritesContext';
import { useTheme } from '../context/ThemeContext';
import { Character } from '../context/types';

interface CharacterCardProps {
  character: Character;
}

export function CharacterCard({ character }: CharacterCardProps) {
  const { theme } = useTheme();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  
  const isCharacterFavorite = isFavorite(character.id);

  const handleFavoritePress = () => {
    if (isCharacterFavorite) {
      removeFavorite(character.id);
    } else {
      addFavorite(character);
    }
  };

  const handleCardPress = () => {
    router.push(`/character/${character.id}`);
  };

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

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={handleCardPress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: character.image }}
        style={styles.image}
        resizeMode="cover"
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {character.name}
          </Text>
          
          <TouchableOpacity
            onPress={handleFavoritePress}
            style={styles.favoriteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isCharacterFavorite ? "heart" : "heart-outline"}
              size={20}
              color={isCharacterFavorite ? theme.error : theme.textSecondary}
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(character.status) }]} />
          <Text style={[styles.statusText, { color: theme.textSecondary }]}>
            {character.status} - {character.species}
          </Text>
        </View>
        
        <Text style={[styles.location, { color: theme.textSecondary }]} numberOfLines={1}>
          📍 {character.location.name}
        </Text>
        
        <Text style={[styles.episodes, { color: theme.textSecondary }]}>
          {character.episode.length} episodios
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    margin: 8,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
  },
  location: {
    fontSize: 12,
    marginTop: 2,
  },
  episodes: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
});