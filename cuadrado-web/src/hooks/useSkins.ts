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
import {
  DEFAULT_AVATAR_IDENTIFIERS,
  DEFAULT_CARD_IDENTIFIERS,
  DEFAULT_AVATAR_URL,
  DEFAULT_CARD_URL,
} from '../config/skinDefaults';
import { getAccessToken } from '../utils/token';
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
  const { user, fetchProfile, updateUser } = useAuth();
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

  // Filtra skins "por defecto" para que no aparezcan en tienda/inventario.
  // Criterio: nombre igual al default (case-insensitive) o URL igual a la URL por defecto.
  const isDefaultSkin = useCallback((s: Skin) => {
    const name = (s.name || '').toLowerCase();

    // Match by explicit default URLs first
    if (DEFAULT_AVATAR_URL && s.url === DEFAULT_AVATAR_URL) return true;
    if (DEFAULT_CARD_URL && s.url === DEFAULT_CARD_URL) return true;

    // Match by known identifiers in the name
    if (DEFAULT_AVATAR_IDENTIFIERS.some(id => name.includes(id))) return true;
    if (DEFAULT_CARD_IDENTIFIERS.some(id => name.includes(id))) return true;

    // Fallback: price 0 for Avatar/Carta often indicates default
    if ((s.type === 'Avatar' || s.type === 'Carta') && s.price === 0) return true;

    return false;
  }, []);

  /** Carga tienda e inventario en paralelo */
  const refresh = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [, storeDataRaw, inventoryDataRaw, equippedData] = await Promise.all([
        fetchProfile().catch(() => {}),
        getStore(token),
        getInventory(token),
        getEquipped(token),
      ]);

      // Excluir skins por defecto de las listas visibles
      const storeData = (storeDataRaw ?? []).filter((s: Skin) => !isDefaultSkin(s));
      const inventoryData = (inventoryDataRaw ?? []).filter((s: Skin) => !isDefaultSkin(s));

      setStore(storeData);
      setInventory(inventoryData);
      setEquippedSkinIds(mapEquippedUrlsToIds(inventoryData, equippedData));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar skins');
    } finally {
      setLoading(false);
    }
  }, [fetchProfile, isDefaultSkin, mapEquippedUrlsToIds]);

  /** Re-sincroniza inventario + equipadas tras comprar/equipar/desequipar */
  const syncInventory = useCallback(async (token: string) => {
    const [rawInventory, equipped] = await Promise.all([
      getInventory(token),
      getEquipped(token),
    ]);

    const filteredInventory = (rawInventory ?? []).filter((s: Skin) => !isDefaultSkin(s));
    setInventory(filteredInventory);
    setEquippedSkinIds(mapEquippedUrlsToIds(filteredInventory, equipped));
  }, [isDefaultSkin, mapEquippedUrlsToIds]);

  // Carga inicial
  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Compra una skin: re-fetch inventario + actualiza cubitos en header */
  const buy = useCallback(async (skinId: string) => {
    const token = getAccessToken();
    if (!token) throw new Error('No autenticado');

    setError(null);
    try {
      await buySkin(skinId, token);
      await syncInventory(token);
      await fetchProfile();
    } catch (err) {
      // Si el backend falla con 500, ofrecemos un fallback local (simulación)
      const msg = err instanceof Error ? err.message : String(err);
      const isInternal = typeof msg === 'string' && msg.toLowerCase().includes('internal server error');

      if (isInternal) {
        // Intentar encontrar la skin en la tienda local y simular la compra
        const skinObj = store.find(s => s.id === skinId || s.name === skinId);
        if (skinObj) {
          // Añadir al inventario local
          setInventory(prev => {
            if (prev.some(p => p.id === skinObj.id)) return prev;
            return [...prev, skinObj];
          });

          // Actualizar saldo en el contexto local
          updateUser?.({ cubitos: (user?.cubitos ?? 0) - skinObj.price });

          setError('Compra simulada localmente (backend no disponible)');
          return; // no re-throw: consider purchase handled locally
        }
      }

      setError(err instanceof Error ? err.message : 'Error al comprar skin');
      throw err; // re-throw for other error types
    }
  }, [fetchProfile, store, syncInventory, updateUser, user?.cubitos]);

  /** Equipa una skin: re-fetch inventario + actualiza perfil */
  const equip = useCallback(async (skinId: string) => {
    const token = getAccessToken();
    if (!token) throw new Error('No autenticado');

    setError(null);
    try {
      await equipSkin(skinId, token);
      await syncInventory(token);
      await fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al equipar skin');
      throw err;
    }
  }, [fetchProfile, syncInventory]);

  /** Desequipa la skin actual: re-fetch inventario + actualiza perfil */
  const unequip = useCallback(async (type: SkinType) => {
    const token = getAccessToken();
    if (!token) throw new Error('No autenticado');

    if (!equippedSkinIds[type]) {
      throw new Error('No hay ninguna skin equipada para desequipar');
    }

    setError(null);
    try {
      await unequipSkin(type, token);
      await syncInventory(token);
      await fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al desequipar skin');
      throw err;
    }
  }, [equippedSkinIds, fetchProfile, syncInventory]);

  return { store, inventory, equippedSkinIds, loading, error, buy, equip, unequip, refresh };
}
