import { View } from 'react-native';
import React, { useContext, useEffect, useLayoutEffect, useState } from 'react';
import GStyles from '../style/global';
import Header from '../components/Header';
import { Button, Divider, Text } from '@rneui/themed';
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
  const [takePhoto, setTakePhoto] = useState(false);
  const [registered, setRegistered] = useState(false);
  // TODO: setado temporariamente
  const [userData, setUserData] = useState();

  // TODO: setado true temporariamente
  const [loading, setLoading] = useState(false);

  const authContext = useContext(AuthContext);

  const setAlertMessage = useAlert();

  const [document, setDocument] = useState('')
  const [searchUserTicket, setSearchUserTicket] = useState(false)
  const [showSearchModalByCPF, setShowSearchModalByCPF] = useState(false);
  const [createNewFastTicket, setCreateNewFastTicket] = useState(false)
  const [cpfValue, setCpfValue] = useState('')
  const [valueInitialFirstName, setValueInitialFirstName] = useState('')
  const [valueInitialLastname, setValueInitialLastname] = useState('')
  const [valuePicturePath, setValuePicturePath] = useState(null)


  const handleUserFormCompleted = data => {
    console.log(`@@@@@ data`, data);
    setUserData(data.user);

    // Remove pontos e traços do CPF
    const cleanedCpf = data.user.userDocument.replace(/[.-]/g, '');
    setDocument(cleanedCpf);
  };

  const savePhoto = async (picturePath) => {
    if (!picturePath) return;

    setValuePicturePath(picturePath)

    setTakePhoto(false)
  };

  const clearStates = () => {
    setValuePicturePath(null)
    setSearchUserTicket(false);
    setShowSearchModalByCPF(false);
    setCreateNewFastTicket(false);
    setUserData(null);
    setTakePhoto(false);
    setRegistered(false);
    setCpfValue('');
    setValueInitialFirstName('');
    setValueInitialLastname('');

  };

  const completeRegister = async () => {
    const formData = convertJsonToFormData();

    console.log(formData)

    if (!formData) {
      console.log("Erro", "Não há dados de utilizador para registar.");
      return;
    }
    setLoading(true);

    try {

      const result = await completeFastTicketRegister(
        formData,
        authContext.userToken
      );

      if (result) {
        setAlertMessage('Ingresso cadastrado com sucesso!');
        setRegistered(true);
        console.log('Ingresso cadastrado com sucesso!');
      }
    } catch (error) {
      console.error('❌ Erro ao cadastrar ingresso');

      if (error.response) {
        // A requisição foi feita e o servidor respondeu com status != 2xx
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
        console.error('Data:', error.response.data);
        console.error('Config da requisição:', error.config);
      } else if (error.request) {
        // A requisição foi feita mas não houve resposta
        console.error('Requisição feita mas sem resposta:', error.request);
      } else {
        // Alguma outra coisa aconteceu ao configurar a requisição
        console.error('Erro ao configurar a requisição:', error.message);
      }

      console.error('Stack trace:', error.stack);
      alert('Erro ao cadastrar ingresso! Veja o console para detalhes.');
    } finally {
      setLoading(false);
      clearStates()
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
      setValuePicturePath(null)
    }, [])
  );


  const convertJsonToFormData = () => {
    const formData = new FormData();


    for (const key in userData) {
      if (Object.prototype.hasOwnProperty.call(userData, key) && userData[key] !== null) {
        formData.append(key, userData[key]);
      }
    }
    
    formData.append('Face', {
      uri: valuePicturePath,
      type: 'image/jpeg',
      name: 'userImage.jpg',
    });

    return formData
  }

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

          {!userData && !takePhoto && createNewFastTicket && (
            <BasicFastRegisterForm
              onUserFormCompleted={handleUserFormCompleted}
              initialDocument={cpfValue}
              initialFirstName={valueInitialFirstName}
              initialLastName={valueInitialLastname}
            />
          )}

          {!takePhoto && canFinishRegistration && !valuePicturePath && (
            <>
              <Button
                type="solid"
                size="lg"
                containerStyle={{ marginTop: 20 }}
                onPress={() => {
                  setTakePhoto(true)
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

          {canFinishRegistration && !takePhoto && !registered && valuePicturePath && (
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



        </ScrollView>
        {takePhoto && <TakePictureScreen />}
        <Loading isActive={loading} />
      </View>
    </RegisterStateContext.Provider >
  );
};

export default NewFastTicket;
