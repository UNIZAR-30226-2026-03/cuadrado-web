// components/SkinCard.tsx - Tarjeta reutilizable de skin cosmética
//
// 5 variantes: shop-available, shop-owned, shop-equipped,
//              inventory-normal, inventory-equipped.
// Aspect ratio depende del tipo: Tapete=16:9, Carta=2:3, Avatar=1:1 circular.

import { useState } from 'react';
import type { Skin } from '../types/skin.types';
import '../styles/SkinCard.css';

export type SkinVariant =
  | 'shop-available'
  | 'shop-owned'
  | 'shop-equipped'
  | 'inventory-normal'
  | 'inventory-equipped';

interface SkinCardProps {
  skin: Skin;
  variant: SkinVariant;
  onAction?: () => void;   // comprar | equipar | desequipar según variante
  loading?: boolean;       // muestra spinner durante acción async
}

// Icono SVG de fallback por tipo de skin
function FallbackIcon({ type }: { type: Skin['type'] }) {
  if (type === 'Tapete') {
    return (
      <svg className="skin-card__fallback-icon" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2"/>
        <path d="M2 10h20M2 14h20"/>
      </svg>
    );
  }
  if (type === 'Carta') {
    return (
      <svg className="skin-card__fallback-icon" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2"/>
        <path d="M9 7h6M9 12h6M9 17h4"/>
      </svg>
    );
  }
  // Avatar
  return (
    <svg className="skin-card__fallback-icon" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
}

export default function SkinCard({ skin, variant, onAction, loading = false }: SkinCardProps) {
  const [imgError, setImgError] = useState(false);

  const typeClass = `skin-card--${skin.type.toLowerCase()}`;
  const variantClass = `skin-card--${variant}`;

  // Determina badge según variante
  function renderBadge() {
    if (variant === 'shop-available') {
      return (
        <span className="skin-card__badge skin-card__badge--price">
          {skin.price} ◆
        </span>
      );
    }
    if (variant === 'shop-owned') {
      return <span className="skin-card__badge skin-card__badge--owned">Poseída</span>;
    }
    if (variant === 'shop-equipped') {
      return <span className="skin-card__badge skin-card__badge--equipped-gold">Equipada</span>;
    }
    if (variant === 'inventory-equipped') {
      return <span className="skin-card__badge skin-card__badge--in-use">EN USO</span>;
    }
    return null;
  }

  // Determina overlay de acción (solo en inventario)
  function renderOverlay() {
    if (variant === 'inventory-normal' && onAction) {
      return (
        <div className="skin-card__overlay" onClick={onAction}>
          <span className="skin-card__overlay-text">Equipar</span>
        </div>
      );
    }
    if (variant === 'inventory-equipped' && onAction) {
      return (
        <div className="skin-card__overlay skin-card__overlay--unequip" onClick={onAction}>
          <span className="skin-card__overlay-text">Desequipar</span>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`skin-card ${typeClass} ${variantClass}`}>
      <div className="skin-card__image-wrap">
        {!imgError ? (
          <img
            className="skin-card__img"
            src={skin.url}
            alt={skin.name}
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="skin-card__fallback">
            <FallbackIcon type={skin.type} />
          </div>
        )}
        {renderOverlay()}
      </div>

      <div className="skin-card__info">
        <span className="skin-card__name">{skin.name}</span>
        {renderBadge()}
      </div>

      {/* Botón de compra solo en tienda para skins disponibles */}
      {variant === 'shop-available' && onAction && (
        <button
          className={`skin-card__buy-btn${loading ? ' skin-card__buy-btn--loading' : ''}`}
          onClick={onAction}
          disabled={loading}
        >
          {loading ? '...' : 'Comprar'}
        </button>
      )}
    </div>
  );
}
