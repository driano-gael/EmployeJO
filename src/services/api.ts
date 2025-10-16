// Wrapper Axios pour gérer l'authentification JWT et les erreurs
import axios, { AxiosError } from 'axios';

// Map pour suivre les tentatives de retry
const retryMap = new WeakMap();

// Instance pour l'authentification - URL de base générale
export const authApi = axios.create({
  baseURL: 'https://api.nabzh.ninja/api/', // Endpoints d'authentification
});

// Instance pour les tickets - URL spécifique au service QR code
const ticketApi = axios.create({
  baseURL: 'https://api.nabzh.ninja/api/qr_code_service/', // Endpoints de tickets
});

// Fonction pour définir le token (sera appelée depuis authService)
let getTokenFunction: (() => Promise<string | null>) | null = null;
let refreshTokenFunction: (() => Promise<string | null>) | null = null;
let logoutFunction: (() => Promise<void>) | null = null;

export const setAuthFunctions = (
  getToken: () => Promise<string | null>,
  refreshToken: () => Promise<string | null>,
  logout: () => Promise<void>
) => {
  getTokenFunction = getToken;
  refreshTokenFunction = refreshToken;
  logoutFunction = logout;
};

// Intercepteur pour ajouter le token aux requêtes de tickets
ticketApi.interceptors.request.use(async (config) => {
  console.log('📡 Requête ticket envoyée vers:', config.baseURL + config.url);
  console.log('🔐 Headers:', config.headers);

  if (getTokenFunction) {
    const token = await getTokenFunction();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token ajouté à la requête ticket');
    } else {
      console.log('⚠️ Aucun token disponible');
    }
  }
  return config;
});

// Intercepteur pour gérer les erreurs et le refresh automatique des tokens
ticketApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !retryMap.get(originalRequest)) {
      retryMap.set(originalRequest, true);

      // Tentative de refresh du token
      if (refreshTokenFunction) {
        const newToken = await refreshTokenFunction();

        if (newToken) {
          // Retry la requête avec le nouveau token
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return ticketApi(originalRequest);
        } else {
          // Si le refresh échoue, rediriger vers la connexion
          if (logoutFunction) {
            await logoutFunction();
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export default ticketApi; // Export par défaut pour les tickets
