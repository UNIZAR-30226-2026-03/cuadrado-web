// hooks/useSkins.ts - Estado combinado de tienda e inventario de skins
//
// Carga en paralelo getStore, getInventory y getEquipped al montar.
// El estado de equipado se deriva de /skins/equipped para evitar desajustes con /auth/me.
// Tras buy/equip/unequip: re-fetch de inventario y equipadas.

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getStore,
  getInventory,
  getEquipped,
  buySkin,
  equipSkin,
  unequipSkin,
  type EquippedSkinUrls,
} from '../services/skin.service';
import type { Skin, SkinType } from '../types/skin.types';

type EquippedSkinIds = Record<SkinType, string | null>;

interface UseSkinsReturn {
  store: Skin[];
  inventory: Skin[];
  equippedSkinIds: EquippedSkinIds;
  loading: boolean;
  error: string | null;
  buy: (skinId: string) => Promise<void>;
  equip: (skinId: string) => Promise<void>;
  unequip: (type: SkinType) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useSkins(): UseSkinsReturn {
  const { user, fetchProfile } = useAuth();
  const [store, setStore] = useState<Skin[]>([]);
  const [inventory, setInventory] = useState<Skin[]>([]);
  const [equippedSkinIds, setEquippedSkinIds] = useState<EquippedSkinIds>({
    Carta: null,
    Avatar: null,
    Tapete: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapEquippedUrlsToIds = useCallback((
    skins: Skin[],
    equipped: EquippedSkinUrls,
  ): EquippedSkinIds => {
    const findIdByUrl = (url: string | null) => {
      if (!url) return null;
      return skins.find((skin) => skin.url === url)?.id ?? null;
    };

    return {
      Carta: findIdByUrl(equipped.carta) ?? user?.equippedCardId ?? null,
      Avatar: findIdByUrl(equipped.avatar) ?? user?.equippedAvatarId ?? null,
      Tapete: findIdByUrl(equipped.tapete) ?? user?.equippedTapeteId ?? null,
    };
  }, [user?.equippedAvatarId, user?.equippedCardId, user?.equippedTapeteId]);

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
      const [, storeData, inventoryData, equippedData] = await Promise.all([
        fetchProfile().catch(() => {}),
        getStore(token),
        getInventory(token),
        getEquipped(token),
      ]);
      setStore(storeData);
      setInventory(inventoryData);
      setEquippedSkinIds(mapEquippedUrlsToIds(inventoryData, equippedData));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar skins');
    } finally {
      setLoading(false);
    }
  }, [fetchProfile, mapEquippedUrlsToIds]);

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
      const [, inventoryData, equippedData] = await Promise.all([
        fetchProfile().catch(() => {}),
        getInventory(token),
        getEquipped(token),
      ]);
      setInventory(inventoryData);
      setEquippedSkinIds(mapEquippedUrlsToIds(inventoryData, equippedData));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al comprar skin');
      throw err; // re-throw so ShopPage can react
    }
  }, [fetchProfile, mapEquippedUrlsToIds]);

  /** Equipa una skin: re-fetch inventario + actualiza perfil */
  const equip = useCallback(async (skinId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('No autenticado');

    setError(null);
    try {
      await equipSkin(skinId, token);
      const [, inventoryData, equippedData] = await Promise.all([
        fetchProfile().catch(() => {}),
        getInventory(token),
        getEquipped(token),
      ]);
      setInventory(inventoryData);
      setEquippedSkinIds(mapEquippedUrlsToIds(inventoryData, equippedData));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al equipar skin');
      throw err;
    }
  }, [fetchProfile, mapEquippedUrlsToIds]);

  /** Desequipa la skin actual: re-fetch inventario + actualiza perfil */
  const unequip = useCallback(async (type: SkinType) => {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('No autenticado');

    if (!equippedSkinIds[type]) {
      throw new Error('No hay ninguna skin equipada para desequipar');
    }

    setError(null);
    try {
      await unequipSkin(type, token);
      const [, inventoryData, equippedData] = await Promise.all([
        fetchProfile().catch(() => {}),
        getInventory(token),
        getEquipped(token),
      ]);
      setInventory(inventoryData);
      setEquippedSkinIds(mapEquippedUrlsToIds(inventoryData, equippedData));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al desequipar skin');
      throw err;
    }
  }, [equippedSkinIds, fetchProfile, mapEquippedUrlsToIds]);

  return { store, inventory, equippedSkinIds, loading, error, buy, equip, unequip, refresh };
}
