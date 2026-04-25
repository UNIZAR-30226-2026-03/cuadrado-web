// hooks/useGame.ts - Estadio 5: habilidades interactivas simples y complejas.

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  gameActions,
  subscribeToGameEvents,
  unsubscribeFromGameEvents,
} from '../services/game.service';
import { POWER_MAP } from '../data/cardPowers';
import { getLastGameStartData, getLastRoomState, getLastTurnoIniciadoData } from '../services/room.service';
import type {
  Card,
  CartaRevelada,
  EvCuboActivado,
  EvCartaRevelada,
  EvCartaRobada,
  EvCartaRobadaPorDescartar6,
  EvCartasRevealedTodos,
  EvDecisionRequerida,
  EvDescartarPendiente,
  EvHabilidadDenegada,
  EvInicioPartida,
  EvIntercambioCartas,
  EvJugadorMenosPuntuacionCalculado,
  EvPartidaFinalizada,
  EvPoder8Estado,
  EvRevanchaEstado,
  EvTurnoIniciado,
} from '../types/game.types';

const INITIAL_HAND_COUNT = 4;
const DEFAULT_DECK_COUNT = 52;
const MAX_DEBUG_EVENTS = 200;

// Habilidades interactivas que requieren panel de confirmación (Estadios 4 y 5).
export type InteractiveSkillType =
  | 'ver-carta-propia'
  | 'hacer-robar-carta'
  | 'proteger-carta'
  | 'saltar-turno'
  | 'intercambiar-todas'
  | 'ver-carta-todos'
  | 'ver-carta-propia-y-rival'
  | 'intercambiar-carta-preparar'
  | 'intercambiar-carta-rival';

export interface PendingInteractiveSkill {
  tipo: InteractiveSkillType;
  gameId: string;
  rivalId?: string;
}

export interface Stage0PlayerState {
  userId: string;
  name: string;
  isBot: boolean;
  isMe: boolean;
  cardCount: number;
}

export interface Stage0GameState {
  gameId: string;
  turnIndex: number;
  players: Stage0PlayerState[];
  activePlayerId: string | null;
  phase: 'WAIT_DRAW' | 'WAIT_DECISION' | null;
  turnDeadlineAt: number | null;
  deckCount: number;
  cuboActive: boolean;
  cuboTurnosRestantes: number;
  cuboSolicitanteId: string | null;
  cuboAnnouncedAt: number | null;
  pendingCard: Card | null;
  topDiscardCard: Card | null;
  lastExchange: { remitente: string; destinatario: string; at: number } | null;
  lastSkillUse: Stage0SkillUse | null;
  // Habilidad interactiva pendiente de resolucion (Estadios 4 y 5).
  pendingSkill: PendingInteractiveSkill | null;
  // Cartas reveladas al jugador local por poder 5 (una por rival).
  revealedCards: CartaRevelada[];
  // Carta/s reveladas al jugador local por poderes 10/J.
  peekedCard: EvCartaRevelada | null;
  result: EvPartidaFinalizada | null;
  rematch: Stage0RematchState;
  // Índices de cartas propias con protección activa (carta 3).
  myProtectedIndices: ReadonlySet<number>;
  // Poderes almacenados del jugador local (7 y/o 8).
  myStoredPowers: number[];
  // ID del jugador con menos puntos tras activar el poder 7. Se limpia manualmente.
  menosPuntuacionJugadorId: string | null;
  // Aviso visual temporal para el jugador local cuando le cancelan una habilidad.
  deniedSkillNotice: Stage0DeniedSkillNotice | null;
  // Estado global del poder 8 (anulaciones pendientes en la partida).
  power8PendingCount: number;
  power8QueuedCount: number;
  power8LastActivatorId: string | null;
}

export interface Stage0DeniedSkillNotice {
  eventAt: number;
  habilidad: string;
}

export interface Stage0SkillUse {
  eventAt: number;
  byUserId: string | null;
  byName: string;
  powerValue: string;
  shortDesc: string;
  trigger: 'discard' | 'auto';
}

export interface Stage0DebugEvent {
  event: string;
  payload: unknown;
  receivedAt: number;
}

export interface Stage0RematchState {
  status: 'idle' | 'waiting-host' | 'room-ready';
  hostId: string | null;
  readyPlayerIds: string[];
  roomCode: string | null;
  roomName: string | null;
}

interface ReducerState {
  game: Stage0GameState;
}

type ReducerAction =
  | { type: 'INIT_FROM_START'; payload: EvInicioPartida; myUserId: string; turno: EvTurnoIniciado | null }
  | { type: 'INICIO_PARTIDA'; payload: EvInicioPartida; myUserId: string }
  | { type: 'TURNO_INICIADO'; payload: EvTurnoIniciado }
  | { type: 'CARTA_ROBADA'; payload: EvCartaRobada }
  | { type: 'CARTA_ROBADA_POR_DESCARTAR_6'; payload: EvCartaRobadaPorDescartar6; eventAt: number }
  | { type: 'DECISION_REQUERIDA'; payload: EvDecisionRequerida }
  | {
    type: 'DESCARTAR_PENDIENTE';
    payload: EvDescartarPendiente;
    powerIsEnabled: boolean;
    preservePendingCard: boolean;
    eventAt: number;
    isMyTurn: boolean;
  }
  | { type: 'PARTIDA_FINALIZADA'; payload: EvPartidaFinalizada }
  | { type: 'REVANCHA_ESTADO'; payload: EvRevanchaEstado }
  | { type: 'CARTA_REVELADA'; payload: EvCartaRevelada }
  | { type: 'CARTAS_REVEALED_TODOS'; payload: EvCartasRevealedTodos }
  | { type: 'CUBO_ACTIVADO'; payload: EvCuboActivado; eventAt: number }
  | { type: 'INTERCAMBIO_RIVAL'; payload: { gameId: string; usuarioIniciador: string } }
  | { type: 'INTERCAMBIO_CARTAS'; payload: EvIntercambioCartas }
  | { type: 'HABILIDAD_DENEGADA'; payload: EvHabilidadDenegada; myUserId: string; eventAt: number }
  | { type: 'CLEAR_PEEKED_CARD' }
  | { type: 'CLEAR_REVEALED_CARDS' }
  | { type: 'SE_HA_HECHO_ROBAR_CARTA'; destinatarioId: string }
  | { type: 'CLEAR_PENDING_SKILL' }
  | { type: 'CARTA_PROTEGIDA'; jugadorId: string; cartaIndex: number; myUserId: string }
  | { type: 'PODER_ALMACENADO'; powerValue: number }
  | { type: 'JUGADOR_MENOS_PUNTUACION_CALCULADO'; payload: EvJugadorMenosPuntuacionCalculado }
  | { type: 'PODER8_USADO' }
  | { type: 'PODER8_ESTADO'; payload: EvPoder8Estado }
  | { type: 'CLEAR_MENOS_PUNTUACION_RESULT' }
  | { type: 'CLEAR_DENIED_SKILL_NOTICE' };

function createEmptyGameState(): Stage0GameState {
  return {
    gameId: '',
    turnIndex: 0,
    players: [],
    activePlayerId: null,
    phase: null,
    turnDeadlineAt: null,
    deckCount: DEFAULT_DECK_COUNT,
    cuboActive: false,
    cuboTurnosRestantes: 0,
    cuboSolicitanteId: null,
    cuboAnnouncedAt: null,
    pendingCard: null,
    topDiscardCard: null,
    lastExchange: null,
    lastSkillUse: null,
    pendingSkill: null,
    revealedCards: [],
    peekedCard: null,
    result: null,
    rematch: {
      status: 'idle',
      hostId: null,
      readyPlayerIds: [],
      roomCode: null,
      roomName: null,
    },
    myProtectedIndices: new Set(),
    myStoredPowers: [],
    menosPuntuacionJugadorId: null,
    deniedSkillNotice: null,
    power8PendingCount: 0,
    power8QueuedCount: 0,
    power8LastActivatorId: null,
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

function normalizeCardValue(card: Card): number | 'JOKER' {
  if (card.palo === 'joker' || card.carta >= 53) {
    return 'JOKER';
  }

  if (card.carta >= 1 && card.carta <= 13) {
    return card.carta;
  }

  return ((card.carta - 1) % 13) + 1;
}

function getPowerValueFromCard(card: Card): string | null {
  const value = normalizeCardValue(card);

  if (value === 'JOKER') {
    return null;
  }

  if (value === 1) {
    return 'A';
  }

  if (value === 11) {
    return 'J';
  }

  if (value >= 2 && value <= 10) {
    return String(value);
  }

  return null;
}

/** Devuelve el tipo de habilidad interactiva para un valor de carta, o null si no aplica. */
function getInteractiveSkillType(powerValue: string): InteractiveSkillType | null {
  switch (powerValue) {
    case '10': return 'ver-carta-propia';
    case '2': return 'hacer-robar-carta';
    case '4': return 'saltar-turno';
    case '3': return 'proteger-carta';
    case 'A': return 'intercambiar-todas';
    case '5': return 'ver-carta-todos';
    case 'J': return 'ver-carta-propia-y-rival';
    case '9': return 'intercambiar-carta-preparar';
    default: return null;
  }
}

function buildSkillUse(
  powerValue: string,
  actor: Stage0PlayerState | null,
  eventAt: number,
  trigger: Stage0SkillUse['trigger'],
): Stage0SkillUse {
  const power = POWER_MAP[powerValue];

  return {
    eventAt,
    byUserId: actor?.userId ?? null,
    byName: actor?.name ?? 'Jugador',
    powerValue,
    shortDesc: power?.shortDesc ?? 'Habilidad activada.',
    trigger,
  };
}

/** Reducer de Estadio 0-4: estado pequeño y transiciones transparentes. */
function reducer(state: ReducerState, action: ReducerAction): ReducerState {
  switch (action.type) {
    case 'INIT_FROM_START': {
      const players = buildPlayers(action.payload, action.myUserId);
      const game: Stage0GameState = {
        ...createEmptyGameState(),
        gameId: action.payload.partidaId,
        turnIndex: action.turno?.turn ?? 0,
        players,
        activePlayerId: action.turno?.userId ?? null,
        phase: action.turno?.phase ?? null,
        turnDeadlineAt: action.turno?.turnDeadlineAt ?? null,
      };

      return { game };
    }

    case 'INICIO_PARTIDA': {
      const players = buildPlayers(action.payload, action.myUserId);

      return {
        game: {
          ...createEmptyGameState(),
          gameId: action.payload.partidaId,
          turnIndex: 0,
          players,
        },
      };
    }

    case 'TURNO_INICIADO':
      return {
        game: {
          ...state.game,
          gameId: state.game.gameId || action.payload.gameId,
          turnIndex: action.payload.turn,
          activePlayerId: action.payload.userId,
          phase: action.payload.phase,
          turnDeadlineAt: action.payload.turnDeadlineAt,
          cuboTurnosRestantes: state.game.cuboActive
            ? Math.max(0, state.game.cuboTurnosRestantes - 1)
            : state.game.cuboTurnosRestantes,
          pendingCard: null,
          lastSkillUse: null,
          pendingSkill: null,
          // peekedCard NO se limpia aquí: persiste hasta que el jugador lo cierra
          // (CLEAR_PEEKED_CARD). Limpiarlo aquí causaba que carta-revelada +
          // turno-iniciado en ráfaga borrara la carta antes del primer render.
        },
      };

    case 'CARTA_ROBADA':
      return {
        game: {
          ...state.game,
          deckCount: action.payload.cartasRestantes,
        },
      };

    case 'CARTA_ROBADA_POR_DESCARTAR_6': {
      const deckCount = action.payload.reshuffle?.cantidadCartasMazo ?? state.game.deckCount;
      return {
        game: {
          ...state.game,
          gameId: state.game.gameId || action.payload.gameId,
          deckCount,
          phase: 'WAIT_DECISION',
          pendingCard: action.payload.cartaRobada,
        },
      };
    }

    case 'DECISION_REQUERIDA':
      return {
        game: {
          ...state.game,
          gameId: state.game.gameId || action.payload.gameId,
          phase: 'WAIT_DECISION',
          pendingCard: action.payload.carta ?? null,
        },
      };

    case 'DESCARTAR_PENDIENTE': {
      const keepPendingCard = action.preservePendingCard && Boolean(state.game.pendingCard);
      const actor = state.game.players.find((p) => p.userId === state.game.activePlayerId) ?? null;
      const powerValue = action.powerIsEnabled ? getPowerValueFromCard(action.payload.carta) : null;
      const skillUse = powerValue
        ? buildSkillUse(powerValue, actor, action.eventAt, 'discard')
        : state.game.lastSkillUse;

      // Las cartas interactivas (Estadios 4 y 5) abren panel de habilidad.
      const interactiveType = powerValue ? getInteractiveSkillType(powerValue) : null;
      const pendingSkill = interactiveType
        ? { tipo: interactiveType, gameId: state.game.gameId }
        : null;

      // Poderes almacenables (7 y 8): se detectan por el valor de la carta descartada
      // por el jugador activo local. El jugador es quien sabe que acaba de guardar el poder.
      const cardNum = normalizeCardValue(action.payload.carta);
      const isStorablePower = (cardNum === 7 || cardNum === 8) && action.powerIsEnabled && action.isMyTurn;
      const myStoredPowers = isStorablePower
        ? [...state.game.myStoredPowers, cardNum]
        : state.game.myStoredPowers;

      return {
        game: {
          ...state.game,
          pendingCard: keepPendingCard ? state.game.pendingCard : null,
          topDiscardCard: action.payload.carta,
          phase: keepPendingCard ? 'WAIT_DECISION' : 'WAIT_DRAW',
          lastSkillUse: skillUse,
          pendingSkill,
          myStoredPowers,
        },
      };
    }

    case 'CARTA_REVELADA':
      return {
        game: {
          ...state.game,
          peekedCard: action.payload,
          pendingSkill: null,
        },
      };

    case 'CARTAS_REVEALED_TODOS':
      return {
        game: {
          ...state.game,
          gameId: state.game.gameId || action.payload.gameId,
          revealedCards: action.payload.cartasReveladas,
          peekedCard: null,
          pendingSkill: null,
        },
      };

    case 'CUBO_ACTIVADO':
      return {
        game: {
          ...state.game,
          gameId: state.game.gameId || action.payload.gameId,
          cuboActive: true,
          cuboSolicitanteId: action.payload.solicitanteId,
          cuboTurnosRestantes: action.payload.turnosRestantes,
          cuboAnnouncedAt: action.eventAt,
        },
      };

    case 'INTERCAMBIO_RIVAL':
      return {
        game: {
          ...state.game,
          gameId: state.game.gameId || action.payload.gameId,
          pendingSkill: {
            tipo: 'intercambiar-carta-rival',
            gameId: action.payload.gameId,
            rivalId: action.payload.usuarioIniciador,
          },
        },
      };

    case 'INTERCAMBIO_CARTAS': {
      // Detectar intercambio de TODAS las cartas (sin índices específicos)
      const esIntercambioTotal =
        action.payload.numCartaRemitente === undefined &&
        action.payload.numCartaDestinatario === undefined;

      return {
        game: {
          ...state.game,
          // Actualizar cardCount si es intercambio de todas y tenemos los datos
          players: esIntercambioTotal && action.payload.cardCountRemitente !== undefined
            ? state.game.players.map((p) => {
                if (p.userId === action.payload.remitente) {
                  return { ...p, cardCount: action.payload.cardCountRemitente ?? p.cardCount };
                } else if (p.userId === action.payload.destinatario) {
                  return { ...p, cardCount: action.payload.cardCountDestinatario ?? p.cardCount };
                }
                return p;
              })
            : state.game.players,
          lastExchange: {
            remitente: action.payload.remitente,
            destinatario: action.payload.destinatario,
            at: Date.now(),
          },
          pendingSkill: null,
          myProtectedIndices: new Set(),
        },
      };
    }

    case 'HABILIDAD_DENEGADA':
      {
        const jugadorAfectadoId = action.payload.jugadorId ?? action.payload.userId ?? null;
        const habilidadNegada = action.payload.habilidad ?? action.payload.accion ?? 'habilidad';
        const isLocalDenied = jugadorAfectadoId === action.myUserId;

        let nextPowers = state.game.myStoredPowers;
        if (isLocalDenied) {
          if (habilidadNegada === 'jugador-menos-puntuacion') {
            const copy = [...state.game.myStoredPowers];
            const idx = copy.indexOf(7);
            if (idx !== -1) copy.splice(idx, 1);
            nextPowers = copy;
          } else if (habilidadNegada === 'desactivar-proxima-habilidad') {
            const copy = [...state.game.myStoredPowers];
            const idx = copy.indexOf(8);
            if (idx !== -1) copy.splice(idx, 1);
            nextPowers = copy;
          }
        }

        return {
          game: {
            ...state.game,
            pendingSkill: null,
            myProtectedIndices: new Set(),
            myStoredPowers: nextPowers,
            deniedSkillNotice: isLocalDenied
              ? { eventAt: action.eventAt, habilidad: habilidadNegada }
              : state.game.deniedSkillNotice,
          },
        };
      }

    case 'CARTA_PROTEGIDA': {
      if (action.jugadorId !== action.myUserId) {
        return state;
      }
      const next = new Set(state.game.myProtectedIndices);
      next.add(action.cartaIndex);
      return { game: { ...state.game, myProtectedIndices: next } };
    }

    case 'CLEAR_PEEKED_CARD':
      return {
        game: {
          ...state.game,
          peekedCard: null,
        },
      };

    case 'CLEAR_REVEALED_CARDS':
      return {
        game: {
          ...state.game,
          revealedCards: [],
        },
      };

    case 'SE_HA_HECHO_ROBAR_CARTA':
      return {
        game: {
          ...state.game,
          players: state.game.players.map((p) =>
            p.userId === action.destinatarioId ? { ...p, cardCount: p.cardCount + 1 } : p,
          ),
        },
      };

    case 'CLEAR_PENDING_SKILL':
      return {
        game: {
          ...state.game,
          pendingSkill: null,
        },
      };

    case 'PODER_ALMACENADO':
      return {
        game: {
          ...state.game,
          myStoredPowers: [...state.game.myStoredPowers, action.powerValue],
        },
      };

    case 'JUGADOR_MENOS_PUNTUACION_CALCULADO': {
      const nextPowers = [...state.game.myStoredPowers];
      const idx = nextPowers.indexOf(7);
      if (idx !== -1) nextPowers.splice(idx, 1);
      return {
        game: {
          ...state.game,
          myStoredPowers: nextPowers,
          menosPuntuacionJugadorId: action.payload.jugadorId,
        },
      };
    }

    case 'PODER8_USADO': {
      const nextPowers = [...state.game.myStoredPowers];
      const idx = nextPowers.indexOf(8);
      if (idx !== -1) nextPowers.splice(idx, 1);
      return {
        game: {
          ...state.game,
          myStoredPowers: nextPowers,
        },
      };
    }

    case 'CLEAR_MENOS_PUNTUACION_RESULT':
      return {
        game: {
          ...state.game,
          menosPuntuacionJugadorId: null,
        },
      };

    case 'CLEAR_DENIED_SKILL_NOTICE':
      return {
        game: {
          ...state.game,
          deniedSkillNotice: null,
        },
      };

    case 'PODER8_ESTADO':
      return {
        game: {
          ...state.game,
          power8PendingCount: Math.max(0, action.payload.pendientes ?? 0),
          power8QueuedCount: Math.max(0, action.payload.pendientesDiferidos ?? 0),
          power8LastActivatorId: action.payload.activadorId !== undefined
            ? (action.payload.activadorId ?? null)
            : state.game.power8LastActivatorId,
        },
      };

    case 'PARTIDA_FINALIZADA':
      return {
        game: {
          ...state.game,
          result: action.payload,
          phase: null,
          turnDeadlineAt: null,
          cuboActive: false,
          cuboTurnosRestantes: 0,
          cuboSolicitanteId: null,
          cuboAnnouncedAt: null,
          pendingCard: null,
          pendingSkill: null,
          revealedCards: [],
          peekedCard: null,
          lastExchange: null,
          rematch: {
            status: 'idle',
            hostId: null,
            readyPlayerIds: [],
            roomCode: null,
            roomName: null,
          },
          myProtectedIndices: new Set(),
          myStoredPowers: [],
          menosPuntuacionJugadorId: null,
          deniedSkillNotice: null,
          power8PendingCount: 0,
          power8QueuedCount: 0,
          power8LastActivatorId: null,
        },
      };

    case 'REVANCHA_ESTADO':
      return {
        game: {
          ...state.game,
          rematch: {
            status: action.payload.estado,
            hostId: action.payload.hostId,
            readyPlayerIds: action.payload.jugadoresListos,
            roomCode: action.payload.roomCode ?? null,
            roomName: action.payload.roomName ?? null,
          },
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
  canActSkill: boolean;
  canRequestCubo: boolean;
  canUsePoder7: boolean;
  canUsePoder8: boolean;
  selectableHandCount: number;
  lastSkillUse: Stage0SkillUse | null;
  debugEvents: Stage0DebugEvent[];
  drawCard: () => void;
  discardPending: () => void;
  swapWithPending: (cardIndex: number) => void;
  // Habilidades interactivas (Estadios 4 y 5)
  verCarta: (index: number) => void;
  verCartaPropiaYRival: (indexPropia: number, rivalId: string, indexRival: number) => void;
  verCartaTodos: () => void;
  intercambiarTodas: (rivalId: string) => void;
  prepararIntercambioCiego: (indexPropia: number, rivalId: string) => void;
  responderIntercambioCiego: (indexPropia: number) => void;
  hacerRobarCarta: (rivalId: string) => void;
  saltarTurno: (rivalId: string) => void;
  protegerCarta: (index: number) => void;
  decidirIntercambioJ: (intercambiar: boolean) => void;
  clearPeekedCard: () => void;
  clearRevealedCards: () => void;
  clearDebugEvents: () => void;
  solicitarCubo: () => void;
  // Poderes almacenables (Estadio 7)
  usarPoder7: () => void;
  usarPoder8: () => void;
  clearMenosPuntuacionResult: () => void;
  deniedSkillNotice: Stage0DeniedSkillNotice | null;
  clearDeniedSkillNotice: () => void;
  power8PendingCount: number;
  power8QueuedCount: number;
  power8LastActivatorId: string | null;
  volverAJugar: () => void;
}

/** Convierte enabledPowers (number[]) a Set<number>. Retorna null si vacío (= todos habilitados). */
function buildEnabledPowersSet(rawPowers: unknown): Set<number> | null {
  if (!Array.isArray(rawPowers) || rawPowers.length === 0) {
    return null;
  }

  const set = new Set<number>();

  for (const p of rawPowers) {
    if (typeof p === 'number' && Number.isInteger(p)) {
      set.add(p);
    }
  }

  return set.size > 0 ? set : null;
}

export function useGame(myUserId: string): UseGameReturn {
  const [state, dispatch] = useReducer(reducer, { game: createEmptyGameState() });

  // enabledPowers es number[] (1-11), el backend normaliza cualquier valor enviado al crear sala.
  const enabledPowersRef = useRef<Set<number> | null>(null);
  // Indica que carta-robada-por-descartar-6 llego antes que descartar-pendiente.
  const preservePendingAfterDiscardRef = useRef(false);
  // Jugador activo en el momento del último turno-iniciado (para detectar mi turno en handlers).
  const activePlayerIdRef = useRef<string | null>(null);

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
    const roomState = getLastRoomState();
    if (roomState?.rules.enabledPowers) {
      enabledPowersRef.current = buildEnabledPowersSet(roomState.rules.enabledPowers);
    }

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
        preservePendingAfterDiscardRef.current = false;
        activePlayerIdRef.current = payload.userId;
        dispatch({ type: 'TURNO_INICIADO', payload });
      },
      onCartaRobada: (payload) => {
        pushDebugEvent('game:carta-robada', payload);
        dispatch({ type: 'CARTA_ROBADA', payload });
      },
      onCartaRobadaPorDescartar6: (payload) => {
        pushDebugEvent('game:carta-robada-por-descartar-6', payload);
        preservePendingAfterDiscardRef.current = true;
        dispatch({ type: 'CARTA_ROBADA_POR_DESCARTAR_6', payload, eventAt: Date.now() });
      },
      onDecisionRequerida: (payload) => {
        pushDebugEvent('game:decision-requerida', payload);
        dispatch({ type: 'DECISION_REQUERIDA', payload });
      },
      onDescartarPendiente: (payload) => {
        pushDebugEvent('game:descartar-pendiente', payload);
        const cardNumber = normalizeCardValue(payload.carta);
        const powerIsEnabled =
          cardNumber !== 'JOKER' &&
          (enabledPowersRef.current === null || enabledPowersRef.current.has(cardNumber));
        const preservePendingCard = preservePendingAfterDiscardRef.current;
        preservePendingAfterDiscardRef.current = false;
        // activePlayerIdRef mantiene el ID del jugador activo en el momento del evento
        // para detectar si el descarte fue del jugador local sin acceder al estado React.
        const isMyTurn = activePlayerIdRef.current === myUserId;
        dispatch({
          type: 'DESCARTAR_PENDIENTE',
          payload,
          powerIsEnabled,
          preservePendingCard,
          eventAt: Date.now(),
          isMyTurn,
        });
      },
      onIntercambioCartas: (payload) => {
        pushDebugEvent('game:intercambio-cartas', payload);
        dispatch({
          type: 'INTERCAMBIO_CARTAS',
          payload,
        });
      },
      onPartidaFinalizada: (payload) => {
        pushDebugEvent('game:partida-finalizada', payload);
        preservePendingAfterDiscardRef.current = false;
        dispatch({ type: 'PARTIDA_FINALIZADA', payload });
      },
      onRevanchaEstado: (payload) => {
        pushDebugEvent('game:revancha-estado', payload);
        dispatch({ type: 'REVANCHA_ESTADO', payload });
      },
      onCuboActivado: (payload) => {
        pushDebugEvent('game:cubo-activado', payload);
        dispatch({ type: 'CUBO_ACTIVADO', payload, eventAt: Date.now() });
      },
      onCartaRevelada: (payload) => {
        pushDebugEvent('game:carta-revelada', payload);
        dispatch({ type: 'CARTA_REVELADA', payload });
      },
      onCartasRevealedTodos: (payload) => {
        pushDebugEvent('game:cartas-reveladas-todos', payload);
        dispatch({ type: 'CARTAS_REVEALED_TODOS', payload });
      },
      onHabilidadDenegada: (payload) => {
        pushDebugEvent('game:habilidad-denegada', payload);
        dispatch({ type: 'HABILIDAD_DENEGADA', payload, myUserId, eventAt: Date.now() });
      },
      onIntercambioRival: (payload) => {
        pushDebugEvent('game:intercambio-rival', payload);
        dispatch({ type: 'INTERCAMBIO_RIVAL', payload });
      },
      onSeHaHechoRobarCarta: (payload) => {
        pushDebugEvent('game:se-ha-hecho-robar-carta', payload);
        dispatch({ type: 'SE_HA_HECHO_ROBAR_CARTA', destinatarioId: payload.destinatario });
      },
      onCartaProtegida: (payload) => {
        pushDebugEvent('game:carta-protegida', payload);
        dispatch({ type: 'CARTA_PROTEGIDA', jugadorId: payload.jugadorId, cartaIndex: payload.cartaIndex, myUserId });
      },
      onJugadorMenosPuntuacionCalculado: (payload) => {
        pushDebugEvent('game:jugador-menos-puntuacion-calculado', payload);
        dispatch({ type: 'JUGADOR_MENOS_PUNTUACION_CALCULADO', payload });
      },
      onPoder8Estado: (payload) => {
        pushDebugEvent('game:poder8-estado', payload);
        dispatch({ type: 'PODER8_ESTADO', payload });
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
  // pendingSkill bloquea robar aunque la fase sea WAIT_DRAW, evitando emitir
  // game:robar-carta mientras el backend espera la resolución del skill.
  const canDrawCard = Boolean(gameState.gameId) && isMyTurn && gameState.phase === 'WAIT_DRAW' && !gameState.pendingCard && !gameState.pendingSkill;
  const canResolvePending = Boolean(gameState.gameId) && isMyTurn && gameState.phase === 'WAIT_DECISION' && Boolean(gameState.pendingCard);
  const canActSkill =
    Boolean(gameState.gameId) &&
    Boolean(gameState.pendingSkill) &&
    (
      isMyTurn ||
      gameState.pendingSkill?.tipo === 'intercambiar-carta-rival'
    );
  // CUBO solo disponible tras completar al menos una ronda completa (turnIndex >= nJugadores).
  const canRequestCubo =
    Boolean(gameState.gameId) &&
    !gameState.result &&
    !gameState.cuboActive &&
    gameState.turnIndex >= gameState.players.length;
  // Poderes almacenables solo activables en WAIT_DRAW del propio turno.
  const canUsePoder7 =
    isMyTurn &&
    gameState.phase === 'WAIT_DRAW' &&
    gameState.myStoredPowers.includes(7) &&
    !gameState.result;
  const canUsePoder8 =
    isMyTurn &&
    gameState.phase === 'WAIT_DRAW' &&
    gameState.myStoredPowers.includes(8) &&
    !gameState.result;
  const selectableHandCount = Math.max(0, myPlayer?.cardCount ?? 0);

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

  const verCarta = useCallback((index: number) => {
    if (!canActSkill || gameState.pendingSkill?.tipo !== 'ver-carta-propia') {
      return;
    }
    if (index < 0 || index >= selectableHandCount) {
      return;
    }
    gameActions.verCarta(gameState.gameId, index);
  }, [canActSkill, gameState.pendingSkill?.tipo, gameState.gameId, selectableHandCount]);

  const verCartaPropiaYRival = useCallback((indexPropia: number, rivalId: string, indexRival: number) => {
    if (!canActSkill || gameState.pendingSkill?.tipo !== 'ver-carta-propia-y-rival') {
      return;
    }
    if (!rivalId || rivalId === myUserId) {
      return;
    }
    if (indexPropia < 0 || indexPropia >= selectableHandCount || indexRival < 0) {
      return;
    }
    gameActions.verCarta(gameState.gameId, indexPropia, rivalId, indexRival);
  }, [canActSkill, gameState.pendingSkill?.tipo, gameState.gameId, myUserId, selectableHandCount]);

  const verCartaTodos = useCallback(() => {
    if (!canActSkill || gameState.pendingSkill?.tipo !== 'ver-carta-todos') {
      return;
    }
    gameActions.verCartaTodos(gameState.gameId);
    dispatch({ type: 'CLEAR_PENDING_SKILL' });
  }, [canActSkill, gameState.pendingSkill?.tipo, gameState.gameId]);

  const intercambiarTodas = useCallback((rivalId: string) => {
    if (!canActSkill || gameState.pendingSkill?.tipo !== 'intercambiar-todas') {
      return;
    }
    if (!rivalId || rivalId === myUserId) {
      return;
    }
    gameActions.intercambiarTodasCartas(gameState.gameId, rivalId);
    dispatch({ type: 'CLEAR_PENDING_SKILL' });
  }, [canActSkill, gameState.pendingSkill?.tipo, gameState.gameId, myUserId]);

  const prepararIntercambioCiego = useCallback((indexPropia: number, rivalId: string) => {
    if (!canActSkill || gameState.pendingSkill?.tipo !== 'intercambiar-carta-preparar') {
      return;
    }
    if (!rivalId || rivalId === myUserId) {
      return;
    }
    if (indexPropia < 0 || indexPropia >= selectableHandCount) {
      return;
    }
    gameActions.prepararIntercambioCarta(gameState.gameId, indexPropia, rivalId);
    dispatch({ type: 'CLEAR_PENDING_SKILL' });
  }, [canActSkill, gameState.pendingSkill?.tipo, gameState.gameId, myUserId, selectableHandCount]);

  const responderIntercambioCiego = useCallback((indexPropia: number) => {
    if (!canActSkill || gameState.pendingSkill?.tipo !== 'intercambiar-carta-rival') {
      return;
    }
    if (indexPropia < 0 || indexPropia >= selectableHandCount) {
      return;
    }
    const iniciadorId = gameState.pendingSkill.rivalId;
    if (!iniciadorId) {
      return;
    }

    gameActions.intercambiarCartaInteractivo(gameState.gameId, indexPropia, iniciadorId);
    dispatch({ type: 'CLEAR_PENDING_SKILL' });
  }, [canActSkill, gameState.pendingSkill, gameState.gameId, selectableHandCount]);

  const hacerRobarCarta = useCallback((rivalId: string) => {
    if (!canActSkill || gameState.pendingSkill?.tipo !== 'hacer-robar-carta') {
      return;
    }
    gameActions.hacerRobarCarta(gameState.gameId, rivalId);
    // Optimistic: cierra el panel antes de recibir turno-iniciado del servidor.
    dispatch({ type: 'CLEAR_PENDING_SKILL' });
  }, [canActSkill, gameState.pendingSkill?.tipo, gameState.gameId]);

  const saltarTurno = useCallback((rivalId: string) => {
    if (!canActSkill || gameState.pendingSkill?.tipo !== 'saltar-turno') {
      return;
    }
    gameActions.saltarTurnoJugador(gameState.gameId, rivalId);
    dispatch({ type: 'CLEAR_PENDING_SKILL' });
  }, [canActSkill, gameState.pendingSkill?.tipo, gameState.gameId]);

  const protegerCarta = useCallback((index: number) => {
    if (!canActSkill || gameState.pendingSkill?.tipo !== 'proteger-carta') {
      return;
    }
    gameActions.protegerCarta(gameState.gameId, index);
    dispatch({ type: 'CLEAR_PENDING_SKILL' });
  }, [canActSkill, gameState.pendingSkill?.tipo, gameState.gameId]);

  const decidirIntercambioJ = useCallback((intercambiar: boolean) => {
    if (!gameState.peekedCard?.cartaJugadorContrario || !gameState.gameId) {
      return;
    }
    gameActions.resolverJ(gameState.gameId, intercambiar);
    dispatch({ type: 'CLEAR_PEEKED_CARD' });
  }, [gameState.peekedCard, gameState.gameId]);

  const clearPeekedCard = useCallback(() => {
    dispatch({ type: 'CLEAR_PEEKED_CARD' });
  }, []);

  const clearRevealedCards = useCallback(() => {
    dispatch({ type: 'CLEAR_REVEALED_CARDS' });
  }, []);

  const clearDebugEvents = useCallback(() => {
    setDebugEvents([]);
  }, []);

  const usarPoder7 = useCallback(() => {
    if (!canUsePoder7 || !gameState.gameId) return;
    gameActions.jugadorMenosPuntuacion(gameState.gameId);
  }, [canUsePoder7, gameState.gameId]);

  const usarPoder8 = useCallback(() => {
    if (!canUsePoder8 || !gameState.gameId) return;
    gameActions.desactivarProximaHabilidad(gameState.gameId);
    dispatch({ type: 'PODER8_USADO' });
  }, [canUsePoder8, gameState.gameId]);

  const clearMenosPuntuacionResult = useCallback(() => {
    dispatch({ type: 'CLEAR_MENOS_PUNTUACION_RESULT' });
  }, []);

  const clearDeniedSkillNotice = useCallback(() => {
    dispatch({ type: 'CLEAR_DENIED_SKILL_NOTICE' });
  }, []);

  const solicitarCubo = useCallback(() => {
    if (!canRequestCubo || !gameState.gameId) {
      return;
    }

    gameActions.solicitarCubo(gameState.gameId);
  }, [canRequestCubo, gameState.gameId]);

  const volverAJugar = useCallback(() => {
    if (!gameState.gameId || !gameState.result) {
      return;
    }

    gameActions.volverAJugar(gameState.gameId);
  }, [gameState.gameId, gameState.result]);

  return {
    state: gameState,
    myPlayer,
    isMyTurn,
    canDrawCard,
    canResolvePending,
    canActSkill,
    canRequestCubo,
    canUsePoder7,
    canUsePoder8,
    selectableHandCount,
    lastSkillUse: gameState.lastSkillUse,
    debugEvents,
    drawCard,
    discardPending,
    swapWithPending,
    verCarta,
    verCartaPropiaYRival,
    verCartaTodos,
    intercambiarTodas,
    prepararIntercambioCiego,
    responderIntercambioCiego,
    hacerRobarCarta,
    saltarTurno,
    protegerCarta,
    decidirIntercambioJ,
    clearPeekedCard,
    clearRevealedCards,
    clearDebugEvents,
    solicitarCubo,
    usarPoder7,
    usarPoder8,
    clearMenosPuntuacionResult,
    deniedSkillNotice: gameState.deniedSkillNotice,
    clearDeniedSkillNotice,
    power8PendingCount: gameState.power8PendingCount,
    power8QueuedCount: gameState.power8QueuedCount,
    power8LastActivatorId: gameState.power8LastActivatorId,
    volverAJugar,
  };
}
