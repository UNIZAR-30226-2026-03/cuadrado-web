// pages/InventoryPage.tsx - Inventario de skins del usuario (/inventory)
//
// Muestra las skins poseídas por el usuario agrupadas por categoría.
// Permite equipar y desequipar. Al final de cada sección siempre aparece la card "+"
// si hay skins sin adquirir o si la categoría está vacía en el inventario.

import { useCallback } from 'react';
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

export default function InventoryPage() {
  const navigate = useNavigate();
  const { store, inventory, equippedSkinId, loading, error, equip, unequip } = useSkins();

  // Muestra la card "+" si hay skins sin adquirir O si la categoría está vacía
  function showAddMore(type: SkinType): boolean {
    const storeCount = store.filter(s => s.type === type).length;
    const invCount = inventory.filter(s => s.type === type).length;
    return storeCount > invCount || invCount === 0;
  }

  const handleEquip = useCallback(async (skinId: string) => {
    await equip(skinId).catch(() => {});
  }, [equip]);

  const handleUnequip = useCallback(async () => {
    await unequip().catch(() => {});
  }, [unequip]);

  return (
    <div className="skin-page">
      <GameHeader title="Inventario" onBack={() => navigate('/home')} />

      <main className="skin-page__content">
        {loading ? (
          <div className="skin-page__loading">Cargando inventario…</div>
        ) : (
          <div className="skin-page__sections">
            {error && <div className="skin-page__error">{error}</div>}

            {CATEGORIES.map(({ type, label }) => {
              const skins = inventory.filter(s => s.type === type);

              return (
                <section
                  key={type}
                  className={`skin-section skin-section--${type.toLowerCase()}`}
                >
                  <h2 className="skin-section__title">{label}</h2>
                  <div className={`skin-section__grid skin-section__grid--${type.toLowerCase()}`}>
                    {skins.map(skin => (
                      <SkinCard
                        key={skin.name}
                        skin={skin}
                        variant={skin.name === equippedSkinId ? 'inventory-equipped' : 'inventory-normal'}
                        onAction={
                          skin.name === equippedSkinId
                            ? handleUnequip
                            : () => handleEquip(skin.name)
                        }
                      />
                    ))}

                    {/* Card "+" al final de cada sección con skins disponibles o categoría vacía */}
                    {showAddMore(type) && (
                      <div
                        className={`skin-card skin-card--${type.toLowerCase()} skin-card--add-more`}
                        onClick={() => navigate(`/shop?category=${type}`)}
                        role="button"
                        aria-label={`Ver más ${label} en la tienda`}
                      >
                        <span className="skin-card__add-icon">+</span>
                      </div>
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
