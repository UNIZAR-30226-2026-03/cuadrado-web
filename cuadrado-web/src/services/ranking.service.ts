// services/ranking.service.ts - Capa HTTP para el ranking global
//
// El endpoint GET /api/ranking aún no está implementado en el backend.
// Esta función devuelve [] hasta que esté disponible.
// Cuando el backend lo implemente, eliminar el bloque catch y dejar solo el fetch.

import type { RankingEntry } from '../types/ranking.types';
import { API_URL } from './api.config';

/** Devuelve los top usuarios del ranking. GET /api/users/top?limit=X */
export async function getRanking(token: string, limit: number = 50): Promise<RankingEntry[]> {
  try {
    const res = await fetch(`${API_URL}/users/top?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return (await res.json()) as RankingEntry[];
  } catch {
    return [];
  }
}

/** Devuelve la posición del usuario autenticado en el ranking. GET /api/users/me/position */
export async function getMyPosition(token: string): Promise<number> {
  try {
    const res = await fetch(`${API_URL}/users/me/position`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return 999;
    const data = await res.json() as { position: number };
    return data.position;
  } catch {
    return 999;
  }
}
