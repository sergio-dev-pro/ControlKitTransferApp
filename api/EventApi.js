import axios from 'axios';
import BASE_URL from '../constants/api';
import BASE_URL_V2 from '../constants/api2';

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
    url: BASE_URL_V2 + `/events/${eventId}/sponsors`,
    method: 'GET',
    headers: {
      Accept: 'text/plain',
      'Authorization': 'Bearer ' + token
    },
  });

export const getEventDays = async eventId =>
  axios({
    url: BASE_URL_V2 + `/events/${eventId}/days`,
    method: 'GET',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/json-patch+json',
    },
  });

  export const getEventSectors = async eventId =>
  await axios({
    url: BASE_URL_V2 + `/events/${eventId}/sectors`,
    method: 'GET',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/json-patch+json',
    },
  });

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

export const getEventsList = async (token, companiesId) => {
  var response = await axios({
    url: `${BASE_URL_V2}/events?companyId=${companiesId}`,
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json-patch+json',
      'Authorization': 'Bearer ' + token
    },
  });
  return response.data;

};