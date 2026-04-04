// components/SkinCard.tsx - Tarjeta reutilizable de skin cosmética
//
// 5 variantes: shop-available, shop-owned, shop-equipped,
//              inventory-normal, inventory-equipped.
// Estructura vertical: imagen → badge de estado + nombre → botón de acción.

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
  onAction?: () => void;
  loading?: boolean;
}

// Icono SVG del cubo del juego — usado en el badge de precio
function CubeIcon() {
  return (
    <svg
      className="skin-card__cube-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}

// Icono de fallback por tipo de skin
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

  const typeClass    = `skin-card--${skin.type.toLowerCase()}`;
  const variantClass = `skin-card--${variant}`;
  const showCheck    = variant === 'shop-owned' || variant === 'shop-equipped' || variant === 'inventory-equipped';

  // Badge de estado debajo del nombre
  function renderBadge() {
    switch (variant) {
      case 'shop-available':
        return (
          <span className="skin-card__badge skin-card__badge--price">
            <CubeIcon /> {skin.price}
          </span>
        );
      case 'shop-owned':
        return <span className="skin-card__badge skin-card__badge--owned">Poseída</span>;
      case 'shop-equipped':
      case 'inventory-equipped':
        return <span className="skin-card__badge skin-card__badge--equipped">Equipada</span>;
      default:
        return null;
    }
  }

  // Botón de acción siempre visible (no overlay)
  function renderAction() {
    if (!onAction) return null;

    switch (variant) {
      case 'shop-available':
        return (
          <button
            className="skin-card__action skin-card__action--primary"
            onClick={onAction}
            disabled={loading}
            aria-label={`Comprar ${skin.name} por ${skin.price} cubitos`}
          >
            Comprar
          </button>
        );
      case 'shop-owned':
        return (
          <button
            className="skin-card__action skin-card__action--secondary"
            onClick={onAction}
            disabled={loading}
            aria-label={`Equipar ${skin.name}`}
          >
            Equipar
          </button>
        );
      case 'shop-equipped':
      case 'inventory-equipped':
        return (
          <button
            className="skin-card__action skin-card__action--danger"
            onClick={onAction}
            disabled={loading}
            aria-label={`Desequipar ${skin.name}`}
          >
            Desequipar
          </button>
        );
      case 'inventory-normal':
        return (
          <button
            className="skin-card__action skin-card__action--primary"
            onClick={onAction}
            disabled={loading}
            aria-label={`Equipar ${skin.name}`}
          >
            Equipar
          </button>
        );
      default:
        return null;
    }
  }

  return (
    <div
      className={`skin-card ${typeClass} ${variantClass}`}
      aria-label={`${skin.name}${variant.includes('equipped') ? ', equipada' : ''}`}
      aria-busy={loading || undefined}
    >
      {/* Zona de imagen */}
      <div className="skin-card__media">
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

        {/* Checkmark: indica ítem poseído o equipado */}
        {showCheck && (
          <span className="skin-card__owned-badge" aria-hidden="true">✓</span>
        )}

        {/* Overlay de carga */}
        {loading && (
          <div className="skin-card__loading-overlay" aria-hidden="true">
            <span className="skin-card__spinner" />
          </div>
        )}
      </div>

      {/* Cuerpo: badge + nombre + botón */}
      <div className="skin-card__body">
        <div className="skin-card__meta">
          {renderBadge()}
          <span className="skin-card__name">{skin.name}</span>
        </div>
        {renderAction()}
      </div>
    </div>
  );
}
