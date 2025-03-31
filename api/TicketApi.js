import axios from 'axios';
import BASE_URL from '../constants/api';
import BASE_URL_V2 from '../constants/api2';


export const fetchTickets = async (deviceId, eventId, userToken) =>
  axios({
    url: BASE_URL + '/api/tickets/sync',
    method: 'POST',
    data: { deviceId, eventId },
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

export const registerBraceletDelivery = async (token, reason, eventId, accessKey) => {
  try {
    const response = await axios({
      url: BASE_URL_V2 + `/tickets/deliveryBracelet`,
      method: 'PATCH',
      data: { reason, eventId, accessKey },
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return true;
  } catch (error) {
    console.error("Erro na requisição:", error.response?.data || error.message);
    throw error;
  }
};

export const registerBraceletDeliveryByDocument = async (token, reason, eventId, document, accessKeys) => {
      
  const data2 = { reason, eventId, document, accessKeys};

  console.log('Payload + ', data2)

   const response = await axios({
    url: BASE_URL_V2 + `/tickets/deliveryBraceletByDocument`,
    method: 'PATCH',
    data: { reason, eventId, document, accessKey},
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/json-patch+json',
      Authorization: 'Bearer ' + token,
    },
  });

  return response;
}
export const braceletRegister = async (operatorToken, code, reason, accessKey, eventId) => {
  return await axios({
    url: BASE_URL_V2 + `/tickets/braceletCode`,
    method: 'PATCH',
    data: { code, reason, accessKey, eventId },
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