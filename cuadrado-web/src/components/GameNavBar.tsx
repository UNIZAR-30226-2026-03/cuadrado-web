// components/GameNavBar.tsx - Barra de navegacion inferior del lobby
//
// 5 botones: Inventario, Tienda, Unirse (primario/dorado, central),
// Crear Partida y Perfil. Iconos line-art SVG monocromaticos con glow en hover.

import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/GameNavBar.css';

interface NavItem {
  icon: string; // clave del mapa de iconos SVG
  label: string;
  route: string;
  primary?: boolean; // true solo para el boton central destacado
}

// Iconos SVG line-art (estilo Feather/Lucide): trazo fino, sin relleno
const NAV_ICONS: Record<string, ReactNode> = {
  inventory: (
    /* Armario/taquilla line-art */
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="2" width="18" height="20" rx="2"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <circle cx="12" cy="7" r="1"/>
      <circle cx="12" cy="17" r="1"/>
    </svg>
  ),
  shop: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  join: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
      <polyline points="10 17 15 12 10 7"/>
      <line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
  ),
  create: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="12" height="16" rx="2"/>
      <path d="M19 12h4M21 10v4"/>
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  ),
};

const NAV_ITEMS: NavItem[] = [
  { icon: 'inventory', label: 'Inventario',    route: '/inventory' },
  { icon: 'shop',      label: 'Tienda',        route: '/shop' },
  { icon: 'join',      label: 'Unirse \na sala', route: '/join-room', primary: true },
  { icon: 'create',    label: 'Crear\nPartida', route: '/create-room' },
  { icon: 'profile',   label: 'Perfil',        route: '/profile' },
];

export default function GameNavBar() {
  const navigate = useNavigate();

  return (
    <nav className="game-nav">
      <div className="game-nav__track">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.route}
            className={`game-nav__btn ${item.primary ? 'game-nav__btn--primary' : ''}`}
            onClick={() => navigate(item.route)}
          >
            <span className="game-nav__btn-icon">{NAV_ICONS[item.icon]}</span>
            <span className="game-nav__btn-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
