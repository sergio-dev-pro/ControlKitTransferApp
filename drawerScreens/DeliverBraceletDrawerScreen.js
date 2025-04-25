import { Button, CheckBox, Divider, Text } from '@rneui/themed';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import {
  registerBraceletDelivery,
  registerBraceletDeliveryByDocument,
} from '../api/TicketApi';
import Header from '../components/Header';
import QrCodeReader from '../components/QrCodeReader';
import { useAlert } from '../context/AlertContext';
import { AuthContext } from '../context/AuthContext';
import { formatDate } from '../helpers/format';
import { isDateGreaterThanOrEqualToToday } from '../helpers/validation';
import GStyles from '../style/global';
import THEME from '../style/theme';
import { Input } from '@rneui/themed';
import { getEventDays } from '../api/EventApi';
import SelectModal from '../components/SelectModal';
import JustificationModal from '../components/JustificationModal';
import SearchUserModal from '../components/SearchUserModal';
import ReactNativeModal from 'react-native-modal';

function DeliverBraceletDrawerScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [eventDay, setEventDay] = useState(null);
  const [days, setDays] = useState([]);
  const [document, setDocument] = useState(null);
  const [showQrCodeReader, setShowQrcodereader] = useState(false);
  const [showSearchModalByCPF, setShowSearchModalByCPF] = useState(false);
  const [userTickets, setUserTickets] = useState();

  const authContext = useContext(AuthContext);
  const setAlertMessage = useAlert();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [reason, setReason] = useState('');
  const [justificationSubmitted, setJustificationSubmitted] = useState(false);
  const [justificationMessage, setJustificationMessage] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState(null);
  const [savedTicketCode, setSavedTicketCode] = useState('');
  const [ticketCodesReuse, setTicketCodesReuse] = useState([]);
  const [operationCancelled, setOperationCancelled] = useState(false);
  const [userDocument, setUserDocument] = useState(null);

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


  useEffect(() => {
    if (justificationSubmitted && reason) {
      setJustificationSubmitted(false);
      if (ticketCodesReuse.length > 0) {
        console.log('Chamando confirmTicketCodeSelection com justificativa: ', reason);
        confirmTicketCodeSelection(ticketCodesReuse);
      } else if (savedTicketCode) {
        console.log('Chamando handleQRCodeRead com justificativa: ', reason);
        handleQRCodeRead(savedTicketCode);
      }
    }
  }, [justificationSubmitted, reason, ticketCodesReuse, savedTicketCode]);

  const handleQRCodeRead = async (ticketCode) => {
    if (!savedTicketCode) {
      setSavedTicketCode(ticketCode);
    }

    setShowQrcodereader(false);
    try {
      setLoading(true);

      const success = await registerBraceletDelivery(
        authContext.userToken,
        reason,
        authContext.selectedEventId,
        ticketCode
      );

      if (success) {
        setAlertMessage("Entrega registrada com sucesso!", "#32CD32");
        return;
      }

      setAlertMessage("Entrega não registrada. Verifique os dados e tente novamente.", "#dc143c");
    } catch (error) {
      console.error("Erro ao registrar entrega:", error.response?.data || error.message);

      let errorMessage = "Erro ao registrar a entrega da pulseira.";
      if (error.response) {
        errorMessage += ` Detalhes: ${error.response.data?.message || "Erro desconhecido."}`;
      }

      setAlertMessage(errorMessage, "#dc143c");
    } finally {
      setLoading(false);
    }
  };

  var itemsDay = [];
  for (var i in days) {
    var dayElements = days[i].split('T')[0].split('-');
    var day = dayElements[2] + '/' + dayElements[1] + '/' + dayElements[0];
    itemsDay.push({ key: day, value: day });
  }

  const handleJustificationSubmit = (justification) => {
    setJustificationSubmitted(true);
    setReason(justification);
    setIsModalVisible(false);

  };

  const handleJustificationCancel = () => {
    setIsModalVisible(false);
    setShowSearchModalByCPF(false);
    setUserTickets(null);

    setLoading(false);
    setEventDay(null);
    setDocument(null);
    setShowQrcodereader(false);
    setSavedTicketCode(null);
    setReason('');
    setUserDocument(null)
  };

  const handleUserFound = user => {
    console.log('@@@@@@@@user.tickets =================>', user);
    if (user?.tickets) {
      setUserTickets(user.tickets);
      setUserDocument(user.id)
    } else {
      setUserTickets([]);
    }
    setShowSearchModalByCPF(false);
  };

  const confirmTicketCodeSelection = async (ticketCodes) => {
    try {
      setLoading(true);
      setOperationCancelled(false);

      if (userTickets) {
        const alreadyDelivered = userTickets.filter(ticket =>
          ticketCodes.includes(ticket.accessKey) && ticket.braceletDelivered
        );

        if (alreadyDelivered.length > 0 && !reason) {
          let message = '';

          if (alreadyDelivered.length === 1) {
            const ticket = alreadyDelivered[0];
            message = `A pulseira para o setor ${ticket.sector} no dia ${ticket.day} já foi entregue.`;
          } else {
            message = `As seguintes pulseiras já foram entregues:`;
            alreadyDelivered.forEach(ticket => {
              message += `\n- Setor: ${ticket.sector}, Dia: ${ticket.day}`;
            });
          }

          setJustificationMessage(message);
          setTicketCodesReuse(ticketCodes);
          setIsModalVisible(true);
          return;
        }
      }

      const requests = ticketCodes.map(async (code, index) => {
        if (operationCancelled) {
          console.log(`❌ Operação cancelada antes de processar ticket ${index + 1}`);
          return;
        }

        try {
          const response = await registerBraceletDeliveryByDocument(
            authContext.userToken,
            reason,
            authContext.selectedEventId,
            userDocument,
            ticketCodes
          );

          if (response) {
            console.log(`✅ Entrega registrada para ticket ${index + 1}:`, response.data);

            const { data: ticket } = response;
            setAlertMessage(`Entrega registrada com sucesso para o setor ${ticket.sectorName}.`, '#32cd32');
          }

        } catch (error) {
          console.error(`❌ Erro ao registrar entrega do ticket ${index + 1}:`, error);

          if (error.response) {
            console.error("🔴 Resposta do servidor:", error.response.data);
          } else {
            console.error("⚠️ Erro sem resposta do servidor:", error.message);
          }

          setAlertMessage("Erro ao registrar entrega da pulseira", "#dc143c");
        }
      });

      await Promise.all(requests);

      setReason('');


      if (!isModalVisible && !operationCancelled) {
        setUserTickets(undefined);
        setUserDocument(null);
      }

    } catch (error) {
      console.error("🔥 Erro inesperado:", error);
      setAlertMessage("Erro ao registrar entrega da pulseira");
    } finally {
      setLoading(false);
    }
  };


  console.log('userDocument: ' + userDocument)

  return (
    <View style={{ ...GStyles.view }}>
      <Header
        style={{ marginBottom: 0 }}
        openDrawer={() => navigation.openDrawer()}
      />
      <View style={{ width: '100%', backgroundColor: THEME.cor.whitesmoke }}>
        <Text h3 h3Style={{ padding: 8, textAlign: 'center' }}>
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
        <Button
          containerStyle={{ marginTop: 10 }}
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
            tickets={userTickets}
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

      <JustificationModal
        modalVisible={isModalVisible}
        setModalVisible={setIsModalVisible}
        onSubmit={handleJustificationSubmit}
        onCancel={handleJustificationCancel}
        message={`${justificationMessage}\nPara registrar uma nova entrega, por favor, forneça uma justificativa detalhada.`}
      />
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
      style={{ alignItems: 'center' }}
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
        <Text h4 h4Style={{ marginBottom: 20 }}>
          Selecione o dia para a entrega da pulseira
        </Text>
        {tickets.map((ticket) => {
          const code = ticket.accessKey;
          return (
            <View
              style={{ flexDirection: 'row', alignItems: 'center' }}
              key={code}>
              <CheckBox
                containerStyle={{ padding: 0 }}
                checked={selecteds.includes(code)}
                onPress={() => toggleCheckbox(code)}
                iconType="material-community"
                checkedIcon="checkbox-outline"
                uncheckedIcon="checkbox-blank-outline"
              />
              <Text h5 style={{ fontSize: 15 }}>
                {[ ticket.sector || '',  ticket.category || '', ticket.day || '', ticket.braceletDelivered ? "ENTREGUE" : null].filter(Boolean).join(' - ')}
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
            containerStyle={{ marginLeft: 16 }}
            title="Confirmar"
            onPress={handleConfirm}
          />
        </View>
      </View>
    </ReactNativeModal>
  );
};
export default DeliverBraceletDrawerScreen;
