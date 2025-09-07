import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useConnectionStatus } from '../hooks/useNetInfo';

export function OfflineIndicator() {
  const { isOffline } = useConnectionStatus();
  const { theme } = useTheme();

  if (!isOffline) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.error }]}>
      <Ionicons name="cloud-offline" size={16} color="white" />
      <Text style={styles.text}>Sin conexión a internet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});