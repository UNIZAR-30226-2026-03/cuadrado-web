// context/ModalContext.tsx - Estado global para modales compartidos de la app.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type ActiveModal = 'settings' | 'create-room' | null;

interface ModalContextType {
  activeModal: ActiveModal;
  isSettingsOpen: boolean;
  isCreateRoomOpen: boolean;
  openSettingsModal: () => void;
  openCreateRoomModal: () => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const openSettingsModal = useCallback(() => {
    setActiveModal('settings');
  }, []);

  const openCreateRoomModal = useCallback(() => {
    setActiveModal('create-room');
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const value = useMemo<ModalContextType>(
    () => ({
      activeModal,
      isSettingsOpen: activeModal === 'settings',
      isCreateRoomOpen: activeModal === 'create-room',
      openSettingsModal,
      openCreateRoomModal,
      closeModal,
    }),
    [activeModal, closeModal, openCreateRoomModal, openSettingsModal],
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal debe usarse dentro de ModalProvider');
  }
  return context;
}
