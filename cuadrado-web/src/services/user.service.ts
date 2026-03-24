// ─────────────────────────────────────────────────────────
// services/user.service.ts — Acceso a datos del perfil de usuario
//
// Centraliza las peticiones HTTP al endpoint de perfil.
// Sigue el mismo patrón de manejo de errores que auth.service.ts.
// ─────────────────────────────────────────────────────────

import type { UserProfile } from '../types/user.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Obtiene el perfil del usuario autenticado desde GET /api/auth/me
export async function getProfileRequest(
  accessToken: string
): Promise<UserProfile> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Error al obtener el perfil');
  }

  return data;
}
