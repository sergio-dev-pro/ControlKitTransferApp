import axios from 'axios';
import BASE_URL from '../constants/api';
import BASE_URL_V2 from '../constants/api2';
import { api } from './InterceptorApi';

export const getEventRequiredFields = async eventId =>
  axios({
    url: BASE_URL + `/api/events/${eventId}/fields`,
    method: 'GET',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/json-patch+json',
    },
  });

export const getSponsors = async (eventId, token) => {
  const response = await axios({
    url: BASE_URL_V2 + `/events/${eventId}/sponsors`,
    method: 'GET',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/json-patch+json',
      'Authorization': 'Bearer ' + token
    },
  });
  return response.data
}

export const getEventDays = async (eventId, token) => {
  const response = await axios({
    url: BASE_URL_V2 + `/Events/${eventId}/Days`,
    method: 'GET',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/json-patch+json',
      'Authorization': 'Bearer ' + token
    },
  });

  return response.data
}

export const getEventSectors = async (eventId, token) => {
  const response = await axios({
    url: BASE_URL_V2 + `/Events/${eventId}/Sectors`,
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json-patch+json',
      'Authorization': 'Bearer ' + token
    },
  });

  return response.data
}

export const getKitDelivery = async (code) => {
  var response = await axios({
    url: BASE_URL + `/api/events/${code}/kitDelivery`,
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json-patch+json',
    },
  });
  return response.data;

};

export const getEventsList = async (token, companyId) => {
  const url = `${BASE_URL_V2}/events?companyId=${companyId}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn('⚠️ Token expirado, tentando atualizar...');

      const tokens = await refreshAccessToken();

      if (tokens?.accessToken) {
        // tenta novamente com o novo access token
        const retryResponse = await axios.get(url, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });
         return {newToken: tokens?.accessToken, refreshToken: tokens?.refreshToken, ...retryResponse.data}
      }
    }

    console.error('❌ Erro ao buscar lista de eventos:', error);
    throw error;
  }
};


export const getAccessPolicies = async (eventId, token) => {
  const response = await axios({
    url: `${BASE_URL_V2}/Events/${eventId}/accessPolicies`,
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json-patch+json',
      'Authorization': 'Bearer ' + token
    },
  });

  return response.data;
};