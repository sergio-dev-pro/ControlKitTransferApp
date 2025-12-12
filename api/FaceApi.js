import axios from 'axios';
import { Alert } from 'react-native';
import { getAndroidId } from 'react-native-device-info';

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
    console.log('@@faceDetectResult='+response.data);
    return response.data;
  } catch (error) {
    Alert.alert('', error.response.data.message);
    return null;
  }
};

