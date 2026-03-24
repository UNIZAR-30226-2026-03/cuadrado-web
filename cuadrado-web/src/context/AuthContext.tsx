// ─────────────────────────────────────────────────────────
// context/AuthContext.tsx — Estado global de autenticación
//
// Implementa el patrón "Context + custom hook" de React:
//   - AuthProvider: componente que envuelve la app y expone
//     las funciones de autenticación a todos sus hijos.
//   - useAuth: hook que cualquier componente puede llamar
//     para acceder al estado y acciones de autenticación,
//     sin necesidad de pasar props manualmente (prop drilling).
// ─────────────────────────────────────────────────────────

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

// Contrato del contexto: qué estado y funciones se exponen a los hijos
interface AuthContextType {
  isAuthenticated: boolean;                                    // true si hay sesión activa
  user: UserProfile | null;                                    // Datos del usuario autenticado
  login: (data: LoginPayload) => Promise<void>;               // Inicia sesión y guarda tokens
  register: (data: RegisterPayload) => Promise<void>;         // Registra un nuevo usuario
  logout: () => void;                                          // Cierra la sesión local
  changePassword: (data: ChangePasswordPayload) => Promise<void>; // Cambia la contraseña
  fetchProfile: () => Promise<void>;                           // Refresca los datos del usuario
}

// Creamos el contexto con undefined como valor por defecto.
// Si alguien intenta usar el contexto fuera del Provider, useAuth lo detectará.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── AuthProvider ──────────────────────────────────────────
// Componente que gestiona el estado de autenticación y lo
// proporciona a todos sus componentes hijos mediante el contexto.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Al montar la app, comprobamos si ya hay un token guardado en localStorage.
  // Si existe, intentamos cargar el perfil del usuario desde el backend.
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsAuthenticated(true);
      fetchProfile();
    }
  }, []); // [] → se ejecuta solo una vez, al montar el componente

  // Obtiene el perfil actualizado del usuario desde el backend.
  // Se llama al montar la app (si hay token) y tras el login.
  async function fetchProfile() {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const profile = await getProfileRequest(token);
      setUser(profile);
    } catch {
      // Si falla (token expirado, etc.), no cerramos sesión aquí;
      // el usuario verá datos vacíos hasta que refresque
    }
  }

  // Llama al servicio de login, guarda los tokens y los datos del usuario.
  async function login(data: LoginPayload) {
    const res = await loginRequest(data);

    // Guardamos ambos tokens en localStorage para persistirlos entre sesiones
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);

    // Guardamos los datos del usuario que devuelve el login
    if (res.user) {
      setUser({
        username: res.user.username,
        cubitos: res.user.cubitos ?? 0,
        eloRating: res.user.eloRating ?? 1200,
      });
    }

    setIsAuthenticated(true);

    // Cargamos el perfil completo en segundo plano
    fetchProfile();
  }

  // Solo llama al servicio de registro. No inicia sesión automáticamente:
  // el usuario debe hacer login explícitamente tras registrarse.
  async function register(data: RegisterPayload) {
    await registerRequest(data);
  }

  // Elimina los tokens del almacenamiento local y limpia el estado
  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
  }

  // Cambia la contraseña del usuario autenticado.
  // Requiere el accessToken para que el backend verifique la identidad.
  async function changePassword(data: ChangePasswordPayload) {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('No autenticado');

    await changePasswordRequest(data, token);
  }

  return (
    // Proporcionamos el estado y las funciones a todos los componentes hijos
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, register, logout, changePassword, fetchProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── useAuth ───────────────────────────────────────────────
// Hook personalizado para consumir el contexto de autenticación.
// Lanza un error descriptivo si se usa fuera del AuthProvider,
// lo que facilita depurar problemas de configuración.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
