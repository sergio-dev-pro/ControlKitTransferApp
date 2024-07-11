import axios from 'axios';

export const detectFace = async (formData) => {
  // try {
  //   const url = 'https://api-facial.credenciamentospr.com/api/faces/detect';
  //   const response = await axios({
  //     url,
  //     method: 'POST',
  //     data: formData,
  //     headers: {
  //       Accept: 'application/json',
  //       'Content-Type': 'multipart/form-data',
  //     },
  //   });
  //   console.log('@@faceDetectResult='+response.data);
  //   return response.data.faces;
  // } catch (error) {
  //   console.log(error);
  //   alert(error.response.data);
  //   return 0;
  // }
  return 1;
};

