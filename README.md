# 🚀 MultiversoHub - Rick & Morty App

Una aplicación móvil educativa y de entretenimiento completa basada en el universo de Rick and Morty, desarrollada con React Native, Expo y TypeScript.

## 📱 Características

### ✅ Funcionalidades Implementadas
- **Navegación moderna** con tabs y stacks usando Expo Router
- **Consumo de API** de Rick and Morty con manejo de errores
- **Sistema de favoritos** con persistencia local y en la nube
- **Modo offline** con cache inteligente y detección de conexión
- **Tema claro/oscuro** personalizable
- **Telemetría local** para análisis de uso
- **Filtros avanzados** por estado de personajes
- **Búsqueda en tiempo real** 
- **Sincronización con Firebase** para backup de datos
- **Pantalla de configuración** completa

### 🎯 Pantallas Principales
1. **Home** - Dashboard con estadísticas y accesos rápidos
2. **Personajes** - Lista paginada con filtros y búsqueda
3. **Favoritos** - Gestión de personajes favoritos con ordenamiento
4. **Detalle** - Información completa del personaje y episodios
5. **Perfil** - Configuración, estadísticas y gestión de datos

## 🛠️ Instalación y Configuración

### Prerrequisitos
```bash
# Instalar Node.js (v18 o superior)
# Instalar Expo CLI
npm install -g @expo/cli
```

### Pasos de instalación

1. **Crear el proyecto**
```bash
npx create-expo-app MultiversoHub
cd MultiversoHub
```

2. **Instalar dependencias principales**
```bash
# Router y navegación
npx expo install expo-router react-native-screens react-native-safe-area-context

# Estado y almacenamiento
npm install @react-native-async-storage/async-storage

# Conectividad
npm install @react-native-community/netinfo

# Firebase
npm install firebase

# Utilidades
npx expo install expo-constants expo-system-ui

# Iconos
npm install react-native-vector-icons
```

3. **Configurar Firebase**
```bash
# Crear proyecto en Firebase Console
# Copiar credenciales en services/firebase.ts
# Habilitar Firestore Database
```

4. **Copiar archivos del proyecto**
- Copiar toda la estructura de carpetas y archivos proporcionada
- Actualizar `app.json` con tu configuración
- Configurar Firebase con tus credenciales

5. **Ejecutar la aplicación**
```bash
# Desarrollo
npm start

# Android
npm run android

# iOS  
npm run ios

# Web
npm run web
```

## 📁 Estructura del Proyecto

```
MultiversoHub/
├── app/                          # Rutas de la aplicación
│   ├── (tabs)/                   # Navegación por tabs
│   │   ├── _layout.tsx          # Layout de tabs
│   │   ├── index.tsx            # Home
│   │   ├── characters.tsx       # Lista de personajes
│   │   ├── favorites.tsx        # Favoritos
│   │   └── profile.tsx          # Perfil
│   ├── character/               # Stack de detalles
│   │   └── [id].tsx            # Detalle del personaje
│   └── _layout.tsx             # Layout principal
├── components/                  # Componentes reutilizables
│   ├── CharacterCard.tsx       # Tarjeta de personaje
│   ├── FilterButtons.tsx       # Botones de filtro
│   └── OfflineIndicator.tsx    # Indicador offline
├── context/                    # Contextos de React
│   ├── FavoritesContext.tsx    # Estado de favoritos
│   ├── ThemeContext.tsx        # Tema de la app
│   └── types.ts               # Tipos TypeScript
├── services/                   # Servicios de la app
│   ├── api.ts                 # API de Rick and Morty
│   ├── firebase.ts           # Configuración Firebase
│   ├── storage.ts            # Almacenamiento local
│   └── telemetry.ts          # Telemetría
├── hooks/                     # Hooks personalizados
│   └── useNetInfo.ts         # Hook de conectividad
└── constants/                 # Constantes
    └── Colors.ts             # Paleta de colores
```

## 🔧 Tecnologías Utilizadas

### Frontend
- **React Native 0.73** - Framework móvil
- **Expo SDK 50** - Herramientas de desarrollo
- **TypeScript** - Tipado estático
- **Expo Router** - Navegación file-based

### Estado y Persistencia
- **Context API + useReducer** - Manejo de estado global
- **AsyncStorage** - Almacenamiento local
- **Firebase Firestore** - Base de datos en la nube

### Conectividad y Cache
- **NetInfo** - Detección de conexión
- **Cache inteligente** - Funcionamiento offline
- **Sincronización automática** - Backup en la nube

### API y Datos
- **Rick and Morty API** - Fuente de datos
- **Fetch con timeout** - Peticiones HTTP robustas
- **Paginación automática** - Carga eficiente

## 🎨 Diseño y UX

### Temas
- **Tema claro y oscuro** con transiciones suaves
- **Colores consistentes** siguiendo Material Design
- **Iconos Ionicons** para mejor legibilidad

### Navegación
- **Tabs principales** para acceso rápido
- **Stack navigation** para detalles
- **Indicadores visuales** de estado

### Offline Experience
- **Indicador de conexión** siempre visible
- **Cache inteligente** para contenido
- **Mensajes informativos** sobre limitaciones

## 📊 Telemetría y Analytics

### Eventos Rastreados
- Visualización de personajes
- Agregado/eliminación de favoritos
- Aplicación de filtros
- Lanzamiento de la app

### Funcionalidades
- **Almacenamiento local** de eventos
- **Exportación de datos** para análisis
- **Limpieza automática** de eventos antiguos
- **Estadísticas en tiempo real**

## 🔄 Sincronización de Datos

### Firebase Integration
- **Backup automático** de favoritos
- **Sincronización de preferencias**
- **Resolución de conflictos** simple
- **Funcionamiento offline-first**

### Estrategia de Cache
- **Cache por tiempo** con expiración automática
- **Fallback a datos locales** cuando no hay conexión
- **Sincronización inteligente** al recuperar conexión

## 🧪 Testing y Debugging

### Telemetría para Debug
```typescript
// Ejemplo de uso
import { TelemetryEvents } from './services/telemetry';

// Registrar evento
TelemetryEvents.CHARACTER_VIEWED(characterId, characterName);

// Ver estadísticas
const stats = getTelemetryStats();
console.log('Total eventos:', stats.totalEvents);
```

### Modo Desarrollador
- **Console logs** detallados para debugging
- **Exportación de telemetría** para análisis
- **Información de storage** en pantalla de perfil

## 🚀 Despliegue

### Build para Producción
```bash
# Android APK
expo build:android

# iOS IPA  
expo build:ios

# Publicar en stores
expo submit:android
expo submit:ios
```

### Variables de Entorno
Crear `.env` con:
```
FIREBASE_API_KEY=your_api_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

## 🔍 Decisiones Técnicas

### ¿Por qué Context API sobre Redux?
- **Menor complejidad** para el tamaño del proyecto
- **Mejor rendimiento** para este caso de uso
- **Menos boilerplate** y configuración
- **Tipado más simple** con TypeScript

### ¿Por qué Expo Router?
- **File-based routing** más intuitivo
- **Mejor performance** que React Navigation
- **Deep linking** automático
- **Type safety** nativo

### ¿Por qué Firebase?
- **Setup rápido** sin backend propio
- **Sincronización automática** entre dispositivos
- **Offline support** nativo
- **Escalabilidad** para crecimiento futuro

## 🎓 Lo Que Aprendiste

### Desarrollo Móvil
- Navegación avanzada en React Native
- Manejo de estado global sin Redux
- Implementación de temas personalizados
- Gestión de cache y funcionamiento offline

### Integración de APIs
- Consumo de APIs REST con manejo de errores
- Paginación y filtrado de datos
- Cache inteligente para mejor UX
- Manejo de timeouts y reconexión

### Persistencia de Datos
- AsyncStorage para datos locales
- Firebase para backup en la nube
- Estrategias de sincronización
- Resolución de conflictos

### Buenas Prácticas
- Arquitectura escalable y mantenible
- Tipado con TypeScript
- Manejo de errores robusto
- Testing y debugging efectivo

## 🐛 Troubleshooting

### Problemas Comunes

**Error de Firebase**
```bash
# Verificar configuración
console.log('Firebase config:', firebaseConfig);
```

**NetInfo no funciona**
```bash
# Instalar dependencia nativa
npx expo install @react-native-community/netinfo
```

**Iconos no aparecen**
```bash
# Limpiar cache
npx expo start --clear
```

## 📈 Próximas Mejoras

### Funcionalidades Pendientes
- [ ] Notificaciones push
- [ ] Compartir personajes en redes sociales
- [ ] Modo dark/light automático por horario
- [ ] Búsqueda por voz
- [ ] Animaciones avanzadas
- [ ] Tests unitarios y de integración

### Optimizaciones
- [ ] Lazy loading de imágenes
- [ ] Virtualización de listas largas
- [ ] Compresión de imágenes
- [ ] Bundle splitting
- [ ] Performance monitoring

## 🤝 Contribuir

1. Fork del proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Equipo

Desarrollado por el equipo de MultiversoHub como proyecto educativo de React Native.

## 🌟 Agradecimientos

- **Rick and Morty API** - Por proporcionar una API gratuita y completa
- **Expo Team** - Por las herramientas de desarrollo excepcionales
- **React Native Community** - Por los paquetes y documentación

---

**¡Wubba Lubba Dub Dub! 🛸**

*"La ciencia no se trata de por qué, se trata de por qué no."* - Rick Sanchez