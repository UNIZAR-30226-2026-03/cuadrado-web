// components/modals/ErrorModal.tsx - Modal de error de conexión con el backend.
//
// Patrón de cierre:
//   - Clic en overlay → cierra el modal
//   - Clic dentro del modal → stopPropagation() evita propagación al overlay
//   - Botón "Volver" → cierra explícitamente

import '../../styles/ErrorModal.css';

interface ErrorModalProps {
  onClose: () => void;
}

export default function ErrorModal({ onClose }: ErrorModalProps) {
  return (
    <div className="error-overlay" onClick={onClose}>
      {/* stopPropagation evita que un clic dentro del modal cierre el overlay */}
      <div className="error-modal" onClick={(e) => e.stopPropagation()}>
        <span className="error-modal__icon">&#9888;</span>
        <h2 className="error-modal__title">ERROR DE CONEXION</h2>
        <p className="error-modal__text">
          No se ha podido conectar con el servidor.<br />
          Comprueba tu conexión e inténtalo de nuevo.
        </p>
        <button className="error-modal__btn" onClick={onClose}>
          Volver
        </button>
      </div>
    </div>
  );
}
