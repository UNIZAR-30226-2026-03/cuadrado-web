// components/icons/UiIcons.tsx - Iconos SVG de interfaz de usuario.
//
// Usados en el modal de crear sala: checkboxes de poderes y selección de tiempo de turno.

/** Icono de reloj para los botones de tiempo de turno */
export function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none">
      <circle cx="10" cy="10" r="8" stroke="var(--neon-cyan)" strokeWidth="1.5" />
      <line x1="10" y1="10" x2="10" y2="4"  stroke="var(--neon-cyan)" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="10" y1="10" x2="14" y2="10" stroke="var(--neon-cyan)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="10" r="1" fill="var(--neon-cyan)" />
    </svg>
  );
}

/** Icono de check (✓) para checkbox activado */
export function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" style={{ width: 13, height: 13 }} aria-hidden="true">
      <polyline
        points="3,10 8,16 17,4"
        fill="none"
        stroke="var(--neon-cyan)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Icono de guión (–) para checkbox en estado indeterminado */
export function DashIcon() {
  return (
    <svg viewBox="0 0 20 20" style={{ width: 13, height: 13 }} aria-hidden="true">
      <line
        x1="4"
        y1="10"
        x2="16"
        y2="10"
        stroke="var(--neon-cyan)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
