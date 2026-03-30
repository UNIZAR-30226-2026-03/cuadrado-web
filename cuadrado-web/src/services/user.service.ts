// services/user.service.ts - Acceso a datos del perfil de usuario

import type { UserProfile } from '../types/user.types';
import { API_URL } from './api.config';

/** Obtiene el perfil del usuario autenticado. GET /auth/me */
export async function getProfileRequest(accessToken: string): Promise<UserProfile> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al obtener el perfil');
  return data;
}
