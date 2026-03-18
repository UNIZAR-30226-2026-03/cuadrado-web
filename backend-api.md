# Cuadrado Backend — Guía de integración para el frontend web

## Descripción general

**Cuadrado-Backend** es una API construida con **NestJS** (Node.js + TypeScript) que combina REST y WebSockets (Socket.io) para dar soporte a un juego de cartas multijugador.

### Tecnologías clave
- **Framework:** NestJS 11 sobre Express 5
- **Base de datos:** PostgreSQL con ORM Prisma
- **Autenticación:** JWT (access token + refresh token)
- **Tiempo real:** Socket.io
- **Almacenamiento de imágenes:** Supabase Storage

### Cómo arrancar el backend
```
# Directorio: cuadrado-backend/cubo
npm install
# Configurar .env con las variables de entorno (ver sección de configuración)
npm run start:dev
```

El servidor escucha en **`http://localhost:3000`** por defecto.
Todas las rutas REST tienen el prefijo **`/api`**.

### Configuración mínima (.env)
| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL |
| `JWT_SECRET` | Clave secreta para firmar tokens |
| `JWT_EXPIRATION` | Vida del access token (ej. `7d`) |
| `JWT_REFRESH_EXPIRATION` | Vida del refresh token (ej. `30d`) |
| `SMTP_*` | Credenciales SMTP para recuperación de contraseña |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Acceso al almacenamiento de skins |

### Autenticación
La mayoría de los endpoints protegidos requieren un **Bearer Token** en la cabecera HTTP:
```
Authorization: Bearer <accessToken>
```
El `accessToken` se obtiene al hacer login o al refrescar el token.

---

## Referencia completa de endpoints

### 1. Salud del servidor

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api` | No | Comprueba que el servidor está activo. Devuelve `"Hello from Cuadrado"` |

---

### 2. Autenticación — `/api/auth`

#### `POST /api/auth/register`
Registra un nuevo usuario.

**Body:**
```json
{
  "username": "jugador1",
  "email": "jugador1@correo.com",
  "password": "minimo8chars"
}
```
**Respuesta exitosa (201):**
```json
{
  "id": "...",
  "username": "jugador1",
  "email": "jugador1@correo.com"
}
```

---

#### `POST /api/auth/login`
Inicia sesión. Devuelve los tokens de acceso.

**Body:**
```json
{
  "username": "jugador1",
  "password": "minimo8chars"
}
```
**Respuesta exitosa (200):**
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>",
  "user": {
    "username": "jugador1",
    "eloRating": 1200,
    "cubitos": 0
  }
}
```

---

#### `GET /api/auth/me`
Devuelve el perfil del usuario autenticado.

**Headers:** `Authorization: Bearer <accessToken>`

**Respuesta exitosa (200):**
```json
{
  "username": "jugador1",
  "email": "jugador1@correo.com"
}
```

---

#### `POST /api/auth/change-password`
Cambia la contraseña del usuario autenticado.

**Headers:** `Authorization: Bearer <accessToken>`

**Body:**
```json
{
  "currentPassword": "antigua",
  "newPassword": "nueva12345"
}
```
**Respuesta exitosa (200):**
```json
{ "message": "Contraseña actualizada" }
```

---

#### `POST /api/auth/refresh`
Renueva el access token usando el refresh token.

**Body:**
```json
{ "refreshToken": "<refresh_jwt>" }
```
**Respuesta exitosa (200):**
```json
{
  "accessToken": "<nuevo_jwt>",
  "refreshToken": "<nuevo_refresh_jwt>"
}
```

---

#### `POST /api/auth/logout`
Cierra la sesión e invalida el refresh token.

**Headers:** `Authorization: Bearer <accessToken>`

**Body:**
```json
{ "refreshToken": "<refresh_jwt>" }
```
**Respuesta exitosa (200):**
```json
{ "message": "Sesión cerrada" }
```

---

### 3. Recuperación de contraseña — `/api/forgotten_passwd`

#### `POST /api/forgotten_passwd/notify`
Envía un código de verificación de 9 caracteres alfanuméricos al email del usuario. El código expira en **10 minutos**.
Por seguridad, la respuesta es siempre la misma aunque el email no exista en el sistema.

**Body:**
```json
{ "email": "jugador1@correo.com" }
```
**Respuesta exitosa (200):**
```json
{ "ok": true, "message": "Si el email existe, se ha enviado un código de verificación." }
```

---

#### `POST /api/forgotten_passwd/verify`
Verifica que el código de recuperación es correcto. No comprueba expiración (eso se valida en `/reset`).

**Body:**
```json
{
  "email": "jugador1@correo.com",
  "authCode": "a3f9b1c2e"
}
```
**Respuesta exitosa (200):**
```json
{ "ok": true, "message": "Código verificado correctamente." }
```
**Error (401):** `"El código de verificación es incorrecto"`

---

#### `POST /api/forgotten_passwd/reset`
Restablece la contraseña del usuario. Valida el código y comprueba que no haya expirado.
Tras el cambio, el código se invalida para evitar reutilización.

**Body:**
```json
{
  "email": "jugador1@correo.com",
  "authCode": "a3f9b1c2e",
  "newPassword": "nueva12345"
}
```
**Respuesta exitosa (200):**
```json
{ "ok": true, "message": "Contraseña restablecida correctamente." }
```
**Errores:**
- **401:** `"El código de verificación es incorrecto"`
- **401:** `"El código de verificación ha expirado"`

---

### 4. Skins / Cosméticos — `/api/skins`

Los tipos de skin disponibles son: `"Carta"`, `"Avatar"`, `"Tapete"`.
La moneda del juego son los **cubitos**.

#### `GET /api/skins/store`
Devuelve todas las skins disponibles en la tienda.

**Respuesta exitosa (200):**
```json
[
  {
    "name": "CartaFuego",
    "type": "Carta",
    "price": 100,
    "url": "https://...supabase.co/storage/.../carta_fuego.png"
  }
]
```

---

#### `GET /api/skins/inventory`
Devuelve las skins que posee el usuario autenticado.

**Headers:** `Authorization: Bearer <accessToken>`

**Respuesta:** igual que `/store` pero filtrada a lo que el usuario tiene comprado.

---

#### `POST /api/skins/buy/:skinId`
Compra una skin (descuenta cubitos). No se puede comprar una skin ya poseída.

**Headers:** `Authorization: Bearer <accessToken>`

**Parámetro de ruta:** `skinId` — nombre de la skin (ej. `/api/skins/buy/CartaFuego`)

**Respuesta exitosa (201):**
```json
{
  "message": "Skin comprada con éxito",
  "skin": { "name": "CartaFuego", "type": "Carta", "price": 100, "url": "..." }
}
```

---

#### `PATCH /api/skins/equip/:skinId`
Equipa una skin que el usuario ya posee. Solo se puede equipar una skin a la vez.

**Headers:** `Authorization: Bearer <accessToken>`

**Parámetro de ruta:** `skinId` — nombre de la skin

**Respuesta exitosa (200):**
```json
{ "message": "Skin equipada" }
```

---

#### `PATCH /api/skins/unequip`
Desequipa la skin actualmente equipada.

**Headers:** `Authorization: Bearer <accessToken>`

**Respuesta exitosa (200):**
```json
{ "message": "Skin desequipada" }
```

---

### 5. Salas de juego — WebSocket (Socket.io)

La conexión WebSocket se realiza **al mismo host/puerto** que la API REST:
```
ws://localhost:3000
```

El cliente debe identificarse enviando su `userId` en los datos de conexión del socket.

#### Eventos que envía el cliente al servidor

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `rooms:create` | `{ name?, rules?, savedRoom? }` | Crea una nueva sala |
| `rooms:join` | `{ roomCode: string }` | Se une a una sala existente por código |
| `rooms:leave` | _(vacío)_ | Abandona la sala actual |
| `rooms:start` | `{ roomCode: string }` | Inicia la partida (solo el host) |
| `rooms:list-public` | _(vacío)_ | Lista las salas públicas que no han comenzado |

**Estructura de `rules` (RulesConfig):**
```json
{
  "maxPlayers": 4,
  "turnTimeSeconds": 30,
  "isPrivate": false,
  "fillWithBots": false
}
```

#### Respuestas del servidor a eventos del cliente

| Evento origen | Respuesta | Payload |
|---------------|-----------|---------|
| `rooms:create` | callback | `{ success: true, roomCode: "XXXX", roomName: "..." }` |
| `rooms:join` | callback | `{ success: true, roomCode: "XXXX", roomName: "..." }` |
| `rooms:leave` | callback | `{ success: true }` |
| `rooms:start` | callback | `{ success: true, roomCode: "XXXX" }` |
| `rooms:list-public` | callback | `{ success: true, rooms: [{ name, code, playersCount, rules, createdAt }] }` |

#### Eventos que emite el servidor a todos los jugadores de la sala

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `room:update` | `RoomState` | Estado actualizado de la sala (jugadores, turno, etc.) |
| `room:playerReconnected` | `{ userId, socketId }` | Un jugador se ha reconectado |
| `room:playerDisconnected` | `{ userId, waitingForReconnect }` | Un jugador se ha desconectado (25s de espera) |
| `room:closed` | `{ reason, roomCode }` | La sala fue cerrada (el host abandonó) |

**Estructura de `RoomState`:**
```json
{
  "name": "Sala de Pepito",
  "code": "A1B2",
  "hostId": "jugador1",
  "players": [
    {
      "userId": "jugador1",
      "socketId": "abc123",
      "isHost": true,
      "joinedAt": "2025-01-01T00:00:00.000Z",
      "connected": true
    }
  ],
  "rules": { "maxPlayers": 4, "turnTimeSeconds": 30, "isPrivate": false, "fillWithBots": false },
  "started": false,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

---

## Modelo de datos (referencia)

### Usuario
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `username` | String (PK) | Nombre de usuario único |
| `email` | String | Email único |
| `cubitos` | Int | Moneda del juego |
| `eloRating` | Int | Puntuación ELO (base: 1200) |
| `rankPlacement` | Int | Posición en ranking |
| `gamesPlayed` | Int | Total de partidas |
| `gamesWon` | Int | Partidas ganadas |
| `numPlayersPlayed` | Int | Total de jugadores enfrentados |
| `numPlayersWon` | Int | Jugadores contra los que ha ganado |
| `settings` | Json? | Configuraciones del usuario |
| `equippedSkinID` | String? | Skin actualmente equipada |

### Skin
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | String (PK) | Identificador de la skin |
| `type` | String | `"Carta"` / `"Avatar"` / `"Tapete"` |
| `price` | Int | Precio en cubitos |
| `url` | String | URL de imagen (Supabase) |

---

## Resumen de rutas

```
GET    /api                           → Health check
POST   /api/auth/register             → Registro
POST   /api/auth/login                → Login
GET    /api/auth/me                   → Perfil (🔒)
POST   /api/auth/change-password      → Cambiar contraseña (🔒)
POST   /api/auth/refresh              → Renovar token
POST   /api/auth/logout               → Logout (🔒)

POST   /api/forgotten_passwd/notify   → Solicitar código de recuperación
POST   /api/forgotten_passwd/verify   → Verificar código
POST   /api/forgotten_passwd/reset    → Restablecer contraseña

GET    /api/skins/store               → Tienda de skins
GET    /api/skins/inventory           → Inventario del usuario (🔒)
POST   /api/skins/buy/:skinId         → Comprar skin (🔒)
PATCH  /api/skins/equip/:skinId       → Equipar skin (🔒)
PATCH  /api/skins/unequip             → Desequipar skin (🔒)

WS     ws://localhost:3000            → Salas de juego en tiempo real
  emit:   rooms:create / rooms:join / rooms:leave / rooms:start / rooms:list-public
  listen: room:update / room:playerReconnected / room:playerDisconnected / room:closed
```
> 🔒 = requiere `Authorization: Bearer <accessToken>`
