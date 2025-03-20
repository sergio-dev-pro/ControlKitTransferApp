import axios from 'axios';
import BASE_URL from '../constants/api';
import BASE_URL_V2 from '../constants/api2';


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
export const braceletRegister = async (operatorToken, code, reason, accessKey, eventId) => {
  return await axios({
    url: BASE_URL_V2 + `/tickets/braceletCode`,
    method: 'PATCH',
    data: {code, reason, accessKey, eventId},
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/json-patch+json',
      Authorization: 'Bearer ' + operatorToken,
    },
  });
};

export const hasBraceleteCode = async (userToken, accessKey, eventId) => {
  const url = `${BASE_URL_V2}/tickets/hasBraceletCode?eventId=${eventId}&accessKey=${accessKey}`;

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