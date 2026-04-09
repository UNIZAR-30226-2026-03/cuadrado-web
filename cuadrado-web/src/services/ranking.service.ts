// services/ranking.service.ts - Capa HTTP para el ranking global
//
// El endpoint GET /api/ranking aún no está implementado en el backend.
// Esta función devuelve [] hasta que esté disponible.
// Cuando el backend lo implemente, eliminar el bloque catch y dejar solo el fetch.

import type { RankingEntry } from '../types/ranking.types';
import { API_URL } from './api.config';

const RANKING_API_ENABLED = import.meta.env.VITE_ENABLE_RANKING_API === 'true';

/** Devuelve los primeros 50 jugadores del ranking global. GET /api/ranking */
export async function getRanking(token: string): Promise<RankingEntry[]> {
  // Mientras backend no publique /ranking, evitar peticiones que solo generan 404 en consola.
  if (!RANKING_API_ENABLED) {
    return [];
  }

  try {
    const res = await fetch(`${API_URL}/ranking`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return (await res.json()) as RankingEntry[];
  } catch {
    // Endpoint no implementado aún — devolver vacío
    return [];
  }
}
