import { Button, CheckBox, Divider, Text } from '@rneui/themed';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import {
  getTicketDelivery,
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

      const { data: ticket } = await getTicketDelivery(
        authContext.selectedEventId,
        ticketCode,
        authContext.userToken, 'Bracelet'
      );

      if (!ticket) {
        throw new Error("Ingresso não encontrado na api!");
      }

      if (ticket.braceletDeliveredAt && !reason) {
        const message = `A pulseira para o setor ${ticket.sector} no dia ${ticket.day} já foi entregue.`;
        setTicketCodesReuse([ticket.ticketId]);
        setJustificationMessage(message);
        setIsModalVisible(true);
        return;
      }

      const formData = new FormData();
      formData.append('EventId', authContext.selectedEventId);
      formData.append('Type', 'Bracelet');
      formData.append(`Tickets[0].TicketId`, ticket.ticketId);

      if (reason) {
        formData.append(`Tickets[0].Reason`, reason);
        formData.append(`Tickets[0].ReasonType`, 'Exchange');
      }

      const success = await registerBraceletDelivery(
        authContext.userToken,
        formData
      );

      if (success) {
        setAlertMessage("Entrega registrada com sucesso!", "#32CD32");
        return;
      }

      setAlertMessage("Entrega não registrada. Verifique os dados e tente novamente.", "#dc143c");
    } catch (error) {
      console.error('Erro ao ler QR Code:', error);

      if (error.response) {
        // --- 1. O Servidor Respondeu com Erro ---
        const { status, data } = error.response;
        console.log('Status:', status);
        console.log('Data:', data);

        if (status === 401) {
         setAlertMessage('Sessão Expirada: A sua sessão expirou. Por favor, faça login novamente.');
          authContext.logout();
          return;
        }

        if (status === 404) {
          setAlertMessage('Pulseira não encontrado.', '#dc143c');
          return;
        }

        if (status === 400 || data?.message) {
          const apiMessage = data?.message || 'Dados do Pulseira inválidos.';
          setAlertMessage(apiMessage, '#dc143c');
          return;
        }

        setAlertMessage(`Erro do servidor (${status}). Tente novamente.`, '#dc143c');

      } else if (error.request) {
        // --- 2. Erro de Rede (Sem resposta) ---
        console.error('Erro de Rede:', error.request);
        setAlertMessage('Sem conexão com a internet.', '#dc143c');

      } else {
        console.error('Erro de Configuração:', error.message);
        const msg = error.message === "Pulseira não encontrado na resposta da API."
          ? error.message
          : 'Ocorreu um erro ao processar o código.';
        setAlertMessage(msg, '#dc143c');
      }

      return null;

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

      console.log('ticketCodes=' + ticketCodes)

      if (userTickets) {
        const alreadyDelivered = userTickets.filter(ticket =>
          ticketCodes.includes(ticket.id) && ticket.braceletDeliveredAt
        );

        console.log()

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

      const formData = new FormData();
      formData.append('EventId', authContext.selectedEventId);
      formData.append('Type', 'Bracelet');

      ticketCodes.forEach((ticketId, index) => {
        formData.append(`Tickets[${index}].TicketId`, ticketId);
        if (reason) {
          formData.append(`Tickets[${index}].Reason`, reason);
          formData.append(`Tickets[${index}].ReasonType`, 'Exchange');
        }
      });

      console.log('formData=' + JSON.stringify(formData));

      try {
        const response = await registerBraceletDelivery(
          authContext.userToken,
          formData
        );

        if (response) {
          console.log(`✅ Entrega registrada para ticket: `, response.data);

          const { data: ticket } = response;
          setAlertMessage(`Entrega registrada com sucesso!`, '#32cd32');
        }

      } catch (error) {
        let errorMessage = "Erro ao registrar entrega da pulseira";

        console.error(`❌ Erro ao registrar entrega do ticket: `, error);
        if (error.response) {
          console.error("🔴 Resposta do servidor:", error.response.data);

          if (error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
          }
        } else {
          console.error("⚠️ Erro sem resposta do servidor:", error.message);
        }

        setAlertMessage(errorMessage, "#dc143c");
      }

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
          const code = ticket.id;
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
                {[ticket.sector || '', ticket.day || '', ticket.braceletDeliveredAt ? "ENTREGUE" : null].filter(Boolean).join(' - ')}
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
