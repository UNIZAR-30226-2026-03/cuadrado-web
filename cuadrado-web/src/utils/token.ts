// utils/token.ts - Acceso centralizado a tokens JWT en localStorage.
//
// Encapsula los accesos directos a localStorage para facilitar
// el cambio de estrategia de almacenamiento en el futuro (cookies, sessionStorage…).

/** Devuelve el access token o null si no existe o el acceso falla */
export function getAccessToken(): string | null {
  try {
    return localStorage.getItem('accessToken');
  } catch {
    return null;
  }
}

/** Devuelve el refresh token o null si no existe o el acceso falla */
export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem('refreshToken');
  } catch {
    return null;
  }
}

/** Persiste ambos tokens tras un login o refresh exitoso */
export function setTokens(access: string, refresh: string): void {
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

/** Elimina ambos tokens al hacer logout */
export function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}
