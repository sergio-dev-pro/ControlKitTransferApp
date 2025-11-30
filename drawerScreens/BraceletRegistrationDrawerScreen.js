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
  const { userToken, selectedEventId, updateTokens, logout } = useContext(AuthContext);
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

  const verifyTicketAssociation = async (eventkey) => {
    const bearerToken = userToken;
    const keyAccess = eventkey

    try {
      const data = await hasBraceleteCode(bearerToken, keyAccess, selectedEventId);
      setIsTicketPreScanned(data.exists);
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
        ticketCode,
        reason,
        selectedEventKey,
        selectedEventId
      );

      setAlertMessage(`Registrado`, '#32cd32');

      await new Promise(resolve => setTimeout(resolve, 1500));

      const temOutrosPendentes = user?.tickets?.some(
        ticket => ticket.id !== selectedEventKey && !ticket.hasBraceletCode
      );

      if (temOutrosPendentes) {
        setRegisterNewTicket(true);
      } else {
        resetState();
        await new Promise(resolve => setTimeout(resolve, 500));
        setAlertMessage(`Operação Finalizada`, '#32cd32');
      }

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
    if (selectedEvent && typeof selectedEvent === 'string') {
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
      verifyTicketAssociation(selectedEventKey);
  }, [selectedEventKey])

  const attListTickets = async () => {
    try {
      const updatedUser = await getUserByCpfWithAuth(guardarCpf, selectedEventId, userToken, false, true);

      if (updatedUser) {
        const searchedFor = { cpf: guardarCpf };
        if (updatedUser.newToken) {
          updateTokens({ accessToken: updatedUser.newToken, refreshToken: updatedUser.refreshToken })
        }
        handleUserFound({ ...updatedUser, id: guardarCpf }, searchedFor);
      } else {
        console.warn('Usuário não encontrado ou resposta inválida.');
      }
    } catch (error) {
      console.error('Erro geral:', error);

      if (error.response) {
        console.error('Erro response:', error.response);
        const status = error.response.status;
        const data = error.response.data;

        if(status === 401){
         setAlertMessage('Sessão Expirada: A sua sessão expirou. Por favor, faça login novamente.');
          logout(); 
          return;
        }

        if (status === 404) {
          Alert.alert('Aviso', 'Usuário não encontrado.');
          cpfValueNotFound(inputValue);
          return;
        }

        // --- 4. TRATAMENTO DO 400 (Erro de Validação) ---
        if (status === 400 || data?.errors) {
          const errors = data.errors;
          const errorMessages = Array.isArray(errors)
            ? errors.join('\n')
            : typeof errors === 'string'
              ? errors
              : JSON.stringify(errors);
          
         setAlertMessage('Erro de Validação', errorMessages || 'Dados inválidos.');
          return;
        }

       setAlertMessage('Erro', `Erro inesperado do servidor (status ${status}). Tente novamente.`);
        
      } else if (error.request) {
        // --- 5. TRATAMENTO DE ERRO DE REDE ---
        // A requisição foi feita mas não houve resposta
        console.error('Erro de rede:', error.message);
       setAlertMessage('Erro de Conexão', 'Verifique a sua internet e tente novamente.');
      
      } else {
        // Erro na configuração da requisição
        console.error('Erro de configuração:', error.message);
        setAlertMessage('Erro', 'Ocorreu um erro interno na aplicação.');
      }

    } finally {
      setLoading(false);
    }
  };

  const hasTicketCodeRead = !!ticketCode;
  const hasAllDataToRegisterBracelet = selectedEvent && ticketCode;

  console.log(user?.tickets)

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
              items={(user?.tickets || []).map(ticket => ({
                key: ticket.id, // Usando `accessKey` como identificador único
                value: [ticket.sector || '', ticket.category || '', ticket.day || '',
                ticket.accessPolicy || '', ticket.hasBraceletCode ? '(Registrado)' : '' || ''].filter(Boolean).join(' - ')
              }))}
              value={selectedEventKey}
              setValue={eventKey => {
                setSelectedEventKey(eventKey);
                setSelectedEvent(user?.tickets.find(ticket => ticket.id === eventKey));
              }}
            />

            {selectedEvent && (
              <Text h4 h4Style={{ fontSize: 18, color: '#000', paddingLeft: 16 }}>
                {[selectedEvent.category, selectedEvent.day, selectedEvent.sector]
                  .filter(Boolean)
                  .join(' - ')}

                {user?.registeredBlaceletTickets?.includes(selectedEventKey) && (
                  <Text style={{ color: 'red', fontWeight: 'bold' }}>
                    {"\n"}Pulseira já entregue
                  </Text>
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