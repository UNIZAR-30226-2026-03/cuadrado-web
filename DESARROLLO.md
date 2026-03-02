# Cubo — Documentación Técnica del Frontend

> Guía paso a paso de todo lo creado, modificado y por qué, para que cualquier persona pueda recrear el proyecto completo desde cero.

**Fecha de creación:** 28 de febrero de 2026  
**Stack principal:** React 19 · TypeScript 5.9 · Vite 7.3 · react-router-dom 7 · socket.io-client 4  
**Estado:** Fase 1–2 completadas (estructura + vistas maquetadas). Fase 3 parcial (lógica mock). Fase 4 pendiente (backend real).

---

## Índice

0. [Glosario de conceptos clave](#0-glosario-de-conceptos-clave)
1. [Punto de partida](#1-punto-de-partida)
2. [Dependencias instaladas](#2-dependencias-instaladas)
3. [Estructura de directorios creada](#3-estructura-de-directorios-creada)
4. [Configuración global del proyecto](#4-configuración-global-del-proyecto)
   - 4.1. [index.html](#41-indexhtml--modificado)
   - 4.2. [main.tsx](#42-srcmaintsx--sin-cambios)
   - 4.3. [vite.config.ts](#43-viteconfigts--sin-cambios)
   - 4.4. [eslint.config.js](#44-eslintconfigjs--sin-cambios)
   - 4.5. [Configuración TypeScript](#45-configuración-typescript-tsconfigjson--sin-cambios)
   - 4.6. [.gitignore](#46-gitignore--sin-cambios)
5. [Sistema de tipos (TypeScript)](#5-sistema-de-tipos-typescript)
6. [Contextos de estado (React Context API)](#6-contextos-de-estado-react-context-api)
7. [Servicios API (mock)](#7-servicios-api-mock)
8. [Hook de WebSocket](#8-hook-de-websocket)
9. [Componentes UI reutilizables](#9-componentes-ui-reutilizables)
   - 9.1. [Button](#91-button--botón-genérico)
   - 9.2. [Input](#92-input--campo-de-entrada)
   - 9.3. [GlassCard](#93-glasscard--tarjeta-con-efecto-glassmorphism)
   - 9.4. [Logo](#94-logo--logotipo-de-cubo)
   - 9.5. [IconButton](#95-iconbutton--botón-de-icono-cuadrado)
   - 9.6. [Sparkle](#96-sparkle--estrella-decorativa-pulsante)
10. [Páginas (vistas)](#10-páginas-vistas)
    - 10.1. [LoginPage](#101-loginpage--pantalla-de-inicio-de-sesión)
    - 10.2. [RegisterPage](#102-registerpage--pantalla-de-registro)
    - 10.3. [LobbyPage](#103-lobbypage--menú-principal--sala-de-espera)
    - 10.4. [CreateRoomModal](#104-createroommodal--modal-de-creación-de-sala)
    - 10.5. [JoinRoomModal](#105-joinroommodal--modal-para-unirse-a-sala)
    - 10.6. [GamePage](#106-gamepage--mesa-de-juego)
    - 10.7. [PlayerSlot](#107-playerslot--slot-de-jugador-rival)
11. [Enrutamiento y protección de rutas](#11-enrutamiento-y-protección-de-rutas)
12. [Estilos globales y sistema de diseño](#12-estilos-globales-y-sistema-de-diseño)
13. [Errores corregidos](#13-errores-corregidos)
14. [Cómo ejecutar el proyecto](#14-cómo-ejecutar-el-proyecto)
15. [Árbol de archivos final](#15-árbol-de-archivos-final)
16. [Resumen de decisiones técnicas](#16-resumen-de-decisiones-técnicas)

---

## 0. Glosario de conceptos clave

Antes de empezar, una referencia rápida de los conceptos y términos que aparecen a lo largo de este documento:

| Término | Significado |
|---------|------------|
| **Vite** | Herramienta de *build* y servidor de desarrollo ultra-rápido para proyectos web. Reemplaza a Webpack/CRA (Create React App). Usa ESModules nativos del navegador en desarrollo para ofrecer recarga instantánea (*Hot Module Replacement*). |
| **React** | Biblioteca de JavaScript para construir interfaces de usuario mediante componentes declarativos. Usamos la versión 19.2. |
| **TypeScript** | Superconjunto de JavaScript que añade tipado estático. Los archivos `.ts`/`.tsx` se compilan a `.js` antes de ejecutarse en el navegador. Vite se encarga de esta compilación de forma transparente. |
| **JSX / TSX** | Sintaxis que permite escribir HTML dentro de JavaScript/TypeScript. React la convierte en llamadas a funciones (`React.createElement`). Los archivos `.tsx` son TypeScript con JSX. |
| **Componente** | Pieza reutilizable de interfaz. En React es una función que recibe `props` (propiedades) y devuelve JSX. Ejemplo: `Button`, `GlassCard`. |
| **Hook** | Función especial de React (empieza por `use`) que permite a los componentes funcionales tener estado (`useState`), efectos (`useEffect`), contexto (`useContext`), etc. |
| **Context API** | Sistema de React para compartir datos globalmente sin pasar `props` manualmente entre componentes intermedios (*prop drilling*). Se compone de: `createContext`, `Provider` (envuelve), `useContext` (consume). |
| **Router / SPA** | *Single Page Application*: la app carga una sola página HTML y el enrutador (*router*) cambia el contenido dinámicamente según la URL, sin recargar la página. Usamos `react-router-dom`. |
| **Mock** | Implementación simulada/ficticia. Permite trabajar sin backend real. Nuestras funciones API devuelven datos inventados con un retardo artificial. |
| **Socket.io** | Biblioteca para comunicación bidireccional en tiempo real entre cliente y servidor usando WebSockets. El servidor puede enviar eventos al cliente sin que este los solicite. |
| **Glassmorphism** | Tendencia de diseño visual que simula vidrio esmerilado: fondo semi-transparente + desenfoque (`backdrop-filter: blur`) + bordes translúcidos. |
| **CSS Custom Properties** | Variables CSS nativas (definidas con `--nombre: valor` y usadas con `var(--nombre)`). Permiten centralizar colores, tamaños, etc. |
| **Barrel file** | Archivo `index.ts` que re-exporta módulos de una carpeta, simplificando los imports. |
| **ESLint** | Herramienta de análisis estático que detecta errores y problemas de estilo en el código JavaScript/TypeScript antes de ejecutarlo. |
| **Strict Mode** | Modo de React (`<StrictMode>`) que ejecuta cada componente dos veces en desarrollo para detectar efectos secundarios impuros. No afecta la producción. |

---

## 1. Punto de partida

El proyecto comenzó como una plantilla vacía generada por **Vite** con la configuración **React + TypeScript**:

```bash
npm create vite@latest cuadrado-web -- --template react-ts
```

Esto generó la estructura mínima:

```
cuadrado-web/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── eslint.config.js
├── public/
│   └── vite.svg
└── src/
    ├── main.tsx          ← Punto de entrada de React
    ├── App.tsx           ← Componente raíz (placeholder)
    ├── App.css
    ├── index.css
    └── assets/
        └── react.svg
```

**Tecnologías base** incluidas por la plantilla:
- React 19.2.0 + ReactDOM
- TypeScript ~5.9.3
- Vite 7.3.1 (bundler y servidor de desarrollo)
- ESLint con plugins `react-hooks` y `react-refresh`
- `babel-plugin-react-compiler` (optimización automática de React)

---

## 2. Dependencias instaladas

Se ejecutó este comando para añadir las dos dependencias de producción necesarias:

```bash
npm install react-router-dom socket.io-client
```

### ¿Por qué cada una?

| Paquete | Versión | Motivo |
|---------|---------|--------|
| `react-router-dom` | ^7.13.1 | Navegación entre pantallas (Login, Registro, Lobby, Sala de juego) sin recargar la página. Proporciona componentes como `<BrowserRouter>`, `<Routes>`, `<Route>`, `<Navigate>`, `<Link>`, y hooks como `useNavigate()` y `useParams()`. |
| `socket.io-client` | ^4.8.3 | Comunicación en tiempo real con el servidor Nest.js (futuro). Actualmente se usa en **modo mock** (simulado) para poder avanzar con el frontend sin depender del backend. |

Ambas se registraron automáticamente en `package.json` → `"dependencies"`.

---

## 3. Estructura de directorios creada

Dentro de `src/`, se crearon **6 nuevos directorios**, cada uno con un propósito claro:

```
src/
├── types/          ← Interfaces TypeScript compartidas
├── context/        ← Proveedores de estado global (React Context)
├── services/       ← Funciones de llamada a la API (mock)
├── hooks/          ← Custom hooks (socket.io)
├── components/
│   └── ui/         ← Componentes reutilizables de interfaz
└── pages/          ← Vistas/pantallas completas de la app
```

### ¿Por qué esta estructura?

Se sigue una **arquitectura por responsabilidad**, muy habitual en proyectos React medianos/grandes:

- **`types/`**: Centraliza todas las interfaces TypeScript para que cualquier archivo pueda importarlas desde un único lugar (`../types`). Evita duplicación y facilita cambios globales.
- **`context/`**: Separa la lógica de estado de las vistas. React Context API permite compartir datos (usuario autenticado, estado de la partida) sin pasar props manualmente entre muchos componentes.
- **`services/`**: Encapsula todas las llamadas HTTP/REST. Cuando el backend esté listo, solo hace falta modificar estos archivos (sustituir los mocks por `fetch`/`axios` reales) sin tocar componentes.
- **`hooks/`**: Los custom hooks encapsulan lógica reutilizable (conexión WebSocket). Se mantienen separados de los componentes.
- **`components/ui/`**: Componentes "tontos" (sin lógica de negocio) que solo se encargan de la presentación visual. Son reutilizables en cualquier página.
- **`pages/`**: Cada archivo es una pantalla completa de la aplicación, conectada a una ruta URL.

### Comandos para crear los directorios

```bash
# Desde la carpeta src/ del proyecto
mkdir types
mkdir context
mkdir services
mkdir hooks
mkdir components\ui
mkdir pages
```

O en una sola línea (PowerShell / macOS / Linux):
```bash
mkdir src/types src/context src/services src/hooks src/components/ui src/pages
```

---

## 4. Configuración global del proyecto

### 4.1. `index.html` — Modificado

**Cambios realizados:**
```html
<!-- Antes (plantilla Vite): -->
<html lang="en">
  ...
  <title>Vite + React + TS</title>

<!-- Después: -->
<html lang="es">
  ...
  <title>Cubo — El juego de cartas</title>
```

**¿Por qué?**
- `lang="es"` → Indica a navegadores y lectores de pantalla que el contenido está en español.
- `<title>` → Muestra "Cubo — El juego de cartas" en la pestaña del navegador.

### 4.2. `src/main.tsx` — Sin cambios

El punto de entrada se dejó tal cual lo generó Vite:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**Explicación línea por línea:**
- `import { StrictMode }` → Importa el componente de React que activa el modo estricto.
- `import { createRoot }` → API de React 18+ para crear la raíz del árbol de componentes.
- `import './index.css'` → Importa los estilos globales (Vite los inyecta automáticamente en el HTML).
- `import App from './App.tsx'` → Importa el componente raíz de la aplicación.
- `document.getElementById('root')!` → Busca el `<div id="root">` del `index.html`. El `!` (non-null assertion) le dice a TypeScript que confiamos en que existe.
- `<StrictMode>` → Envuelve la app para detectar problemas potenciales en desarrollo (doble renderizado intencional para encontrar efectos impuros). No tiene efecto en producción.

### 4.3. `vite.config.ts` — Sin cambios

Configuración del bundler Vite, generada por la plantilla:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
})
```

**Explicación:**
- `defineConfig` → Función helper de Vite que proporciona autocompletado TypeScript para la configuración.
- `react()` → Plugin oficial de Vite para React. Gestiona la transformación de JSX y el Hot Module Replacement (recarga en caliente sin perder estado).
- `babel-plugin-react-compiler` → Plugin experimental de React (v19) que optimiza automáticamente los componentes durante la compilación, reduciendo re-renders innecesarios sin necesidad de usar `React.memo()` manualmente.

**¿Por qué no se modificó?** La configuración por defecto es suficiente para el proyecto. Si en el futuro se necesitase un proxy para el backend, se añadiría una sección `server.proxy`.

### 4.4. `eslint.config.js` — Sin cambios

Configuración de ESLint v9+ con formato *flat config*:

```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
```

**Explicación de cada parte:**
- `globalIgnores(['dist'])` → Excluye la carpeta de build `dist/` del análisis.
- `files: ['**/*.{ts,tsx}']` → Solo analiza archivos TypeScript/TSX.
- `js.configs.recommended` → Reglas básicas de JavaScript (no usar `var`, no variables no declaradas, etc.).
- `tseslint.configs.recommended` → Reglas de TypeScript (no variables sin usar, tipos correctos, etc.).
- `reactHooks.configs.flat.recommended` → Valida las [reglas de los hooks](https://es.react.dev/reference/rules/rules-of-hooks): los hooks solo se llaman en el nivel superior de los componentes, `useEffect` siempre incluye sus dependencias, etc.
- `reactRefresh.configs.vite` → Valida que los componentes exportados sean compatibles con Hot Refresh de Vite (solo exportar componentes desde archivos `.tsx`, no funciones arbitrarias).
- `globals.browser` → Define variables globales del navegador (`window`, `document`, `console`) para que ESLint no las marque como no declaradas.

**¿Por qué importa?** ESLint es la herramienta que nos obligó a corregir los errores de la sección 13 (parámetros no usados, dependencias de efectos, exports). Sin esta configuración, esos errores pasarían desapercibidos.

### 4.5. Configuración TypeScript (`tsconfig.json`) — Sin cambios

El proyecto tiene **3 archivos** de configuración TypeScript (generados por Vite):

**`tsconfig.json`** — Archivo raíz que solo referencia a los otros dos:
```jsonc
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

**`tsconfig.app.json`** — Configuración para el código de la aplicación (todo dentro de `src/`):
```jsonc
{
  "compilerOptions": {
    "target": "ES2022",               // Genera código ES2022
    "lib": ["ES2022", "DOM", "DOM.Iterable"], // APIs disponibles
    "module": "ESNext",               // Usa módulos ES nativos
    "moduleResolution": "bundler",    // Resolución de imports estilo Vite/bundler
    "jsx": "react-jsx",               // Transforma JSX al formato moderno de React 17+
    "strict": true,                    // Modo estricto de TypeScript
    "noUnusedLocals": true,           // Error si hay variables declaradas sin usar
    "noUnusedParameters": true,       // Error si hay parámetros de función sin usar
    "noEmit": true,                   // No genera archivos .js (Vite se encarga)
    "verbatimModuleSyntax": true,     // import type debe usarse explícitamente
    "allowImportingTsExtensions": true // Permite importar con .tsx extension
  },
  "include": ["src"]
}
```

**Opciones relevantes para el desarrollo:**
- `strict: true` → Activa todas las comprobaciones estrictas de TypeScript. Es lo que nos obliga a tipar correctamente todo.
- `noUnusedLocals` / `noUnusedParameters` → Complementan ESLint detectando variables y parámetros sin usar a nivel de compilación.
- `noEmit: true` → TypeScript solo comprueba tipos, no genera archivos JavaScript. Vite (a través de su plugin React) se encarga de la compilación real.

**`tsconfig.node.json`** — Configuración para archivos de configuración de Node (solo `vite.config.ts`):
```jsonc
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "types": ["node"],      // Tipos de Node.js para la configuración
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

**¿Por qué dos tsconfigs separados?** El código de la app (`src/`) se ejecuta en el navegador (necesita tipos DOM), mientras que `vite.config.ts` se ejecuta en Node.js (necesita tipos Node). Cada entorno tiene APIs diferentes.

### 4.6. `.gitignore` — Sin cambios

Archivo generado por la plantilla que indica a Git qué archivos/carpetas **no** rastrear:

```gitignore
# Logs
logs
*.log
npm-debug.log*

node_modules       # Dependencias (se regeneran con npm install)
dist               # Build de producción (se regenera con npm run build)
dist-ssr
*.local            # Archivos de configuración local

# Editor directories
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
```

**¿Por qué no se sube `node_modules/`?** Contiene miles de archivos (las dependencias y sus sub-dependencias). Se regeneran exactamente igual ejecutando `npm install`, guiado por `package-lock.json` que sí se versiona.

---

## 5. Sistema de tipos (TypeScript)

### Archivo: `src/types/index.ts`

Se creó un archivo central con **7 interfaces** TypeScript que modelan todos los datos del juego:

```typescript
export interface User {
  id: number;
  name: string;
  email: string;
  coins: number;      // Monedas del jugador
  stars: number;      // Estrellas (puntuación acumulada)
  rank: number;       // Posición en el ranking
  avatar: string;     // URL o string vacío
}
```

**¿Por qué?** Representa al usuario autenticado con todos sus datos de perfil y estadísticas, tal como aparecen en la cabecera del Lobby.

```typescript
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
```

**¿Por qué?** Separa el "estado de autenticación" como tipo propio. `user` es `null` cuando no hay sesión activa.

```typescript
export interface Card {
  id: string;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: string;      // "A","2"…"K"
  faceUp: boolean;
}
```

**¿Por qué?** Cada carta tiene un ID único (generado con `crypto.randomUUID()`), un palo (union type restringido a 4 valores), un valor textual, y un booleano que indica si está boca arriba. Se usa tanto para las cartas del jugador como para la pila de descarte.

```typescript
export interface Player {
  id: number;
  name: string;
  avatar: string;
  cards: Card[];      // Siempre 4 cartas en Cubo
  emoji: string;      // Emoji de avatar temporal
  isMuted: boolean;   // Si tiene el audio silenciado
}
```

**¿Por qué?** Cada jugador en la mesa necesita mostrar su nombre, avatar (emoji por ahora), sus 4 cartas, y un indicador de silencio para la futura funcionalidad de chat de voz.

```typescript
export interface RoomConfig {
  name: string;
  maxPlayers: number;   // 2-8
  decks: 1 | 2;        // 1 o 2 barajas
  specialCards: boolean;
  isPrivate: boolean;
  code?: string;        // Solo existe si isPrivate es true
}
```

**¿Por qué?** Configura la creación de una sala. Los valores posibles están restringidos con TypeScript (`decks: 1 | 2`, `maxPlayers: number` con validación en la UI para 2-8).

```typescript
export interface Room {
  id: string;
  config: RoomConfig;
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
}
```

**¿Por qué?** Modela una sala de juego completa. El `status` como union type limita los estados posibles.

```typescript
export interface GameState {
  roomId: string;
  players: Player[];
  currentTurn: number;     // ID del jugador que tiene el turno
  deckCount: number;       // Cartas restantes en el mazo
  discardTop: Card | null; // Carta visible en la pila de descarte
  turnTimer: number;       // Segundos restantes del turno
  phase: 'waiting' | 'dealing' | 'playing' | 'cubo' | 'finished';
}
```

**¿Por qué?** Representa el estado completo de una partida en curso. El `phase` controla qué se muestra en pantalla (fase de juego, alguien cantó CUBO, etc.).

---

## 6. Contextos de estado (React Context API)

### 6.1. `src/context/AuthContext.tsx` — Contexto de autenticación

**Propósito:** Gestionar el estado de sesión del usuario (login, registro, logout) y hacer que sea accesible desde cualquier componente sin pasar props.

**Estructura:**

1. **`MOCK_USER`**: Un objeto de prueba que simula un usuario ya registrado:
   ```typescript
   const MOCK_USER: User = {
     id: 1,
     name: 'UsuarioPrueba',
     email: 'user@cubo.dev',
     coins: 1250,
     stars: 8500,
     rank: 42,
     avatar: '',
   };
   ```

2. **`AuthContextType`**: Interfaz que define qué datos y funciones expone el contexto:
   - `user: User | null` — El usuario actual (o null si no hay sesión)
   - `isAuthenticated: boolean` — Derivado de `!!user`
   - `login(email, password): Promise<void>` — Inicia sesión (mock: siempre éxito, retardo de 400ms)
   - `register(name, email, password): Promise<void>` — Registra usuario (mock: usa el nombre proporcionado)
   - `logout(): void` — Cierra sesión poniendo `user` a `null`

3. **`AuthProvider`**: Componente que envuelve la app y proporciona el contexto.

4. **`useAuth()`**: Custom hook que simplifica el acceso al contexto. Lanza error si se usa fuera del Provider.

**¿Por qué mock?** Permite desarrollar y probar todas las pantallas y flujos sin necesitar el backend Nest.js. Cuando el backend esté listo, solo hay que reemplazar los cuerpos de `login`/`register` por llamadas HTTP reales.

**¿Por qué `useCallback`?** Las funciones `login`, `register` y `logout` están envueltas en `useCallback` para mantener referencias estables y evitar re-renders innecesarios en componentes que dependan de ellas. Sin `useCallback`, cada re-render del `AuthProvider` crearía nuevas instancias de esas funciones, lo que dispararía re-renders en cascada en todos los componentes hijos que las usen.

**Directiva `eslint-disable` en la cabecera del archivo:**
```typescript
/* eslint-disable react-refresh/only-export-components */
```
Esta línea existe en la primera línea del archivo. Es necesaria porque `react-refresh` (el plugin de recarga en caliente de Vite) exige que los archivos `.tsx` solo exporten componentes React. Sin embargo, este archivo también exporta el hook `useAuth()`, lo que violaría esa regla. La directiva desactiva esa comprobación solo para este archivo. El mismo patrón se repite en `GameContext.tsx` por la misma razón (`useGame()`).

**Código completo de `src/context/AuthContext.tsx`:**

```tsx
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User, AuthState } from '../types';

const MOCK_USER: User = {
  id: 1,
  name: 'UsuarioPrueba',
  email: 'user@cubo.dev',
  coins: 1250,
  stars: 8500,
  rank: 42,
  avatar: '',
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (_email: string, _pass: string) => {
    void _email; void _pass;
    await new Promise((r) => setTimeout(r, 400));
    setUser(MOCK_USER);
  }, []);

  const register = useCallback(async (name: string, _email: string, _pass: string) => {
    void _email; void _pass;
    await new Promise((r) => setTimeout(r, 400));
    setUser({ ...MOCK_USER, name });
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

### 6.2. `src/context/GameContext.tsx` — Contexto de partida

**Propósito:** Gestionar el estado de una partida en curso: jugadores, turno, temporizador, selección de carta, y la acción de cantar CUBO.

**Funciones auxiliares:**

- **`randomCard(faceUp?)`**: Genera una carta aleatoria eligiendo un palo y valor aleatorio. Usa `crypto.randomUUID()` para generar IDs únicos.
- **`mockPlayers(count)`**: Crea un array de jugadores ficticios. El primero siempre se llama "Usuario" (el jugador local). Los demás se llaman "Rival 1", "Rival 2", etc. Cada uno recibe 4 cartas aleatorias y un emoji diferente.

**Estado gestionado:**

- `game: GameState | null` — Estado completo de la partida (null antes de empezar)
- `selectedCardId: string | null` — ID de la carta seleccionada por el jugador
- `turnTimer: number` — Segundos restantes del turno (comienza en 20)

**Funciones expuestas:**

- **`startGame(roomId, playerCount?)`**: Inicializa una partida mock con los jugadores y cartas aleatorias. Pone `phase: 'playing'` y reinicia el temporizador a 20.
- **`selectCard(playerId, cardId)`**: Alterna la selección de una carta (si ya está seleccionada, la deselecciona).
- **`callCubo()`**: Cambia la fase de la partida a `'cubo'`, activando el overlay visual correspondiente.

**Temporizador de turno:**

```typescript
useEffect(() => {
  if (!game || game.phase !== 'playing') return;
  timerRef.current = setInterval(() => {
    setTurnTimer((t) => {
      if (t <= 1) {
        clearInterval(timerRef.current!);
        return 0;
      }
      return t - 1;
    });
  }, 1000);
  return () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
}, [game?.phase]);
```

**¿Cómo funciona?** Un `useEffect` escucha cambios en `game?.phase`. Cuando la fase es `'playing'`, lanza un `setInterval` que decrementa el temporizador cada segundo. Al llegar a 0, se limpia el intervalo. La función de limpieza (`return`) asegura que el intervalo se destruye si el componente se desmonta o la fase cambia.

**Nota sobre ESLint:** Se añadió `// eslint-disable-next-line react-hooks/exhaustive-deps` porque ESLint exige incluir `game` completo en las dependencias, pero solo necesitamos reaccionar a cambios en `game.phase`. Incluir `game` entero causaría bucles infinitos al cambiar otras propiedades del estado.

**Código completo de `src/context/GameContext.tsx`:**

```tsx
/* eslint-disable react-refresh/only-export-components */
import {
  createContext, useContext, useState, useCallback,
  useEffect, useRef, type ReactNode,
} from 'react';
import type { GameState, Card, Player } from '../types';

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function randomCard(faceUp = false): Card {
  return {
    id: crypto.randomUUID(),
    suit: SUITS[Math.floor(Math.random() * 4)],
    value: VALUES[Math.floor(Math.random() * 13)],
    faceUp,
  };
}

function mockPlayers(count: number): Player[] {
  const emojis = ['😊', '😎', '😄', '😏', '🤔', '😆', '🙂', '😁'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: i === 0 ? 'Usuario' : `Rival ${i}`,
    avatar: '',
    cards: [randomCard(), randomCard(), randomCard(), randomCard()],
    emoji: emojis[i % emojis.length],
    isMuted: false,
  }));
}

interface GameContextType {
  game: GameState | null;
  startGame: (roomId: string, playerCount?: number) => void;
  selectCard: (playerId: number, cardId: string) => void;
  callCubo: () => void;
  selectedCardId: string | null;
  turnTimer: number;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<GameState | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [turnTimer, setTurnTimer] = useState(20);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startGame = useCallback((roomId: string, playerCount = 4) => {
    setGame({
      roomId,
      players: mockPlayers(playerCount),
      currentTurn: 0,
      deckCount: 40,
      discardTop: randomCard(true),
      turnTimer: 20,
      phase: 'playing',
    });
    setTurnTimer(20);
  }, []);

  const selectCard = useCallback((_playerId: number, cardId: string) => {
    setSelectedCardId((prev) => (prev === cardId ? null : cardId));
  }, []);

  const callCubo = useCallback(() => {
    setGame((prev) => prev ? { ...prev, phase: 'cubo' } : prev);
  }, []);

  useEffect(() => {
    if (!game || game.phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTurnTimer((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.phase]);

  return (
    <GameContext.Provider value={{ game, startGame, selectCard, callCubo, selectedCardId, turnTimer }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
```

---

## 7. Servicios API (mock)

### Archivo: `src/services/api.ts`

**Propósito:** Encapsular todas las llamadas al backend en funciones asíncronas independientes. Actualmente devuelven datos ficticios con un retardo de 400ms para simular latencia de red.

**Funciones:**

| Función | Parámetros | Retorno | Descripción |
|---------|-----------|---------|-------------|
| `loginUser` | `email, pass` | `Promise<User>` | Simula login exitoso devolviendo un usuario mock |
| `registerUser` | `name, email, pass` | `Promise<User>` | Simula registro devolviendo un nuevo usuario con `id: 2, coins: 0, rank: 999` |
| `createRoom` | `config: RoomConfig` | `Promise<Room>` | Simula creación de sala generando un ID aleatorio con `crypto.randomUUID().slice(0, 8)` |
| `joinRoom` | `roomId` | `Promise<Room>` | Simula unirse a una sala devolviendo una sala con configuración por defecto |
| `listPublicRooms` | — | `Promise<Room[]>` | Devuelve 2 salas públicas ficticias: "Partida rápida" (4 jugadores, 1 baraja) y "Torneo doble" (8 jugadores, 2 barajas) |

**¿Por qué la función `delay()`?**
```typescript
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));
```
Cada función empieza con `await delay()`. Esto simula el retardo de red para que la UI muestre correctamente estados de carga ("Entrando…", "Creando…"), que de otro modo serían instantáneos y no se verían.

**¿Por qué `void _pass`?** ESLint marca como error los parámetros no usados (como `_pass` que el mock ignora). La sentencia `void _pass` le dice a ESLint "soy consciente de que no lo uso, es intencional".

**Migración futura:** Cuando el backend Nest.js esté listo, cada función se sustituirá por algo como:
```typescript
export async function loginUser(email: string, pass: string): Promise<User> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass }),
  });
  return res.json();
}
```
El resto de la aplicación no necesitará cambios porque la firma (parámetros y tipo de retorno) se mantiene igual.

**Código completo de `src/services/api.ts`:**

```typescript
import type { User, Room, RoomConfig } from '../types';

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export async function loginUser(_email: string, _pass: string): Promise<User> {
  void _pass;
  await delay();
  return { id: 1, name: 'UsuarioPrueba', email: _email,
           coins: 1250, stars: 8500, rank: 42, avatar: '' };
}

export async function registerUser(name: string, email: string, _pass: string): Promise<User> {
  void _pass;
  await delay();
  return { id: 2, name, email, coins: 0, stars: 0, rank: 999, avatar: '' };
}

export async function createRoom(config: RoomConfig): Promise<Room> {
  await delay();
  return { id: crypto.randomUUID().slice(0, 8), config, players: [], status: 'waiting' };
}

export async function joinRoom(roomId: string): Promise<Room> {
  await delay();
  return {
    id: roomId,
    config: { name: 'Sala de prueba', maxPlayers: 4, decks: 1,
              specialCards: false, isPrivate: false },
    players: [],
    status: 'waiting',
  };
}

export async function listPublicRooms(): Promise<Room[]> {
  await delay();
  return [
    { id: 'sala-01',
      config: { name: 'Partida rápida', maxPlayers: 4, decks: 1,
                specialCards: false, isPrivate: false },
      players: [], status: 'waiting' },
    { id: 'sala-02',
      config: { name: 'Torneo doble', maxPlayers: 8, decks: 2,
                specialCards: true, isPrivate: false },
      players: [], status: 'waiting' },
  ];
}
```

---

## 8. Hook de WebSocket

### Archivo: `src/hooks/useGameSocket.ts`

**Propósito:** Abstrae la conexión WebSocket con Socket.io para la comunicación en tiempo real durante la partida.

**Interfaz de eventos del servidor:**
```typescript
export interface ServerEvents {
  'game:start':         { roomId: string };
  'game:turn':          { playerId: number; timer: number };
  'game:card-played':   { playerId: number; cardId: string };
  'game:cubo':          { playerId: number };
  'game:end':           { winnerId: number; scores: Record<number, number> };
  'room:player-joined': { playerId: number; name: string };
  'room:player-left':   { playerId: number };
  'chat:message':       { playerId: number; text: string };
}
```

**¿Por qué definir estos tipos?** Sirven como contrato entre frontend y backend. Cuando el backend implemente los WebSockets, ambos equipos tienen una referencia clara de qué eventos existen y qué datos llevan.

**Funcionamiento actual (mock):**

```typescript
export function useGameSocket(roomId: string | undefined) {
  // ...
  useEffect(() => {
    if (!roomId) return;
    // Simula una conexión exitosa después de 300ms
    const t = setTimeout(() => {
      setConnected(true);
      console.log(`[socket-mock] Conectado a sala ${roomId}`);
    }, 300);
    return () => { clearTimeout(t); setConnected(false); };
  }, [roomId]);

  const emit = useCallback((event: string, data?: unknown) => {
    console.log(`[socket-mock] emit → ${event}`, data);
  }, []);

  return { connected, emit, socketRef };
}
```

**Retorno:**
- `connected: boolean` — Indica si hay conexión (se muestra en la UI como badge verde/rojo)
- `emit(event, data)` — Función para enviar eventos al servidor (actualmente solo imprime en consola)
- `socketRef` — Referencia al socket (actualmente `null`)

**Código real comentado:** Dentro del `useEffect` hay un bloque comentado con la implementación real usando `io()` de Socket.io. Para activarlo, se descomenta y se comenta el mock. La URL del servidor se toma de `import.meta.env.VITE_WS_URL` (variable de entorno de Vite) con fallback a `http://localhost:3001`.

---

## 9. Componentes UI reutilizables

Todos los componentes viven en `src/components/ui/` y se exportan desde un **barrel file** (`index.ts`) para simplificar las importaciones:

```typescript
// src/components/ui/index.ts
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as GlassCard } from './GlassCard';
export { default as Logo } from './Logo';
export { default as IconButton } from './IconButton';
export { default as Sparkle } from './Sparkle';
```

**¿Por qué un barrel file?** Permite importar varios componentes en una sola línea:
```typescript
import { Button, Input, GlassCard, Logo } from '../components/ui';
// En vez de:
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
// ...
```

---

### 9.1. `Button` — Botón genérico

**Archivo:** `Button.tsx` + `Button.css`

```tsx
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}
```

**¿Por qué extiende `ButtonHTMLAttributes`?** Permite pasar cualquier atributo HTML nativo (`type`, `disabled`, `onClick`, etc.) sin tener que declararlos uno a uno.

**Variantes (CSS):**
- **`primary`** → Gradiente azul, borde blanco translúcido. Botón principal de acción.
- **`secondary`** → Fondo casi transparente, borde sutil. Acciones alternativas.
- **`gold`** → Gradiente dorado. Usado exclusivamente para el botón CUBO en la mesa de juego.
- **`ghost`** → Completamente transparente, sin bordes. Para acciones terciarias.

**Tamaños:** `sm` (compacto), `md` (estándar), `lg` (grande, para formularios).

**Código CSS completo (`Button.css`):**
```css
.cubo-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-radius: 999px;                 /* Forma de píldora */
  font-family: 'Georgia', serif;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  letter-spacing: 0.02em;
}
.cubo-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.35); }
.cubo-btn:active { transform: translateY(0); }

/* Tamaños */
.cubo-btn--sm  { padding: 0.4rem 1.2rem; font-size: 0.85rem; }
.cubo-btn--md  { padding: 0.65rem 2rem;   font-size: 1.05rem; }
.cubo-btn--lg  { padding: 0.85rem 2.8rem; font-size: 1.25rem; }

/* Variantes */
.cubo-btn--primary   { background: linear-gradient(180deg, #3a6ea5, #1b3a5c); }
.cubo-btn--secondary { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); }
.cubo-btn--gold      { background: linear-gradient(180deg, #e8a914, #b07a0a);
                       border-color: rgba(255,215,0,0.6); font-size: 1.4rem; }
.cubo-btn--ghost     { background: transparent; border-color: transparent; }
```

---

### 9.2. `Input` — Campo de entrada

**Archivo:** `Input.tsx` + `Input.css`

```tsx
interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}
```

**Funcionamiento:** Si se proporciona un `label`, genera automáticamente un `<label>` vinculado al `<input>` mediante un `id` derivado del texto del label (minúsculas, espacios reemplazados por guiones).

**Código CSS completo (`Input.css`):**
```css
.cubo-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  width: 100%;
}
.cubo-input-label {
  font-family: 'Georgia', serif;
  font-weight: 700;
  font-size: 0.95rem;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}
.cubo-input {
  width: 100%;
  padding: 0.65rem 1rem;
  border: 2px solid rgba(255, 255, 255, 0.25);  /* Borde semi-transparente */
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);         /* Fondo translúcido */
  color: #fff;
  font-size: 1rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
}
.cubo-input::placeholder { color: rgba(255, 255, 255, 0.5); }
.cubo-input:focus {
  border-color: rgba(255, 255, 255, 0.55);       /* Se ilumina al focus */
  background: rgba(255, 255, 255, 0.18);
}
```

---

### 9.3. `GlassCard` — Tarjeta con efecto glassmorphism

**Archivo:** `GlassCard.tsx` + `GlassCard.css`

```tsx
interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}
```

**¿Por qué extiende `HTMLAttributes<HTMLDivElement>`?** Permite pasar `onClick` y cualquier otro atributo de `<div>`. Esto fue necesario porque los modales necesitan `onClick={(e) => e.stopPropagation()}` para evitar que los clics dentro del modal cierren el overlay.

**Estilos clave:**
```css
.glass-card {
  background: rgba(30, 60, 110, 0.55);      /* Azul oscuro semi-transparente */
  border: 2px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(12px);               /* Efecto de cristal esmerilado */
  -webkit-backdrop-filter: blur(12px);       /* Compatibilidad Safari */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

El efecto *glassmorphism* difumina el fondo que hay detrás de la tarjeta, creando la sensación de cristal translúcido. Es el elemento visual central de la identidad de Cubo.

---

### 9.4. `Logo` — Logotipo de Cubo

**Archivo:** `Logo.tsx` + `Logo.css`

**Estructura visual:**
- 5 tarjetas blancas estilizadas con abanico (rotadas entre -10° y +10°, con altura escalonada)
- Un badge "10" en la esquina superior derecha
- Texto "Cubo" debajo en Georgia itálica

```tsx
{[0, 1, 2, 3, 4].map((i) => (
  <span
    key={i}
    className="cubo-logo__card"
    style={{
      transform: `rotate(${-10 + i * 5}deg) translateY(${Math.abs(i - 2) * 2}px)`,
      height: `${28 + i * 3}px`,
    }}
  />
))}
```

**¿Cómo funciona el abanico?** Cada carta se rota incrementalmente: -10°, -5°, 0°, +5°, +10°. El `translateY` crea una ligera curva vertical usando la distancia al centro (`Math.abs(i - 2)`). Las alturas varían de 28px a 40px para dar profundidad.

**Tamaños soportados:** `sm` (cabecera del lobby), `md` (por defecto), `lg` (pantallas de login/registro).

---

### 9.5. `IconButton` — Botón de icono cuadrado

**Archivo:** `IconButton.tsx` + `IconButton.css`

```tsx
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  active?: boolean;
}
```

**Uso:** Para los controles de audio (🎤, 🔇) en la mesa de juego. Tamaño fijo de 44×44px con borde redondeado (10px), fondo azul oscuro translúcido. El estado `active` cambia la opacidad del borde y el fondo.

**Código CSS completo (`IconButton.css`):**
```css
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: rgba(20, 50, 100, 0.6);
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
}
.icon-btn:hover { background: rgba(30, 70, 130, 0.8); }
.icon-btn--active {
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(60, 100, 170, 0.7);
}
```

---

### 9.6. `Sparkle` — Estrella decorativa pulsante

**Archivo:** `Sparkle.tsx` + `Sparkle.css`

**Propósito:** Elemento decorativo puramente visual, inspirado en los mockups de referencia. Es una estrella de 4 puntas SVG que pulsa suavemente.

```tsx
<svg viewBox="0 0 24 24" fill="currentColor" className="sparkle-svg">
  <path d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41Z" />
</svg>
```

**Animación:**
```css
@keyframes sparkle-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50%      { opacity: 1;   transform: scale(1.15); }
}
```

**Posiciones:** Se usa con `position: fixed` y soporta 4 esquinas (`bottom-right`, `top-left`, `top-right`, `bottom-left`). Tiene `pointer-events: none` para no interferir con clics.

---

## 10. Páginas (vistas)

### 10.1. `LoginPage` — Pantalla de inicio de sesión

**Archivos:** `LoginPage.tsx` + `Auth.css`

**Ruta:** `/login`

**Composición visual (de arriba a abajo):**
1. Componente `<Sparkle>` decorativo en esquina inferior derecha
2. `<Logo size="lg">` — Logotipo grande
3. `<h1>` "¡BIENVENIDO A CUBO!" con texto grande serif y sombra
4. `<p>` subtítulo con frases descriptivas del juego
5. `<GlassCard>` conteniendo el formulario:
   - Input "Usuario / Email"
   - Input "Contraseña" (type=password)
   - Mensaje de error condicional (en rojo `#ff6b6b`)
   - Botón "Iniciar Sesión" (primary, lg)
   - Botón "Registrarse" (secondary, lg)
6. Enlace `<Link>` inferior a `/registro`

**Flujo de datos:**
1. El usuario rellena email y contraseña → estado local (`useState`)
2. Al enviar el formulario → `setLoading(true)` → `await login(email, password)` (del `AuthContext`)
3. Si OK → `navigate('/lobby')` (redirección programática)
4. Si error → muestra mensaje de error
5. En ambos casos → `setLoading(false)` en el `finally`

**Estilos (Auth.css):**
- `.auth-page`: Centrado con flexbox (`justify-content: center, align-items: center`), `min-height: 100vh`, gap de 0.8rem entre elementos
- `.auth-title`: Tipografía Georgia serif, `font-size: clamp(2rem, 5vw, 3.4rem)` (responsiva), sombra de texto fuerte
- `.auth-card`: Ancho máximo 380px, padding interno de 1.8rem
- `.auth-form .cubo-btn`: Los botones ocupan el 100% del ancho

---

### 10.2. `RegisterPage` — Pantalla de registro

**Archivo:** `RegisterPage.tsx` (reutiliza `Auth.css`)

**Ruta:** `/registro`

**Diferencias con Login:**
- 4 campos: Usuario, Email, Contraseña, Confirmar Contraseña
- Validación de contraseñas coincidentes antes de enviar
- Usa `register(name, email, password)` del `AuthContext`
- No tiene título "¡BIENVENIDO…!" (solo el logo y la tarjeta directamente)
- Enlace inferior "Volver a Iniciar Sesión" con `<Link to="/login">`

**Validación:**
```typescript
if (password !== confirm) {
  setError('Las contraseñas no coinciden');
  return; // No llega a llamar a register()
}
```

---

### 10.3. `LobbyPage` — Menú principal / Sala de espera

**Archivos:** `LobbyPage.tsx` + `Lobby.css`

**Ruta:** `/lobby` (protegida)

**Composición visual:**

**Header (`lobby-header`):**
- Logo pequeño (`<Logo size="sm">`)
- Barra de estadísticas: 🧊 Monedas, ⭐ Estrellas, 🏆 Ranking — tomados del `user` del `AuthContext`
- Botón de configuración/logout (⚙️) que ejecuta `logout()` al hacer clic

**Centro decorativo (`lobby-center`):**
- Mesa rectangular con fondo oscuro translúcido, bordes redondeados y sombra
- 6 "manos" posicionadas alrededor de la mesa con CSS absoluto
- Cada mano tiene un emoji de mano (🤚) y 4 mini-cartas (cuadrados grises de 16×22px)
- Opacidad al 30% (`opacity: 0.3`) para dar efecto de fondo decorativo sin distraer

**Navegación inferior (`lobby-nav`):**
- 5 botones: Inventario 📦, Tienda 🛒, Crear Partida ▶️, Unirse a Sala 🔍, Perfil 👤
- Sub-componente `NavItem` definido en el mismo archivo:
  ```tsx
  function NavItem({ icon, label, onClick, primary }) {
    return (
      <button className={`lobby-nav-item ${primary ? 'lobby-nav-item--primary' : ''}`}>
        <span className="lobby-nav-icon">{icon}</span>
        <span className="lobby-nav-label">{label}</span>
      </button>
    );
  }
  ```
- "Crear Partida" tiene `primary={true}` → borde azulado distinto y fondo más intenso
- Línea horizontal decorativa conectora (pseudo-elemento `::before` en `.lobby-nav`)

**Modales:**
- `showCreate` y `showJoin` son booleanos locales que controlan la visibilidad
- Al crear una sala → `navigate('/sala/${roomId}')` navega directamente a la partida
- Al unirse → mismo comportamiento

---

### 10.4. `CreateRoomModal` — Modal de creación de sala

**Archivos:** `CreateRoomModal.tsx` + `Modal.css`

**Props:**
- `onClose: () => void` — Cierra el modal
- `onCreate: (roomId: string) => void` — Callback tras crear la sala

**Campos del formulario:**
1. **Nombre de la sala** (`Input`) — Valor por defecto "Mi Sala"
2. **Jugadores máx.** (`select`) — Opciones 2 a 8
3. **Nº de barajas** (`select`) — 1 baraja / 2 barajas
4. **Cartas especiales** (`checkbox`)
5. **Sala privada** (`checkbox`)

**Flujo:**
1. Submit del formulario → `setLoading(true)`
2. Llama a `createRoom(config)` del servicio API
3. Recibe la `room` con su `id`
4. Ejecuta `onCreate(room.id)` → El Lobby navega a `/sala/{id}`

**Overlay del modal (`Modal.css`):**
```css
.modal-overlay {
  position: fixed;
  inset: 0;                         /* Cubre toda la pantalla */
  background: rgba(0, 0, 0, 0.6);  /* Fondo oscuro semi-transparente */
  backdrop-filter: blur(4px);       /* Difumina el contenido detrás */
  z-index: 100;                     /* Sobre todo el contenido */
}
```

**Truco de cierre:** El overlay tiene `onClick={onClose}`, pero la tarjeta interna tiene `onClick={(e: React.MouseEvent) => e.stopPropagation()}`. Así, clicar fuera de la tarjeta cierra el modal, pero clicar dentro no.

> **Nota sobre el tipo `React.MouseEvent`:** La anotación de tipo `e: React.MouseEvent` es obligatoria en el `onClick` de `GlassCard` porque TypeScript necesita saber que el evento proviene de un `<div>` (el `GlassCard` extiende `HTMLAttributes<HTMLDivElement>`). Sin esta anotación, TypeScript no puede inferir el tipo exacto del evento cuando se usa con `stopPropagation()`.

---

### 10.5. `JoinRoomModal` — Modal para unirse a sala

**Archivo:** `JoinRoomModal.tsx` (reutiliza `Modal.css`)

**Dos formas de unirse:**

1. **Código de sala privada:**
   - Input para escribir el código
   - Botón "Unirse" que llama `joinRoom(code.trim())`

2. **Salas públicas:**
   - Al montar el componente, `useEffect` llama a `listPublicRooms()`
   - Mientras carga → "Cargando salas…" (itálica, color atenuado)
   - Después → Lista de salas (`.room-list`) con nombre, jugadores/máximo, barajas, y botón "Unirse"

**Ejemplo de sala en la lista:**
```
┌────────────────────────────────────────────────┐
│  Partida rápida                    [Unirse]    │
│  0/4 · 1 baraja                                │
├────────────────────────────────────────────────┤
│  Torneo doble                      [Unirse]    │
│  0/8 · 2 barajas                               │
└────────────────────────────────────────────────┘
```

---

### 10.6. `GamePage` — Mesa de juego

**Archivos:** `GamePage.tsx` + `GameTable.css`

**Ruta:** `/sala/:id` (protegida)

**Inicialización:**
```tsx
const { id: roomId } = useParams<{ id: string }>();
const { game, startGame, ... } = useGame();
const { connected } = useGameSocket(roomId);

useEffect(() => {
  if (roomId && !game) {
    startGame(roomId, 6); // 6 jugadores mock
  }
}, [roomId, game, startGame]);
```

Al entrar en la ruta, si no hay partida iniciada, se crea una con 6 jugadores ficticios.

**Composición visual (de arriba a abajo):**

1. **Badge de conexión** (`.conn-badge`): Esquina superior izquierda, verde si conectado ("● Conectado"), rojo si no ("○ Conectando…").

2. **Botón de pausa** (`.pause-btn`): Esquina superior derecha, icono ⏸.

3. **Temporizador de turno** (`.turn-timer`): Centrado arriba, anillo SVG circular:
   ```tsx
   <svg viewBox="0 0 36 36" className="timer-ring">
     <circle cx="18" cy="18" r="16" className="timer-ring__bg" />
     <circle
       cx="18" cy="18" r="16" className="timer-ring__fg"
       strokeDasharray={`${(turnTimer / 20) * 100} 100`}
     />
   </svg>
   <span className="timer-text">{turnTimer}</span>
   ```
   **¿Cómo funciona?** El segundo `<circle>` usa `stroke-dasharray` para crear un arco parcial. `(turnTimer / 20) * 100` calcula el porcentaje completado del total (20 segundos). A medida que el timer baja, el arco se encoge visualmente.

4. **Oponentes** (`.table-opponents`): Contenedor relativo donde se posicionan los `<PlayerSlot>` de los rivales usando CSS absolute positioning.

5. **Centro: mazo + descarte** (`.table-center`):
   - **Mazo** (`.deck-pile`): Carta boca abajo con patrón diagonal (`repeating-linear-gradient 45deg`) y contador debajo mostrando las cartas restantes.
   - **Descarte** (`.discard-pile`): Carta boca arriba mostrando el palo (♥♦♣♠ con colores rojo/negro) y el valor.

6. **Mi área** (`.my-area`): Franja inferior con gradiente de transparente a azul oscuro:
   - Controles de audio (🎤 y 🔇 como `<IconButton>`)
   - Avatar (emoji dentro de círculo) + nombre
   - Grid 2×2 de mis 4 cartas (seleccionables con borde dorado y elevación al clicar)
   - Botón dorado "CUBO"

7. **Overlay de fase** (`.phase-overlay`): Cuando alguien canta CUBO, se superpone una capa oscura con el texto "¡CUBO!" en grande y dorado.

**Función auxiliar `suitSymbol()`:**
```typescript
function suitSymbol(suit: string) {
  switch (suit) {
    case 'hearts':   return '♥';
    case 'diamonds': return '♦';
    case 'clubs':    return '♣';
    case 'spades':   return '♠';
    default:         return '?';
  }
}
```
Convierte los nombres internos de palos a sus símbolos Unicode para mostrar en las cartas.

---

### 10.7. `PlayerSlot` — Slot de jugador rival

**Archivos:** `PlayerSlot.tsx` + `PlayerSlot.css`

**Props:**
- `player: Player` — Datos del jugador
- `position: number` — Índice de posición (0, 1, 2…)
- `totalOpponents: number` — Total de oponentes (para calcular la distribución)

**Composición:**
- Avatar circular con emoji (44×44px)
- Nombre del jugador (texto pequeño 0.7rem)
- Grid 2×2 de cartas boca abajo (24×34px)
- Pseudo-elemento `::after` decorativo debajo de las cartas (shelf/estante)

**Sistema de posicionamiento CSS:**
Se definen reglas para cada combinación de `total` y `position`:

```css
/* Con 3 oponentes (4 jugadores totales): */
.player-slot--total-3.player-slot--pos-0 { top: 60%; left: 2%; }   /* Izquierda */
.player-slot--total-3.player-slot--pos-1 { top: 2%;  left: 50%; }  /* Arriba centro */
.player-slot--total-3.player-slot--pos-2 { top: 60%; right: 2%; }  /* Derecha */
```

Se soportan distribuciones para 1 a 7 oponentes (2 a 8 jugadores totales). Las posiciones usan porcentajes para ser responsivas dentro del contenedor `.table-opponents`.

---

## 11. Enrutamiento y protección de rutas

### Archivo: `src/App.tsx`

**Estructura jerárquica:**
```
<BrowserRouter>
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
</BrowserRouter>
```

**¿Por qué este orden?**
- `BrowserRouter` debe envolver toda la aplicación para que funcione `react-router-dom`.
- `AuthProvider` va dentro para que `useAuth()` esté disponible en `AppRoutes` y todas las páginas.
- `AppRoutes` es un componente separado para poder usar `useAuth()` (los hooks solo funcionan dentro de componentes hijos del Provider).

**Rutas definidas:**

| Ruta | Componente | Protección |
|------|-----------|------------|
| `/login` | `<LoginPage>` | Redirige a `/lobby` si ya está autenticado |
| `/registro` | `<RegisterPage>` | Redirige a `/lobby` si ya está autenticado |
| `/lobby` | `<LobbyPage>` | Solo accesible si está autenticado |
| `/sala/:id` | `<GamePage>` | Solo accesible si está autenticado |
| `*` (wildcard) | — | Redirige a `/login` |

**Componente `ProtectedRoute`:**
```tsx
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}
```

Si el usuario no está autenticado e intenta acceder a una ruta protegida, se redirige a `/login`. El `replace` evita que la ruta protegida quede en el historial del navegador.

**Detalle importante sobre `GameProvider`:**
```tsx
<Route
  path="/sala/:id"
  element={
    <ProtectedRoute>
      <GameProvider>
        <GamePage />
      </GameProvider>
    </ProtectedRoute>
  }
/>
```

El `GameProvider` **solo envuelve** la ruta `/sala/:id`. Así el estado de la partida se crea y destruye al entrar y salir de la sala, evitando que persista en memoria cuando el usuario vuelve al lobby.

**Código completo de `src/App.tsx`:**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login"
        element={isAuthenticated ? <Navigate to="/lobby" replace /> : <LoginPage />} />
      <Route path="/registro"
        element={isAuthenticated ? <Navigate to="/lobby" replace /> : <RegisterPage />} />
      <Route path="/lobby"
        element={<ProtectedRoute><LobbyPage /></ProtectedRoute>} />
      <Route path="/sala/:id"
        element={
          <ProtectedRoute>
            <GameProvider>
              <GamePage />
            </GameProvider>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

---

## 12. Estilos globales y sistema de diseño

### Archivo: `src/index.css`

Se reescribió completamente el CSS global de la plantilla Vite para crear el **sistema de diseño de Cubo**.

**Fuente tipográfica:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```
Se usa **Inter** como fuente principal del cuerpo de texto (sans-serif moderna y legible). Los títulos usan **Georgia** (serif clásica) para dar un toque de distinción.

**Variables CSS (Custom Properties):**
```css
:root {
  --cubo-bg-dark:   #0b1e3d;     /* Azul muy oscuro — fondo externo */
  --cubo-bg-mid:    #143a6e;     /* Azul medio — zona intermedia del gradiente */
  --cubo-bg-light:  #1e5aa0;     /* Azul claro — centro del spotlight */
  --cubo-accent:    #e8a914;     /* Dorado — acentos, timer, botón CUBO */
  --cubo-gold:      #d4a012;     /* Dorado oscuro — variante hover */
  --cubo-text:      #ffffff;     /* Blanco puro — texto principal */
  --cubo-text-dim:  rgba(255, 255, 255, 0.6); /* Blanco atenuado — texto secundario */
  --cubo-glass:     rgba(30, 60, 110, 0.55);  /* Fondo glassmorphism */
  --cubo-border:    rgba(255, 255, 255, 0.15); /* Bordes translúcidos */
  --cubo-radius:    12px;                       /* Radio estándar */
}
```

**¿Por qué variables CSS?** Permiten cambiar toda la paleta de colores desde un solo lugar. Si el diseño evoluciona, se modifican las variables y todos los componentes se actualizan automáticamente.

**Fondo:** Gradiente radial elíptico que crea un efecto de "spotlight" central:
```css
body {
  background: radial-gradient(
    ellipse at 50% 30%,      /* Centro ligeramente arriba */
    var(--cubo-bg-light),    /* Azul claro en el centro */
    var(--cubo-bg-mid) 50%,  /* Azul medio a media distancia */
    var(--cubo-bg-dark) 100% /* Azul oscuro en los bordes */
  );
  background-attachment: fixed;  /* No se mueve al hacer scroll */
}
```

### Archivo: `src/App.css`

Se **vació** su contenido original (los estilos de la plantilla Vite) y se dejó como archivo vacío con un comentario. Los estilos se distribuyeron en archivos CSS específicos por página/componente.

---

## 13. Errores corregidos

### 13.1. Rutas de importación incorrectas

**Problema:** Después de crear todos los archivos en `src/pages/`, Vite lanzó errores como:
```
Failed to resolve import "../../context/GameContext" from "src/pages/GamePage.tsx"
```

**Causa raíz:** Los archivos en `src/pages/` usaban `../../` (dos niveles arriba) para importar desde `src/context/`, pero `pages/` está directamente dentro de `src/`, así que solo necesitan `../` (un nivel arriba):

```
src/
├── context/   ← Un nivel arriba desde pages/
├── pages/     ← Aquí estamos
```

`../../` apuntaría a la carpeta padre de `src/`, que es la raíz del proyecto, donde no existen esos módulos.

**Solución:** Se corrigieron las importaciones en los 7 archivos afectados:

| Archivo | Antes | Después |
|---------|-------|---------|
| `GamePage.tsx` | `../../context/GameContext` | `../context/GameContext` |
| `LoginPage.tsx` | `../../context/AuthContext` | `../context/AuthContext` |
| `RegisterPage.tsx` | `../../context/AuthContext` | `../context/AuthContext` |
| `LobbyPage.tsx` | `../../context/AuthContext` | `../context/AuthContext` |
| `CreateRoomModal.tsx` | `../../components/ui` | `../components/ui` |
| `JoinRoomModal.tsx` | `../../components/ui` | `../components/ui` |
| `PlayerSlot.tsx` | `../../types` | `../types` |

---

### 13.2. GlassCard sin soporte para `onClick`

**Problema:** TypeScript error al intentar pasar `onClick` a `<GlassCard>` en los modales.

**Causa:** La interfaz `Props` original solo tenía `children` y `className`, no heredaba de ningún tipo HTML.

**Solución:** Se cambió a extender `HTMLAttributes<HTMLDivElement>`:
```tsx
// Antes:
interface Props { children: ReactNode; className?: string; }

// Después:
interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}
```

Y se usó `...rest` para pasar los atributos restantes al `<div>`:
```tsx
export default function GlassCard({ children, className = '', ...rest }: Props) {
  return <div className={`glass-card ${className}`} {...rest}>{children}</div>;
}
```

---

### 13.3. Parámetros no usados (ESLint)

**Problema:** ESLint marcaba errores `@typescript-eslint/no-unused-vars` en parámetros de funciones mock que intencionalmente no se usan.

**Solución:** Convención de prefijo `_` + sentencia `void`:
```typescript
const login = useCallback(async (_email: string, _pass: string) => {
  void _email; void _pass;
  // ...
}, []);
```

El prefijo `_` indica "parámetro intencionalmente ignorado". La sentencia `void` confirma al linter que somos conscientes de no usarlo.

---

### 13.4. Dependencia de useEffect en GameContext

**Problema:** ESLint `react-hooks/exhaustive-deps` exigía incluir `game` en el array de dependencias del `useEffect` del temporizador.

**Problema con la sugerencia de ESLint:** Si incluimos `game` completo, cada vez que el temporizador modifica `turnTimer` (que se almacena en el estado y podría afectar indirectamente), se reiniciaría el intervalo.

**Solución:** Se añadió la directiva de desactivación con comentario explicativo:
```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [game?.phase]);
```

Solo nos interesa reiniciar el temporizador cuando cambia la *fase* del juego, no cualquier cambio en el estado.

### 13.5. Directiva `react-refresh/only-export-components` en contextos

**Problema:** ESLint `react-refresh/only-export-components` generaba warnings en `AuthContext.tsx` y `GameContext.tsx` porque estos archivos exportan tanto componentes (`AuthProvider`, `GameProvider`) como hooks (`useAuth`, `useGame`).

**Causa:** El plugin `react-refresh` de Vite espera que cada archivo `.tsx` exporte **solo componentes React** para que el Hot Module Replacement (HMR) funcione correctamente. Cuando un archivo exporta una mezcla de componentes y funciones no-componente, el HMR puede fallar al intentar preservar el estado.

**Solución:** Se añadió una directiva de desactivación en la **primera línea** de ambos archivos:
```typescript
/* eslint-disable react-refresh/only-export-components */
```

**¿Por qué es aceptable?** Los archivos de contexto son un caso especial donde es válido y necesario exportar tanto el Provider (componente) como el hook de acceso. El patrón `createContext` + `Provider` + `useX()` es universal en la comunidad React y Vite maneja correctamente el HMR en este caso particular.

---

## 14. Cómo ejecutar el proyecto

### Requisitos previos
- **Node.js** versión 18 o superior
- **npm** (incluido con Node.js)

### Pasos

1. **Clonar/descargar** el repositorio

2. **Entrar en la carpeta del proyecto:**
   ```bash
   cd cuadrado-web
   ```

3. **Instalar dependencias:**
   ```bash
   npm install
   ```

4. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

5. **Abrir en el navegador:** Vite mostrará la URL (normalmente `http://localhost:5173/`)

### Flujo de uso

1. Se abre la pantalla de **Login** (`/login`)
2. Se introduce cualquier email/contraseña y se pulsa "Iniciar Sesión" (el mock acepta todo)
3. Se redirige al **Lobby** (`/lobby`) donde se ven las estadísticas del usuario mock
4. Se puede pulsar **"Crear Partida"** → se abre el modal → al crear se redirige a `/sala/{id}`
5. En la **Mesa de juego** se ven los oponentes, el mazo, el descarte, y las propias cartas
6. Se pueden **seleccionar cartas** (borde dorado) y pulsar el botón **CUBO** (muestra overlay)
7. El **temporizador** cuenta atrás desde 20 segundos
8. Para volver al lobby, usar el botón atrás del navegador
9. En el lobby, el botón ⚙️ cierra la sesión y vuelve a `/login`

### Otros comandos disponibles

```bash
npm run build    # Compila TypeScript y genera build de producción en dist/
npm run lint     # Ejecuta ESLint para verificar calidad del código
npm run preview  # Sirve el build de producción localmente
```

---

## 15. Árbol de archivos final

```
cuadrado-web/
├── .gitignore                          ← Archivos excluidos de Git
├── index.html                          ← HTML base (lang="es", título Cubo)
├── package.json                        ← Dependencias y scripts npm
├── package-lock.json                   ← Versiones exactas de dependencias (autogenerado)
├── tsconfig.json                       ← Configuración TypeScript raíz (referencias)
├── tsconfig.app.json                   ← TypeScript para código de la app (src/)
├── tsconfig.node.json                  ← TypeScript para config de Vite
├── vite.config.ts                      ← Configuración de Vite + plugin React
├── eslint.config.js                    ← Configuración de ESLint (flat config v9)
├── README.md                           ← Readme del proyecto (plantilla original)
├── DESARROLLO.md                       ← ⭐ Este archivo de documentación
├── public/
│   └── vite.svg                        ← Favicon por defecto de Vite
└── src/
    ├── main.tsx                        ← Punto de entrada (monta <App> en el DOM)
    ├── App.tsx                         ← ✨ Router + Providers + definición de rutas
    ├── App.css                         ← Vacío (estilos distribuidos por componente)
    ├── index.css                       ← ✨ Estilos globales + variables CSS del tema Cubo
    ├── assets/
    │   └── react.svg                   ← Logo React (sin usar, de la plantilla)
    │
    ├── types/
    │   └── index.ts                    ← ✨ 7 interfaces TypeScript (User, Card, Player…)
    │
    ├── context/
    │   ├── AuthContext.tsx              ← ✨ Autenticación mock (login/register/logout)
    │   └── GameContext.tsx              ← ✨ Estado de partida mock (timer, cartas, CUBO)
    │
    ├── services/
    │   └── api.ts                      ← ✨ 5 funciones API mock (login, rooms, etc.)
    │
    ├── hooks/
    │   └── useGameSocket.ts            ← ✨ Hook WebSocket mock (preparado para socket.io)
    │
    ├── components/
    │   └── ui/
    │       ├── index.ts                ← ✨ Barrel file (re-exporta los 6 componentes)
    │       ├── Button.tsx              ← ✨ Botón: 4 variantes + 3 tamaños
    │       ├── Button.css              ← ✨ Estilos píldora, gradientes, hover
    │       ├── Input.tsx               ← ✨ Campo de entrada con label automático
    │       ├── Input.css               ← ✨ Fondo translúcido, focus iluminado
    │       ├── GlassCard.tsx           ← ✨ Tarjeta glassmorphism (extiende HTMLAttributes)
    │       ├── GlassCard.css           ← ✨ backdrop-filter blur(12px)
    │       ├── Logo.tsx                ← ✨ Logotipo con 5 cartas en abanico + "10"
    │       ├── Logo.css                ← ✨ 3 tamaños (sm/md/lg), rotaciones
    │       ├── IconButton.tsx          ← ✨ Botón cuadrado para iconos (44×44px)
    │       ├── IconButton.css          ← ✨ Estado active, hover
    │       ├── Sparkle.tsx             ← ✨ Estrella SVG decorativa, 4 posiciones
    │       └── Sparkle.css             ← ✨ Animación pulse infinita
    │
    └── pages/
        ├── LoginPage.tsx               ← ✨ Pantalla de login (email + password)
        ├── RegisterPage.tsx            ← ✨ Pantalla de registro (4 campos + validación)
        ├── Auth.css                    ← ✨ Estilos compartidos login/registro
        ├── LobbyPage.tsx               ← ✨ Menú principal: header + mesa + nav
        ├── CreateRoomModal.tsx          ← ✨ Modal crear sala (5 opciones config)
        ├── JoinRoomModal.tsx            ← ✨ Modal unirse: código privado + lista pública
        ├── Lobby.css                   ← ✨ Estilos del lobby (header, mesa, nav)
        ├── Modal.css                   ← ✨ Estilos modales (overlay, select, room list)
        ├── GamePage.tsx                ← ✨ Mesa de juego completa
        ├── PlayerSlot.tsx              ← ✨ Componente de rival en la mesa
        ├── PlayerSlot.css              ← ✨ Posicionamiento CSS: 1–7 oponentes
        └── GameTable.css               ← ✨ Estilos mesa: timer, cartas, overlay
```

**Leyenda:** ✨ = Archivo creado/reescrito en este desarrollo.

**Conteo de archivos:**

| Acción | Cantidad | Archivos |
|--------|----------|----------|
| Creados desde cero | 30 | Todos los de `types/`, `context/`, `services/`, `hooks/`, `components/ui/`, `pages/` |
| Reescritos completamente | 2 | `index.css`, `App.css` |
| Editados (modificaciones puntuales) | 2 | `index.html`, `App.tsx` |
| **Total** | **34** | |

Además se añadió este archivo `DESARROLLO.md`.

---

## 16. Resumen de decisiones técnicas

Una tabla consolidada de todas las decisiones de diseño tomadas y su justificación:

| Decisión | Alternativas consideradas | Justificación |
|----------|--------------------------|---------------|
| **React Context API** para estado global | Redux, Zustand, Jotai | Para una app de tamaño medio sin lógica compleja de estado, Context es suficiente y no añade dependencias. Si el estado creciera mucho, se migraría a Zustand. |
| **Archivos CSS separados** por componente | CSS Modules, Tailwind, styled-components | Simplicidad máxima. Cada componente importa su `.css`. No requiere configuración adicional ni curva de aprendizaje extra. |
| **Variables CSS nativas** (`--cubo-*`) | Preprocesadores (Sass/Less), tema en JS | Variables CSS funcionan directamente en el navegador, se pueden inspeccionar en DevTools, y no necesitan compilación. Ideales para paletas de color. |
| **Mock local** en vez de backend real | JSON Server, MSW (Mock Service Worker) | Los mocks integrados en el código son los más rápidos de implementar para un prototipo. La firma de las funciones ya está definida para sustituir por real. |
| **Un barrel file** para componentes UI | Importaciones directas archivo por archivo | Reduce el boilerplate de los imports en páginas. Una sola línea importa 6 componentes. |
| **Función `suitSymbol()`** local | Mapa global, emojis directos | La función switch es clara, tipada, y fácilmente testeable. Se define en el mismo archivo donde se usa. |
| **CSS `position: absolute`** para PlayerSlots | Grid/Flexbox adaptativo | Los jugadores deben rodear una mesa circular. El posicionamiento absoluto con porcentajes permite distribuirlos orgánicamente según el tamaño del grupo. |
| **SVG `stroke-dasharray`** para timer | Canvas, librería de charts, CSS animation | SVG es ligero, escalable, y el cálculo es trivial: `(tiempoRestante / tiempoTotal) * 100`. |
| **`GameProvider` solo en `/sala/:id`** | Provider global | El estado de la partida se destruye al salir de la sala. No permanece en memoria innecesariamente en el lobby o pantallas de auth. |
| **`useCallback` en contextos** | Funciones normales | Evita re-renders en cascada. Las funciones del contexto se pasan como dependencias en `useEffect` de componentes hijos. |
| **`crypto.randomUUID()`** para IDs | Incremento, Math.random, nanoid | API nativa del navegador, sin dependencias. Genera IDs únicos universales (UUID v4). |
| **Google Fonts (Inter)** | Fuente del sistema, descarga local | Inter es moderna, legible, y con soporte completo de pesos. Se carga desde CDN rápidamente. |

---

> **Estado actual del proyecto:** Fase 1 (estructura, enrutamiento, UI) y gran parte de la Fase 2 (maquetación de todas las vistas) completadas. Fase 3 (lógica de contextos mock) parcialmente implementada. Pendiente la Fase 4 (integración real con backend Nest.js, tests, pulido final).
