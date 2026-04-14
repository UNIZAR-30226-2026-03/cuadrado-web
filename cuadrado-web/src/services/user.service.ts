// services/user.service.ts - Acceso a datos del perfil de usuario

import type {
  UserProfile,
  UserSettings,
  UpdateUserSettingsPayload,
} from '../types/user.types';
import { API_URL } from './api.config';

/** Obtiene el perfil del usuario autenticado. GET /users/me */
export async function getProfileRequest(accessToken: string): Promise<UserProfile> {
  const res = await fetch(`${API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return handleResponse<UserProfile>(res, 'Error al obtener el perfil');
}

async function handleResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || fallbackMessage);
  return data as T;
}

/** Obtiene la configuracion del usuario autenticado. GET /users/me/settings */
export async function getMySettingsRequest(accessToken: string): Promise<UserSettings> {
  const res = await fetch(`${API_URL}/users/me/settings`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return handleResponse<UserSettings>(res, 'Error al obtener la configuracion');
}

/** Actualiza la configuracion del usuario autenticado. PATCH /users/me/settings */
export async function updateMySettingsRequest(
  accessToken: string,
  payload: UpdateUserSettingsPayload
): Promise<UserSettings> {
  const res = await fetch(`${API_URL}/users/me/settings`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<UserSettings>(res, 'Error al actualizar la configuracion');
}

