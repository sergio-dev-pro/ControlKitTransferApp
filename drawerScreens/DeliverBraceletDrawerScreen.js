import {Button, CheckBox, Divider, Text} from '@rneui/themed';
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
import SearchUserModal from '../components/SearchUserModal';
import ReactNativeModal from 'react-native-modal';

function DeliverBraceletDrawerScreen({navigation}) {
  const [loading, setLoading] = useState(false);
  const [eventDay, setEventDay] = useState(null);
  const [days, setDays] = useState([]);
  const [document, setDocument] = useState(null);
  const [showQrCodeReader, setShowQrcodereader] = useState(false);
  const [showSearchModalByCPF, setShowSearchModalByCPF] = useState(false);
  const [userTickets, setUserTickets] = useState();

  const authContext = useContext(AuthContext);
  const setAlertMessage = useAlert();

  //authContext.selectedEventId

  useEffect(() => {
    // (async () => {
    //   try {
    //     setLoading(true);
    //     console.log('selectedEventId=' + authContext.selectedEventId);
    //     const {data: days} = await getEventDays(authContext.selectedEventId);
    //     setDays(days);
    //   } catch (error) {
    //     console.error(error);
    //   } finally {
    //     setLoading(false);
    //   }
    // })();
  }, []);

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
      if (ticket.kitDelivered) {
        setDocument(null);
        setEventDay(null);
        return setAlertMessage(
          `A pulseira de ${ticket.name} para o dia ${formatDate(
            ticket.day,
          )} já foi entregue.`,
        );
      }
      console.log(ticket.day);
      // if (!isDateGreaterThanOrEqualToToday(ticket.day))
      //   return setAlertMessage(
      //     `A entrega para o dia ${formatDate(
      //       ticket.day,
      //     )} já passou! Nao é possível registrar entrega.`,
      //   );
      setDocument(null);
      setEventDay(null);
      setAlertMessage(
        `Entrega de pulseira de ${ticket.name} registrada com sucesso para o setor ${ticket.sectorName}.`,
        '#32cd32',
      );
    } catch (error) {
      //console.error(error);
      //console.error(JSON.stringify(error));
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

  const saveBlaceletDeliveryByDocument = async () => {
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
      );
      console.log(JSON.stringify(ticket));
      if (ticket.kitDelivered)
        return setAlertMessage(
          `A pulseira de ${ticket.name} para o dia ${formatDate(
            ticket.day,
          )} já foi entregue.`,
        );
      console.log(ticket.day);
      setDocument(null);
      setEventDay(null);
      setAlertMessage(
        `Entrega de pulseira registrada com sucesso para o setor ${ticket.sectorName}.`,
        '#32cd32',
      );
    } catch (error) {
      //console.error(error);
      //console.error(JSON.stringify(error));
      console.error(error.response);
      console.log('error by api: ' + error?.response?.data);
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
  const handleUserFound = user => {
    console.log('@@@@@@@@user.tickets', user.tickets);
    user && setUserTickets(user.tickets);
    setShowSearchModalByCPF(false);
  };
  const confirmTicketCodeSelection = async ticketCodes => {
    console.log('@@@ticketCodes', ticketCodes);
    try {
      setLoading(true);
      await new Promise((resolve, reject) => {
        ticketCodes.forEach(async (code, index) => {
          try {
            const {data: ticket} = await registerBraceletDelivery(
              code,
              authContext.userToken,
            );
            if (ticket.kitDelivered) {
              return Alert.alert(
                '',
                `A pulseira de ${ticket.name} para o dia ${formatDate(
                  ticket.day,
                )} já foi entregue.`,
              );
            }
            Alert.alert(
              '',
              `Entrega da pulseira para ${ticket.name}, dia ${formatDate(
                ticket.day,
              )}, setor ${ticket.sectorName}, foi registrada com sucesso.`,
            );
          } catch (error) {
            reject(error);
          } finally {
            if (index === ticketCodes.length - 1) {
              resolve();
            }
          }
        });
      });
    } catch (error) {
      setAlertMessage('Erro ao registrar entrega da pulseira');
    } finally {
      setLoading(false);
      setUserTickets();
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
        <Button
          containerStyle={{marginTop: 10}}
          type="outline"
          onPress={() => {
            setShowSearchModalByCPF(true);
          }}>
          Buscar por CPF
        </Button>
        {showSearchModalByCPF && (
          <SearchUserModal
            title="Buscar"
            onUserFound={handleUserFound}
            placeholderText="Busque pelo CPF"
            isVisible={showSearchModalByCPF}
            onClose={() => {
              setShowSearchModalByCPF(false);
            }}
          />
        )}
        {userTickets && (
          <TicketCodeSelectionModal
            isVisible
            tickets={Object.entries(userTickets)}
            onClose={() => setUserTickets(undefined)}
            onConfirm={confirmTicketCodeSelection}
            isConfirming={loading}
          />
        )}
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
// tickets = [[code, name]...]
const TicketCodeSelectionModal = ({
  tickets,
  onClose,
  onConfirm,
  isVisible,
  isConfirming,
}) => {
  const [selecteds, setSelecteds] = useState([]);
  const setAlertMessage = useAlert();
  const toggleCheckbox = code => {
    setSelecteds(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  const handleConfirm = () => {
    if (selecteds.length === 0)
      return setAlertMessage('Nenhum dia selecionado.');
    onConfirm(selecteds);
  };

  return (
    <ReactNativeModal
      isVisible={isVisible}
      backdropOpacity={0.1}
      style={{alignItems: 'center'}}
      onBackdropPress={onClose}>
      {/* {tickets} */}
      <View
        style={{
          backgroundColor: 'white',
          borderRadius: 10,
          padding: 20,
          height: 'auto',
          width: `95%`,
        }}>
        <Text h4 h4Style={{marginBottom: 20}}>
          Selecione o dia para a entrega da pulseira
        </Text>
        {tickets.map(([code, name]) => {
          return (
            <View
              style={{flexDirection: 'row', alignItems: 'center'}}
              key={code}>
              <CheckBox
                containerStyle={{padding: 0}}
                checked={selecteds.includes(code)}
                onPress={() => toggleCheckbox(code)}
                iconType="material-community"
                checkedIcon="checkbox-outline"
                uncheckedIcon={'checkbox-blank-outline'}
              />
              <Text h5 style={{fontSize: 15}}>
                {name}
              </Text>
            </View>
          );
        })}
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 20,
          }}>
          <Button title="Voltar" size="lg" type="clear" onPress={onClose} />
          <Button
            type="solid"
            loading={isConfirming}
            size="lg"
            containerStyle={{marginLeft: 16}}
            title="Confirmar"
            onPress={handleConfirm}
          />
        </View>
      </View>
    </ReactNativeModal>
  );
};
export default DeliverBraceletDrawerScreen;
