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

  export const registerTicket = async (eventId, accessKeys, token) => {
    const payload = { eventId, accessKeys };
    return await axios({
      url: BASE_URL_V2 + `/tickets/kits`,
      method: 'PATCH',
      data: payload,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json-patch+json',
        Authorization: 'Bearer ' + token,
      },
    });
  };

  export const getTicketDelivery = async (eventId, accessKey, token, type) => {
    const payload = { eventId, accessKey };
    return await axios({
      url: BASE_URL_V2 + `/Deliveries?eventId=${eventId}&accessKey=${accessKey}&type=${type}`,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json-patch+json',
        Authorization: 'Bearer ' + token,
      },
    });
  };



export const registerBraceletDelivery = async (token, formData) => {

  const response = await axios({
    url: BASE_URL_V2 + `/Deliveries`,
    method: 'POST',
    data: formData,
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'multipart/form-data',
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