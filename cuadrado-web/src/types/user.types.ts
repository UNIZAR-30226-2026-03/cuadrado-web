// types/user.types.ts - Tipo del perfil de usuario

/** Datos del usuario tal como los devuelve /auth/me y el login */
export interface UserProfile {
  username: string;
  email?: string;
  cubitos: number;
  eloRating: number;
  rankPlacement?: number;
  gamesPlayed?: number;
  gamesWon?: number;
  equippedCardId?: string | null;
  equippedAvatarId?: string | null;
  equippedTapeteId?: string | null;
  equippedSkinID?: string | null; // Compatibilidad con versión previa
}

/** Configuracion de audio del usuario (persistida en settings JSON) */
export interface UserSettings {
  voiceChatVolume: number;
  gameMusicVolume: number;
  soundEffectsVolume: number;
}

/** Payload para actualizar configuracion del usuario */
export interface UpdateUserSettingsPayload {
  voiceChatVolume?: number;
  gameMusicVolume?: number;
  soundEffectsVolume?: number;
}
