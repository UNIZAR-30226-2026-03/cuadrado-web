// pages/InventoryPage.tsx - Inventario de skins del usuario (/inventory)
//
// Panel superior: resumen de los 3 ítems equipados actualmente.
// Navegación por categoría mediante tabs. Controles de ordenado.

import { useState, useCallback, useRef, useLayoutEffect, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import GameHeader from '../components/game/GameHeader';
import SkinCard from '../components/skins/SkinCard';
import { useSkins } from '../hooks/useSkins';
import {
  DEFAULT_AVATAR_URL,
  DEFAULT_AVATAR_DISPLAY_NAME,
  DEFAULT_CARD_URL,
  DEFAULT_CARD_DISPLAY_NAME,
  TAPETE_EMPTY_LABEL,
} from '../config/skinDefaults';
import type { Skin, SkinType } from '../types/skin.types';
import '../styles/ShopPage.css';
import '../styles/InventoryPage.css';

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

// Panel de equipados: muestra un vistazo rápido de los 3 slots.
// Al pulsar un slot se navega a su tab de categoría.
function EquippedPanel({
  inventory,
  equippedSkinIds,
  onTabSelect,
}: {
  inventory: Skin[];
  equippedSkinIds: Record<SkinType, string | null>;
  onTabSelect: (type: SkinType) => void;
}) {
  const slots: { type: SkinType; label: string; emptyLabel: string }[] = [
    { type: 'Tapete', label: 'Tapete',  emptyLabel: TAPETE_EMPTY_LABEL },
    { type: 'Carta',  label: 'Carta',   emptyLabel: 'Ninguna' },
    { type: 'Avatar', label: 'Avatar',  emptyLabel: 'Ninguno' },
  ];

  return (
    <section className="equipped-panel" aria-label="Ítems equipados actualmente">
      <h2 className="equipped-panel__title">Equipado actualmente</h2>
      <div className="equipped-panel__slots">
        {slots.map(({ type, label, emptyLabel }) => {
          const equippedId = equippedSkinIds[type];
          const skin = equippedId ? inventory.find(s => s.id === equippedId) : null;

          // Fallbacks: Avatar y Carta deben mostrar siempre una skin (por defecto)
          const showDefaultAvatar = !skin && type === 'Avatar';
          const showDefaultCard = !skin && type === 'Carta';

          return (
            <button
              className="equipped-slot"
              key={type}
              onClick={() => onTabSelect(type)}
              aria-label={`Ver categoría ${label}`}
            >
              <span className="equipped-slot__label">{label}</span>
              <div className={`equipped-slot__preview${skin || showDefaultAvatar || showDefaultCard ? '' : ' equipped-slot__preview--empty'}`}>
                {skin || showDefaultAvatar || showDefaultCard ? (
                  // Si hay skin real la mostramos; si no, mostramos la imagen por defecto (avatar)
                  skin ? (
                    <img
                      className="equipped-slot__img"
                      src={skin.url}
                      alt={skin.name}
                      loading="lazy"
                    />
                  ) : showDefaultAvatar ? (
                    <img
                      className="equipped-slot__img"
                      src={DEFAULT_AVATAR_URL}
                      alt={DEFAULT_AVATAR_DISPLAY_NAME}
                      loading="lazy"
                    />
                  ) : (
                    // Carta por defecto: mostrar la imagen real de la skin default
                    <img
                      className="equipped-slot__img"
                      src={DEFAULT_CARD_URL}
                      alt={DEFAULT_CARD_DISPLAY_NAME}
                      loading="lazy"
                    />
                  )
                ) : (
                  // Tapete vacío: mostrar una X estilizada (usuario pidió 'X')
                  <svg
                    className="equipped-slot__empty-icon"
                    width="28" height="28"
                    viewBox="0 0 24 24"
                    fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </div>
              <span className={`equipped-slot__name${skin || showDefaultAvatar || showDefaultCard ? '' : ' equipped-slot__name--empty'}`}>
                {skin ? skin.name : (showDefaultAvatar ? DEFAULT_AVATAR_DISPLAY_NAME : showDefaultCard ? DEFAULT_CARD_DISPLAY_NAME : emptyLabel)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// Card de acceso a la tienda al final del grid
function AddMoreCard({ label, type, onClick }: { label: string; type: SkinType; onClick: () => void }) {
  return (
    <button
      className={`skin-card skin-card--${type.toLowerCase()} skin-card--add-more`}
      onClick={onClick}
      aria-label={`Ver más ${label} en la tienda`}
    >
      <svg
        className="add-more-card__icon"
        viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
        <path d="M3 6h18"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
      <span className="add-more-card__label">Ver en tienda</span>
    </button>
  );
}

export default function InventoryPage() {
  const navigate = useNavigate();
  const { store, inventory, equippedSkinIds, loading, error, equip, unequip } = useSkins();

  const [activeTab,      setActiveTab]      = useState<SkinType>('Tapete');
  const [sortBy,         setSortBy]         = useState<SortKey>('price-asc');
  const [loadingSkinId,  setLoadingSkinId]  = useState<string | null>(null);

  const pageRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Entrada de la página: panel de equipados + tabs deslizan desde abajo
  useLayoutEffect(() => {
    if (loading) return;

    const scope = pageRef.current;
    if (!scope) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.from('.equipped-panel', {
        y: -20,
        autoAlpha: 0,
        duration: 0.45,
        ease: 'power2.out',
        clearProps: 'all',
      });
      tl.from('.skin-tabs', {
        y: -14,
        autoAlpha: 0,
        duration: 0.35,
        ease: 'power2.out',
        clearProps: 'all',
      }, 0.1);
      tl.from('.app-page__panel', {
        y: 24,
        autoAlpha: 0,
        duration: 0.4,
        ease: 'power3.out',
        clearProps: 'all',
      }, 0.15);
    }, scope);
    return () => ctx.revert();
  }, [loading]);

  // Stagger de cards al cambiar de tab
  useEffect(() => {
    const scope = gridRef.current;
    if (!scope) return;

    const ctx = gsap.context(() => {
      gsap.from('.skin-card', {
        y: 14,
        autoAlpha: 0,
        scale: 0.9,
        duration: 0.28,
        ease: 'power2.out',
        stagger: { each: 0.04, from: 'start' },
        clearProps: 'all',
      });
    }, scope);
    return () => ctx.revert();
  }, [activeTab]);

  function showAddMore(type: SkinType): boolean {
    const storeCount = store.filter(s => s.type === type).length;
    const invCount   = inventory.filter(s => s.type === type).length;
    return storeCount > invCount || invCount === 0;
  }

  const handleEquip = useCallback(async (skinId: string) => {
    setLoadingSkinId(skinId);
    try   { await equip(skinId); }
    catch { /* error gestionado por useSkins */ }
    finally { setLoadingSkinId(null); }
  }, [equip]);

  const handleUnequip = useCallback(async (type: SkinType, skinId: string) => {
    setLoadingSkinId(skinId);
    try   { await unequip(type); }
    catch { /* error gestionado por useSkins */ }
    finally { setLoadingSkinId(null); }
  }, [unequip]);

  const visibleSkins = sortSkins(
    inventory.filter(s => s.type === activeTab),
    sortBy
  );

  return (
    <div className="app-page" ref={pageRef}>
      <GameHeader title="Inventario" onBack={() => navigate(-1)} />

      <main className="app-page__content">
        {loading ? (
          <div className="app-page__loading">Cargando inventario…</div>
        ) : (
          <>
            {/* Panel de equipados */}
            <EquippedPanel
              inventory={inventory}
              equippedSkinIds={equippedSkinIds}
              onTabSelect={setActiveTab}
            />

            {/* Barra de tabs */}
            <div className="skin-tabs" role="tablist" aria-label="Categorías del inventario">
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
              className="app-page__panel"
              role="tabpanel"
              aria-live="polite"
              aria-atomic="false"
            >
              {error && <div className="app-page__error" role="alert">{error}</div>}

              {/* Controles de ordenado */}
              <div className="skin-sort" aria-label="Ordenar por">
                <label className="skin-sort__label" htmlFor="inv-sort-select">Ordenar:</label>
                <select
                  id="inv-sort-select"
                  className="skin-sort__select"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortKey)}
                >
                  {SORTS.map(({ key, label }) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Grid del inventario */}
              {visibleSkins.length === 0 && !showAddMore(activeTab) ? (
                <div className="app-page__empty">
                  <p>No tienes {TABS.find(t => t.type === activeTab)?.label.toLowerCase()} todavía.</p>
                </div>
              ) : (
                <div className={`skin-grid skin-grid--${activeTab.toLowerCase()}`} ref={gridRef}>
                  {visibleSkins.map(skin => (
                    <SkinCard
                      key={skin.id}
                      skin={skin}
                      variant={skin.id === equippedSkinIds[skin.type] ? 'inventory-equipped' : 'inventory-normal'}
                      onAction={
                        skin.id === equippedSkinIds[skin.type]
                          ? () => handleUnequip(skin.type, skin.id)
                          : () => handleEquip(skin.id)
                      }
                      loading={loadingSkinId === skin.id}
                    />
                  ))}

                  {showAddMore(activeTab) && (
                    <AddMoreCard
                      label={TABS.find(t => t.type === activeTab)?.label ?? activeTab}
                      type={activeTab}
                      onClick={() => navigate(`/shop?category=${activeTab}`)}
                    />
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

