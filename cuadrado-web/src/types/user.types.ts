// ─────────────────────────────────────────────────────────
// types/user.types.ts — Tipos del perfil de usuario
//
// Define la estructura de datos del usuario tal como la
// devuelve el backend en login y en el endpoint /auth/me.
// ─────────────────────────────────────────────────────────

// Datos del usuario que se almacenan en el contexto de autenticación
export interface UserProfile {
  username: string;
  email?: string;
  cubitos: number;
  eloRating: number;
  rankPlacement?: number;
  gamesPlayed?: number;
  gamesWon?: number;
}
