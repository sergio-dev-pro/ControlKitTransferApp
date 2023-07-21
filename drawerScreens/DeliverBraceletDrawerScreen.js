import {Button, Divider, Text} from '@rneui/themed';
import React, {useContext, useState} from 'react';
import {View} from 'react-native';
import {registerBraceletDelivery} from '../api/TicketApi';
import Header from '../components/Header';
import QrCodeReader from '../components/QrCodeReader';
import {useAlert} from '../context/AlertContext';
import {AuthContext} from '../context/AuthContext';
import {formatDate} from '../helpers/format';
import {isDateGreaterThanOrEqualToToday} from '../helpers/validation';
import GStyles from '../style/global';
import THEME from '../style/theme';

function DeliverBraceletDrawerScreen({navigation}) {
  const [loading, setLoading] = useState(false);
  const [showQrCodeReader, setShowQrcodereader] = useState(false);
  const authContext = useContext(AuthContext);
  const setAlertMessage = useAlert();

  const handleQRCodeRead = async ticketCode => {
    // #
    const isCodeWithHashtag = ticketCode.includes('#');
    const code = isCodeWithHashtag ? ticketCode.split('#')[0] : ticketCode;

    setShowQrcodereader(false);
    try {
      setLoading(true);
      const {data: ticket} = await registerBraceletDelivery(
        code,
        authContext.userToken,
      );
      if (ticket.kitDelivered)
        return setAlertMessage(
          `A pulseira de ${ticket.name} para o dia ${formatDate(
            ticket.day,
          )} já foi entregue.`,
        );
      console.log(ticket.day);
      // if (!isDateGreaterThanOrEqualToToday(ticket.day))
      //   return setAlertMessage(
      //     `A entrega para o dia ${formatDate(
      //       ticket.day,
      //     )} já passou! Nao é possível registrar entrega.`,
      //   );
      setAlertMessage('ITAU Entrega de pulseira registrada com sucesso.', '#32cd32');
    } catch (error) {
      //console.error(error);
      //console.error(JSON.stringify(error));
      console.error(error.response);
      console.log('error by api: ' + error?.response?.data);
      if(error?.response?.data?.errors)
      {
        setAlertMessage(error.response.data.errors, '#dc143c');
        return null;
      }
      setAlertMessage('Entrega não registrada, problema ao enviar registro de entrega de pulseira.', '#dc143c');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{...GStyles.view}}>
      <Header
        style={{marginBottom: 0}}
        openDrawer={() => navigation.openDrawer()}
      />
      <View style={{width: '100%', backgroundColor: THEME.cor.whitesmoke}}>
        <Text h3 h3Style={{padding: 8, textAlign: 'center'}}>
          Entrega de pulseiras
        </Text>
        <Divider />
      </View>
      <View style={[GStyles.container]}>
        <Button
          loading={loading}
          onPress={() => {
            // setQrcodereader(null);
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
    </View>
  );
}

export default DeliverBraceletDrawerScreen;
