// components/game/GameHeader.tsx - Cabecera compartida: logo (home) o botón volver + título + badge de cubitos

import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import '../../styles/GameHeader.css';

interface GameHeaderProps {
  /** Título de sección mostrado en el centro. Si se omite, no se renderiza. */
  title?: string;
  /** Si se provee, sustituye el logo por un botón "← Volver" que llama a esta función. */
  onBack?: () => void;
}

/** Icono SVG de cubo wireframe (solo aristas) */
function CubeWireframeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      className="cubito-icon"
    >
      {/* Cara frontal */}
      <path d="M4 8 L12 4 L20 8 L12 12 Z" />
      {/* Aristas verticales */}
      <path d="M4 8 L4 16 L12 20 L12 12" />
      <path d="M20 8 L20 16 L12 20" />
      <path d="M12 4 L12 12" opacity="0.4" /> {/* arista trasera superior */}
    </svg>
  );
}

export default function GameHeader({ title, onBack }: GameHeaderProps = {}) {
  const { user } = useAuth();
  const { openSettingsModal } = useModal();
  const isSub = Boolean(title || onBack);

  return (
    <header className={`game-header${isSub ? ' game-header--sub' : ''}`}>
      {/* Izquierda: logo (home) o botón volver (sub-páginas) */}
      <div className="game-header__brand">
        {onBack ? (
          <button className="game-header__back" onClick={onBack} aria-label="Volver">
            ← Volver
          </button>
        ) : (
          <img src="/Logo.png" alt="Cubo" className="game-header__logo" />
        )}
      </div>

      {/* Centro: título de sección */}
      {title && <h1 className="game-header__title">{title}</h1>}

      {/* Derecha: badge de cubitos + botón de ajustes */}
      <div className="game-header__actions">
        <div className="game-header__badge game-header__badge--cubitos">
          <CubeWireframeIcon />
          <span className="game-header__badge-value">
            {user?.cubitos?.toLocaleString('es-ES') ?? '0'}
          </span>
        </div>

        <button
          className="game-header__icon-btn"
          onClick={openSettingsModal}
          aria-label="Ajustes"
          title="Ajustes"
        >
          ⚙
        </button>
      </div>
    </header>
  );
}
