// pages/ShopPage.tsx - Tienda de skins cosméticas (/shop)
//
// Muestra todas las skins disponibles agrupadas por categoría, ordenadas por precio.
// Comprar abre ConfirmModal. Las skins poseídas pueden equiparse/desequiparse directamente.
// Si se navega con ?category=<tipo>, se hace scrollIntoView al montar.

import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import GameHeader from '../components/GameHeader';
import SkinCard from '../components/SkinCard';
import ConfirmModal from '../components/ConfirmModal';
import { useSkins } from '../hooks/useSkins';
import type { Skin, SkinType } from '../types/skin.types';
import '../styles/ShopPage.css';

const CATEGORIES: { type: SkinType; label: string }[] = [
  { type: 'Tapete',  label: 'Tapetes' },
  { type: 'Carta',   label: 'Reversos de Carta' },
  { type: 'Avatar',  label: 'Avatares' },
];

export default function ShopPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { store, inventory, equippedSkinIds, loading, error, buy, equip, unequip } = useSkins();

  // Modal de confirmación de compra
  const [pendingSkin, setPendingSkin] = useState<Skin | null>(null);
  const [buying, setBuying] = useState(false);
  // ID de skin en operación equip/unequip (para spinner)
  const [loadingEquipId, setLoadingEquipId] = useState<string | null>(null);
  // ID de la última skin comprada (para animación GSAP)
  const [boughtSkinId, setBoughtSkinId] = useState<string | null>(null);

  // Refs de secciones para scrollIntoView
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  // Ref de la card comprada para la animación GSAP
  const boughtCardRef = useRef<HTMLDivElement | null>(null);

  // Scroll a categoría si viene con ?category=
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    if (cat && sectionRefs.current[cat]) {
      sectionRefs.current[cat]!.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.search, loading]);

  // Determina la variante visual de una skin en la tienda
  function getVariant(skin: Skin) {
    if (skin.id === equippedSkinIds[skin.type]) return 'shop-equipped' as const;
    if (inventory.some(s => s.id === skin.id)) return 'shop-owned' as const;
    return 'shop-available' as const;
  }

  // Equipar desde tienda (skin ya poseída, sin modal de confirmación)
  const handleEquipFromShop = useCallback(async (skin: Skin) => {
    setLoadingEquipId(skin.id);
    try {
      await equip(skin.id);
    } catch {
      // error ya gestionado y expuesto por useSkins
    } finally {
      setLoadingEquipId(null);
    }
  }, [equip]);

  // Desequipar desde tienda la skin actualmente equipada
  const handleUnequipFromShop = useCallback(async (skin: Skin) => {
    setLoadingEquipId(skin.id);
    try {
      await unequip(skin.type);
    } catch {
      // error ya gestionado y expuesto por useSkins
    } finally {
      setLoadingEquipId(null);
    }
  }, [unequip]);

  // Confirmar compra
  const handleConfirm = useCallback(async () => {
    if (!pendingSkin) return;
    setBuying(true);
    try {
      await buy(pendingSkin.id);
      setBoughtSkinId(pendingSkin.id);
      setPendingSkin(null);
    } catch (err) {
      console.error('Error al comprar skin:', err);
    } finally {
      setBuying(false);
    }
  }, [pendingSkin, buy]);

  // Animación GSAP de compra exitosa: bounce en la card
  useEffect(() => {
    if (!boughtSkinId || !boughtCardRef.current) return;
    const el = boughtCardRef.current;
    const tween = gsap.fromTo(
      el,
      { scale: 1 },
      {
        scale: 1.15,
        duration: 0.18,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
        onComplete: () => setBoughtSkinId(null),
      }
    );
    return () => { tween.kill(); };
  }, [boughtSkinId]);

  // Devuelve el onAction correcto según variante
  function getOnAction(skin: Skin) {
    const variant = getVariant(skin);
    if (variant === 'shop-available') return () => setPendingSkin(skin);
    if (variant === 'shop-owned')     return () => handleEquipFromShop(skin);
    if (variant === 'shop-equipped')  return () => handleUnequipFromShop(skin);
    return undefined;
  }

  return (
    <div className="skin-page">
      <GameHeader title="Tienda" onBack={() => navigate('/home')} />

      <main className="skin-page__content">
        {loading ? (
          <div className="skin-page__loading">Cargando tienda…</div>
        ) : (
          <div className="skin-page__sections" aria-live="polite" aria-atomic="false">
            {error && <div className="skin-page__error" role="alert">{error}</div>}

            {CATEGORIES.map(({ type, label }) => {
              // Ordenar por precio ascendiente
              const skins = store
                .filter(s => s.type === type)
                .sort((a, b) => a.price - b.price);

              return (
                <section
                  key={type}
                  className="skin-section"
                  ref={(el) => { sectionRefs.current[type] = el; }}
                >
                  <h2 className="skin-section__title">{label}</h2>
                  <div className={`skin-section__grid skin-section__grid--${type.toLowerCase()}`}>
                    {skins.map(skin => {
                      const variant = getVariant(skin);
                      return (
                        <div
                          key={skin.id}
                          ref={skin.id === boughtSkinId ? boughtCardRef : undefined}
                        >
                          <SkinCard
                            skin={skin}
                            variant={variant}
                            onAction={getOnAction(skin)}
                            loading={
                              (buying && pendingSkin?.id === skin.id) ||
                              loadingEquipId === skin.id
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal de confirmación de compra */}
      {pendingSkin && (
        <ConfirmModal
          skin={pendingSkin}
          onConfirm={handleConfirm}
          onCancel={() => setPendingSkin(null)}
          loading={buying}
        />
      )}
    </div>
  );
}
