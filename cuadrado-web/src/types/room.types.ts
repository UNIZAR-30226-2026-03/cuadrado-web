// types/room.types.ts - Tipos compartidos para salas (rooms)

export interface RulesConfig {
  maxPlayers: number;
  turnTimeSeconds: number;
  isPrivate: boolean;
  fillWithBots: boolean;
  deckCount: number;
  enabledPowers: string[];
}

export interface PublicRoomSummary {
  name: string;
  code: string;
  playersCount: number;
  rules: RulesConfig;
  /** ISO string en el cliente (Date en el backend) */
  createdAt: string;
}

export interface RoomPlayerState {
  userId: string;
  socketId: string;
  isHost: boolean;
  /** ISO string en el cliente (Date en el backend) */
  joinedAt: string;
  connected: boolean;
  controlador: 'humano' | 'bot';
  /** Solo presente si controlador === 'bot' (ej: "bot1") */
  nombreEnPartida?: string;
}

export interface RoomState {
  name: string;
  code: string;
  hostId: string;
  players: RoomPlayerState[];
  rules: RulesConfig;
  started: boolean;
  /** ISO string en el cliente (Date en el backend) */
  createdAt: string;
}

export interface SavedRoomPayload {
  name: string;
  rules: RulesConfig;
}

export interface CreateRoomPayload {
  name?: string;
  rules?: RulesConfig;
  savedRoom?: SavedRoomPayload;
}
