// components/ErrorModal.tsx - Modal de error de conexion con el backend
//
// Patron de cierre:
//   - Clic en el overlay → cierra el modal
//   - Clic dentro del modal → stopPropagation() evita propagacion al overlay
//   - Boton "Volver" → cierra explicitamente

import '../styles/ErrorModal.css';

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
          Comprueba tu conexion e intentalo de nuevo.
        </p>
        <button className="error-modal__btn" onClick={onClose}>
          Volver
        </button>
      </div>
    </div>
  );
}
