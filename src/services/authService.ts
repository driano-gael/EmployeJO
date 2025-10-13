// Service d'authentification adapté à l'API Django DRF
import api, { setAuthFunctions } from './api';
import * as SecureStore from 'expo-secure-store';

export interface LoginResponse {
  access: string;
  refresh: string;
  role: string;
  email: string;
}

export const getToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync('accessToken');
};

export const getRefreshToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync('refreshToken');
};

export const refreshToken = async (): Promise<string | null> => {
  try {
    const refreshTokenValue = await getRefreshToken();
    if (!refreshTokenValue) return null;

    const response = await api.post('auth/refresh/', { refresh: refreshTokenValue });
    const { access } = response.data;

    await SecureStore.setItemAsync('accessToken', access);
    return access;
  } catch (error) {
    // Si le refresh échoue, supprimer tous les tokens
    await logout();
    return null;
  }
};

export const logout = async (): Promise<void> => {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
};

// Initialiser les fonctions d'authentification dans api.ts
setAuthFunctions(getToken, refreshToken, logout);

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await api.post('auth/login/', { email, password });
  const { access, refresh, role, email: userEmail } = response.data;

  // Stocker les tokens de manière sécurisée
  await SecureStore.setItemAsync('accessToken', access);
  await SecureStore.setItemAsync('refreshToken', refresh);

  return { access, refresh, role, email: userEmail };
};
