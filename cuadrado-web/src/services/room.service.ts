// services/room.service.ts - Capa WebSocket para la gestion de salas
//
// Usa socket.io-client contra los eventos definidos en el backend:
//   - rooms:create | rooms:join | rooms:list-public | rooms:leave | rooms:start
//
// Para desarrollo, Vite ya proxya /socket.io a http://localhost:3000
// (ver vite.config.ts). En prod se usa VITE_API_URL si esta definido.

import { io, type Socket } from 'socket.io-client';
import { API_URL } from './api.config';
import { getAccessToken } from '../utils/token';
import type {
  CreateRoomPayload,
  PublicRoomSummary,
  RoomState,
} from '../types/room.types';

interface SocketAuthOptions {
  accessToken?: string;
  userId?: string;
}

interface CreateRoomResponse {
  success: true;
  roomCode: string;
  roomName: string;
  loadedFromSave?: boolean;
  warning?: string;
}

interface JoinRoomResponse {
  success: true;
  roomCode: string;
  roomName: string;
}

interface ListPublicRoomsResponse {
  success: true;
  rooms: PublicRoomSummary[];
}

interface LeaveRoomResponse {
  success: true;
}

interface StartRoomResponse {
  success: true;
  roomCode: string;
}

interface RoomsServerEvents {
  'room:update': (state: RoomState) => void;
  'room:playerDisconnected': (payload: {
    userId: string;
    waitingForReconnect: boolean;
  }) => void;
  'room:playerReconnected': (payload: {
    userId: string;
    socketId: string;
  }) => void;
  'room:closed': (payload: { reason: string; roomCode: string }) => void;
}

interface RoomsClientEvents {
  'rooms:create': (payload: CreateRoomPayload, ack: (res: CreateRoomResponse) => void) => void;
  'rooms:join': (payload: { roomCode: string }, ack: (res: JoinRoomResponse) => void) => void;
  'rooms:list-public': (payload: undefined, ack: (res: ListPublicRoomsResponse) => void) => void;
  'rooms:leave': (payload: undefined, ack: (res: LeaveRoomResponse) => void) => void;
  'rooms:start': (payload: { roomCode: string }, ack: (res: StartRoomResponse) => void) => void;
}

type RoomsSocket = Socket<RoomsServerEvents, RoomsClientEvents>;

const SOCKET_PATH = '/socket.io';
const DEFAULT_TIMEOUT_MS = 8000;

let socket: RoomsSocket | null = null;
let lastCreateRoomWarning: string | null = null;

// Caché del último estado de sala recibido vía room:update.
let lastRoomState: RoomState | null = null;

export function getLastRoomState(): RoomState | null {
  return lastRoomState;
}

export function consumeCreateRoomWarning(): string | null {
  const warning = lastCreateRoomWarning;
  lastCreateRoomWarning = null;
  return warning;
}

// ── Caché de inicio de partida (game:inicio-partida / game:turno-iniciado) ──
// GamePage puede perder estos eventos durante la navegación, así que se cachean
// en el socket permanente de salas (establecido antes de navegar a /game).

interface CachedGameStart {
  partidaId: string;
  jugadores: string[];
  jugadoresDetalle: Array<{
    userId: string;
    controlador: 'humano' | 'bot';
    dificultadBot?: string;
    nombreEnPartida?: string;
  }>;
}

interface CachedTurnoIniciado {
  gameId: string;
  turn: number;
  userId: string;
  phase: 'WAIT_DRAW';
  turnDeadlineAt: number;
}

let lastGameStartData: CachedGameStart | null = null;
let lastTurnoIniciadoData: CachedTurnoIniciado | null = null;

export function getLastGameStartData(): CachedGameStart | null {
  return lastGameStartData;
}

export function getLastTurnoIniciadoData(): CachedTurnoIniciado | null {
  return lastTurnoIniciadoData;
}

export function clearGameCache(): void {
  lastGameStartData = null;
  lastTurnoIniciadoData = null;
}

function getStoredAccessToken(): string | undefined {
  return getAccessToken() ?? undefined;
}

function buildHandshake(auth?: SocketAuthOptions): Record<string, string> {
  const payload: Record<string, string> = {};
  const accessToken = auth?.accessToken ?? getStoredAccessToken();

  if (accessToken) payload.token = accessToken;
  if (auth?.userId) payload.userId = auth.userId;
  return payload;
}

function resolveSocketUrl(): string | undefined {
  if (API_URL.startsWith('http://') || API_URL.startsWith('https://')) {
    const url = new URL(API_URL);
    url.pathname = url.pathname.replace(/\/api\/?$/, '');
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  }

  return undefined; // mismo origin (Vite proxy)
}

function extractWsErrorMessage(payload: unknown): string {
  if (typeof payload === 'string') {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const maybeMessage = (payload as { message?: unknown }).message;

    if (typeof maybeMessage === 'string') {
      return maybeMessage;
    }

    if (Array.isArray(maybeMessage) && maybeMessage.length > 0) {
      return String(maybeMessage[0]);
    }
  }

  return 'Error de socket en salas';
}

async function connectWithTimeout(target: RoomsSocket, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<void> {
  if (target.connected) return;

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Tiempo de espera al conectar con salas'));
    }, timeoutMs);

    const onConnect = () => {
      cleanup();
      resolve();
    };

    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };

    const cleanup = () => {
      clearTimeout(timer);
      target.off('connect', onConnect);
      target.off('connect_error', onError);
    };

    target.once('connect', onConnect);
    target.once('connect_error', onError);
    target.connect();
  });
}

async function ensureSocketConnected(auth?: SocketAuthOptions): Promise<RoomsSocket> {
  const handshake = buildHandshake(auth);

  if (!socket) {
    const socketUrl = resolveSocketUrl();
    const options = {
      path: SOCKET_PATH,
      autoConnect: false,
      auth: handshake,
      query: handshake,
    };

    socket = socketUrl ? io(socketUrl, options) : io(options);

    // Listeners permanentes para cachear estado entre navegaciones
    socket.on('room:update', (state: RoomState) => {
      lastRoomState = state;
    });
    (socket as unknown as { on: (ev: string, cb: (d: unknown) => void) => void })
      .on('game:inicio-partida', (d: unknown) => {
        lastGameStartData = d as CachedGameStart;
      });
    (socket as unknown as { on: (ev: string, cb: (d: unknown) => void) => void })
      .on('game:turno-iniciado', (d: unknown) => {
        lastTurnoIniciadoData = d as CachedTurnoIniciado;
      });
  } else if (Object.keys(handshake).length > 0) {
    socket.auth = { ...(socket.auth as Record<string, unknown>), ...handshake };
  }

  const activeSocket = socket;
  if (!activeSocket) {
    throw new Error('Socket de salas no inicializado');
  }

  await connectWithTimeout(activeSocket);
  return activeSocket;
}

function emitWithAck<T>(event: keyof RoomsClientEvents, payload?: unknown): Promise<T> {
  const activeSocket = socket;
  if (!activeSocket) {
    return Promise.reject(new Error('Socket de salas no inicializado'));
  }

  return new Promise<T>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      clearTimeout(timer);
      (activeSocket as unknown as { off: (ev: string, cb: (data: unknown) => void) => void })
        .off('exception', onException);
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Tiempo de espera en evento de salas'));
    }, DEFAULT_TIMEOUT_MS + 500);

    const onException = (data: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(extractWsErrorMessage(data)));
    };

    (activeSocket as unknown as { once: (ev: string, cb: (data: unknown) => void) => void })
      .once('exception', onException);

    const socketWithTimeout = activeSocket.timeout(DEFAULT_TIMEOUT_MS) as unknown as {
      emit: (
        eventName: string,
        eventPayload: unknown,
        callback: (err: Error | null, response: T) => void,
      ) => void;
    };

    socketWithTimeout.emit(
      String(event),
      payload,
      (err: Error | null, response: T) => {
        if (settled) return;
        settled = true;
        cleanup();

        if (err) {
          reject(err);
          return;
        }

        resolve(response);
      },
    );
  });
}

export async function connectRoomsSocket(auth?: SocketAuthOptions): Promise<RoomsSocket> {
  return ensureSocketConnected(auth);
}

export function getRoomsSocket(): RoomsSocket | null {
  return socket;
}

export function disconnectRoomsSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    lastRoomState = null;
    lastGameStartData = null;
    lastTurnoIniciadoData = null;
    lastCreateRoomWarning = null;
  }
}

export async function createRoom(
  payload: CreateRoomPayload,
  auth?: SocketAuthOptions,
): Promise<{ roomCode: string; roomName: string }> {
  await ensureSocketConnected(auth);
  const res = await emitWithAck<CreateRoomResponse>('rooms:create', payload);
  lastCreateRoomWarning = res.warning ?? null;
  return { roomCode: res.roomCode, roomName: res.roomName };
}

export async function joinRoom(
  roomCode: string,
  auth?: SocketAuthOptions,
): Promise<{ roomCode: string; roomName: string }> {
  await ensureSocketConnected(auth);
  const res = await emitWithAck<JoinRoomResponse>('rooms:join', { roomCode });
  return { roomCode: res.roomCode, roomName: res.roomName };
}

export async function listPublicRooms(auth?: SocketAuthOptions): Promise<PublicRoomSummary[]> {
  await ensureSocketConnected(auth);
  const res = await emitWithAck<ListPublicRoomsResponse>('rooms:list-public');
  return res.rooms;
}

export async function leaveRoom(auth?: SocketAuthOptions): Promise<void> {
  await ensureSocketConnected(auth);
  await emitWithAck<LeaveRoomResponse>('rooms:leave');
  lastRoomState = null;
}

export async function startRoom(roomCode: string, auth?: SocketAuthOptions): Promise<void> {
  await ensureSocketConnected(auth);
  await emitWithAck<StartRoomResponse>('rooms:start', { roomCode });
}
