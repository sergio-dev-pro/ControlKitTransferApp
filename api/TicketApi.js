import axios from 'axios';
import BASE_URL from '../constants/api';
import BASE_URL_V2 from '../constants/api2';
import { getAndroidId } from 'react-native-device-info';


let deviceId = null;

const getDeviceId = async () => {
  if (!deviceId) {
    deviceId = await getAndroidId();
  }
  return deviceId;
};

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

  export const getTicketDelivery = async (eventId, accessKey, token, type) => {
    return await axios({
      url: BASE_URL_V2 + `/Deliveries?eventId=${eventId}&accessKey=${accessKey}&type=${type}`,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json-patch+json',
        Authorization: 'Bearer ' + token,
        'X-Device-Id': await getDeviceId()
      },
    });
  };

  export const getDeliveryByCode = async (eventId, code, token, type) => {
    return await axios({
      url: BASE_URL_V2 + `/Deliveries/${code}?eventId=${eventId}&type=${type}`,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json-patch+json',
        Authorization: 'Bearer ' + token,
        'X-Device-Id': await getDeviceId()
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
      'X-Device-Id': await getDeviceId()
    },
  });

  return response;
}
export const braceletRegister = async (operatorToken, code, reason, accessKey, eventId) => {
  return await axios({
    url: BASE_URL_V2 + `/tickets/keys/${accessKey}`,
    method: 'POST',
    data: { code, reason, eventId },
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/json-patch+json',
      Authorization: 'Bearer ' + operatorToken,
      'X-Device-Id': await getDeviceId()
    },
  });
};

export const hasBraceleteCode = async (userToken, accessKey, eventId) => {
  const url = `${BASE_URL_V2}/tickets/keys/${accessKey}?eventId=${eventId}`;

  try {
    const response = await axios({
      url: url,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'X-Device-Id': await getDeviceId()
      },

    });
    console.log(response)
    return response.data;

  } catch (error) {
    console.error('Erro ao verificar o código da pulseira:', error);
    throw error;
  }
};