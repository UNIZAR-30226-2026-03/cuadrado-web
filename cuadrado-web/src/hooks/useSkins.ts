// hooks/useSkins.ts - Estado combinado de tienda e inventario de skins
//
// Carga en paralelo getStore y getInventory al montar.
// equippedSkinId se deduce del perfil del usuario (AuthContext).
// Tras buy/equip/unequip: re-fetch de inventario + fetchProfile() para actualizar cubitos.

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStore, getInventory, buySkin, equipSkin, unequipSkin } from '../services/skin.service';
import type { Skin } from '../types/skin.types';

interface UseSkinsReturn {
  store: Skin[];
  inventory: Skin[];
  equippedSkinId: string | null;
  loading: boolean;
  error: string | null;
  buy: (skinId: string) => Promise<void>;
  equip: (skinId: string) => Promise<void>;
  unequip: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useSkins(): UseSkinsReturn {
  const { user, fetchProfile } = useAuth();
  const [store, setStore] = useState<Skin[]>([]);
  const [inventory, setInventory] = useState<Skin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // equippedSkinId se lee directamente del perfil del usuario en el contexto
  const equippedSkinId = user?.equippedSkinID ?? null;

  /** Carga tienda e inventario en paralelo */
  const refresh = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [storeData, inventoryData] = await Promise.all([
        getStore(token),
        getInventory(token),
      ]);
      setStore(storeData);
      setInventory(inventoryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar skins');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Compra una skin: re-fetch inventario + actualiza cubitos en header */
  const buy = useCallback(async (skinId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('No autenticado');

    setError(null);
    try {
      await buySkin(skinId, token);
      const [, inventoryData] = await Promise.all([
        fetchProfile().catch(() => {}),
        getInventory(token),
      ]);
      setInventory(inventoryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al comprar skin');
      throw err; // re-throw so ShopPage can react
    }
  }, [fetchProfile]);

  /** Equipa una skin: re-fetch inventario + actualiza perfil */
  const equip = useCallback(async (skinId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('No autenticado');

    setError(null);
    try {
      await equipSkin(skinId, token);
      const [, inventoryData] = await Promise.all([
        fetchProfile().catch(() => {}),
        getInventory(token),
      ]);
      setInventory(inventoryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al equipar skin');
      throw err;
    }
  }, [fetchProfile]);

  /** Desequipa la skin actual: re-fetch inventario + actualiza perfil */
  const unequip = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('No autenticado');

    setError(null);
    try {
      await unequipSkin(token);
      const [, inventoryData] = await Promise.all([
        fetchProfile().catch(() => {}),
        getInventory(token),
      ]);
      setInventory(inventoryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al desequipar skin');
      throw err;
    }
  }, [fetchProfile]);

  return { store, inventory, equippedSkinId, loading, error, buy, equip, unequip, refresh };
}
