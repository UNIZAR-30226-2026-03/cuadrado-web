// Fichero crear usuarios de prueba
/*
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Usuario, EstadoAutenticacion } from '../types/index.tsx';

const MOCK_USER: Usuario = {
    id: 1,
    nombre: "Usuario de prueba",
    monedas: 100,
    exp: 500,
    partidasJugadas: 10,
    partidasGanadas: 5,
    ranking: 2,
    avatarSeleccionado: "avatar1.png",
    reversoSeleccionado: "reverso1.png",
    tapeteSeleccionado: "tapete1.png",
};

interface TipoContextoAutenticacion extends EstadoAutenticacion {
    login: (email: string, contrasena: string) => Promise<void>;
    registrar: (nombre: string, email: string, contrasena: string) => Promise<void>;
    logout: () => void;
}

const ContextoAutenticacion = createContext<TipoContextoAutenticacion | undefined>(undefined);

export const ProveedorAutenticacion = ({ children }: { children: ReactNode }) => {
    const [usuario, setUsuario] = useState<Usuario | null>(null);

    const login = useCallback(async (email: string, contrasena: string) => {
        // Aquí iría la lógica real de autenticación (API, validación, etc.)
        // Por ahora, simplemente asignamos el usuario de prueba
        setUsuario(MOCK_USER);
    }, []);

    const registrar = useCallback(async (nombre: string, email: string, contrasena: string) => {
        // Aquí iría la lógica real de registro (API, validación, etc.)
        // Por ahora, simplemente asignamos el usuario de prueba
        setUsuario(MOCK_USER);
    }, []);

    const logout = useCallback(() => {
        setUsuario(null);
    }, []);

    return (
        <ContextoAutenticacion.Provider value={{ usuario, estaAutenticado: !!usuario, login, registrar, logout }}>
            {children}
        </ContextoAutenticacion.Provider>
    );
}

export function usarAutenticación() {
  const ctx = useContext(ContextoAutenticacion);
  if (!ctx) throw new Error('usarAutenticación debe usarse dentro de ProveedorAutenticacion');
  return ctx;
}
*/

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

import type {
  LoginPayload,
  RegisterPayload,
  ChangePasswordPayload,
  AuthResponse,
} from '../types/auth.types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthResponse['user'] | null;
  login: (data: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => void;
  changePassword: (data: ChangePasswordPayload) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      return;
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }

    setIsAuthenticated(true);
  }, []);

  async function login(data: LoginPayload) {
    const res = await loginRequest(data);

    localStorage.setItem('accessToken', res.accessToken);
    if (res.refreshToken) {
      localStorage.setItem('refreshToken', res.refreshToken);
    }
    const resolvedUser = res.user ?? { username: data.username };
    localStorage.setItem('user', JSON.stringify(resolvedUser));
    setUser(resolvedUser);

    setIsAuthenticated(true);
  }

  async function register(data: RegisterPayload) {
    await registerRequest(data);
  }

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  }

  async function changePassword(data: ChangePasswordPayload) {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('No autenticado');

    await changePasswordRequest(data, token);
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, register, logout, changePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
