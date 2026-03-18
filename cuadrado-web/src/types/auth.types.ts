// ─────────────────────────────────────────────────────────
// types/auth.types.ts — Tipos específicos de autenticación
//
// Define las formas (shapes) de los datos que se envían y
// reciben al interactuar con los endpoints de autenticación
// del backend. Mantenerlos separados de los tipos de dominio
// facilita la localización de cambios si la API evoluciona.
// ─────────────────────────────────────────────────────────

// Datos necesarios para registrar un nuevo usuario
export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

// Datos necesarios para iniciar sesión
export interface LoginPayload {
  username: string;
  password: string;
}

// Datos para cambiar la contraseña de un usuario autenticado
export interface ChangePasswordPayload {
  currentPassword: string; // Contraseña actual (para verificar identidad)
  newPassword: string;     // Nueva contraseña a establecer
}

// Datos para refrescar los tokens de sesión cuando el accessToken caduca
export interface RefreshPayload {
  refreshToken: string;
}

// Datos para solicitar el correo de recuperación de contraseña
export interface ForgotPasswordPayload {
  email: string;
}

// Respuesta del backend tras un login o refresh exitoso.
// La app usa autenticación JWT con dos tokens:
//   - accessToken: vida corta, se envía en cada petición protegida
//   - refreshToken: vida larga, solo se usa para obtener un nuevo accessToken
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}
