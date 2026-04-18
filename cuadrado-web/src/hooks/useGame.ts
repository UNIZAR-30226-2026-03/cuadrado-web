// hooks/useGame.ts - Hook principal de estado de la partida en curso.
//
// Inicializa el estado desde datos cacheados en room.service (para no perder
// los eventos de inicio enviados antes de montar GamePage), luego escucha
// todos los eventos WebSocket de juego y actualiza el estado via useReducer.

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { getAccessToken } from '../utils/token';
import {
  getLastGameStartData,
  getLastTurnoIniciadoData,
} from '../services/room.service';
import {
  subscribeToGameEvents,
  unsubscribeFromGameEvents,
  gameActions,
} from '../services/game.service';
import { getEquipped } from '../services/skin.service';
import { DEFAULT_AVATAR_URL, DEFAULT_CARD_URL } from '../config/skinDefaults';
import type {
  GameState,
  GamePlayerState,
  EvInicioPartida,
  EvTurnoIniciado,
  EvCartaRobada,
  EvDecisionRequerida,
  EvDescartarPendiente,
  EvIntercambioCartas,
  EvPartidaFinalizada,
  EvCuboActivado,
  EvMazoRebarajado,
  EvCartasRevealedTodos,
  EvCartaRevelada,
  CartaRevelada,
  PendingSkill,
} from '../types/game.types';

const INITIAL_CARD_COUNT = 4;
const REVEALED_CARDS_DISPLAY_MS = 4500;

// ── Estado inicial ────────────────────────────────────────────────────────────

function makeEmpty(): GameState {
  return {
    gameId: '',
    players: [],
    turnIndex: 0,
    activePlayerId: null,
    phase: null,
    turnDeadlineAt: null,
    deckCount: 52,
    cuboActive: false,
    cuboTurnosRestantes: 0,
    pendingCard: null,
    pendingSkill: null,
    revealedCards: [],
    peekedCard: null,
    result: null,
    lastDiscardedCard: null,
    lastDiscardPlayerId: null,
  };
}

// ── Mapeo carta → tipo de skill ───────────────────────────────────────────────

function cardToSkillTipo(carta: number): PendingSkill['tipo'] | null {
  switch (carta) {
    case 1:  return 'intercambiar-todas';
    case 2:  return 'hacer-robar-carta';
    case 3:  return 'proteger-carta';
    case 4:  return 'saltar-turno';
    case 5:  return 'ver-carta-todos';
    case 9:  return 'intercambiar-carta-preparar';
    case 10: return 'ver-carta-propia';
    case 11: return 'ver-carta-propia-y-rival';
    // Cartas 6, 7, 8, 12: el backend las resuelve automáticamente (sin-efecto-inmediato o roba-y-sigue)
    default: return null;
  }
}

// ── Reducer ───────────────────────────────────────────────────────────────────

type Action =
  | { type: 'INIT'; state: GameState }
  | { type: 'TURNO_INICIADO'; data: EvTurnoIniciado }
  | { type: 'CARTA_ROBADA'; data: EvCartaRobada }
  | { type: 'DECISION_REQUERIDA'; data: EvDecisionRequerida }
  | { type: 'DESCARTAR_PENDIENTE'; data: EvDescartarPendiente; playerIndex: number }
  | { type: 'INTERCAMBIO_CARTAS'; data: EvIntercambioCartas }
  | { type: 'PARTIDA_FINALIZADA'; data: EvPartidaFinalizada }
  | { type: 'CUBO_ACTIVADO'; data: EvCuboActivado }
  | { type: 'MAZO_REBARAJADO'; data: EvMazoRebarajado }
  | { type: 'CARTAS_REVEALED'; revealed: CartaRevelada[] }
  | { type: 'CLEAR_REVEALED' }
  | { type: 'SET_PEEKED_CARD'; data: EvCartaRevelada | null }
  | { type: 'SET_PENDING_SKILL'; skill: PendingSkill | null }
  | { type: 'UPDATE_SKINS'; userId: string; avatarUrl: string | null; cardSkinUrl: string | null }
  | { type: 'ROBAR_FORZADO'; destinatario: string };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'INIT':
      return action.state;

    case 'TURNO_INICIADO':
      return {
        ...state,
        turnIndex: action.data.turn,
        activePlayerId: action.data.userId,
        phase: action.data.phase,
        turnDeadlineAt: action.data.turnDeadlineAt,
        pendingCard: null,
        pendingSkill: null,
      };

    case 'CARTA_ROBADA': {
      const players = state.players.map((p, i) =>
        i === action.data.jugadorRobado ? { ...p, cardCount: p.cardCount + 1 } : p
      );
      return { ...state, players, deckCount: action.data.cartasRestantes };
    }

    case 'DECISION_REQUERIDA':
      return { ...state, phase: 'WAIT_DECISION', pendingCard: action.data.game ?? null };

    case 'DESCARTAR_PENDIENTE': {
      const { playerIndex, data } = action;
      const players = state.players.map((p, i) =>
        i === playerIndex ? { ...p, cardCount: Math.max(0, p.cardCount - 1) } : p
      );
      return {
        ...state,
        players,
        pendingCard: null,
        lastDiscardedCard: data.carta,
        lastDiscardPlayerId: state.players[playerIndex]?.userId ?? null,
      };
    }

    case 'INTERCAMBIO_CARTAS':
      return state; // los conteos no cambian, solo posiciones internas

    case 'PARTIDA_FINALIZADA':
      return { ...state, result: action.data, phase: null };

    case 'CUBO_ACTIVADO':
      return { ...state, cuboActive: true, cuboTurnosRestantes: action.data.turnosRestantes };

    case 'MAZO_REBARAJADO':
      return { ...state, deckCount: action.data.cantidadCartasMazo };

    case 'CARTAS_REVEALED':
      return { ...state, revealedCards: action.revealed };

    case 'CLEAR_REVEALED':
      return { ...state, revealedCards: [] };

    case 'SET_PEEKED_CARD':
      return { ...state, peekedCard: action.data };

    case 'SET_PENDING_SKILL':
      return { ...state, pendingSkill: action.skill };

    case 'UPDATE_SKINS': {
      const players = state.players.map(p =>
        p.userId === action.userId
          ? { ...p, avatarUrl: action.avatarUrl, cardSkinUrl: action.cardSkinUrl }
          : p
      );
      return { ...state, players };
    }

    case 'ROBAR_FORZADO': {
      const players = state.players.map(p =>
        p.userId === action.destinatario ? { ...p, cardCount: p.cardCount + 1 } : p
      );
      return { ...state, players };
    }

    default:
      return state;
  }
}

// ── Helpers de construcción de estado ─────────────────────────────────────────

function buildPlayers(
  jugadores: string[],
  jugadoresDetalle: EvInicioPartida['jugadoresDetalle'],
  myUserId: string,
): GamePlayerState[] {
  return jugadores.map((userId, i) => {
    const det = jugadoresDetalle[i];
    return {
      userId,
      name: det?.controlador === 'bot'
        ? (det.nombreEnPartida ?? `Bot ${i + 1}`)
        : userId,
      cardCount: INITIAL_CARD_COUNT,
      isBot: det?.controlador === 'bot',
      avatarUrl: DEFAULT_AVATAR_URL,
      cardSkinUrl: DEFAULT_CARD_URL,
      isMe: userId === myUserId,
    };
  });
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseGameReturn {
  gameState: GameState;
  tapeteUrl: string | null;
  isMyTurn: boolean;
  canDrawCard: boolean;
  activePlayer: GamePlayerState | null;
  actions: typeof gameActions;
  setPendingSkill: (skill: PendingSkill | null) => void;
}

export function useGame(myUserId: string): UseGameReturn {
  const [gameState, dispatch] = useReducer(reducer, undefined, makeEmpty);

  // Tapete del jugador local: estado separado para disparar re-render al cargar
  const [tapeteUrl, setTapeteUrl] = useState<string | null>(null);

  // Índice del jugador que robó la última carta (para atribuir el descarte)
  const lastDrawIndexRef = useRef<number>(-1);

  function loadSkinsForAll(jugadores: string[], me: string) {
    const token = getAccessToken();
    if (!token) return;
    jugadores.forEach(uid => {
      const isMe = uid === me;
      getEquipped(token, isMe ? undefined : uid)
        .then(skins => {
          if (isMe) setTapeteUrl(skins.tapete);
          dispatch({
            type: 'UPDATE_SKINS',
            userId: uid,
            avatarUrl: skins.avatar,
            cardSkinUrl: skins.carta,
          });
        })
        .catch(() => {});
    });
  }

  // ── Bootstrap desde caché ──────────────────────────────────────────────
  useEffect(() => {
    const cached = getLastGameStartData();
    if (!cached) return;

    const turno = getLastTurnoIniciadoData();
    const players = buildPlayers(cached.jugadores, cached.jugadoresDetalle, myUserId);

    dispatch({
      type: 'INIT',
      state: {
        ...makeEmpty(),
        gameId: cached.partidaId,
        players,
        turnIndex: turno?.turn ?? 0,
        activePlayerId: turno?.userId ?? null,
        phase: turno?.phase ?? null,
        turnDeadlineAt: turno?.turnDeadlineAt ?? null,
      },
    });

    loadSkinsForAll(cached.jugadores, myUserId);
  }, [myUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Suscripción a eventos de partida ───────────────────────────────────
  useEffect(() => {
    subscribeToGameEvents({
      onInicioPartida: (data) => {
        const players = buildPlayers(data.jugadores, data.jugadoresDetalle, myUserId);
        dispatch({
          type: 'INIT',
          state: { ...makeEmpty(), gameId: data.partidaId, players },
        });
        loadSkinsForAll(data.jugadores, myUserId);
      },

      onTurnoIniciado: (data) => {
        dispatch({ type: 'TURNO_INICIADO', data });
      },

      onCartaRobada: (data) => {
        lastDrawIndexRef.current = data.jugadorRobado;
        dispatch({ type: 'CARTA_ROBADA', data });
      },

      onDecisionRequerida: (data) => {
        dispatch({ type: 'DECISION_REQUERIDA', data });
      },

      onDescartarPendiente: (data) => {
        const idx = lastDrawIndexRef.current >= 0 ? lastDrawIndexRef.current : 0;
        dispatch({ type: 'DESCARTAR_PENDIENTE', data, playerIndex: idx });
        lastDrawIndexRef.current = -1;
      },

      onIntercambioCartas: (data) => {
        dispatch({ type: 'INTERCAMBIO_CARTAS', data });
      },

      onTurnoExpirado: () => {
        // El backend ya avanzará el turno y emitirá turno-iniciado
        dispatch({ type: 'SET_PENDING_SKILL', skill: null });
      },

      onPartidaFinalizada: (data) => {
        dispatch({ type: 'PARTIDA_FINALIZADA', data });
      },

      onCuboActivado: (data) => {
        dispatch({ type: 'CUBO_ACTIVADO', data });
      },

      onMazoRebarajado: (data) => {
        dispatch({ type: 'MAZO_REBARAJADO', data });
      },

      onCartasRevealedTodos: (data: EvCartasRevealedTodos) => {
        dispatch({ type: 'CARTAS_REVEALED', revealed: data.cartasReveladas });
        setTimeout(() => dispatch({ type: 'CLEAR_REVEALED' }), REVEALED_CARDS_DISPLAY_MS);
      },

      onCartaRevelada: (data: EvCartaRevelada) => {
        dispatch({ type: 'SET_PEEKED_CARD', data });
        setTimeout(() => dispatch({ type: 'SET_PEEKED_CARD', data: null }), REVEALED_CARDS_DISPLAY_MS);
      },

      onIntercambioRival: (data) => {
        dispatch({
          type: 'SET_PENDING_SKILL',
          skill: {
            tipo: 'intercambiar-carta-rival',
            rivalId: data.usuarioIniciador,
            gameId: data.gameId,
          },
        });
      },

      onSeHaHechoRobarCarta: (data) => {
        dispatch({ type: 'ROBAR_FORZADO', destinatario: data.destinatario });
      },

      onHabilidadDenegada: () => {
        dispatch({ type: 'SET_PENDING_SKILL', skill: null });
      },
    });

    return () => {
      unsubscribeFromGameEvents();
    };
  }, [myUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Inferir skill pendiente cuando yo descarto ─────────────────────────
  useEffect(() => {
    const { lastDiscardedCard, lastDiscardPlayerId, gameId } = gameState;
    if (!lastDiscardedCard || !lastDiscardPlayerId) return;
    if (lastDiscardPlayerId !== myUserId) return;

    const tipo = cardToSkillTipo(lastDiscardedCard.carta);
    if (!tipo) return;

    dispatch({ type: 'SET_PENDING_SKILL', skill: { tipo, gameId } });
  }, [gameState.lastDiscardedCard, gameState.lastDiscardPlayerId, myUserId, gameState.gameId]);

  // ── Derived state ──────────────────────────────────────────────────────
  const myPlayer = gameState.players.find(p => p.isMe) ?? null;
  const isMyTurn = !!gameState.activePlayerId && gameState.activePlayerId === myUserId;
  const canDrawCard = isMyTurn && gameState.phase === 'WAIT_DRAW' && (myPlayer?.cardCount ?? 0) < 6;
  const activePlayer = gameState.activePlayerId
    ? (gameState.players.find(p => p.userId === gameState.activePlayerId) ?? null)
    : null;

  const setPendingSkill = useCallback((skill: PendingSkill | null) => {
    dispatch({ type: 'SET_PENDING_SKILL', skill });
  }, []);

  return {
    gameState,
    tapeteUrl,
    isMyTurn,
    canDrawCard,
    activePlayer,
    actions: gameActions,
    setPendingSkill,
  };
}
