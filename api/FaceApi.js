import axios from 'axios';
import { Alert } from 'react-native';
import { getAndroidId } from 'react-native-device-info';
import BASE_URL_V2 from '../constants/api2';

export const detectFace = async (formData, userToken) => {
  try {
    const response = await axios({
      url: BASE_URL_V2 + "/faces/detect",
      method: "POST",
      data: formData,
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${userToken}` ,
        'X-Device-Id': await getAndroidId()
      },
    });
    return response.data;
  } catch (error) {
    console.log('ERROR: ', error.response.data)

    Alert.alert('', error.response.data.message);
    return null;
  }
};

