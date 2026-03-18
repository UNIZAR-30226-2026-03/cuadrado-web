// ─────────────────────────────────────────────────────────
// services/auth.service.ts — Capa de acceso a la API de autenticación
//
// Este módulo centraliza todas las llamadas HTTP relacionadas
// con la autenticación. Al aislarlo aquí:
//   - El contexto (AuthContext) no necesita saber los detalles de fetch.
//   - Si la URL o el formato de la API cambia, solo hay que editar aquí.
//   - Se puede sustituir fetch por axios u otra librería fácilmente.
// ─────────────────────────────────────────────────────────

import type {
  RegisterPayload,
  LoginPayload,
  ChangePasswordPayload,
  RefreshPayload,
  ForgotPasswordPayload,
  AuthResponse,
} from '../types/auth.types';

// La URL base de la API se lee de las variables de entorno de Vite.
// En desarrollo apunta a localhost; en producción se configura en .env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ── handleResponse ────────────────────────────────────────
// Función auxiliar que procesa todas las respuestas HTTP.
// - Parsea el cuerpo JSON de la respuesta.
// - Si el código HTTP indica error (4xx/5xx), lanza una excepción
//   con el mensaje de error del backend, o uno genérico si no lo hay.
// - Si todo va bien, devuelve los datos parseados.
async function handleResponse(res: Response) {
  const data = await res.json();

  if (!res.ok) {
    // res.ok es false cuando el código HTTP es >= 400
    throw new Error(data.message || 'Error en la petición');
  }

  return data;
}

// ── registerRequest ───────────────────────────────────────
// Registra un nuevo usuario en el sistema.
// POST /auth/register → no devuelve datos (void)
export async function registerRequest(
  payload: RegisterPayload
): Promise<void> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  await handleResponse(res);
}

// ── loginRequest ──────────────────────────────────────────
// Autentica a un usuario y obtiene los tokens JWT.
// POST /auth/login → devuelve { accessToken, refreshToken }
export async function loginRequest(
  payload: LoginPayload
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}

// ── changePasswordRequest ─────────────────────────────────
// Cambia la contraseña de un usuario autenticado.
// PATCH /auth/change-password → requiere el token en la cabecera Authorization
// El uso de PATCH (en lugar de PUT) indica una actualización parcial del recurso.
export async function changePasswordRequest(
  payload: ChangePasswordPayload,
  accessToken: string  // Token JWT necesario para identificar al usuario
): Promise<void> {
  const res = await fetch(`${API_URL}/auth/change-password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`, // Esquema de autenticación Bearer (JWT)
    },
    body: JSON.stringify(payload),
  });

  await handleResponse(res);
}

// ── refreshTokenRequest ───────────────────────────────────
// Obtiene un nuevo par de tokens usando el refreshToken actual.
// Se usa cuando el accessToken ha caducado (vida corta)
// sin obligar al usuario a volver a hacer login.
// POST /auth/refresh → devuelve { accessToken, refreshToken }
export async function refreshTokenRequest(
  payload: RefreshPayload
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}

// ── forgotPasswordRequest ─────────────────────────────────
// Solicita al backend que envíe un correo de recuperación de contraseña.
// POST /forgotten_passwd/notify → no devuelve datos (void)
// (Nota: el endpoint está en una ruta distinta al resto de auth)
export async function forgotPasswordRequest(
  payload: ForgotPasswordPayload
): Promise<void> {
  const res = await fetch(`${API_URL}/forgotten_passwd/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  await handleResponse(res);
}
