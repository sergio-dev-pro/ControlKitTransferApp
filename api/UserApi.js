import axios from 'axios';
import BASE_URL from '../constants/api';
import { getModel } from 'react-native-device-info';
import { Alert } from 'react-native';
import BASE_URL_V2 from '../constants/api2';
import { api } from './InterceptorApi';


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

export const refreshAccessToken = async () => {
  try {
    const oldRefreshToken = await AsyncStorage.getItem('refreshToken');
    if (!oldRefreshToken) {
      console.warn('Nenhum refreshToken encontrado no AsyncStorage');
      return null;
    }

    const response = await axios({
    url:
      `${BASE_URL_V2}/CompanyUsers/RefreshToken`,
    data: {
      refreshToken: oldRefreshToken,
    },
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
  });

    const newAccessToken = response.data?.accessToken;
    const newRefreshToken = response.data?.refreshToken || oldRefreshToken;

    if (!newAccessToken) {
      console.error('Resposta inválida da API de refreshToken');
      return null;
    }

    // Salva novos tokens
    await AsyncStorage.setItem('userToken', newAccessToken);
    await AsyncStorage.setItem('refreshToken', newRefreshToken);

    console.log('✅ Token atualizado com sucesso');
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (error) {
    console.error('❌ Erro ao atualizar o token:', error);
    return null;
  }
};



export const getUserByCpfWithAuth = async (cpf, eventId, token) => {
  const cleanCpf = cpf.replace(/\D/g, '');
  const url = `${BASE_URL_V2}/users?searchTerm=${cleanCpf}&eventid=${eventId}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn('⚠️ Token expirado, tentando atualizar...');
      const tokens = await refreshAccessToken();

      if (tokens?.accessToken) {
        // tenta novamente com o novo token
        const retryResponse = await axios.get(url, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });
        var result = retryResponse.data;

        return {newToken: tokens?.accessToken, refreshToken: tokens?.refreshToken, ...result}
      }
    }

    console.error('Erro ao buscar usuário por CPF:', error);
    throw {
      response: {
        status: error?.response?.status ?? 500,
        data: error?.response?.data
      },
      message: error.message
    };
  }
};

export const getUserByEmail = async (email, eventId, token) =>
{
  var response = await axios({
    url:
      BASE_URL_V2 +
      '/users?searchTerm=' +
      email +
      '&eventId=' +
      eventId,
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: 'Bearer ' + token
    },
  });

  return response.data;
}

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
  await axios({
    url: BASE_URL_V2 + "/users/face?origin=meetingpointapp",
    method: "POST",
    data: formData,
    headers: {
      Accept: "application/json",
      "Content-Type": "multipart/form-data",
      Authorization: "Bearer " + token,
    },
  });

  return true
};

export const completeUserRegister = async (formData, token) => {
  await axios({
    url: BASE_URL_V2 + "/users/active",
    method: "POST",
    data: formData,
    headers: {
      Accept: "application/json",
      "Content-Type": "multipart/form-data",
      Authorization: "Bearer " + token,
    },
  });

  return true
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
    url: BASE_URL_V2 + '/users/email',
    method: 'PATCH',
    data: data,
    headers: {
      Accept: 'application/json',
      Authorization: 'Bearer ' + userToken,
    },
  });
};


export const completeFastTicketRegister = async (formData, userToken) => {

  var response = await axios({
    url: BASE_URL_V2 + '/tickets',
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${userToken}` ,
    },
  });
  console.log('response returned=' + JSON.stringify(response.data));
  return true;
};

export const completeManualRegisterByTickets = async (data, userToken) => {
  axios({
    url: BASE_URL_V2 + '/users/manual',
    method: 'PUT',
    data,
    headers: {
      Accept: 'application/json',
      Authorization: 'Bearer ' + userToken
    },
  });
};

