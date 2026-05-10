// components/ConfirmModal.tsx - Modal de confirmación de compra de skin
//
// Solo aparece para la acción "Comprar".
// Si cubitos insuficientes: botón confirmar deshabilitado + mensaje de error.

import type { Skin } from '../types/skin.types';
import { useAuth } from '../context/AuthContext';
import '../styles/ConfirmModal.css';

interface ConfirmModalProps {
  skin: Skin;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmModal({ skin, onConfirm, onCancel, loading = false }: ConfirmModalProps) {
  const { user } = useAuth();
  const canAfford = (user?.cubitos ?? 0) >= skin.price;
  const previewClass = `confirm-modal__preview-wrap confirm-modal__preview-wrap--${skin.type.toLowerCase()}`;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className={previewClass}>
          {skin.url ? (
            <img className="confirm-modal__preview-img" src={skin.url} alt={skin.name} />
          ) : (
            <div className="confirm-modal__preview-empty" aria-hidden="true">Previsualización no disponible</div>
          )}
        </div>

        <p className="confirm-modal__name">{skin.name}</p>
        <p className="confirm-modal__price">{skin.price} ◆ cubitos</p>

        {!canAfford && (
          <p className="confirm-modal__insufficient">
            Cubitos insuficientes para esta compra
          </p>
        )}

        <div className="confirm-modal__actions">
          <button
            className="confirm-modal__btn-confirm"
            onClick={onConfirm}
            disabled={!canAfford || loading}
          >
            {loading ? '...' : 'Confirmar'}
          </button>
          <button className="confirm-modal__btn-cancel" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
