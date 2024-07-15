import {Button, Divider, Text} from '@rneui/themed';
import React, {useContext, useEffect, useState} from 'react';
import {Alert, View} from 'react-native';
import {
  registerBraceletDelivery,
  registerBraceletDeliveryByDocument,
} from '../api/TicketApi';
import Header from '../components/Header';
import QrCodeReader from '../components/QrCodeReader';
import {useAlert} from '../context/AlertContext';
import {AuthContext} from '../context/AuthContext';
import {formatDate} from '../helpers/format';
import {isDateGreaterThanOrEqualToToday} from '../helpers/validation';
import GStyles from '../style/global';
import THEME from '../style/theme';
import {Input} from '@rneui/themed';
import {getEventDays} from '../api/EventApi';
import SelectModal from '../components/SelectModal';
import JustificationModal from '../components/JustificationModal';

function DeliverBraceletDrawerScreen({navigation}) {
  const [loading, setLoading] = useState(false);
  const [eventDay, setEventDay] = useState(null);
  const [days, setDays] = useState([]);
  const [document, setDocument] = useState(null);
  const [showQrCodeReader, setShowQrcodereader] = useState(false);
  const authContext = useContext(AuthContext);
  const setAlertMessage = useAlert();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [reason, setReason] = useState('');
  const [justificationSubmitted, setJustificationSubmitted] = useState(false);
  const [justificationMessage, setJustificationMessage] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState(null);
  const [savedTicketCode, setSavedTicketCode] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        console.log('selectedEventId=' + authContext.selectedEventId);
        const {data: days} = await getEventDays(authContext.selectedEventId);
        setDays(days);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (justificationSubmitted && reason) {
      if (deliveryMethod === 'Document') {
        saveBraceletDeliveryByDocument();
      } else if (deliveryMethod === 'QRCode' && savedTicketCode) {
        handleQRCodeRead(savedTicketCode);
      }
      setJustificationSubmitted(false);
      setReason('');
    }
  }, [reason]);

  const handleQRCodeRead = async ticketCode => {

    if (!savedTicketCode) {
      setSavedTicketCode(ticketCode);
    }

    const isCodeWithHashtag = ticketCode.includes('#');
    const code = isCodeWithHashtag ? ticketCode.split('#')[0] : ticketCode;

    setShowQrcodereader(false);
    try {
      setLoading(true);
      const {data: ticket} = await registerBraceletDelivery(
        code,
        authContext.userToken,
        reason,
      );

      if (ticket.kitDelivered && !reason) {
        setDeliveryMethod('QRCode');
        setDocument(null);
        setEventDay(null);
        setJustificationMessage(
          `A pulseira de ${ticket.name} para o dia ${formatDate(
            ticket.day,
          )} já foi entregue.`,
        );
        setIsModalVisible(true);
        return;
      }

      setDocument(null);
      setEventDay(null);
      setSavedTicketCode(null);
      setAlertMessage(
        `Entrega de pulseira de ${ticket.name} registrada com sucesso para o setor ${ticket.sectorName}.`,
        '#32cd32',
      );
    } catch (error) {
      console.error(error.response);
      console.log('error by api: ' + error?.response?.data);
      if (error?.response?.data?.errors) {
        setAlertMessage(error.response.data.errors, '#dc143c');
        return null;
      }
      setAlertMessage(
        'Entrega não registrada, problema ao enviar registro de entrega de pulseira.',
        '#dc143c',
      );
      return null;
    } finally {
      setLoading(false);
      
    }
  };

  const saveBraceletDeliveryByDocument = async () => {
    if (!document) {
      Alert.alert('', 'Documento precisa ser preenchido.');
      return;
    }

    if (!eventDay) {
      Alert.alert('', 'Dia precisa ser selecionado.');
      return;
    }

    try {
      setLoading(true);
      const {data: ticket} = await registerBraceletDeliveryByDocument(
        document,
        eventDay,
        authContext.selectedEventId,
        authContext.userToken,
        reason,
      );

      console.log('Ticket returned:', ticket);

      if (ticket.kitDelivered && !reason) {
        setDeliveryMethod('Document');
        setJustificationMessage(
          `A pulseira de ${ticket.name} para o dia ${formatDate(
            ticket.day,
          )} já foi entregue.`,
        );
        setIsModalVisible(true);
        return;
      }

      setDocument(null);
      setEventDay(null);
      setAlertMessage(
        `Entrega de pulseira registrada com sucesso para o setor ${ticket.sectorName}.`,
        '#32cd32',
      );
    } catch (error) {
      console.error(error.response);
      console.log('error by api: ', error?.response?.data);
      if (error?.response?.data?.errors) {
        setAlertMessage(error.response.data.errors, '#dc143c');
        return null;
      }
      setAlertMessage(
        'Entrega não registrada, problema ao registrar entrega de pulseira.',
        '#dc143c',
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  var itemsDay = [];
  for (var i in days) {
    var dayElements = days[i].split('T')[0].split('-');
    var day = dayElements[2] + '/' + dayElements[1] + '/' + dayElements[0];
    itemsDay.push({key: day, value: day});
  }

  const handleJustificationSubmit = justification => {
    setReason(justification);
    setIsModalVisible(false);
    setJustificationSubmitted(true);
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
            setShowQrcodereader(true);
          }}>
          Ler código do ingresso
        </Button>
        <Input
          style={{marginTop: 10}}
          placeholder="Digite o CPF ou passaporte"
          value={document}
          onChangeText={setDocument}
        />
        <SelectModal
          label={'Selecione o dia'}
          items={itemsDay}
          setValue={value => {
            setEventDay(value);
          }}
          value={eventDay}
        />
        <Button loading={loading} onPress={saveBraceletDeliveryByDocument}>
          Entregar por documento
        </Button>
      </View>
      {showQrCodeReader && (
        <QrCodeReader
          onRead={handleQRCodeRead}
          onClose={() => setShowQrcodereader(false)}
        />
      )}

      <JustificationModal
        modalVisible={isModalVisible}
        setModalVisible={setIsModalVisible}
        onSubmit={handleJustificationSubmit}
        message={`${justificationMessage}\nPara registrar uma nova entrega, por favor, forneça uma justificativa detalhada.`}
      />
    </View>
  );
}

export default DeliverBraceletDrawerScreen;
