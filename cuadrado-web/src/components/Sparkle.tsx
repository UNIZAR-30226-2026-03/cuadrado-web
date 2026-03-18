// ─────────────────────────────────────────────────────────
// components/Sparkle.tsx — Decoración SVG de cubo 3D
//
// Dibuja un cubo isométrico (3D proyectado en 2D) mediante
// tres trazos SVG: la cara superior, las dos caras laterales
// y la arista frontal vertical.
//
// Se posiciona de forma fija en la esquina inferior derecha
// de la pantalla mediante la clase CSS "sparkle" (App.css),
// que también le aplica una animación de pulso suave.
// Es puramente decorativo (pointer-events: none en CSS).
// ─────────────────────────────────────────────────────────

export default function Sparkle() {
  return (
    <svg
      className="sparkle"      // La clase CSS controla posición y animación
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Cubo decorativo"  // Accesibilidad
    >
      {/* Cara superior del cubo: rombo formado por 4 puntos */}
      <path d="M14 22L32 12L50 22L32 32L14 22Z" stroke="white" strokeWidth="2.4" strokeLinejoin="round" />

      {/* Caras laterales del cubo: desde los vértices del rombo hacia abajo */}
      <path d="M14 22V42L32 52L50 42V22" stroke="white" strokeWidth="2.4" strokeLinejoin="round" />

      {/* Arista frontal vertical: línea central que da profundidad al cubo */}
      <path d="M32 32V52" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
