import axios from 'axios';
import BASE_URL from '../constants/api';

export const ticketOwnerDocumentRegistration = (token, formData) =>
  axios({
    url: BASE_URL + `/api/files/v3/documents`,
    method: 'POST',
    data: formData,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data',
      Authorization: 'Bearer ' + token,
    },
  });
export const ticketOwnerSignatureRegistration = (token, formData) =>
  axios({
    url: BASE_URL + `/api/files/v2/signatures`,
    method: 'POST',
    data: formData,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data',
      Authorization: 'Bearer ' + token,
    },
  });
