// services/skin.service.ts - Capa HTTP para el sistema de skins
//
// Todos los endpoints requieren token JWT vía Authorization: Bearer.
// Los errores se propagan como Error(message) siguiendo el patrón de auth.service.ts.

import type { Skin, SkinType } from '../types/skin.types';
import { API_URL } from './api.config';

// Reutiliza el mismo patrón handleResponse de auth.service.ts
async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error en la petición');
  return data as T;
}

/** Devuelve todas las skins disponibles en la tienda. GET /skins/store */
export async function getStore(token: string): Promise<Skin[]> {
  const res = await fetch(`${API_URL}/skins/store`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<Skin[]>(res);
}

/** Devuelve las skins que posee el usuario. GET /skins/inventory */
export async function getInventory(token: string): Promise<Skin[]> {
  const res = await fetch(`${API_URL}/skins/inventory`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<Skin[]>(res);
}

/** Compra una skin para el usuario. POST /skins/buy/:skinId */
export async function buySkin(skinId: string, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/skins/buy/${encodeURIComponent(skinId)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  await handleResponse<unknown>(res);
}

/** Equipa una skin del inventario del usuario. PATCH /skins/equip/:skinId */
export async function equipSkin(skinId: string, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/skins/equip/${encodeURIComponent(skinId)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  await handleResponse<unknown>(res);
}

/** Desequipa la skin actualmente equipada por tipo. PATCH /skins/unequip/:type */
export async function unequipSkin(type: SkinType, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/skins/unequip/${encodeURIComponent(type)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  await handleResponse<unknown>(res);
}
