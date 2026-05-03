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

/** Props opcionales que se pueden pasar al abrir el modal de ajustes */
export interface SettingsModalProps {
  settingsContext?: 'lobby' | 'waiting-room' | 'in-game';
  isHost?: boolean;
  onLeaveRoom?: () => void;
  onLeaveGame?: () => void;
  onSaveAndClose?: () => void;
  onCloseWithoutSave?: () => void;
}

interface ModalContextType {
  activeModal: ActiveModal;
  isSettingsOpen: boolean;
  isCreateRoomOpen: boolean;
  settingsProps: SettingsModalProps;
  openSettingsModal: (props?: SettingsModalProps) => void;
  openCreateRoomModal: () => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [settingsProps, setSettingsProps] = useState<SettingsModalProps>({});

  const openSettingsModal = useCallback((props?: SettingsModalProps) => {
    setSettingsProps(props ?? {});
    setActiveModal('settings');
  }, []);

  const openCreateRoomModal = useCallback(() => {
    setActiveModal('create-room');
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSettingsProps({});
  }, []);

  const value = useMemo<ModalContextType>(
    () => ({
      activeModal,
      isSettingsOpen: activeModal === 'settings',
      isCreateRoomOpen: activeModal === 'create-room',
      settingsProps,
      openSettingsModal,
      openCreateRoomModal,
      closeModal,
    }),
    [activeModal, settingsProps, closeModal, openCreateRoomModal, openSettingsModal],
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
