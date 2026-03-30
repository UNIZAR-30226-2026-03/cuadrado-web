// types/auth.types.ts - Tipos de payloads y respuestas de la API de autenticacion

/** Datos para registrar un nuevo usuario */
export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

/** Datos para iniciar sesion */
export interface LoginPayload {
  username: string;
  password: string;
}

/** Datos para cambiar la contrasena de un usuario autenticado */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/** Datos para refrescar los tokens cuando el accessToken caduca */
export interface RefreshPayload {
  refreshToken: string;
}

/** Datos para solicitar el correo de recuperacion de contrasena */
export interface ForgotPasswordPayload {
  email: string;
}

/** Datos para verificar el codigo de recuperacion recibido por email */
export interface VerifyCodePayload {
  email: string;
  authCode: string;
}

/** Datos para restablecer la contrasena tras verificar el codigo */
export interface ResetPasswordPayload {
  email: string;
  authCode: string;    // 9 caracteres
  newPassword: string; // minimo 8 caracteres
}

/** Respuesta del backend tras login o refresh.
 *  accessToken: vida corta, se envia en cada peticion protegida.
 *  refreshToken: vida larga, solo para obtener un nuevo accessToken. */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user?: {
    username: string;
    eloRating: number;
    cubitos: number;
  };
}
