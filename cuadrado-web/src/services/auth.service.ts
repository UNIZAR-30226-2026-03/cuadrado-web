import type {
  RegisterPayload,
  LoginPayload,
  ChangePasswordPayload,
  RefreshPayload,
  AuthResponse,
} from '../types/auth.types';

const API_URL = import.meta.env.VITE_API_URL;

async function handleResponse(res: Response) {
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Error en la petición');
  }

  return data;
}

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

export async function changePasswordRequest(
  payload: ChangePasswordPayload,
  accessToken: string
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