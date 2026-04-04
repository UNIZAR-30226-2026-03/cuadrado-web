// pages/InventoryPage.tsx - Inventario de skins del usuario (/inventory)
//
// Panel superior: resumen de los 3 ítems equipados actualmente.
// Navegación por categoría mediante tabs. Controles de ordenado.

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GameHeader from '../components/GameHeader';
import SkinCard from '../components/SkinCard';
import { useSkins } from '../hooks/useSkins';
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

// Panel de equipados: muestra un vistazo rápido de los 3 slots
function EquippedPanel({
  inventory,
  equippedSkinIds,
}: {
  inventory: Skin[];
  equippedSkinIds: Record<SkinType, string | null>;
}) {
  const slots: { type: SkinType; label: string; emptyLabel: string }[] = [
    { type: 'Tapete', label: 'Tapete',  emptyLabel: 'Ninguno' },
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

          return (
            <div className="equipped-slot" key={type}>
              <span className="equipped-slot__label">{label}</span>
              <div className={`equipped-slot__preview${skin ? '' : ' equipped-slot__preview--empty'}`}>
                {skin ? (
                  <img
                    className="equipped-slot__img"
                    src={skin.url}
                    alt={skin.name}
                    loading="lazy"
                  />
                ) : (
                  <svg
                    className="equipped-slot__empty-icon"
                    width="28" height="28"
                    viewBox="0 0 24 24"
                    fill="none" stroke="currentColor"
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                )}
              </div>
              <span className={`equipped-slot__name${skin ? '' : ' equipped-slot__name--empty'}`}>
                {skin ? skin.name : emptyLabel}
              </span>
            </div>
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
    <div className="skin-page">
      <GameHeader title="Inventario" onBack={() => navigate('/home')} />

      <main className="skin-page__content">
        {loading ? (
          <div className="skin-page__loading">Cargando inventario…</div>
        ) : (
          <>
            {/* Panel de equipados */}
            <EquippedPanel inventory={inventory} equippedSkinIds={equippedSkinIds} />

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
              className="skin-page__panel"
              role="tabpanel"
              aria-live="polite"
              aria-atomic="false"
            >
              {error && <div className="skin-page__error" role="alert">{error}</div>}

              {/* Controles de ordenado */}
              <div className="skin-sort" aria-label="Ordenar por">
                <span className="skin-sort__label">Ordenar:</span>
                {SORTS.map(({ key, label }) => (
                  <button
                    key={key}
                    className={`sort-btn${sortBy === key ? ' sort-btn--active' : ''}`}
                    onClick={() => setSortBy(key)}
                    aria-pressed={sortBy === key}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Grid del inventario */}
              {visibleSkins.length === 0 && !showAddMore(activeTab) ? (
                <div className="skin-empty">
                  <p>No tienes {TABS.find(t => t.type === activeTab)?.label.toLowerCase()} todavía.</p>
                </div>
              ) : (
                <div className={`skin-grid skin-grid--${activeTab.toLowerCase()}`}>
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
