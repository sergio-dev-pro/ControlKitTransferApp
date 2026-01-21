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

export const ticketOwnerDocumentRegistration = (token, formData) => {
  return axios({
    url: BASE_URL_V2 + `/files/signatures/documents`,
    method: 'POST',
    data: formData,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data',
      Authorization: 'Bearer ' + token,
    },
  });
};


export const ticketOwnerSignatureRegistration = async (token, formData) => {
  var response = await axios({
    url: BASE_URL_V2 + `/Deliveries`,
    method: 'POST',
    data: formData,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data',
      Authorization: 'Bearer ' + token,
      'X-Device-Id': await getDeviceId()
    },
  });

  if (response.data.length == 0) {
    return true
  }

  return response.data.map(item => item.errorMessage).join('\n')
};


