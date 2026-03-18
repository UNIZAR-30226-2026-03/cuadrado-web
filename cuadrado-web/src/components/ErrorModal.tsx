// ─────────────────────────────────────────────────────────
// components/ErrorModal.tsx — Modal de error de conexión
//
// Muestra un diálogo modal cuando el frontend no puede
// conectarse al backend (fallo de red, servidor caído…).
//
// Patrón de cierre:
//   - Clic en el overlay oscuro → cierra el modal
//   - Clic dentro del modal → stopPropagation() evita que el
//     evento burbujee al overlay y cierre el modal por error
//   - Botón "Volver" → cierra el modal explícitamente
// ─────────────────────────────────────────────────────────

// Props del componente
interface ErrorModalProps {
  onClose: () => void; // Callback que se ejecuta al cerrar el modal
}

export default function ErrorModal({ onClose }: ErrorModalProps) {
  return (
    // Overlay: fondo oscuro semitransparente que cubre toda la pantalla
    // Al hacer clic en él se cierra el modal
    <div className="error-overlay" onClick={onClose}>

      {/* Contenedor del modal: e.stopPropagation() evita que un clic dentro
          del modal propague el evento al overlay y lo cierre accidentalmente */}
      <div className="error-modal" onClick={(e) => e.stopPropagation()}>

        {/* Icono de advertencia (⚠ Unicode: U+26A0) */}
        <span className="error-modal__icon">&#9888;</span>

        <h2 className="error-modal__title">ERROR DE CONEXION</h2>

        <p className="error-modal__text">
          No se ha podido conectar con el servidor.<br />
          Comprueba tu conexion e intentalo de nuevo.
        </p>

        {/* Botón de cierre explícito */}
        <button className="error-modal__btn" onClick={onClose}>
          Volver
        </button>
      </div>
    </div>
  );
}
