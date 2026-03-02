// Fichero crear usuarios de prueba
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
    avatar: "avatar1.png",
    reverso: "reverso1.png",
    tapete: "tapete1.png"
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