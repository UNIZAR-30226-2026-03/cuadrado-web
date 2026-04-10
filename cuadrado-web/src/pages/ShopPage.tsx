// pages/ShopPage.tsx - Tienda de skins cosméticas (/shop)
//
// Navegación por categoría mediante tabs (Tapetes / Cartas / Avatares).
// Controles de ordenado: Precio ↑ (defecto), Precio ↓, Nombre.
// Las skins poseídas permiten equipar/desequipar directamente sin modal.

import { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import GameHeader from '../components/GameHeader';
import SkinCard from '../components/SkinCard';
import ConfirmModal from '../components/ConfirmModal';
import { useSkins } from '../hooks/useSkins';
import type { Skin, SkinType } from '../types/skin.types';
import '../styles/ShopPage.css';

type SortKey = 'price-asc' | 'price-desc' | 'name';

const TABS: { type: SkinType; label: string }[] = [
  { type: 'Tapete', label: 'Tapetes' },
  { type: 'Carta',  label: 'Reversos de Carta' },
  { type: 'Avatar', label: 'Avatares' },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'price-asc',  label: 'Precio ↑' },
  { key: 'price-desc', label: 'Precio ↓' },
  { key: 'name',       label: 'Nombre' },
];

function sortSkins(skins: Skin[], sortKey: SortKey): Skin[] {
  return [...skins].sort((a, b) => {
    if (sortKey === 'price-asc')  return a.price - b.price;
    if (sortKey === 'price-desc') return b.price - a.price;
    return a.name.localeCompare(b.name);
  });
}

export default function ShopPage() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { store, inventory, equippedSkinIds, loading, error, buy, equip, unequip } = useSkins();

  const [activeTab,    setActiveTab]    = useState<SkinType>('Tapete');
  const [sortBy,       setSortBy]       = useState<SortKey>('price-asc');
  const [pendingSkin,  setPendingSkin]  = useState<Skin | null>(null);
  const [buying,       setBuying]       = useState(false);
  const [loadingEquipId, setLoadingEquipId] = useState<string | null>(null);
  const [boughtSkinId, setBoughtSkinId] = useState<string | null>(null);

  const boughtCardRef = useRef<HTMLDivElement | null>(null);
  const pageRef       = useRef<HTMLDivElement>(null);
  const gridRef       = useRef<HTMLDivElement>(null);

  // Entrada de la página: tabs + panel deslizan desde abajo
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.from('.skin-tabs', {
        y: -18,
        autoAlpha: 0,
        duration: 0.4,
        ease: 'power2.out',
        clearProps: 'all',
      });
      tl.from('.skin-page__panel', {
        y: 24,
        autoAlpha: 0,
        duration: 0.45,
        ease: 'power3.out',
        clearProps: 'all',
      }, 0.1);
    }, pageRef);
    return () => ctx.revert();
  }, []);

  // Stagger de cards al cambiar de tab
  useEffect(() => {
    if (!gridRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.skin-card', {
        y: 16,
        autoAlpha: 0,
        scale: 0.9,
        duration: 0.3,
        ease: 'power2.out',
        stagger: { each: 0.05, from: 'start' },
        clearProps: 'all',
      });
    }, gridRef);
    return () => ctx.revert();
  }, [activeTab]);

  // Si se navega con ?category=, activar la tab correspondiente
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category') as SkinType | null;
    if (cat && TABS.some(t => t.type === cat)) setActiveTab(cat);
  }, [location.search]);

  function getVariant(skin: Skin) {
    if (skin.id === equippedSkinIds[skin.type]) return 'shop-equipped' as const;
    if (inventory.some(s => s.id === skin.id))  return 'shop-owned'    as const;
    return 'shop-available' as const;
  }

  const handleEquipFromShop = useCallback(async (skin: Skin) => {
    setLoadingEquipId(skin.id);
    try   { await equip(skin.id); }
    catch { /* error gestionado por useSkins */ }
    finally { setLoadingEquipId(null); }
  }, [equip]);

  const handleUnequipFromShop = useCallback(async (skin: Skin) => {
    setLoadingEquipId(skin.id);
    try   { await unequip(skin.type); }
    catch { /* error gestionado por useSkins */ }
    finally { setLoadingEquipId(null); }
  }, [unequip]);

  const handleConfirm = useCallback(async () => {
    if (!pendingSkin) return;
    setBuying(true);
    try {
      await buy(pendingSkin.id);
      // Mantener la animación usando el `id` local del skin.
      setBoughtSkinId(pendingSkin.id);
      setPendingSkin(null);
    } catch (err) {
      console.error('Error al comprar skin:', err);
    } finally {
      setBuying(false);
    }
  }, [pendingSkin, buy]);

  // Animación GSAP de compra exitosa
  useEffect(() => {
    if (!boughtSkinId || !boughtCardRef.current) return;
    const el = boughtCardRef.current;
    const tween = gsap.fromTo(el, { scale: 1 }, {
      scale: 1.12, duration: 0.18, ease: 'power2.out',
      yoyo: true, repeat: 1, onComplete: () => setBoughtSkinId(null),
    });
    return () => { tween.kill(); };
  }, [boughtSkinId]);

  function getOnAction(skin: Skin) {
    const variant = getVariant(skin);
    if (variant === 'shop-available') return () => setPendingSkin(skin);
    if (variant === 'shop-owned')     return () => handleEquipFromShop(skin);
    if (variant === 'shop-equipped')  return () => handleUnequipFromShop(skin);
    return undefined;
  }

  const visibleSkins = sortSkins(
    store.filter(s => s.type === activeTab),
    sortBy
  );

  return (
    <div className="skin-page" ref={pageRef}>
      <GameHeader title="Tienda" onBack={() => navigate(-1)} />

      <main className="skin-page__content">
        {loading ? (
          <div className="skin-page__loading">Cargando tienda…</div>
        ) : (
          <>
            {/* Barra de tabs */}
            <div className="skin-tabs" role="tablist" aria-label="Categorías de tienda">
              {TABS.map(({ type, label }) => (
                <button
                  key={type}
                  className={`skin-tab${activeTab === type ? ' skin-tab--active' : ''}`}
                  role="tab"
                  aria-selected={activeTab === type}
                  onClick={() => setActiveTab(type)}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Panel con sort + grid */}
            <div
              className="skin-page__panel"
              role="tabpanel"
              aria-live="polite"
              aria-atomic="false"
            >
              {error && <div className="skin-page__error" role="alert">{error}</div>}

              {/* Controles de ordenado */}
              <div className="skin-sort" aria-label="Ordenar por">
                <label className="skin-sort__label" htmlFor="shop-sort-select">Ordenar:</label>
                <select
                  id="shop-sort-select"
                  className="skin-sort__select"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortKey)}
                >
                  {SORTS.map(({ key, label }) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Grid de skins */}
              {visibleSkins.length === 0 ? (
                <div className="skin-empty">
                  <p>No hay artículos en esta categoría.</p>
                </div>
              ) : (
                <div className={`skin-grid skin-grid--${activeTab.toLowerCase()}`} ref={gridRef}>
                  {visibleSkins.map(skin => {
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
              )}
            </div>
          </>
        )}
      </main>

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
