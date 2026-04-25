// services/game.service.ts - Capa WebSocket para eventos de partida.
//
// Reutiliza el socket de salas (mismo namespace) vía getRoomsSocket().
// Todos los emit/on de game:* pasan por aquí.

import { connectRoomsSocket, getRoomsSocket } from './room.service';
import type {
  EvInicioPartida,
  EvTurnoIniciado,
  EvCartaRobada,
  EvCartaRobadaPorDescartar6,
  EvDecisionRequerida,
  EvDescartarPendiente,
  EvIntercambioCartas,
  EvTurnoExpirado,
  EvPartidaFinalizada,
  EvCuboActivado,
  EvMazoRebarajado,
  EvCartasRevealedTodos,
  EvCartaRevelada,
  EvHabilidadDenegada,
  EvRevanchaEstado,
  EvJugadorMenosPuntuacionCalculado,
  EvPoder8Estado,
} from '../types/game.types';

// ── Subscripciones ────────────────────────────────────────────────────────────

export interface GameEventHandlers {
  onInicioPartida?: (data: EvInicioPartida) => void;
  onTurnoIniciado?: (data: EvTurnoIniciado) => void;
  onCartaRobada?: (data: EvCartaRobada) => void;
  onCartaRobadaPorDescartar6?: (data: EvCartaRobadaPorDescartar6) => void;
  onDecisionRequerida?: (data: EvDecisionRequerida) => void;
  onDescartarPendiente?: (data: EvDescartarPendiente) => void;
  onIntercambioCartas?: (data: EvIntercambioCartas) => void;
  onTurnoExpirado?: (data: EvTurnoExpirado) => void;
  onPartidaFinalizada?: (data: EvPartidaFinalizada) => void;
  onCuboActivado?: (data: EvCuboActivado) => void;
  onMazoRebarajado?: (data: EvMazoRebarajado) => void;
  onCartasRevealedTodos?: (data: EvCartasRevealedTodos) => void;
  onCartaRevelada?: (data: EvCartaRevelada) => void;
  onHabilidadDenegada?: (data: EvHabilidadDenegada) => void;
  onRevanchaEstado?: (data: EvRevanchaEstado) => void;
  onIntercambioRival?: (data: { gameId: string; usuarioIniciador: string }) => void;
  onSeHaHechoRobarCarta?: (data: { partidaId: string; remitente: string; destinatario: string }) => void;
  onCartaProtegida?: (data: { gameId: string; jugadorId: string; cartaIndex: number }) => void;
  onBotRobaCarta?: (data: { gameId: string; botId: string }) => void;
  onBotDescartaPendiente?: (data: { gameId: string; botId: string }) => void;
  onBotIntercambiaCartas?: (data: { gameId: string; botId: string }) => void;
  onBotVerCarta?: (data: { gameId: string; botId: string; cartaIndex: number }) => void;
  onBotVerCartaPropiaYRival?: (data: {
    gameId: string;
    botId: string;
    rivalId: string;
    cartaIndex: number;
    cartaIndexRival: number;
  }) => void;
  onBotJugadorMenosPuntuacion?: (data: { gameId: string; botId: string; jugadorId: string }) => void;
  /** Respuesta privada al activar poder 7 — solo la recibe el jugador que lo activó */
  onJugadorMenosPuntuacionCalculado?: (data: EvJugadorMenosPuntuacionCalculado) => void;
  /** Estado global del poder 8 activo (anulaciones pendientes) */
  onPoder8Estado?: (data: EvPoder8Estado) => void;
}

export interface SavedGameSummary {
  gameId: string;
  creatorId: string;
  roomName: string;
  updatedAt: string;
  players: string[];
}

interface SavedGamesResponse {
  success: true;
  [key: string]: unknown;
}

const DEFAULT_TIMEOUT_MS = 8000;

function extractSavedGameSummary(entry: unknown): SavedGameSummary | null {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const record = entry as Record<string, unknown>;
  const gameId = typeof record.gameId === 'string' ? record.gameId : '';
  const creatorId = typeof record.creatorId === 'string' ? record.creatorId : '';
  const roomName = typeof record.roomName === 'string'
    ? record.roomName
    : typeof record.name === 'string'
      ? record.name
      : '';
  const updatedAt = typeof record.updatedAt === 'string' ? record.updatedAt : '';
  const rawPlayers = Array.isArray(record.players) ? record.players : [];
  const players = rawPlayers.filter((player): player is string => typeof player === 'string');

  if (!gameId || !creatorId || !roomName || !updatedAt) {
    return null;
  }

  return { gameId, creatorId, roomName, updatedAt, players };
}

function normalizeSavedGamesResponse(response: unknown): SavedGameSummary[] {
  if (Array.isArray(response)) {
    return response
      .map(entry => extractSavedGameSummary(entry))
      .filter((summary): summary is SavedGameSummary => Boolean(summary));
  }

  if (!response || typeof response !== 'object') {
    return [];
  }

  const record = response as Record<string, unknown>;
  const candidateLists = [
    record.partidasGuardadas,
    record.savedGames,
    record.savedRooms,
    record.games,
    record.rooms,
    record.partidas,
  ];

  for (const candidate of candidateLists) {
    if (!Array.isArray(candidate)) continue;
    return candidate
      .map(entry => extractSavedGameSummary(entry))
      .filter((summary): summary is SavedGameSummary => Boolean(summary));
  }

  return [];
}

let lastSavedGameSummary: SavedGameSummary | null = null;

export function getLastSavedGameSummary(): SavedGameSummary | null {
  return lastSavedGameSummary;
}

export function setLastSavedGameSummary(summary: SavedGameSummary | null): void {
  lastSavedGameSummary = summary;
}

export function clearLastSavedGameSummary(): void {
  lastSavedGameSummary = null;
}

async function emitWithAck<T>(event: string, payload?: unknown): Promise<T> {
  const socket = getRoomsSocket();
  if (!socket) {
    throw new Error('Socket de salas no inicializado');
  }

  return new Promise<T>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      clearTimeout(timer);
      (socket as unknown as { off: (ev: string, cb: (data: unknown) => void) => void })
        .off('exception', onException);
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Tiempo de espera en evento de partida'));
    }, DEFAULT_TIMEOUT_MS + 500);

    const onException = (data: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();

      if (typeof data === 'string') {
        reject(new Error(data));
        return;
      }

      if (data && typeof data === 'object') {
        const message = (data as { message?: unknown }).message;
        if (typeof message === 'string') {
          reject(new Error(message));
          return;
        }
      }

      reject(new Error('Error de socket en partida'));
    };

    (socket as unknown as { once: (ev: string, cb: (data: unknown) => void) => void })
      .once('exception', onException);

    const socketWithTimeout = socket.timeout(DEFAULT_TIMEOUT_MS) as unknown as {
      emit: (
        eventName: string,
        eventPayload: unknown,
        callback: (err: Error | null, response: T) => void,
      ) => void;
    };

    socketWithTimeout.emit(event, payload, (err: Error | null, response: T) => {
      if (settled) return;
      settled = true;
      cleanup();

      if (err) {
        reject(err);
        return;
      }

      resolve(response);
    });
  });
}

// Handlers activos registrados en el socket, para poder eliminarlos en cleanup
const activeHandlers = new Map<string, (data: unknown) => void>();

export function subscribeToGameEvents(handlers: GameEventHandlers): void {
  const socket = getRoomsSocket();
  if (!socket) return;

  function reg<T>(event: string, handler?: (data: T) => void): void {
    if (!handler) return;
    const wrapped = (data: unknown) => handler(data as T);
    activeHandlers.set(event, wrapped);
    socket!.on(event as never, wrapped as never);
  }

  reg('game:inicio-partida', handlers.onInicioPartida);
  reg('game:turno-iniciado', handlers.onTurnoIniciado);
  reg('game:carta-robada', handlers.onCartaRobada);
  reg('game:carta-robada-por-descartar-6', handlers.onCartaRobadaPorDescartar6);
  reg('game:decision-requerida', handlers.onDecisionRequerida);
  reg('game:descartar-pendiente', handlers.onDescartarPendiente);
  reg('game:intercambio-cartas', handlers.onIntercambioCartas);
  reg('game:turno-expirado', handlers.onTurnoExpirado);
  reg('game:partida-finalizada', handlers.onPartidaFinalizada);
  reg('game:cubo-activado', handlers.onCuboActivado);
  reg('game:mazo-rebarajado', handlers.onMazoRebarajado);
  reg('game:cartas-reveladas-todos', handlers.onCartasRevealedTodos);
  reg('game:carta-revelada', handlers.onCartaRevelada);
  reg('game:habilidad-denegada', handlers.onHabilidadDenegada);
  reg('game:revancha-estado', handlers.onRevanchaEstado);
  reg('game:intercambio-rival', handlers.onIntercambioRival);
  reg('game:se-ha-hecho-robar-carta', handlers.onSeHaHechoRobarCarta);
  reg('game:carta-protegida', handlers.onCartaProtegida);
  reg('game:bot-roba-carta', handlers.onBotRobaCarta);
  reg('game:bot-descarta-pendiente', handlers.onBotDescartaPendiente);
  reg('game:bot-intercambia-cartas', handlers.onBotIntercambiaCartas);
  reg('game:bot-ver-carta', handlers.onBotVerCarta);
  reg('game:bot-ver-carta-propia-y-rival', handlers.onBotVerCartaPropiaYRival);
  reg('game:bot-jugador-menos-puntuacion', handlers.onBotJugadorMenosPuntuacion);
  reg('game:jugador-menos-puntuacion-calculado', handlers.onJugadorMenosPuntuacionCalculado);
  reg('game:poder8-estado', handlers.onPoder8Estado);
}

export function unsubscribeFromGameEvents(): void {
  const socket = getRoomsSocket();
  if (!socket) {
    activeHandlers.clear();
    return;
  }
  for (const [event, handler] of activeHandlers.entries()) {
    socket.off(event as never, handler as never);
  }
  activeHandlers.clear();
}

export async function listSavedGames(): Promise<SavedGameSummary[]> {
  await connectRoomsSocket();
  const response = await emitWithAck<SavedGamesResponse>('game:listar-partidas-guardadas');
  return normalizeSavedGamesResponse(response);
}

// ── Acciones (cliente → servidor) ─────────────────────────────────────────────

function emit(event: string, payload?: unknown): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (getRoomsSocket() as any)?.emit(event, payload);
}

export const gameActions = {
  robarCarta: (gameId: string) =>
    emit('game:robar-carta', { gameId }),

  descartarPendiente: (gameId: string) =>
    emit('game:descartar-pendiente', { gameId }),

  cartaPorPendiente: (gameId: string, numCarta: number) =>
    emit('game:carta-por-pendiente', { gameId, numCarta }),

  verCarta: (gameId: string, indexCarta: number, playerId?: string, indexCartaPlayer?: number) =>
    emit('game:ver-carta', { gameId, indexCarta, playerId, indexCartaPlayer }),

  verCartaTodos: (gameId: string) =>
    emit('game:ver-carta-todos', { gameId }),

  prepararIntercambioCarta: (gameId: string, numCartaJugador: number, rivalId: string) =>
    emit('game:preparar-intercambio-carta', { gameId, numCartaJugador, rivalId }),

  intercambiarCartaInteractivo: (gameId: string, numCartaJugador: number, rivalId: string) =>
    emit('game:intercambiar-carta-interactivo', { gameId, numCartaJugador, rivalId }),

  intercambiarTodasCartas: (gameId: string, destinatarioId: string) =>
    emit('game:intercambiar-todas-cartas', { gameId, destinatarioId }),

  hacerRobarCarta: (gameId: string, adversarioId: string) =>
    emit('game:hacer-robar-carta', { gameId, adversarioId }),

  protegerCarta: (gameId: string, numCarta: number) =>
    emit('game:proteger-carta', { gameId, numCarta }),

  saltarTurnoJugador: (gameId: string, adversarioId: string) =>
    emit('game:saltar-turno-jugador', { gameId, adversarioId }),

  solicitarCubo: (gameId: string) =>
    emit('game:cubo', { gameId }),

  resolverJ: (gameId: string, intercambiar: boolean) =>
    emit('game:resolver-j', { gameId, intercambiar }),

  volverAJugar: (gameId: string) =>
    emit('game:volver-a-jugar', { gameId }),

  /** Activa el poder guardado de carta 7 (solo en WAIT_DRAW del propio turno) */
  jugadorMenosPuntuacion: (gameId: string) =>
    emit('game:jugador-menos-puntuacion', { gameId }),

  /** Activa el poder guardado de carta 8 (solo en WAIT_DRAW del propio turno) */
  desactivarProximaHabilidad: (gameId: string) =>
    emit('game:desactivar-proxima-habilidad', { gameId }),
};
