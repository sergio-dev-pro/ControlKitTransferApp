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

export const getEventsList = async (_token, companyId) => {
  const response = await api.get('/events', {
    params: { companyId },
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data;
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