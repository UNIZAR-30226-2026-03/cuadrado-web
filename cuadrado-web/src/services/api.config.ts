// services/api.config.ts - URL base de la API compartida por todos los servicios
//
// Se lee de la variable de entorno VITE_API_URL (definida en .env).
// En desarrollo apunta a localhost; en produccion se configura en el entorno de despliegue.

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
