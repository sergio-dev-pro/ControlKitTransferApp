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

export const registerBraceletDelivery = async (code, token, reason) =>
  await axios({
    url: BASE_URL + `/api/tickets/${code}/blaceletDelivery?reason=${reason}`,
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
  reason
) =>
  await axios({
    url:
      BASE_URL +
      `/api/tickets/blaceletDeliveryByDocument?document=${document}&day=${day}&eventId=${eventId}&reason=${reason}`,
    method: 'PATCH',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/json-patch+json',
      Authorization: 'Bearer ' + token,
    },
  });
export const braceletRegister = async (operatorToken, token, day, code, reason) => {
  const formData = new FormData();
  formData.append('token', token);
  formData.append('day', day);
  formData.append('code', code);
  return await axios({
    url: BASE_URL + `/api/tickets/blaceletCode`,
    method: 'PATCH',
    data: {token, code, day, reason},
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/json-patch+json',
      Authorization: 'Bearer ' + operatorToken,
    },
  });
};

export const hasBraceleteCode = async (token, day, userToken) => {
  const url = `${BASE_URL}/api/tickets/hasBlaceletCode?token=${encodeURIComponent(token)}&day=${day}`;

  try {
    const response = await axios({
      url: url,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
      
    });
    console.log(response)
    return response.data;
   
  } catch (error) {
    console.error('Erro ao verificar o código da pulseira:', error);
    throw error;
  }
 
};