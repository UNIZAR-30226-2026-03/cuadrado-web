// services/room.service.ts - Capa WebSocket para la gestion de salas
//
// Usa socket.io-client contra los eventos definidos en el backend:
//   - rooms:create | rooms:join | rooms:list-public | rooms:leave | rooms:start
//
// Para desarrollo, Vite ya proxya /socket.io a http://localhost:3000
// (ver vite.config.ts). En prod se usa VITE_API_URL si esta definido.

import { io, type Socket } from 'socket.io-client';
import { API_URL } from './api.config';
import type {
  CreateRoomPayload,
  PublicRoomSummary,
  RoomState,
} from '../types/room.types';

interface RoomsAuth {
  accessToken?: string;
  userId?: string;
}

interface CreateRoomResponse {
  success: true;
  roomCode: string;
  roomName: string;
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

function buildHandshake(auth?: RoomsAuth): Record<string, string> {
  const payload: Record<string, string> = {};
  if (auth?.accessToken) payload.token = auth.accessToken;
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

async function ensureSocketConnected(auth?: RoomsAuth): Promise<RoomsSocket> {
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
    activeSocket
      .timeout(DEFAULT_TIMEOUT_MS)
      .emit(event as any, payload, (err: Error | null, response: T) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(response);
      });
  });
}

export async function connectRoomsSocket(auth?: RoomsAuth): Promise<RoomsSocket> {
  return ensureSocketConnected(auth);
}

export function getRoomsSocket(): RoomsSocket | null {
  return socket;
}

export function disconnectRoomsSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export async function createRoom(
  payload: CreateRoomPayload,
  auth?: RoomsAuth,
): Promise<{ roomCode: string; roomName: string }> {
  await ensureSocketConnected(auth);
  const res = await emitWithAck<CreateRoomResponse>('rooms:create', payload);
  return { roomCode: res.roomCode, roomName: res.roomName };
}

export async function joinRoom(
  roomCode: string,
  auth?: RoomsAuth,
): Promise<{ roomCode: string; roomName: string }> {
  await ensureSocketConnected(auth);
  const res = await emitWithAck<JoinRoomResponse>('rooms:join', { roomCode });
  return { roomCode: res.roomCode, roomName: res.roomName };
}

export async function listPublicRooms(auth?: RoomsAuth): Promise<PublicRoomSummary[]> {
  await ensureSocketConnected(auth);
  const res = await emitWithAck<ListPublicRoomsResponse>('rooms:list-public');
  return res.rooms;
}

export async function leaveRoom(auth?: RoomsAuth): Promise<void> {
  await ensureSocketConnected(auth);
  await emitWithAck<LeaveRoomResponse>('rooms:leave');
}

export async function startRoom(roomCode: string, auth?: RoomsAuth): Promise<void> {
  await ensureSocketConnected(auth);
  await emitWithAck<StartRoomResponse>('rooms:start', { roomCode });
}
