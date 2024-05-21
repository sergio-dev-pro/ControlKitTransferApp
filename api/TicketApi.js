import axios from 'axios';
import BASE_URL from '../constants/api';

export const fetchTickets = async (deviceId, eventId, userToken) =>
  axios({
    url: BASE_URL + '/api/tickets/sync',
    method: 'POST',
    data: {deviceId, eventId},
    headers: {
      Accept: 'application/json',
      Authorization: 'Bearer ' + userToken,
    },
  });

export const registerTicket = async (code, token) =>
  await axios({
    url: BASE_URL + `/api/tickets/${code}/kitDelivery`,
    method: 'PATCH',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/json-patch+json',
      Authorization: 'Bearer ' + token,
    },
  });

export const registerBraceletDelivery = async (code, token) =>
  await axios({
    url: BASE_URL + `/api/tickets/${code}/blaceletDelivery`,
    method: 'PATCH',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/json-patch+json',
      Authorization: 'Bearer ' + token,
    },
  });

export const registerBraceletDeliveryByDocument = async (
  document,
  day,
  eventId,
  token,
) =>
  await axios({
    url:
      BASE_URL +
      `/api/tickets/blaceletDeliveryByDocument?document=${document}&day=${day}&eventId=${eventId}`,
    method: 'PATCH',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/json-patch+json',
      Authorization: 'Bearer ' + token,
    },
  });
export const braceletRegister = async (operatorToken, token, day, code) => {
  const formData = new FormData();
  formData.append('token', token);
  formData.append('day', day);
  formData.append('code', code);
  return await axios({
    url: BASE_URL + `/api/tickets/blaceletCode`,
    method: 'PATCH',
    data: {token, code, day},
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/json-patch+json',
      Authorization: 'Bearer ' + operatorToken,
    },
  });
};
