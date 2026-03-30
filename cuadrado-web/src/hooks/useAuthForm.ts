// hooks/useAuthForm.ts - Estado compartido de errores para formularios de autenticacion
//
// Extrae el patron repetido en las 5 paginas de auth:
//   - apiError: mensaje de error del servidor (se muestra arriba del formulario)
//   - showNetworkError: activa el ErrorModal cuando el backend no responde
//   - withSubmit: wrapper try/catch que clasifica los errores automaticamente
//   - useFieldErrors: estado de errores por campo con clearFieldError

import { useState } from 'react';

// --- useAuthForm ---

interface UseAuthFormReturn {
  apiError: string;
  showNetworkError: boolean;
  setApiError: (msg: string) => void;
  dismissNetworkError: () => void;
  /** Ejecuta fn() capturando errores de red y de API automaticamente */
  withSubmit: (fn: () => Promise<void>) => Promise<void>;
}

/** Gestiona errores de API y de red comunes a todos los formularios de autenticacion */
export function useAuthForm(): UseAuthFormReturn {
  const [apiError, setApiError] = useState('');
  const [showNetworkError, setShowNetworkError] = useState(false);

  async function withSubmit(fn: () => Promise<void>) {
    setApiError('');
    try {
      await fn();
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        // Error de red: el backend no es accesible
        setShowNetworkError(true);
      } else if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError('Error desconocido');
      }
    }
  }

  return {
    apiError,
    showNetworkError,
    setApiError,
    dismissNetworkError: () => setShowNetworkError(false),
    withSubmit,
  };
}

// --- useFieldErrors ---

interface UseFieldErrorsReturn {
  fieldErrors: Record<string, string>;
  setFieldErrors: (errors: Record<string, string>) => void;
  /** Elimina el error de un campo al empezar a escribir */
  clearFieldError: (field: string) => void;
}

/** Gestiona errores de validacion por campo en formularios */
export function useFieldErrors(): UseFieldErrorsReturn {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function clearFieldError(field: string) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  return { fieldErrors, setFieldErrors, clearFieldError };
}
