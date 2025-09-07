import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { CharacterStatus } from '../context/types';
import { TelemetryEvents } from '../services/telemetry';

interface FilterButtonsProps {
  activeFilter: CharacterStatus;
  onFilterChange: (filter: CharacterStatus) => void;
}

const filterOptions: { key: CharacterStatus; label: string; emoji: string }[] = [
  { key: 'all', label: 'Todos', emoji: '👥' },
  { key: 'alive', label: 'Vivos', emoji: '💚' },
  { key: 'dead', label: 'Muertos', emoji: '💀' },
  { key: 'unknown', label: 'Desconocidos', emoji: '❓' },
];

export function FilterButtons({ activeFilter, onFilterChange }: FilterButtonsProps) {
  const { theme } = useTheme();

  const handleFilterPress = (filter: CharacterStatus) => {
    onFilterChange(filter);
    TelemetryEvents.FILTER_APPLIED('status', filter);
  };

  return (
    <View style={styles.container}>
      {filterOptions.map((option) => {
        const isActive = activeFilter === option.key;
        
        return (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterButton,
              {
                backgroundColor: isActive ? theme.primary : theme.surface,
                borderColor: theme.border,
              },
            ]}
            onPress={() => handleFilterPress(option.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{option.emoji}</Text>
            <Text
              style={[
                styles.filterText,
                {
                  color: isActive ? 'white' : theme.text,
                  fontWeight: isActive ? '600' : 'normal',
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  emoji: {
    fontSize: 16,
  },
  filterText: {
    fontSize: 14,
  },
});