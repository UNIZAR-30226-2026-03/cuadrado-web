// types/ranking.types.ts - Tipo de entrada en el ranking global

/** Una entrada de la tabla de clasificación global */
export interface RankingEntry {
  position: number;         // Posición en el ranking (1-based)
  username: string;         // Nombre de usuario
  eloRating: number;        // Puntuación ELO
  avatarUrl: string | null; // URL del avatar equipado (null = predeterminado)
  gamesPlayed: number;
  gamesWon: number;
}
