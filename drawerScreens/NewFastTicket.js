import { View } from 'react-native';
import React, { useContext, useEffect, useLayoutEffect, useState } from 'react';
import GStyles from '../style/global';
import Header from '../components/Header';
import { Button, Divider, Text } from '@rneui/themed';
import { getEventDays, getEventSectors, getSponsors } from '../api/EventApi';
import { AuthContext } from '../context/AuthContext';
import Loading from '../components/Loading';
import BasicFastRegisterForm from './ManualRegisterScreen/BasicFastRegisterForm';
import { completeFastTicketRegister, saveUserPhotoAgain } from '../api/UserApi';
import { useAlert } from '../context/AlertContext';
import { ScrollView } from 'react-native-gesture-handler';
import THEME from '../style/theme';
import TakePictureScreen from './ManualRegisterScreen/TakePictureScreen';
import { RegisterStateContext } from './ManualRegisterScreen/registerContext';
import SearchUserModal from '../components/SearchUserModal';
import { useFocusEffect } from '@react-navigation/native';
import SelectModal from '../components/SelectModal';

const NewFastTicket = ({ navigation }) => {
  const [days, setDays] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [tempToken, setTempToken] = useState(false);
  const [takePhoto, setTakePhoto] = useState(false);
  const [registered, setRegistered] = useState(false);
  // TODO: setado temporariamente
  const [userData, setUserData] = useState();

  // TODO: setado true temporariamente
  const [loading, setLoading] = useState(true);

  const authContext = useContext(AuthContext);

  const setAlertMessage = useAlert();

  const [document, setDocument] = useState('')
  const [searchUserTicket, setSearchUserTicket] = useState(false)
  const [showSearchModalByCPF, setShowSearchModalByCPF] = useState(false);
  const [createNewFastTicket, setCreateNewFastTicket] = useState(false)
  const [cpfValue, setCpfValue] = useState('')
  const [valueInitialFirstName, setValueInitialFirstName] = useState('')
  const [valueInitialLastname, setValueInitialLastname] = useState('')
  const [selectedType, setSelectedType] = useState(null);


  useEffect(() => {
    (async () => {
      try {
        console.log("selectedEventId=" + authContext.selectedEventId);
        const { data: days } = await getEventDays(authContext.selectedEventId);
        setDays(days);

        const { data: sectors } = await getEventSectors(authContext.selectedEventId);
        setSectors(sectors);

        const { data: sponsors } = await getSponsors(authContext.selectedEventId, authContext.userToken);
        setSponsors(sponsors)
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUserFormCompleted = data => {
    console.log(`@@@@@ data`, data);
    setUserData(data.user);

    // Remove pontos e traços do CPF
    const cleanedCpf = data.user.document.replace(/[.-]/g, '');
    setDocument(cleanedCpf);
  };

  const savePhoto = async (picturePath) => {
    if (!picturePath) return;

    const formData = new FormData();
    formData.append('file', {
      uri: picturePath,
      type: 'image/jpeg',
      name: 'userImage.jpg',
    });
    formData.append("eventId", authContext.selectedEventId);
    formData.append("document", document);

    try {
      setLoading(true);

      // Chamada da API
      const response = await saveUserPhotoAgain(formData, authContext.userToken);

      // Sucesso
      setAlertMessage('Foto salva com sucesso!');
      clearStates();
      setTakePhoto(false);
      setRegistered(false);

    } catch (error) {
      // Log para debug
      console.error('Erro ao enviar foto:', error);

      // Tenta extrair a mensagem da API
      const apiMessage = error?.response?.data?.message;
      const fallbackMessage = 'Erro ao enviar imagem, tente novamente.';
      const finalMessage = apiMessage || fallbackMessage;

      setAlertMessage(finalMessage);

    } finally {
      setLoading(false);
    }
  };

  const clearStates = () => {
    setUserData(undefined);
  };

  const completeRegister = async () => {
    try {
      setLoading(true);
      const data = {
        ...userData,
      };
      console.log(
        'NewTicket completeRegister',
        JSON.stringify(data),
        'Event id:' +
        authContext.selectedEventId,
        'Auth token: ' +
        authContext.userToken,
      );

      console.log('data: ' + data)
      console.log('data: ', data)

      var result = await completeFastTicketRegister(authContext.selectedEventId, data, authContext.userToken);


      if (result) {
        setAlertMessage('Ingresso cadastrado com sucesso!');
        setTempToken(result);
        setTakePhoto(true);
        setRegistered(true);
        console.log('Ingresso cadastrado com sucesso!');
      }
    } catch (error) {
      console.error(error);
      console.error('error error.response.data', error.response.data);
      alert('Erro ao cadastrar ingresso!');
    } finally {
      setLoading(false);
      setSearchUserTicket(false);
      setShowSearchModalByCPF(false);
      setCreateNewFastTicket(false);
    }
  };

  const canFinishRegistration = !!userData;

  const handleUserFound = user => {
    console.log(user)

    if (user.tickets && user.tickets.length > 0) {
      navigation.navigate('ManualRegisterByTickets', { user, cpf: user.id });
    } else {
      const nameParts = user.name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastname = nameParts.slice(1).join(' ') || '';
      setValueInitialFirstName(firstName)
      setValueInitialLastname(lastname)
      setCpfValue(user.id)
      setCreateNewFastTicket(true);
      setShowSearchModalByCPF(false);
      setSearchUserTicket(true);

    }
  };

  const handleCpfNotFound = (cpf) => {
    console.log('ENTROU')
    setCpfValue(cpf)
    setCreateNewFastTicket(true);
    setShowSearchModalByCPF(false);
    setSearchUserTicket(true);
  };


  useFocusEffect(
    React.useCallback(() => {
      setSearchUserTicket(false);
      setShowSearchModalByCPF(false);
      setCreateNewFastTicket(false);
      setUserData(undefined);
      setTakePhoto(false);
      setRegistered(false);
      setCpfValue(null)
      setSelectedType(null)
    }, [])
  );

  const typeItems = [
    { key: 1, value: 'Ingresso' },
    { key: 2, value: 'Credencial' },
  ];

  console.log(cpfValue)

  return (
    <RegisterStateContext.Provider
      value={{
        cancelPhoto: () => {
          setTakePhoto(false);
        },
        savePhoto,
        isSavingPhoto: loading,
      }}>
      <View style={{ ...GStyles.view }}>
        <Header
          style={{ marginBottom: 0 }}
          openDrawer={() => navigation.openDrawer()}
        />
        <View style={{ width: '100%', backgroundColor: THEME.cor.whitesmoke }}>
          <Text h3 h3Style={{ padding: 8, textAlign: 'center' }}>
            Cadastro rápido
          </Text>
          <Divider />
        </View>

        <ScrollView style={[GStyles.container, { height: '100%' }]}>

          {!searchUserTicket && !registered && (
            <Button
              containerStyle={{ marginTop: 10 }}
              type="outline"
              onPress={() => {
                setShowSearchModalByCPF(true);
              }}>
              Buscar por CPF
            </Button>
          )}

          {showSearchModalByCPF && (
            <SearchUserModal
              title="Buscar"
              onUserFound={handleUserFound}
              placeholderText="Busque pelo CPF"
              isVisible={showSearchModalByCPF}
              onClose={() => {
                setShowSearchModalByCPF(false);
              }}
              cpfValueNotFound={handleCpfNotFound} 
            />
          )}

          {cpfValue && (
            <SelectModal
              label="Tipo"
              items={typeItems}
              value={selectedType}
              setValue={setSelectedType}
            />
          )}


          {!userData && !takePhoto && createNewFastTicket && selectedType && (
            <BasicFastRegisterForm
              onUserFormCompleted={handleUserFormCompleted}
              availableDays={days}
              availableSectors={sectors}
              sponsors={sponsors}
              initialDocument={cpfValue}
              initialFirstName={valueInitialFirstName}
              initialLastName={valueInitialLastname}
              selectType={selectedType}
            />
          )}



          {canFinishRegistration && !takePhoto && !registered && (
            <>
              <Button
                type="solid"
                size="lg"
                containerStyle={{ marginTop: 20 }}
                onPress={completeRegister}>
                Finalizar cadastro
              </Button>
              <Button
                containerStyle={{ marginTop: 10 }}
                type="outline"
                onPress={() => {
                  clearStates();
                  setRegistered(false);
                }}>
                Cancelar
              </Button>
            </>
          )}
          {registered && !takePhoto && (
            <>
              <Button
                type="solid"
                size="lg"
                containerStyle={{ marginTop: 20 }}
                onPress={() => {
                  setTakePhoto(true);
                }}>
                Cadastrar foto
              </Button>
              <Button
                containerStyle={{ marginTop: 10 }}
                type="outline"
                onPress={() => {
                  clearStates();
                  setRegistered(false);
                }}>
                Cancelar
              </Button>
            </>
          )}
        </ScrollView>
        {takePhoto && tempToken && <TakePictureScreen />}
        <Loading isActive={loading} />
      </View>
    </RegisterStateContext.Provider >
  );
};

export default NewFastTicket;
