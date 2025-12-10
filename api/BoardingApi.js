import axios from 'axios';
import { Alert } from 'react-native';
import BASE_URL_V2 from '../constants/api2';
import { getAndroidId } from 'react-native-device-info';

let deviceId = null;

const getDeviceId = async () => {
  if (!deviceId) {
    deviceId = await getAndroidId();
  }
  return deviceId;
};

export const startBoarding = async (userToken, eventId, itineraryId, vehicleId) =>
{
  var data = {
    itineraryId, vehicleId
  };
  try {
    var response = await axios({
        url: BASE_URL_V2 + `/events/${eventId}/Transports/Boardings`,
        method: 'POST',
        data,
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer ' + userToken,
          'X-Device-Id': await getDeviceId()
        },
      });
      console.log('@@@boardingCreated=' + JSON.stringify(response.data))
    return response.data;
  } catch (error) {
    console.log('error', error);
    console.log('error error.response.data', error.response.data);
    Alert.alert('', error.response.data.message);
    return null;
  }
};

export const finishBoarding = async (userToken, eventId, boardingId) => {
  try {
    await axios({
      url: `${BASE_URL_V2}/events/${eventId}/Transports/Boardings/${boardingId}/Finish`,
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${userToken}`,
        'X-Device-Id': await getDeviceId()
      },
    });
    return true;
  } catch (error) {
    console.log('error', error);
    if (error.response?.data?.message) {
      console.log('error.response.data', error.response.data);
      Alert.alert('', error.response.data.message);
    } else {
      Alert.alert('Erro', 'Ocorreu um erro inesperado ao finalizar o embarque.');
    }
    return null;
  }
};


export const registerTicketBoarding = async (userToken, eventId, boardingId, accessKey) =>
{
  var data = {
    accessKey
  };
  try {
    await axios({
        url: BASE_URL_V2 + `/events/${eventId}/Transports/Boardings/${boardingId}/Scan`,
        method: 'PUT',
        data,
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer ' + userToken,
          'X-Device-Id': await getDeviceId()
        },
      });
    return true;
  } catch (error) {
    console.log('error', error);
    console.log('error error.response.data', error.response.data);
    Alert.alert('', error.response.data.message);
    return null;
  }
};



export const getVehicles = async (userToken, eventId) =>
{
  try {
    var response = await axios({
        url: BASE_URL_V2 + `/events/${eventId}/Vehicles`,
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer ' + userToken,
          'X-Device-Id': await getDeviceId()
        },
      });
    return response.data;
  } catch (error) {
    console.log('error', error);
    console.log('error error.response.data', error.response.data);
    Alert.alert('', error.response.data.message);
    return null;
  }
};

export const getItineraries = async (userToken, eventId) =>
{
  try {
    var response = await axios({
        url: BASE_URL_V2 + `/events/${eventId}/Itineraries`,
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer ' + userToken,
          'X-Device-Id': await getDeviceId()
        },
      });
    return response.data;
  } catch (error) {
    console.log('error', error);
    console.log('error error.response.data', error.response.data);
    Alert.alert('', error.response.data.message);
    return null;
  }
};