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

import { getProfileRequest } from '../services/user.service';

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

/** Provee el estado de autenticacion a todos los hijos */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
      value={{ isAuthenticated, user, login, register, logout, changePassword, fetchProfile, updateUser }}
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
