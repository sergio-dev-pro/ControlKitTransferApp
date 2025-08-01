import {Badge, Button, Divider, Input, ListItem, Text} from '@rneui/themed';
import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {ScrollView, View} from 'react-native';
import Header from '../../components/Header';
import Loading from '../../components/Loading';
import GStyles from '../../style/global';
import {
  saveUserPhotoAgain,
} from '../../api/UserApi';
import THEME from '../../style/theme';
import {useIsFocused} from '@react-navigation/native';
import SearchUserModal from '../../components/SearchUserModal';
import { RegisterStateContext } from './registerContext';
import TakePictureScreen from './TakePictureScreen';
import { useAlert } from '../../context/AlertContext';
const formatDate = date => {
  var dateParts = date.split("T")[0].split('-');
    month = dateParts[1];
    day = dateParts[2];
    year = dateParts[0];

  return [day, month, year].join('/');
};
function TicketOfficeManualRegisterScreen({navigation}) {

  const [user, setUser] = useState();

  const isFocused = useIsFocused();
  const [isVisible, setIsVisible] = useState(true);
  const [takePhoto, setTakePhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef();

  const setAlertMessage = useAlert();

  const savePhoto = async picturePath => {

    if (picturePath) {
      const formData = new FormData();
      formData.append('token', user.token);
      formData.append('isBoxOfficeRegistration', 'true');
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
          setTakePhoto(false);
          clearStates();
          setTimeout(() => {setIsVisible(true)}, 3000)
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

  

  useEffect(() => {
    // O ref.current e utilizado para verificar se
    //  o componente ja foi renderizado pela primeira vez.
    ref.current ? isFocused && setIsVisible(true) : (ref.current = true);
  }, [isFocused]);

  // TODO: Não remover
  const handleUserFound = userFounded => {
    if (userFounded.isActive) return alert('Usuário já registrado.');
    setIsVisible(false);
    setUser(userFounded);
  };

  const clearStates = () => {
    setUser(null);
  };  
  const daySectorArray = user && Object.entries(user?.daySectors);
  console.log('@@@ user', user);
  console.log('@@@ daySectorArray',daySectorArray);
  return (
    <>
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
        <Loading isActive={loading} />
        <View style={{width: '100%', backgroundColor: THEME.cor.whitesmoke}}>
          <Text h4 h4Style={{padding: 8, textAlign: 'center'}}>
            Cadastro manual - Bilheteria
          </Text>
          <Divider />
        </View>
        <ScrollView style={[GStyles.container, {height: '100%'}]}>
          {user && (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text h5 style={{paddingLeft: 4}}>
                  CPF:
                </Text>
                <Badge value={user.id} status="success" />
              </View>
              <View>
                {daySectorArray.map(([date, sector]) => (
                  <ListItem key={date}>
                    <ListItem.Content>
                      <ListItem.Title style={{padding: 0, fontSize: 20}}>
                        Dia {formatDate(date)}, Setor {sector}.
                      </ListItem.Title>
                    </ListItem.Content>
                  </ListItem>
                ))}
              </View>
              <View>
                <Button type="solid" size="lg" color="warning" style={{}}
                onPress={() => {
                  setTakePhoto(true);
                }}>
                  Cadastrar foto
                </Button>
                <Button
              type="outline"
              containerStyle={{marginTop: 10}}
              onPress={() => {
                clearStates();
                setIsVisible(true);
              }}>
              Cancelar
            </Button>
              </View>
            </>
          )}
        </ScrollView>
        {!user && (
          <SearchUserModal
            onUserFound={handleUserFound}
            isVisible={isVisible}
            onClose={() => {
              setIsVisible(false);
              navigation.navigate('Kits');
            }}
          />
        )}
      </View>
      {takePhoto && <TakePictureScreen />}
      </RegisterStateContext.Provider>
    </>
  );
}

export default TicketOfficeManualRegisterScreen;
