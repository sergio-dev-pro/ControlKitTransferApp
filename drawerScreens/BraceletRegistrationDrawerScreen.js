import { Button, Divider, Text, Badge } from '@rneui/themed';
import React, { useContext, useState, useEffect } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { braceletRegister, hasBraceleteCode } from '../api/TicketApi';
import Header from '../components/Header';
import QrCodeReader from '../components/QrCodeReader';
import { useAlert } from '../context/AlertContext';
import { AuthContext } from '../context/AuthContext';
import { formatDate, sortDates } from '../helpers/format';
import GStyles from '../style/global';
import THEME from '../style/theme';
import SelectModal from '../components/SelectModal';
import { useIsFocused } from '@react-navigation/native';
import SearchUserModal from '../components/SearchUserModal';
import { reduceArrayToJustDifferentDates } from '../helpers/reduceCallbacks';
import JustificationModal from '../components/JustificationModal';
import CustomModal from '../components/CustomModal';
import { getUserByCpfWithAuth } from '../api/UserApi';


function BraceletRegistrationDrawerScreen({ navigation }) {
  const [showQrCodeReader, setShowQrcodereader] = useState(false);
  const [user, setUser] = useState();
  const [closeModal, setCloseModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState();
  const [sectorDescription, setSectorDescription] = useState(null);
  const [ticketCode, setTicketCode] = useState();
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();
  const { userToken, selectedEventId } = useContext(AuthContext);
  const setAlertMessage = useAlert();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isTicketPreScanned, setIsTicketPreScanned] = useState(false);
  const [reason, setReason] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('')
  const [selectedEventKey, setSelectedEventKey] = useState('');
  const [registerNewTicket, setRegisterNewTicket] = useState(false)
  const [guardarCpf, setGuardarCpf] = useState('');

  const resetState = () => {
    setUser();
    setSelectedDay();
    setTicketCode();
    setSectorDescription(null);
    setSelectedEvent("")
    setSelectedEventKey("")
    setRegisterNewTicket(false)
    setGuardarCpf('')
  };

  const resetNewSelectBracelet = () => {
    setSelectedDay();
    setTicketCode();
    setSectorDescription(null);
    setSelectedEvent("")
    setSelectedEventKey("")
  }

  const handleUserFound = (userFounded, searchedFor) => {

    if (!guardarCpf)
      setGuardarCpf(searchedFor.cpf)

    setRegisterNewTicket(false)

    console.log('selectedEventId=' + selectedEventId);
    if (!userFounded.isActive && selectedEventId != 435)
      return alert('Usuário não registrado, registre no cadastro manual.');

    const userState = { ...userFounded, ...searchedFor };

    setUser(userState);
  };

  const handleQRCodeRead = async ticketCode => {
    // #
    const isCodeWithHashtag = ticketCode.includes('#');
    const code = isCodeWithHashtag ? ticketCode.split('#')[0] : ticketCode;

    setTicketCode(code);
    setShowQrcodereader(false);
  };

  const verifyTicketAssociation = async (token, eventkey) => {
    const bearerToken = userToken;
    const tokenGetCpfOrEmail = user?.token ?? token;
    const dayTicket = "2025-02-27"
    const keyAccess = eventkey

    try {
      const data = await hasBraceleteCode(tokenGetCpfOrEmail, dayTicket, bearerToken, keyAccess);
      console.log('estado: ' + data.hasCode);
      setIsTicketPreScanned(data.hasCode);
    } catch (error) {
      console.error('Erro ao verificar código da pulseira:', error);
    }
  };

  const handleJustificationSubmit = async (justification) => {
    setReason(justification);
    setIsModalVisible(false);
    setIsTicketPreScanned(false);
  };

  const evaluateAndAddTicket = async () => {
    if (!isTicketPreScanned) {
      await save();
    } else {
      setIsModalVisible(true);
    }
  };

  const save = async () => {
    try {
      setLoading(true);
      const { data } = await braceletRegister(
        userToken,
        user?.token,
        selectedDay,
        ticketCode,
        reason,
        selectedEventKey
      );

      setRegisterNewTicket(true)

      console.log('braceletRegister data', data);

      setAlertMessage(`Registrado`, '#32cd32');
    } catch (error) {
      console.error(error.response);
      console.log('error by api: ' + error?.response?.data);
      if (error?.response?.data?.errors) {
        setAlertMessage(error.response.data.errors, '#dc143c');
        return null;
      }
      setAlertMessage('Não registrado, tente novamente', '#dc143c');
      return null;
    } finally {
      setLoading(false);
    }
    console.log(user.token, selectedDay, ticketCode);
  };


  useEffect(() => {
    if (selectedEvent) {
      const data = selectedEvent.split('-')[0]?.trim();
      if (data) {
        const [dia, mes, ano] = data.split('/');
        if (dia && mes && ano) {
          setSelectedDay(`${ano}-${mes}-${dia}`);
        }
      }
    } else {
      setSelectedDay("");
    }
  }, [selectedEvent]);

  useEffect(() => {
    if (selectedEventKey)
      verifyTicketAssociation(user.token, selectedEventKey);
  }, [selectedEventKey])

  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ guardarCpf ', guardarCpf)


  const attListTickets = async () => {
    try {
      const response = await getUserByCpfWithAuth(guardarCpf, selectedEventId, userToken, true);
  
      if (response && response.data) {
        const updatedUser = response.data;
        const searchedFor = { cpf: guardarCpf };
        handleUserFound({ ...updatedUser, id: guardarCpf }, searchedFor);
      } else {
        console.warn('Usuário não encontrado ou resposta inválida.');
      }
    } catch (error) {
      console.error('Erro ao atualizar lista de tickets:', error);
    }
  };
  


  console.log('user.cpf ' + (user?.cpf || ''));
  console.log('user.email ' + (user?.email || ''));
  console.log('user', (user || ''))
  





  const hasTicketCodeRead = !!ticketCode;
  const hasAllDataToRegisterBracelet = selectedEvent && ticketCode;
  return (
    <View style={{ ...GStyles.view }}>
      <Header
        style={{ marginBottom: 0 }}
        openDrawer={() => navigation.openDrawer()}
      />
      <View style={{ width: '100%', backgroundColor: THEME.cor.whitesmoke }}>
        <Text h3 h3Style={{ padding: 8, textAlign: 'center' }}>
          Registrar Qr Code
        </Text>
        <Divider />
      </View>
      <View style={[GStyles.container]}>
        {closeModal && (<TouchableOpacity
          style={{
            backgroundColor: 'black',
            padding: 12,
            borderRadius: 8,
            marginTop: 10,
          }}
          onPress={() => setCloseModal(false)}
        >
          <Text style={{
            color: 'white',
            fontSize: 16,
            textAlign: 'center',
            fontWeight: 'bold',
          }}>Iniciar registro</Text>
        </TouchableOpacity>)}
        {!user ? (
          <SearchUserModal
            title="Busque o usuário que receberá a pulseira"
            onUserFound={handleUserFound}
            fromBlaceletRegistration={true}
            isVisible={isFocused && !user && !closeModal}
            onClose={() => {
              setCloseModal(true);
            }}
          />
        ) : (
          <>
            <Badge
              textStyle={{ fontSize: 13 }}
              containerStyle={{ marginBottom: 30 }}
              badgeStyle={{ height: 25 }}
              value={
                (user?.cpf && `CPF:${user?.cpf}`) ||
                (user?.email && `E-mail:${user?.email}`)
              }
              status="warning"
            />
            <SelectModal
              label="Selecione um Ingresso"
              placeholder="Selecione um evento"
              items={Object.entries(user?.tickets || {}).map(([key, value]) => ({
                key,
                value
              }))}
              value={selectedEventKey}
              setValue={eventKey => {
                setSelectedEventKey(eventKey);
                setSelectedEvent(user?.tickets[eventKey]);
              }}
            />



            {selectedEvent && (
              <Text h4 h4Style={{ fontSize: 18, color: '#000', paddingLeft: 16 }}>
                {selectedEvent}
                {user?.registeredBlaceletTickets.includes(selectedEventKey) && (
                  <Text style={{ color: 'red', fontWeight: 'bold' }}>{"\n"}Pulseira já entregue</Text>
                )}
              </Text>
            )}


            {selectedEvent && !hasTicketCodeRead && (
              <View style={{ padding: 16, height: 'auto' }}>
                <Text
                  h4
                  h4Style={{ fontSize: 18, color: '#86939e', marginBottom: 10 }}>
                  Escaneie o código da pulseira:
                </Text>
                <Button
                  containerStyle={{
                    // flex: 1,
                    marginRight: 5,
                  }}
                  type="outline"
                  size="lg"
                  // read qrcode
                  onPress={() => setShowQrcodereader(true)}>
                  Escanear QR code ou código de barras
                </Button>
              </View>
            )}
            {selectedEvent && hasTicketCodeRead && (
              <View style={{ padding: 16, flex: 1 }}>
                <Text
                  h4
                  h4Style={{ fontSize: 18, color: '#86939e', marginBottom: 10 }}>
                  Código da pulseira:{' '}
                  <Text style={{ color: THEME.cor.primary }}>{ticketCode}</Text>
                </Text>
              </View>
            )}
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'flex-end',
                padding: 8,
                marginTop: 10,
              }}>
              <Button
                type="clear"
                containerStyle={{ marginRight: 20 }}
                size="lg"
                title="Cancelar"
                onPress={resetState}
              />
              {hasAllDataToRegisterBracelet && (
                <Button
                  loading={loading}
                  type="solid"
                  size="lg"
                  title="Salvar"
                  onPress={evaluateAndAddTicket}
                />
              )}
            </View>
          </>
        )}
      </View>
      <JustificationModal
        modalVisible={isModalVisible}
        setModalVisible={setIsModalVisible}
        onSubmit={handleJustificationSubmit}
        message="Para adicionar uma nova pulseira, por favor, forneça uma justificativa."
      />
      {showQrCodeReader && (
        <QrCodeReader
          onRead={handleQRCodeRead}
          onClose={() => setShowQrcodereader(false)}
        />
      )}

      <CustomModal
        visible={registerNewTicket}
        title="Registrar nova pulseira"
        content="Deseja registrar uma nova pulseira para o mesmo CPF?"
        onClose={() => {
          setRegisterNewTicket(false);
          resetState();
        }}
        confirm={() => {
          resetNewSelectBracelet()
          attListTickets()
        }}
      />


    </View>
  );
}

export default BraceletRegistrationDrawerScreen;