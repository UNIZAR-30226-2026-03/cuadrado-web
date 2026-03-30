// ─────────────────────────────────────────────────────────
// services/auth.service.ts - Capa de acceso a la API de autenticacion
//
// Centraliza todas las llamadas HTTP de autenticacion:
//   - El contexto (AuthContext) no necesita saber los detalles de fetch.
//   - Si la URL o el formato de la API cambia, solo hay que editar aqui.
//   - Se puede sustituir fetch por axios u otra libreria facilmente.

import type {
  RegisterPayload,
  LoginPayload,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  VerifyCodePayload,
  ResetPasswordPayload,
  AuthResponse,
} from '../types/auth.types';

import { API_URL } from './api.config';

// --- handleResponse ---
// Parsea la respuesta HTTP y lanza un error si el codigo es >= 400.
async function handleResponse(res: Response) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error en la peticion');
  return data;
}

/** Registra un nuevo usuario. POST /auth/register */
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

/** Autentica un usuario y devuelve los tokens JWT. POST /auth/login */
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

/** Cambia la contrasena del usuario autenticado. PATCH /auth/change-password */
export async function changePasswordRequest(
  payload: ChangePasswordPayload,
  accessToken: string  // Token JWT necesario para identificar al usuario
): Promise<void> {
  const res = await fetch(`${API_URL}/auth/change-password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  await handleResponse(res);
}

/** Solicita el envio del correo de recuperacion. POST /forgotten_passwd/notify */
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

/** Verifica el codigo de recuperacion recibido por email. POST /forgotten_passwd/verify */
export async function verifyCodeRequest(
  payload: VerifyCodePayload
): Promise<void> {
  const res = await fetch(`${API_URL}/forgotten_passwd/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  await handleResponse(res);
}

/** Restablece la contrasena tras verificar el codigo. POST /forgotten_passwd/reset */
export async function resetPasswordRequest(
  payload: ResetPasswordPayload
): Promise<void> {
  const res = await fetch(`${API_URL}/forgotten_passwd/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  await handleResponse(res);
}
