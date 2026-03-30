// components/GameHeader.tsx - Cabecera del lobby: logo + badge de cubitos + boton de ajustes

import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/GameHeader.css';

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

export default function GameHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="game-header">
      {/* Logo estático */}
      <div className="game-header__brand">
        <img
          src="/Logo.png"
          alt="Cubo"
          className="game-header__logo"
        />
      </div>

      {/* Badge de cubitos + botón de ajustes */}
      <div className="game-header__actions">
        <div className="game-header__badge game-header__badge--cubitos">
          <CubeWireframeIcon />
          <span className="game-header__badge-value">
            {user?.cubitos?.toLocaleString('es-ES') ?? '0'}
          </span>
        </div>

        <button
          className="game-header__icon-btn"
          onClick={() => navigate('/settings')}
          aria-label="Ajustes"
          title="Ajustes"
        >
          ⚙
        </button>
      </div>
    </header>
  );
}
