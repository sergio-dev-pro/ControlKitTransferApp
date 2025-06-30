import axios from 'axios';
import BASE_URL from '../constants/api';
import BASE_URL_V2 from '../constants/api2';

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
  await axios({
    url: BASE_URL_V2 + `/Deliveries`,
    method: 'POST',
    data: formData,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data',
      Authorization: 'Bearer ' + token,
    },
  });

  return true;
};

  
