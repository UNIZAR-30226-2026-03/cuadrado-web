// ─────────────────────────────────────────────────────────
// components/GameNavBar.tsx — Barra de navegación inferior del lobby
//
// Muestra 5 botones de navegación: Inventario, Tienda,
// Crear Partida (destacado, dorado), Unirse y Perfil.
// "Crear Partida" es la acción primaria en el centro.
// ─────────────────────────────────────────────────────────

import { useNavigate } from 'react-router-dom';

// Definición de cada entrada de la barra de navegación
interface NavItem {
  icon: string;
  label: string;
  route: string;
  primary?: boolean; // true solo para el botón central destacado
}

const NAV_ITEMS: NavItem[] = [
  { icon: '📦', label: 'Inventario',    route: '/inventory' },
  { icon: '🛒', label: 'Tienda',        route: '/shop' },
  { icon: '▶',  label: 'Crear\nPartida', route: '/create-room', primary: true },
  { icon: '🔍', label: 'Unirse',        route: '/join-room' },
  { icon: '👤', label: 'Perfil',        route: '/profile' },
];

export default function GameNavBar() {
  const navigate = useNavigate();

  return (
    <nav className="game-nav">
      {/* Sin línea conectora — diseño limpio */}
      <div className="game-nav__track">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.route}
            className={`game-nav__btn ${item.primary ? 'game-nav__btn--primary' : ''}`}
            onClick={() => navigate(item.route)}
          >
            <span className="game-nav__btn-icon">{item.icon}</span>
            <span className="game-nav__btn-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
