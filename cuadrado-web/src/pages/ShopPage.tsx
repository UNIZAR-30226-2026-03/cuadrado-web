// pages/ShopPage.tsx - Tienda de skins cosméticas (/shop)
//
// Muestra todas las skins disponibles agrupadas por categoría (Tapetes, Cartas, Avatares).
// El usuario puede comprar skins que no posea. La compra abre un ConfirmModal.
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
  const { store, inventory, equippedSkinId, loading, error, buy } = useSkins();

  // Modal de confirmación de compra
  const [pendingSkin, setPendingSkin] = useState<Skin | null>(null);
  const [buying, setBuying] = useState(false);
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
    if (skin.name === equippedSkinId) return 'shop-equipped' as const;
    if (inventory.some(s => s.name === skin.name)) return 'shop-owned' as const;
    return 'shop-available' as const;
  }

  // Confirmar compra
  const handleConfirm = useCallback(async () => {
    if (!pendingSkin) return;
    setBuying(true);
    try {
      await buy(pendingSkin.name);
      setBoughtSkinId(pendingSkin.name);
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

  return (
    <div className="skin-page">
      <GameHeader title="Tienda" onBack={() => navigate('/home')} />

      <main className="skin-page__content">
        {/* Contenido principal */}
        {loading ? (
          <div className="skin-page__loading">Cargando tienda…</div>
        ) : (
          <div className="skin-page__sections">
            {error && <div className="skin-page__error">{error}</div>}

            {CATEGORIES.map(({ type, label }) => {
              const skins = store.filter(s => s.type === type);
              return (
                <section
                  key={type}
                  className="skin-section"
                  ref={(el) => { sectionRefs.current[type] = el; }}
                >
                  <h2 className="skin-section__title">{label}</h2>
                  <div className={`skin-section__grid skin-section__grid--${type.toLowerCase()}`}>
                    {skins.map(skin => (
                      <div
                        key={skin.name}
                        ref={skin.name === boughtSkinId ? boughtCardRef : undefined}
                      >
                        <SkinCard
                          skin={skin}
                          variant={getVariant(skin)}
                          onAction={getVariant(skin) === 'shop-available'
                            ? () => setPendingSkin(skin)
                            : undefined}
                          loading={buying && pendingSkin?.name === skin.name}
                        />
                      </div>
                    ))}
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
