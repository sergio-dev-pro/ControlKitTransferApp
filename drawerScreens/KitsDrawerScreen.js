import {Button, Text} from '@rneui/themed';
import axios from 'axios';
import React, {useContext, useState} from 'react';
import {View} from 'react-native';
import Header from '../components/Header';
import QrCodeReader from '../components/QrCodeReader';
import BASE_URL from '../constants/api';
import {useAlert} from '../context/AlertContext';
import {AuthContext} from '../context/AuthContext';
import {getDeviceId} from 'react-native-device-info';
import GStyles from '../style/global';

let deviceId = getDeviceId();
console.log(`deviceId`, deviceId);
function KitsDrawerScreen({navigation}) {
  const authContext = useContext(AuthContext);
  const [showQrCodeReader, setShowQrcodereader] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrCodeReader, setQrcodereader] = useState();
  const setAlertMessage = useAlert();

  const handleQRCodeRead = async code => {
    setShowQrcodereader(false);
    try {
      setLoading(true);
      const url = BASE_URL + `/api/tickets/${code}/kitDelivery`;
      await axios({
        url,
        method: 'PATCH',
        headers: {
          Accept: 'text/plain',
          'Content-Type': 'application/json-patch+json',
          Authorization: 'Bearer ' + authContext.userToken,
        },
      });
      setAlertMessage(
        'Ingresso encontrado! Registro de entrega de kit realizado.',
      );
    } catch (error) {
      console.log(error);
      setAlertMessage(error.response.data.errors);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{...GStyles.view}}>
      <Header openDrawer={() => navigation.openDrawer()} />
      <View style={GStyles.container}>
        <Text h3 h3Style={{marginBottom: 10}}>
          Entrega de kits
        </Text>
        <Button
          loading={loading}
          onPress={() => {
            setQrcodereader(null);
            setShowQrcodereader(true);
          }}>
          Ler código do ingresso
        </Button>
      </View>
      {showQrCodeReader && (
        <QrCodeReader
          onRead={handleQRCodeRead}
          onClose={() => setShowQrcodereader(false)}
        />
      )}
      {qrCodeReader && (
        <Text style={{color: 'black'}}>codigo do qr code: {qrCodeReader}</Text>
      )}
    </View>
  );
}

export default KitsDrawerScreen;
