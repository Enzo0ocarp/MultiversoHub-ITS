import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function AuthLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{
          title: 'Iniciar Sesión',
        }}
      />
      <Stack.Screen 
        name="register" 
        options={{
          title: 'Registrarse',
        }}
      />
      <Stack.Screen 
        name="forgot-password" 
        options={{
          title: 'Recuperar Contraseña',
        }}
      />
    </Stack>
  );
}