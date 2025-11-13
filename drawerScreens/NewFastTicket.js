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
  const [isUserActive, setIsUserActive] = useState(false);
  const [emaiValue, setEmailValue] = useState('')

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
    setIsUserActive(false);
    setEmailValue('')

  };

  const completeRegister = async () => {

    if (!isUserActive && !valuePicturePath) {
      return Alert.alert("Foto Obrigatória", "É necessário cadastrar uma foto para finalizar o registo.");
    }

    const formData = convertJsonToFormData();


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
        clearStates();
      }
    } catch (error) {
      console.error('❌ Erro ao cadastrar ingresso');

      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        setAlertMessage(error.response.data.message, '#dc143c');
      } else {
        alert('Erro ao cadastrar ingresso!');
      }

      if (error.response) {
        setValuePicturePath(null);
      }

      console.error('Stack trace:', error.stack);

    } finally {
      setLoading(false);
    }
  };

  const handleUserFound = user => {
    console.log(user.email)
    setIsUserActive(user.isActive || false);
    const nameParts = user.name?.split(' ') || [];
    const firstName = nameParts[0] || '';
    const lastname = nameParts.slice(1).join(' ') || '';
    setValueInitialFirstName(firstName)
    setValueInitialLastname(lastname)
    setCpfValue(user.id)
    setCreateNewFastTicket(true);
    setShowSearchModalByCPF(false);
    setSearchUserTicket(true);
    setEmailValue(user.email)
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
      setIsUserActive(false);
    }, [])
  );


  const convertJsonToFormData = () => {
    const formData = new FormData();


    for (const key in userData) {
      if (Object.prototype.hasOwnProperty.call(userData, key) && userData[key] !== null) {
        formData.append(key, userData[key]);
      }
    }

    if (!isUserActive && valuePicturePath) {
      formData.append('Face', {
        uri: valuePicturePath,
        type: 'image/jpeg',
        name: 'userImage.jpg',
      });
    }

    return formData
  }

  console.log('isUserActive: ' + isUserActive)

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
            Gerar ingresso
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

          {!userData && createNewFastTicket && (
            <BasicFastRegisterForm
              onUserFormCompleted={handleUserFormCompleted}
              initialDocument={cpfValue}
              initialFirstName={valueInitialFirstName}
              initialLastName={valueInitialLastname}
              initialEmail={emaiValue}
            />
          )}

          {userData && !isUserActive && !valuePicturePath && (
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

          {userData && (isUserActive || valuePicturePath) && (
            <>
              <Button
                type="solid"
                size="lg"
                containerStyle={{ marginTop: 20 }}
                onPress={completeRegister}>
                Enviar ingresso
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
