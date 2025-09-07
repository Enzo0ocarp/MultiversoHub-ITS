# 📋 Guía de Instalación - MultiversoHub

Esta guía te llevará paso a paso para configurar y ejecutar la aplicación MultiversoHub en tu entorno de desarrollo.

## 🏗️ Prerrequisitos

### Sistema Operativo
- **Windows 10/11**, **macOS 10.15+**, o **Linux Ubuntu 18.04+**

### Software Requerido

1. **Node.js** (v18.0.0 o superior)
   ```bash
   # Verificar versión
   node --version
   npm --version
   ```

2. **Git**
   ```bash
   # Verificar instalación
   git --version
   ```

3. **Expo CLI**
   ```bash
   npm install -g @expo/cli
   ```

4. **Cuenta de Firebase** (Gratis)
   - Visita [Firebase Console](https://console.firebase.google.com)
   - Crea una cuenta si no tienes

### Para Desarrollo Móvil (Opcional)

#### Android
- **Android Studio** con SDK
- **Emulador Android** o dispositivo físico
- **Java Development Kit (JDK) 11**

#### iOS (Solo macOS)
- **Xcode 14+**
- **iOS Simulator** o dispositivo físico
- **Cuenta de desarrollador Apple**

## 🚀 Instalación Paso a Paso

### Paso 1: Crear el Proyecto Base

```bash
# 1. Crear proyecto con Expo
npx create-expo-app MultiversoHub
cd MultiversoHub

# 2. Verificar que funciona
npm start
```

### Paso 2: Instalar Dependencias

```bash
# Router y navegación
npx expo install expo-router react-native-screens react-native-safe-area-context

# Almacenamiento y estado
npm install @react-native-async-storage/async-storage

# Detectar conexión de red
npm install @react-native-community/netinfo

# Firebase para sincronización
npm install firebase

# Constantes y UI del sistema
npx expo install expo-constants expo-system-ui

# Iconos vectoriales
npm install react-native-vector-icons
```

### Paso 3: Configurar Firebase

#### 3.1 Crear Proyecto en Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Clic en "Crear proyecto"
3. Nombra tu proyecto: `multiversohub-[tu-nombre]`
4. Continúa con la configuración por defecto

#### 3.2 Configurar Firestore
1. En el panel izquierdo, ve a "Firestore Database"
2. Clic en "Crear base de datos"
3. Selecciona "Comenzar en modo de prueba"
4. Elige una ubicación cercana

#### 3.3 Obtener Credenciales
1. Ve a "Configuración del proyecto" (⚙️)
2. En la pestaña "General", baja hasta "Tus apps"
3. Clic en "Agregar app" → Selecciona "Web" (</> )
4. Registra la app con nombre "MultiversoHub"
5. **Copia las credenciales** que aparecen

### Paso 4: Estructura del Proyecto

Crea la siguiente estructura de carpetas:

```bash
mkdir -p app/\(tabs\) app/character components context services hooks constants
```

### Paso 5: Copiar Archivos del Código

Copia todos los archivos proporcionados en los artifacts manteniendo la estructura:

```
MultiversoHub/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── characters.tsx
│   │   ├── favorites.tsx
│   │   └── profile.tsx
│   ├── character/
│   │   └── [id].tsx
│   └── _layout.tsx
├── components/
├── context/
├── services/
├── hooks/
└── constants/
```

### Paso 6: Configurar Firebase en el Código

Edita `services/firebase.ts` y reemplaza las credenciales:

```typescript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxxxxxxxxxx"
};
```

### Paso 7: Actualizar Configuración

#### 7.1 Actualizar `app.json`
```json
{
  "expo": {
    "name": "MultiversoHub",
    "slug": "multiversohub-rick-morty",
    "version": "1.0.0",
    "scheme": "multiversohub",
    "plugins": ["expo-router"],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

#### 7.2 Crear `metro.config.js`
```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
```

### Paso 8: Ejecutar la Aplicación

```bash
# Limpiar cache si es necesario
npx expo start --clear

# Iniciar en modo desarrollo
npx expo start
```

## 📱 Opciones de Ejecución

### Expo Go (Recomendado para empezar)
1. Instala **Expo Go** desde App Store/Google Play
2. Escanea el QR code que aparece en terminal
3. La app se cargará en tu dispositivo

### Emulador Android
```bash
# Iniciar con Android
npx expo start --android
```

### Simulador iOS (Solo macOS)
```bash
# Iniciar con iOS
npx expo start --ios
```

### Navegador Web
```bash
# Iniciar en web
npx expo start --web
```

## 🔧 Verificación de Instalación

### Checklist de Funcionalidades

Ejecuta la app y verifica que funcione:

- [ ] ✅ La app inicia sin errores
- [ ] ✅ Las tabs de navegación funcionan
- [ ] ✅ Se cargan los personajes desde la API
- [ ] ✅ Los filtros funcionan correctamente
- [ ] ✅ Se pueden agregar/quitar favoritos
- [ ] ✅ La pantalla de detalle muestra información
- [ ] ✅ El tema claro/oscuro cambia
- [ ] ✅ Funciona sin internet (modo offline)

### Logs Esperados
En la consola deberías ver:
```
📊 [TELEMETRY] app_launched: { timestamp: ... }
Firebase initialized with device ID: device_...
Loaded 0 telemetry events
```

## 🚨 Solución de Problemas

### Error: "Module not found"
```bash
# Limpiar cache
npx expo start --clear

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Error: Firebase
```bash
# Verificar credenciales en firebase.ts
# Asegurar que Firestore esté habilitado
# Verificar reglas de seguridad de Firestore
```

### Error: NetInfo
```bash
# Reinstalar dependencia
npm uninstall @react-native-community/netinfo
npm install @react-native-community/netinfo
npx expo start --clear
```

### Error: Expo Router
```bash
# Verificar que app.json tenga la configuración correcta
# Asegurar que _layout.tsx existe en app/
```

### Performance Lenta
```bash
# Activar modo desarrollo optimizado
npx expo start --dev-client
```

## 🔧 Configuración Avanzada

### Variables de Entorno
Crea `.env` en la raíz:
```
EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
```

### Configuración de TypeScript
Crea `tsconfig.json`:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./app/*"],
      "@/components/*": ["./components/*"],
      "@/services/*": ["./services/*"]
    }
  }
}
```

### ESLint y Prettier
```bash
npm install --save-dev eslint @typescript-eslint/eslint-plugin prettier
```

## 📚 Recursos Adicionales

### Documentación
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Native](https://reactnative.dev/docs/getting-started)
- [Firebase Web](https://firebase.google.com/docs/web/setup)
- [Rick and Morty API](https://rickandmortyapi.com/documentation)

### Herramientas Útiles
- [Expo DevTools](https://docs.expo.dev/debugging/tools/)
- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- [Postman](https://www.postman.com/) para probar la API

## 💡 Consejos de Desarrollo

### Debugging
```bash
# Ver logs detallados
npx expo start --verbose

# Abrir DevTools
npx expo start --dev-client
```

### Hot Reload
- Los cambios en código se actualizan automáticamente
- Si no funciona, agita el dispositivo y selecciona "Reload"

### Testear en Dispositivo Real
- Mejor rendimiento que emuladores
- Funcionalidades como cámara y sensores
- Experiencia de usuario más realista

## ✅ Completado

Si llegaste hasta aquí y todo funciona, ¡felicitaciones! 🎉

Tienes una aplicación móvil completa de Rick & Morty con:
- ✅ Navegación moderna
- ✅ Consumo de API
- ✅ Sistema de favoritos
- ✅ Modo offline
- ✅ Temas personalizables
- ✅ Sincronización en la nube
- ✅ Telemetría

## 🚀 Siguientes Pasos

1. **Explora el código** para entender la arquitectura
2. **Personaliza el tema** con tus colores favoritos
3. **Agrega nuevas funcionalidades** como compartir personajes
4. **Optimiza el rendimiento** con lazy loading
5. **Publica tu app** en las tiendas

¡Wubba Lubba Dub Dub! 🛸