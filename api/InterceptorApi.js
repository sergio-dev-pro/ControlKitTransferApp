import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL_V2 } from '../constants/api2';

// Instância global da API
export const api = axios.create({
  baseURL: BASE_URL_V2,
  headers: { Accept: 'application/json' },
});

/**
 * Configura o interceptor Axios para atualizar o token automaticamente.
 * @param {function} onTokensRefreshed - Função callback que recebe ({ accessToken, refreshToken })
 */
export const setupAxiosInterceptor = (onTokensRefreshed) => {
  // Remove interceptores antigos antes de adicionar um novo (evita múltiplos handlers)
  api.interceptors.response.handlers = [];

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Verifica se é erro 401/403 e evita loop infinito
      if (
        (error.response?.status === 401 || error.response?.status === 403) &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;

        try {
          const oldRefreshToken = await AsyncStorage.getItem('refreshToken');
          if (!oldRefreshToken) throw new Error('Sem refreshToken salvo');

          // Usa axios direto para não cair em loops com o próprio interceptor
          const { data } = await axios.post(`${BASE_URL_V2}/CompanyUsers/RefreshToken`, {
            refreshToken: oldRefreshToken,
          });

          const newAccessToken = data?.accessToken;
          const newRefreshToken = data?.refreshToken || oldRefreshToken;

          if (!newAccessToken) throw new Error('API não retornou accessToken');

          // Atualiza headers globais e da requisição original
          api.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // Atualiza o contexto + AsyncStorage
          if (onTokensRefreshed) {
            await onTokensRefreshed({
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            });
          }

          // Reenvia a requisição original
          return api(originalRequest);
        } catch (refreshError) {
          console.error('Erro ao tentar atualizar token:', refreshError);

          // Remove tokens inválidos
          await AsyncStorage.multiRemove(['userToken', 'refreshToken']);
        }
      }

      return Promise.reject(error);
    }
  );
};