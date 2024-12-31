import axios from 'axios';
import BASE_URL from '../constants/api';

export const getEventRequiredFields = async eventId =>
  axios({
    url: BASE_URL + `/api/events/${eventId}/fields`,
    method: 'GET',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/json-patch+json',
    },
  });

  export const getSponsors = async (eventId, token) =>
  await axios({
    url: BASE_URL + `/api/events/${eventId}/sponsors`,
    method: 'GET',
    headers: {
      Accept: 'text/plain',
      'Authorization': 'Bearer ' + token
    },
  });

export const getEventDays = async eventId =>
  axios({
    url: BASE_URL + `/api/events/${eventId}/days`,
    method: 'GET',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/json-patch+json',
    },
  });

  export const getEventSectors = async eventId =>
  await axios({
    url: BASE_URL + `/api/events/${eventId}/sectors`,
    method: 'GET',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/json-patch+json',
    },
  });

  export const getKitDelivery = async (code) => {
    try {
      var response = await axios({
        url: BASE_URL + `/api/events/${code}/kitDelivery`,
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json-patch+json',
        },
      });
      return response.data;
    } catch (error) {
      console.log('error', error);
      console.log('error error.response.data', error.response.data);
      alert(error.response.data.errors);
      return null;
    }
  };
