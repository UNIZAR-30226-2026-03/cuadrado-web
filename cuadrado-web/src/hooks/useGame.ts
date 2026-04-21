// hooks/useGame.ts - Estadio 0: estado minimo y sincronizacion por eventos reales.

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  gameActions,
  subscribeToGameEvents,
  unsubscribeFromGameEvents,
} from '../services/game.service';
import { getLastGameStartData, getLastTurnoIniciadoData } from '../services/room.service';
import type {
  Card,
  EvCartaRobada,
  EvDecisionRequerida,
  EvDescartarPendiente,
  EvInicioPartida,
  EvPartidaFinalizada,
  EvTurnoIniciado,
} from '../types/game.types';

const INITIAL_HAND_COUNT = 4;
const DEFAULT_DECK_COUNT = 52;
const MAX_DEBUG_EVENTS = 200;

export interface Stage0PlayerState {
  userId: string;
  name: string;
  isBot: boolean;
  isMe: boolean;
  cardCount: number;
}

export interface Stage0GameState {
  gameId: string;
  players: Stage0PlayerState[];
  activePlayerId: string | null;
  phase: 'WAIT_DRAW' | 'WAIT_DECISION' | null;
  deckCount: number;
  pendingCard: Card | null;
  topDiscardCard: Card | null;
  result: EvPartidaFinalizada | null;
}

export interface Stage0DebugEvent {
  event: string;
  payload: unknown;
  receivedAt: number;
}

interface ReducerState {
  game: Stage0GameState;
}

type ReducerAction =
  | { type: 'INIT_FROM_START'; payload: EvInicioPartida; myUserId: string; turno: EvTurnoIniciado | null }
  | { type: 'INICIO_PARTIDA'; payload: EvInicioPartida; myUserId: string }
  | { type: 'TURNO_INICIADO'; payload: EvTurnoIniciado }
  | { type: 'CARTA_ROBADA'; payload: EvCartaRobada }
  | { type: 'DECISION_REQUERIDA'; payload: EvDecisionRequerida }
  | { type: 'DESCARTAR_PENDIENTE'; payload: EvDescartarPendiente; fallbackPlayerIndex: number | null }
  | { type: 'PARTIDA_FINALIZADA'; payload: EvPartidaFinalizada };

function createEmptyGameState(): Stage0GameState {
  return {
    gameId: '',
    players: [],
    activePlayerId: null,
    phase: null,
    deckCount: DEFAULT_DECK_COUNT,
    pendingCard: null,
    topDiscardCard: null,
    result: null,
  };
}

/** Construye el estado inicial de jugadores con la informacion del evento de inicio. */
function buildPlayers(payload: EvInicioPartida, myUserId: string): Stage0PlayerState[] {
  return payload.jugadores.map((userId, index) => {
    const detail = payload.jugadoresDetalle[index];
    const isBot = detail?.controlador === 'bot';

    return {
      userId,
      isBot,
      isMe: userId === myUserId,
      name: isBot ? (detail?.nombreEnPartida ?? `Bot ${index + 1}`) : userId,
      cardCount: INITIAL_HAND_COUNT,
    };
  });
}

/** Determina que jugador debe perder una carta tras descartar pendiente. */
function resolveDiscardPlayerIndex(state: Stage0GameState, fallbackPlayerIndex: number | null): number {
  // El descarte pendiente corresponde al ultimo jugador que robo carta.
  if (fallbackPlayerIndex !== null && fallbackPlayerIndex >= 0) {
    return fallbackPlayerIndex;
  }

  if (state.activePlayerId) {
    const fromActive = state.players.findIndex((player) => player.userId === state.activePlayerId);
    if (fromActive >= 0) {
      return fromActive;
    }
  }

  return -1;
}

/** Reducer de Estadio 0: estado pequeño y transiciones transparentes. */
function reducer(state: ReducerState, action: ReducerAction): ReducerState {
  switch (action.type) {
    case 'INIT_FROM_START': {
      const players = buildPlayers(action.payload, action.myUserId);
      const game: Stage0GameState = {
        ...createEmptyGameState(),
        gameId: action.payload.partidaId,
        players,
        activePlayerId: action.turno?.userId ?? null,
        phase: action.turno?.phase ?? null,
      };

      return { game };
    }

    case 'INICIO_PARTIDA': {
      const players = buildPlayers(action.payload, action.myUserId);

      return {
        game: {
          ...createEmptyGameState(),
          gameId: action.payload.partidaId,
          players,
        },
      };
    }

    case 'TURNO_INICIADO':
      return {
        game: {
          ...state.game,
          gameId: state.game.gameId || action.payload.gameId,
          activePlayerId: action.payload.userId,
          phase: action.payload.phase,
          pendingCard: null,
        },
      };

    case 'CARTA_ROBADA': {
      const updatedPlayers = state.game.players.map((player, index) => {
        if (index !== action.payload.jugadorRobado) {
          return player;
        }

        return {
          ...player,
          cardCount: player.cardCount + 1,
        };
      });

      return {
        game: {
          ...state.game,
          players: updatedPlayers,
          deckCount: action.payload.cartasRestantes,
        },
      };
    }

    case 'DECISION_REQUERIDA':
      return {
        game: {
          ...state.game,
          gameId: state.game.gameId || action.payload.gameId,
          phase: 'WAIT_DECISION',
          pendingCard: action.payload.game ?? null,
        },
      };

    case 'DESCARTAR_PENDIENTE': {
      const playerIndex = resolveDiscardPlayerIndex(state.game, action.fallbackPlayerIndex);

      const updatedPlayers = state.game.players.map((player, index) => {
        if (index !== playerIndex) {
          return player;
        }

        return {
          ...player,
          cardCount: Math.max(0, player.cardCount - 1),
        };
      });

      return {
        game: {
          ...state.game,
          players: updatedPlayers,
          pendingCard: null,
          topDiscardCard: action.payload.carta,
          phase: 'WAIT_DRAW',
        },
      };
    }

    case 'PARTIDA_FINALIZADA':
      return {
        game: {
          ...state.game,
          result: action.payload,
          phase: null,
          pendingCard: null,
        },
      };

    default:
      return state;
  }
}

export interface UseGameReturn {
  state: Stage0GameState;
  myPlayer: Stage0PlayerState | null;
  isMyTurn: boolean;
  canDrawCard: boolean;
  canResolvePending: boolean;
  selectableHandCount: number;
  debugEvents: Stage0DebugEvent[];
  drawCard: () => void;
  discardPending: () => void;
  swapWithPending: (cardIndex: number) => void;
  clearDebugEvents: () => void;
}

export function useGame(myUserId: string): UseGameReturn {
  const [state, dispatch] = useReducer(reducer, { game: createEmptyGameState() });
  const [debugEvents, setDebugEvents] = useState<Stage0DebugEvent[]>(() => {
    if (!import.meta.env.DEV) {
      return [];
    }

    const events: Stage0DebugEvent[] = [];
    const cachedStart = getLastGameStartData();
    const cachedTurn = getLastTurnoIniciadoData();

    if (cachedStart) {
      events.push({
        event: 'cache:game:inicio-partida',
        payload: cachedStart,
        receivedAt: Date.now(),
      });
    }

    if (cachedTurn) {
      events.push({
        event: 'cache:game:turno-iniciado',
        payload: cachedTurn,
        receivedAt: Date.now(),
      });
    }

    return events;
  });
  const lastDrawPlayerIndexRef = useRef<number | null>(null);

  const pushDebugEvent = useCallback((event: string, payload: unknown) => {
    if (!import.meta.env.DEV) {
      return;
    }

    setDebugEvents((prev) => {
      const next = [...prev, { event, payload, receivedAt: Date.now() }];
      if (next.length <= MAX_DEBUG_EVENTS) {
        return next;
      }
      return next.slice(next.length - MAX_DEBUG_EVENTS);
    });
  }, []);

  useEffect(() => {
    const cachedStart = getLastGameStartData();
    if (!cachedStart) {
      return;
    }

    const cachedTurn = getLastTurnoIniciadoData();

    dispatch({
      type: 'INIT_FROM_START',
      payload: cachedStart as EvInicioPartida,
      myUserId,
      turno: (cachedTurn as EvTurnoIniciado | null) ?? null,
    });
  }, [myUserId]);

  useEffect(() => {
    unsubscribeFromGameEvents();

    subscribeToGameEvents({
      onInicioPartida: (payload) => {
        pushDebugEvent('game:inicio-partida', payload);
        dispatch({ type: 'INICIO_PARTIDA', payload, myUserId });
      },
      onTurnoIniciado: (payload) => {
        pushDebugEvent('game:turno-iniciado', payload);
        dispatch({ type: 'TURNO_INICIADO', payload });
      },
      onCartaRobada: (payload) => {
        pushDebugEvent('game:carta-robada', payload);
        lastDrawPlayerIndexRef.current = payload.jugadorRobado;
        dispatch({ type: 'CARTA_ROBADA', payload });
      },
      onDecisionRequerida: (payload) => {
        pushDebugEvent('game:decision-requerida', payload);
        dispatch({ type: 'DECISION_REQUERIDA', payload });
      },
      onDescartarPendiente: (payload) => {
        pushDebugEvent('game:descartar-pendiente', payload);
        dispatch({
          type: 'DESCARTAR_PENDIENTE',
          payload,
          fallbackPlayerIndex: lastDrawPlayerIndexRef.current,
        });
        lastDrawPlayerIndexRef.current = null;
      },
      onPartidaFinalizada: (payload) => {
        pushDebugEvent('game:partida-finalizada', payload);
        dispatch({ type: 'PARTIDA_FINALIZADA', payload });
      },
      onBotRobaCarta: (payload) => {
        pushDebugEvent('game:bot-roba-carta', payload);
      },
      onBotDescartaPendiente: (payload) => {
        pushDebugEvent('game:bot-descarta-pendiente', payload);
      },
      onBotIntercambiaCartas: (payload) => {
        pushDebugEvent('game:bot-intercambia-cartas', payload);
      },
      onBotVerCarta: (payload) => {
        pushDebugEvent('game:bot-ver-carta', payload);
      },
      onBotVerCartaPropiaYRival: (payload) => {
        pushDebugEvent('game:bot-ver-carta-propia-y-rival', payload);
      },
      onBotJugadorMenosPuntuacion: (payload) => {
        pushDebugEvent('game:bot-jugador-menos-puntuacion', payload);
      },
    });

    return () => {
      unsubscribeFromGameEvents();
    };
  }, [myUserId, pushDebugEvent]);

  const gameState = state.game;
  const myPlayer = gameState.players.find((player) => player.isMe) ?? null;

  const isMyTurn = Boolean(gameState.activePlayerId && gameState.activePlayerId === myUserId);
  const canDrawCard = Boolean(gameState.gameId) && isMyTurn && gameState.phase === 'WAIT_DRAW' && !gameState.pendingCard;
  const canResolvePending = Boolean(gameState.gameId) && isMyTurn && gameState.phase === 'WAIT_DECISION' && Boolean(gameState.pendingCard);
  const selectableHandCount = Math.max(0, (myPlayer?.cardCount ?? 0) - (gameState.pendingCard ? 1 : 0));

  const drawCard = useCallback(() => {
    if (!canDrawCard || !gameState.gameId) {
      return;
    }
    gameActions.robarCarta(gameState.gameId);
  }, [canDrawCard, gameState.gameId]);

  const discardPending = useCallback(() => {
    if (!canResolvePending || !gameState.gameId) {
      return;
    }
    gameActions.descartarPendiente(gameState.gameId);
  }, [canResolvePending, gameState.gameId]);

  const swapWithPending = useCallback((cardIndex: number) => {
    if (!canResolvePending || !gameState.gameId) {
      return;
    }
    if (cardIndex < 0 || cardIndex >= selectableHandCount) {
      return;
    }
    gameActions.cartaPorPendiente(gameState.gameId, cardIndex);
  }, [canResolvePending, gameState.gameId, selectableHandCount]);

  const clearDebugEvents = useCallback(() => {
    setDebugEvents([]);
  }, []);

  return {
    state: gameState,
    myPlayer,
    isMyTurn,
    canDrawCard,
    canResolvePending,
    selectableHandCount,
    debugEvents,
    drawCard,
    discardPending,
    swapWithPending,
    clearDebugEvents,
  };
}
