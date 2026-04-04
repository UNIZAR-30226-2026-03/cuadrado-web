// pages/InventoryPage.tsx - Inventario de skins del usuario (/inventory)
//
// Muestra las skins poseídas por el usuario agrupadas por categoría, ordenadas por precio.
// Permite equipar y desequipar. Al final de cada sección aparece AddMoreCard
// si hay skins sin adquirir o si la categoría está vacía.

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GameHeader from '../components/GameHeader';
import SkinCard from '../components/SkinCard';
import { useSkins } from '../hooks/useSkins';
import type { SkinType } from '../types/skin.types';
import '../styles/ShopPage.css';
import '../styles/InventoryPage.css';

const CATEGORIES: { type: SkinType; label: string }[] = [
  { type: 'Tapete',  label: 'Tapetes' },
  { type: 'Carta',   label: 'Reversos de Carta' },
  { type: 'Avatar',  label: 'Avatares' },
];

// Card de atajo a la tienda con las mismas dimensiones que las skin cards de su categoría
function AddMoreCard({ label, type, onClick }: { label: string; type: SkinType; onClick: () => void }) {
  return (
    <button
      className={`skin-card skin-card--${type.toLowerCase()} skin-card--add-more`}
      onClick={onClick}
      aria-label={`Ver más ${label} en la tienda`}
    >
      {/* Icono de bolsa/tienda */}
      <svg
        className="add-more-card__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
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
  const [loadingSkinId, setLoadingSkinId] = useState<string | null>(null);

  // Muestra AddMoreCard si hay skins sin adquirir O si la categoría está vacía
  function showAddMore(type: SkinType): boolean {
    const storeCount = store.filter(s => s.type === type).length;
    const invCount = inventory.filter(s => s.type === type).length;
    return storeCount > invCount || invCount === 0;
  }

  const handleEquip = useCallback(async (skinId: string) => {
    setLoadingSkinId(skinId);
    try {
      await equip(skinId);
    } catch {
      // error ya gestionado y expuesto por useSkins
    } finally {
      setLoadingSkinId(null);
    }
  }, [equip]);

  const handleUnequip = useCallback(async (type: SkinType, skinId: string) => {
    setLoadingSkinId(skinId);
    try {
      await unequip(type);
    } catch {
      // error ya gestionado y expuesto por useSkins
    } finally {
      setLoadingSkinId(null);
    }
  }, [unequip]);

  return (
    <div className="skin-page">
      <GameHeader title="Inventario" onBack={() => navigate('/home')} />

      <main className="skin-page__content">
        {loading ? (
          <div className="skin-page__loading">Cargando inventario…</div>
        ) : (
          <div className="skin-page__sections" aria-live="polite" aria-atomic="false">
            {error && <div className="skin-page__error" role="alert">{error}</div>}

            {CATEGORIES.map(({ type, label }) => {
              // Ordenar por precio ascendiente
              const skins = inventory
                .filter(s => s.type === type)
                .sort((a, b) => a.price - b.price);

              return (
                <section
                  key={type}
                  className={`skin-section skin-section--${type.toLowerCase()}`}
                >
                  <h2 className="skin-section__title">{label}</h2>
                  <div className={`skin-section__grid skin-section__grid--${type.toLowerCase()}`}>
                    {skins.map(skin => (
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

                    {showAddMore(type) && (
                      <AddMoreCard
                        label={label}
                        type={type}
                        onClick={() => navigate(`/shop?category=${type}`)}
                      />
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
