// ─────────────────────────────────────────────────────────
// pages/HomePage.tsx — Página principal tras autenticarse (ruta "/home")
//
// Actualmente es un placeholder mínimo. Muestra un título
// "HELLO WORLD!" con el estilo neon de la fuente display
// y la decoración Sparkle habitual.
//
// Aquí se desarrollará el contenido principal del juego:
// selección de sala, perfil del usuario, clasificaciones, etc.
// ─────────────────────────────────────────────────────────

import Sparkle from '../components/Sparkle';

export default function HomePage() {
  return (
    <div className="page">
      {/* Título temporal — usa la clase home-title con fuente Bebas Neue y efecto neón */}
      <h1 className="home-title fade-in">HELLO WORLD!</h1>

      {/* Decoración de cubo 3D en esquina inferior derecha */}
      <Sparkle />
    </div>
  );
}
