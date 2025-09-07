import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  isWifiEnabled?: boolean;
}

export function useNetInfo() {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true, // Asumir conexión inicial
    isInternetReachable: null,
    type: null,
    isWifiEnabled: undefined,
  });

  useEffect(() => {
    // Obtener estado inicial
    NetInfo.fetch().then(state => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isWifiEnabled: state.isWifiEnabled,
      });
    });

    // Suscribirse a cambios de estado de red
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isWifiEnabled: state.isWifiEnabled,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return networkState;
}

export function useConnectionStatus() {
  const { isConnected, isInternetReachable } = useNetInfo();
  
  // Considerar conectado si hay conexión Y internet es alcanzable
  // Si isInternetReachable es null (desconocido), asumir que hay internet si hay conexión
  const hasInternet = isConnected && (isInternetReachable !== false);
  
  return {
    isOnline: hasInternet,
    isOffline: !hasInternet,
    isConnected,
    isInternetReachable,
  };
}