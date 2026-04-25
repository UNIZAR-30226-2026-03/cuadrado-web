// types/game.types.ts - Contratos de datos para el sistema de partida WebSocket.

export type PaloCarta = 'corazones' | 'picas' | 'treboles' | 'rombos' | 'joker';

export type TurnPhase =
  | 'WAIT_DRAW'
  | 'WAIT_SKILL'
  | 'WAIT_DECISION';

export interface Card {
  carta: number;
  palo: PaloCarta;
  puntos: number;
  protegida: boolean;
}

export interface GamePlayerDetail {
  userId: string;
  controlador: 'humano' | 'bot';
  dificultadBot?: string;
  nombreEnPartida?: string;
}

// ── Eventos servidor → cliente ────────────────────────────────────────────────

export interface EvInicioPartida {
  partidaId: string;
  jugadores: string[];
  jugadoresDetalle: GamePlayerDetail[];
}

export interface EvTurnoIniciado {
  gameId: string;
  turn: number;
  userId: string;
  phase: 'WAIT_DRAW';
  turnDeadlineAt: number;
}

export interface EvCartaRobada {
  partidaId: string;
  jugadorRobado: number;
  cartasRestantes: number;
}

export interface EvDecisionRequerida {
  gameId: string;
  carta?: Card;
}

export interface EvCartaRobadaPorDescartar6 {
  gameId: string;
  cartaRobada: Card;
  reshuffle?: {
    huboRebarajado: boolean;
    cantidadCartasMazo: number;
  };
}

export interface EvDescartarPendiente {
  partidaId: string;
  carta: Card;
}

export interface EvIntercambioCartas {
  partidaId: string;
  remitente: string;
  destinatario: string;
  numCartaRemitente?: number;
  numCartaDestinatario?: number;
  cardCountRemitente?: number;
  cardCountDestinatario?: number;
}

export interface EvTurnoExpirado {
  gameId: string;
  turn: number;
  phase: string;
  turnDeadlineAt: number;
}

export interface EvPartidaFinalizada {
  gameId: string;
  motivo: 'sinCartasMazo' | 'unJugadorSinCartas' | 'cubo';
  ranking: Array<{ userId: string; puntaje: number }>;
  ganadorId: string;
  cartasJugadores: Array<{ jugadorId: string; valoresCartas: number[] }>;
  recompensas: unknown;
}

export interface EvCuboActivado {
  gameId: string;
  solicitanteId: string;
  turnosRestantes: number;
}

export interface EvMazoRebarajado {
  gameId: string;
  cantidadCartasMazo: number;
  cantidadCartasDescartadas: number;
}

export interface CartaRevelada {
  jugadorId: string;
  indexCarta: number;
  carta: Card;
}

export interface EvCartasRevealedTodos {
  gameId: string;
  cartasReveladas: CartaRevelada[];
}

export interface EvCartaRevelada {
  gameId: string;
  carta: Card;
  cartaJugadorContrario?: Card;
}

export interface EvHabilidadDenegada {
  gameId: string;
  jugadorId?: string;
  habilidad?: string;
  // Compatibilidad con payloads antiguos.
  userId?: string;
  accion?: string;
}

export interface EvRevanchaEstado {
  gameId: string;
  estado: 'waiting-host' | 'room-ready';
  hostId: string;
  jugadoresListos: string[];
  roomCode?: string;
  roomName?: string;
}

/** Respuesta privada al activar el poder de carta 7 */
export interface EvJugadorMenosPuntuacionCalculado {
  gameId: string;
  jugadorId: string;
}

/** Estado global del poder 8: cuántas anulaciones pendientes hay en la partida */
export interface EvPoder8Estado {
  gameId: string;
  /** Anulaciones ya activas que afectan a la siguiente habilidad usada */
  pendientes: number;
  /** Anulaciones armadas en el turno actual; pasan a activas al finalizar turno */
  pendientesDiferidos?: number;
  activadorId?: string | null;
}

// ── Estado de partida ─────────────────────────────────────────────────────────

export interface GamePlayerState {
  userId: string;
  name: string;
  cardCount: number;
  isBot: boolean;
  avatarUrl: string | null;
  cardSkinUrl: string | null;
  isMe: boolean;
}

export type PendingSkillType =
  | 'ver-carta-propia'
  | 'ver-carta-propia-y-rival'
  | 'ver-carta-todos'
  | 'intercambiar-carta-preparar'
  | 'intercambiar-carta-rival'
  | 'intercambiar-todas'
  | 'hacer-robar-carta'
  | 'proteger-carta'
  | 'saltar-turno'
  | 'jugador-menos-puntuacion';

export interface PendingSkill {
  tipo: PendingSkillType;
  /** Solo en intercambiar-carta-rival: quien inició el intercambio */
  rivalId?: string;
  gameId: string;
}

export interface GameState {
  gameId: string;
  /** Jugadores ordenados por turno (índice = número de turno del backend) */
  players: GamePlayerState[];
  turnIndex: number;
  /** ID del jugador cuyo turno está activo (fuente de verdad para detectar "mi turno") */
  activePlayerId: string | null;
  phase: TurnPhase | null;
  turnDeadlineAt: number | null;
  deckCount: number;
  cuboActive: boolean;
  cuboTurnosRestantes: number;
  /** Carta robada pendiente de decisión (solo visible para el jugador local) */
  pendingCard: Card | null;
  pendingSkill: PendingSkill | null;
  /** Cartas reveladas a todos (poder del 5 - ver-carta-todos) */
  revealedCards: CartaRevelada[];
  /** Carta vista solo por el jugador local (poderes 10 y 11) */
  peekedCard: EvCartaRevelada | null;
  result: EvPartidaFinalizada | null;
  lastDiscardedCard: Card | null;
  lastDiscardPlayerId: string | null;
}
