import {View} from 'react-native';
import React, {useContext, useEffect, useLayoutEffect, useState} from 'react';
import GStyles from '../style/global';
import Header from '../components/Header';
import {Button, Divider, Text} from '@rneui/themed';
import {getEventDays, getEventSectors} from '../api/EventApi';
import {AuthContext} from '../context/AuthContext';
import Loading from '../components/Loading';
import BasicFastRegisterForm from './ManualRegisterScreen/BasicFastRegisterForm';
import {completeFastTicketRegister, saveUserPhotoAgain} from '../api/UserApi';
import {useAlert} from '../context/AlertContext';
import {ScrollView} from 'react-native-gesture-handler';
import THEME from '../style/theme';
import TakePictureScreen from './ManualRegisterScreen/TakePictureScreen';
import { RegisterStateContext } from './ManualRegisterScreen/registerContext';

const NewFastTicket = ({navigation}) => {
  const [days, setDays] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [tempToken, setTempToken] = useState(null);
  const [takePhoto, setTakePhoto] = useState(false);
  const [registered, setRegistered] = useState(false);
  // TODO: setado temporariamente
  const [userData, setUserData] = useState();

  // TODO: setado true temporariamente
  const [loading, setLoading] = useState(true);

  const authContext = useContext(AuthContext);

  const setAlertMessage = useAlert();

  useEffect(() => {
    (async () => {
      try {
        console.log("selectedEventId="+authContext.selectedEventId);
        const {data: days} = await getEventDays(authContext.selectedEventId);
        setDays(days);

        const {data: sectors} = await getEventSectors(authContext.selectedEventId);
        setSectors(sectors);
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
  };

  const savePhoto = async picturePath => {

    if (picturePath) {
      const formData = new FormData();
      formData.append('token', tempToken);
      formData.append('file', {
        uri: picturePath,
        type: 'image/jpeg',
        name: 'userImage.jpg',
      });
      console.log('@@@@ formData', formData);
      try {
        setLoading(true);
        var response = await saveUserPhotoAgain(formData);
        if (response) {
          setAlertMessage('Foto salva com sucesso!');
          clearStates();
          setTakePhoto(false);
          setRegistered(false);
        } else {
          setAlertMessage('Erro ao enviar imagem, tente novamente.');
        }
      } catch (error) {
        console.error(error);
        setAlertMessage('Erro ao enviar imagem, tente novamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  const clearStates = () => {
    setUserData(undefined);
  };

  const completeRegister = async () => {
    try {
      setLoading(true);
      const data = {
        ...userData
      };
      console.log(
        'NewTicket completeRegister',
        JSON.stringify(data),
        authContext.userToken,
      );
      var result = await completeFastTicketRegister(authContext.selectedEventId, data, authContext.userToken);
      
      
      if(result?.token)
      {
        setAlertMessage('Ingresso cadastrado com sucesso!');
        setTempToken(result?.token);
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
    }
  };

  console.log('takeFoto='+ takePhoto)

  const canFinishRegistration = !!userData;
  return (
    <RegisterStateContext.Provider
        value={{
          cancelPhoto: () => {
            setTakePhoto(false);
          },
          savePhoto,
          isSavingPhoto: loading,
        }}>
    <View style={{...GStyles.view}}>
      <Header
        style={{marginBottom: 0}}
        openDrawer={() => navigation.openDrawer()}
      />
      <View style={{width: '100%', backgroundColor: THEME.cor.whitesmoke}}>
        <Text h3 h3Style={{padding: 8, textAlign: 'center'}}>
          Cadastro rápido
        </Text>
        <Divider />
      </View>
      <ScrollView style={[GStyles.container, {height: '100%'}]}>
        {days.length > 0 && sectors.length > 0 && (
          <>
            {!userData && !takePhoto && (
              <BasicFastRegisterForm
                onUserFormCompleted={handleUserFormCompleted}
                availableDays={days}
                availableSectors={sectors}
              />
            )}
          </>
        )}
        {canFinishRegistration && !takePhoto && !registered && (
          <>
            <Button
              type="solid"
              size="lg"
              containerStyle={{marginTop: 20}}
              onPress={completeRegister}>
              Finalizar cadastro
            </Button>
            <Button
              containerStyle={{marginTop: 10}}
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
              containerStyle={{marginTop: 20}}
              onPress={() => {
                setTakePhoto(true);
              }}>
              Cadastrar foto
            </Button>
            <Button
              containerStyle={{marginTop: 10}}
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
    </RegisterStateContext.Provider>
  );
};

export default NewFastTicket;
