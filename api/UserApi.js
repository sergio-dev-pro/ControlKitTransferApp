import axios from 'axios';
import BASE_URL from '../constants/api';
import { getModel } from 'react-native-device-info';
import { Alert } from 'react-native';
import BASE_URL_V2 from '../constants/api2';


export const getUserByCpf = async (cpf, eventId) =>
  axios({
    url:
      BASE_URL +
      '/api/users/manual/byDocument?document=' +
      cpf +
      '&eventId=' +
      eventId,
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
export const getUserByCpfWithAuth = async (cpf, eventId, token, fromKitDelivery = false, fromBlaceletRegistration = false) => {
  const cleanCpf = cpf.replace(/\D/g, '');
  return axios({
    url:
      BASE_URL_V2 + `/users/bydocument?document=${cleanCpf}&eventid=${eventId}`,
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: 'Bearer ' + token,
    },

  });
}

export const getUserByEmail = async (email, eventId) =>
  axios({
    url:
      BASE_URL +
      '/api/users/manual/byEmail?email=' +
      email +
      '&eventId=' +
      eventId,
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

export const saveUserPhoto = async formData => {
  formData.append('deviceInfo', getModel());
  try {
    var response = await axios({
      url: BASE_URL + '/api/files/self',
      method: 'POST',
      data: formData,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.log('error', error);
    console.log('error error.response.data', error.response.data);
    alert(error.response.data.errors);
    return null;
  }
};

export const saveUserPhotoAgain = async (formData, token) => {
  try {
   await axios({
      url: BASE_URL_V2 + "/files/updateFace?origin=meetingpointapp",
      method: "POST",
      data: formData,
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
        Authorization: "Bearer " + token,
      },
    });
   
    return true

  } catch (error) {
    console.log("Erro na requisição:", error);
    if (error.response) {
      console.log("Status da resposta:", error.response.status);
      console.log("Headers da resposta:", error.response.headers);
      console.log("Dados do erro na resposta:", error.response.data);
    } else {
      console.log("Erro sem resposta do servidor:", error.message);
    }
    return null;
  }
};

export const guestPreRegister = async formData => {
  try {
    var response = await axios({
      url: BASE_URL + '/api/files/guest/self',
      method: 'POST',
      data: formData,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    });
    return response?.data;
  } catch (error) {
    console.log('error', error);
    console.log('error error.response.data', error.response.data);
    alert(error.response.data.errors);
    return null;
  }
};
export const newUserPreRegister = async (formData, token) =>
  await axios({
    url: BASE_URL + '/api/files/new/self',
    method: 'POST',
    data: formData,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data',
      Authorization: 'Bearer ' + token,
    },
  });

export const completeManualRegister = async (data, userToken) =>
  axios({
    url: BASE_URL + '/api/users/manual',
    method: 'PUT',
    data: data,
    headers: {
      Accept: 'application/json',
      Authorization: 'Bearer ' + userToken,
    },
  });

export const completeTicketRegister = async (data, userToken) => {
  console.log(BASE_URL + '/api/users/new');
  return axios({
    url: BASE_URL + '/api/users/new',
    method: 'POST',
    data: data,
    headers: {
      Accept: 'application/json',
      Authorization: 'Bearer ' + userToken,
    },
  });
};

export const updateEmail = async (data, userToken) => {

  axios({
    url: BASE_URL_V2 + '/users/updateEmail',
    method: 'PATCH',
    data: data,
    headers: {
      Accept: 'application/json',
      Authorization: 'Bearer ' + userToken,
    },
  });
};


export const completeFastTicketRegister = async (eventId, data, userToken) => {
  console.log(BASE_URL + '/api/users/fast');
  console.log('payload=' + JSON.stringify(data));
  try {
    var response = await axios({
      url: BASE_URL + '/api/users/fast',
      method: 'POST',
      data: { ...data, eventId: eventId },
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + userToken,
      },
    });
    console.log('response returned=' + JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.log('error', error);
    console.log('error error.response.data', error.response.data);
    alert(error.response.data.errors);
    return null;
  }
};
