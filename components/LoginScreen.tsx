// components/LoginScreen.tsx - Pantalla de login integrada con exportación correcta
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export function LoginScreen() {
  const { theme } = useTheme();
  const { signIn, signUp, resetPassword, isLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    const { email, password, displayName, confirmPassword } = formData;

    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu email');
      return;
    }

    try {
      if (mode === 'forgot') {
        await resetPassword(email.trim());
        Alert.alert('Éxito', 'Email de recuperación enviado');
        setMode('login');
      } else if (mode === 'register') {
        if (!displayName.trim() || !password || !confirmPassword) {
          Alert.alert('Error', 'Por favor completa todos los campos');
          return;
        }
        if (password !== confirmPassword) {
          Alert.alert('Error', 'Las contraseñas no coinciden');
          return;
        }
        if (password.length < 6) {
          Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
          return;
        }
        await signUp(email.trim(), password, displayName.trim());
      } else {
        if (!password) {
          Alert.alert('Error', 'Por favor ingresa tu contraseña');
          return;
        }
        await signIn(email.trim(), password);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getTitle = () => {
    switch (mode) {
      case 'register': return 'Crear Cuenta';
      case 'forgot': return 'Recuperar Contraseña';
      default: return 'Iniciar Sesión';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'register': return 'Únete a MultiversoHub';
      case 'forgot': return 'Te enviaremos un enlace de recuperación';
      default: return 'Bienvenido de vuelta';
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logo, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="planet" size={32} color={theme.primary} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>{getTitle()}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{getSubtitle()}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Display Name - Solo en registro */}
          {mode === 'register' && (
            <View style={[styles.inputContainer, { borderColor: theme.border }]}>
              <Ionicons name="person" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Nombre completo"
                placeholderTextColor={theme.textSecondary}
                value={formData.displayName}
                onChangeText={(value) => updateField('displayName', value)}
                autoCapitalize="words"
              />
            </View>
          )}

          {/* Email */}
          <View style={[styles.inputContainer, { borderColor: theme.border }]}>
            <Ionicons name="mail" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Email"
              placeholderTextColor={theme.textSecondary}
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password - No en modo forgot */}
          {mode !== 'forgot' && (
            <View style={[styles.inputContainer, { borderColor: theme.border }]}>
              <Ionicons name="lock-closed" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Contraseña"
                placeholderTextColor={theme.textSecondary}
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons 
                  name={showPassword ? "eye" : "eye-off"} 
                  size={20} 
                  color={theme.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Confirm Password - Solo en registro */}
          {mode === 'register' && (
            <View style={[styles.inputContainer, { borderColor: theme.border }]}>
              <Ionicons name="lock-closed" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Confirmar contraseña"
                placeholderTextColor={theme.textSecondary}
                value={formData.confirmPassword}
                onChangeText={(value) => updateField('confirmPassword', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.primary }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>{getTitle()}</Text>
            )}
          </TouchableOpacity>

          {/* Action Links */}
          <View style={styles.links}>
            {mode === 'login' && (
              <>
                <TouchableOpacity onPress={() => setMode('forgot')}>
                  <Text style={[styles.linkText, { color: theme.primary }]}>
                    ¿Olvidaste tu contraseña?
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMode('register')}>
                  <Text style={[styles.linkText, { color: theme.primary }]}>
                    ¿No tienes cuenta? Regístrate
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {mode === 'register' && (
              <TouchableOpacity onPress={() => setMode('login')}>
                <Text style={[styles.linkText, { color: theme.primary }]}>
                  ¿Ya tienes cuenta? Inicia sesión
                </Text>
              </TouchableOpacity>
            )}

            {mode === 'forgot' && (
              <TouchableOpacity onPress={() => setMode('login')}>
                <Text style={[styles.linkText, { color: theme.primary }]}>
                  Volver al login
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// Exportación por defecto también
export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 4,
  },
  submitButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  links: {
    alignItems: 'center',
    gap: 12,
  },
  linkText: {
    fontSize: 14,
    textAlign: 'center',
  },
});