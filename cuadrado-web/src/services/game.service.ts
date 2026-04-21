// services/game.service.ts - Capa WebSocket para eventos de partida.
//
// Reutiliza el socket de salas (mismo namespace) vía getRoomsSocket().
// Todos los emit/on de game:* pasan por aquí.

import { getRoomsSocket } from './room.service';
import type {
  EvInicioPartida,
  EvTurnoIniciado,
  EvCartaRobada,
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
} from '../types/game.types';

// ── Subscripciones ────────────────────────────────────────────────────────────

export interface GameEventHandlers {
  onInicioPartida?: (data: EvInicioPartida) => void;
  onTurnoIniciado?: (data: EvTurnoIniciado) => void;
  onCartaRobada?: (data: EvCartaRobada) => void;
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
  onIntercambioRival?: (data: { gameId: string; usuarioIniciador: string }) => void;
  onSeHaHechoRobarCarta?: (data: { partidaId: string; remitente: string; destinatario: string }) => void;
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
  reg('game:intercambio-rival', handlers.onIntercambioRival);
  reg('game:se-ha-hecho-robar-carta', handlers.onSeHaHechoRobarCarta);
  reg('game:bot-roba-carta', handlers.onBotRobaCarta);
  reg('game:bot-descarta-pendiente', handlers.onBotDescartaPendiente);
  reg('game:bot-intercambia-cartas', handlers.onBotIntercambiaCartas);
  reg('game:bot-ver-carta', handlers.onBotVerCarta);
  reg('game:bot-ver-carta-propia-y-rival', handlers.onBotVerCartaPropiaYRival);
  reg('game:bot-jugador-menos-puntuacion', handlers.onBotJugadorMenosPuntuacion);
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
};
