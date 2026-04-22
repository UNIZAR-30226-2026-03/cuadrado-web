// context/AuthContext.tsx - Estado global de autenticacion (patron Context + custom hook)
//
// - AuthProvider: gestiona tokens en localStorage y expone acciones de auth.
// - useAuth: hook de consumo; lanza un error descriptivo si se usa fuera del Provider.

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

import {
  loginRequest,
  registerRequest,
  changePasswordRequest,
} from '../services/auth.service';

import { getProfileRequest, getMySettingsRequest } from '../services/user.service';

import type {
  LoginPayload,
  RegisterPayload,
  ChangePasswordPayload,
} from '../types/auth.types';

import type { UserProfile } from '../types/user.types';
import { getAccessToken, setTokens, clearTokens } from '../utils/token';

/** Contrato del contexto: estado y acciones expuestos a los hijos */
interface AuthContextType {
  isAuthenticated: boolean;
  authReady: boolean;
  user: UserProfile | null;
  login: (data: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => void;
  changePassword: (data: ChangePasswordPayload) => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateUser: (patch: Partial<UserProfile>) => void;
}

// undefined como valor por defecto: useAuth lo detecta si se usa fuera del Provider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function readLocalPercent(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return typeof parsed === 'number' && Number.isFinite(parsed) ? clampPercent(parsed) : fallback;
  } catch {
    return fallback;
  }
}

/** Provee el estado de autenticacion a todos los hijos */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  /** Carga el perfil del usuario desde el backend. Fallo silencioso para evitar logout en cascada. */
  async function fetchProfile() {
    const token = getAccessToken();
    if (!token) return;
    try {
      const profile = await getProfileRequest(token);
      // Merge con el estado previo para no perder campos que el backend
      // puede devolver omitidos según el endpoint (e.g. cubitos, equippedSkinID)
      setUser(prev => (prev ? { ...prev, ...profile } : profile));
    } catch {
      // Si el token expiro, el usuario vera datos vacios hasta refrescar
    }
  }

  // Al montar: si hay token guardado, restauramos la sesion
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuthenticated(true);
      fetchProfile();
    }
    setAuthReady(true);
  }, []);

  /** Autentica al usuario, guarda tokens y carga el perfil completo */
  async function login(data: LoginPayload) {
    const res = await loginRequest(data);
    setTokens(res.accessToken, res.refreshToken);
    if (res.user) {
      setUser({
        username:  res.user.username,
        cubitos:   res.user.cubitos   ?? 0,
        eloRating: res.user.eloRating ?? 1200,
      });
    }

    try {
      const settings = await getMySettingsRequest(res.accessToken);
      const volGeneral = readLocalPercent('vol_general', 80);
      const factor = Math.max(volGeneral / 100, 0.01);

      localStorage.setItem('vol_music', JSON.stringify(clampPercent(settings.gameMusicVolume / factor)));
      localStorage.setItem('vol_sfx', JSON.stringify(clampPercent(settings.soundEffectsVolume / factor)));
      localStorage.setItem('vol_voice', JSON.stringify(clampPercent(settings.voiceChatVolume / factor)));

      window.dispatchEvent(new Event('app:audio-settings-changed'));
    } catch {
      // Si falla la carga de settings, mantenemos las preferencias locales existentes.
    }

    setIsAuthenticated(true);
    fetchProfile(); // carga el perfil completo en segundo plano
  }

  /** Registra un usuario. No inicia sesion automaticamente. */
  async function register(data: RegisterPayload) {
    await registerRequest(data);
  }

  /** Elimina los tokens y limpia el estado */
  function logout() {
    clearTokens();
    setUser(null);
    setIsAuthenticated(false);
  }

  /** Cambia la contrasena del usuario autenticado */
  async function changePassword(data: ChangePasswordPayload) {
    const token = getAccessToken();
    if (!token) throw new Error('No autenticado');
    await changePasswordRequest(data, token);
  }

  /** Actualiza el perfil del usuario en memoria (no toca el backend). */
  function updateUser(patch: Partial<UserProfile>) {
    setUser(prev => (prev ? { ...prev, ...patch } : prev));
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, authReady, user, login, register, logout, changePassword, fetchProfile, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Hook para consumir el contexto de autenticacion desde cualquier componente */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
