// Wrapper Axios pour gérer l'authentification JWT et les erreurs
import axios, { AxiosError } from 'axios';

// Map pour suivre les tentatives de retry
const retryMap = new WeakMap();

const api = axios.create({
  baseURL: 'https://votre-backend-django.com/api/', // À adapter à votre URL
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

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(async (config) => {
  if (getTokenFunction) {
    const token = await getTokenFunction();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Intercepteur pour gérer les erreurs et le refresh automatique des tokens
api.interceptors.response.use(
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
          return api(originalRequest);
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

export default api;
