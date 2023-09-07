import {useIsFocused} from '@react-navigation/native';
import {Button, Divider, Text} from '@rneui/themed';
import React, {useContext, useEffect, useRef, useState} from 'react';
import {ScrollView, View} from 'react-native';
import {saveUserPhotoAgain} from '../api/UserApi';
import Header from '../components/Header';
import SearchUserModal from '../components/SearchUserModal';
import TakePictureModal from '../components/TakePictureModal';
import {useAlert} from '../context/AlertContext';
import {AuthContext} from '../context/AuthContext';
import GStyles from '../style/global';
import THEME from '../style/theme';

function PhotoReregisterDrawerScreen({navigation}) {
  const [isVisible, setIsVisible] = useState(true);
  const [user, setUser] = useState();
  const isFocused = useIsFocused();
  const ref = useRef();
  const {setUserToken} = useContext(AuthContext);
  const setAlertMessage = useAlert();
  useEffect(() => {
    // O ref.current e utilizado para verificar se
    //  o componente ja foi renderizado pela primeira vez.
    ref.current ? isFocused && setIsVisible(true) : (ref.current = true);
  }, [isFocused]);
  const [isLoading, setIsLoading] = useState();

  const [isVisibleCam, setIsVisibleCam] = useState();
  const toggleCamVisibility = () => setIsVisibleCam(is => !is);

  const handleUserFound = userFounded => {
    if (!userFounded.isActive)
      return setAlertMessage('Usuário precisa realizar o cadastro inicial.');

    setUser(userFounded);
    setIsVisible(false);
  };

  const clearState = () => {
    setUser(undefined);
    setIsVisible(true);
  };
  const handleSavePhoto = async imgPath => {
    const formData = new FormData();
    formData.append('token', user.token);
    formData.append('file', {
      uri: imgPath,
      type: 'image/jpeg',
      name: 'userImage.jpg',
    });
    console.log('@@@@ formData', formData);
    setIsLoading(true);
    var response = await saveUserPhotoAgain(formData);
    if (response) {
      clearState();
      setAlertMessage('Foto atualizada com sucesso!', '#32cd32');
    } else {
      setAlertMessage('Erro ao enviar imagem, tente novamente.');
    }
    toggleCamVisibility();
    setIsLoading(false);
  };

  console.log(user);
  return (
    <View style={{...GStyles.view}}>
      <Header
        style={{marginBottom: 0}}
        openDrawer={() => navigation.openDrawer()}
      />
      <View style={{width: '100%', backgroundColor: THEME.cor.whitesmoke}}>
        <Text h3 h3Style={{padding: 8, textAlign: 'center'}}>
          Recadastrar foto
        </Text>
        <Divider />
      </View>
      <ScrollView style={GStyles.container}>
        {user && (
          <>
            <Text h4 style={{textAlign: 'center', marginBottom: 16}}>
              Usuário encontrado
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}>
              <Text h4>E-mail</Text>
              <Text h4>{user?.id}</Text>
            </View>
            <Button
              type="outline"
              containerStyle={{marginBottom: 8}}
              onPress={clearState}>
              Voltar
            </Button>
            <Button onPress={toggleCamVisibility}>Tirar nova foto</Button>
          </>
        )}
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
        {user && (
          <TakePictureModal
            isVisible={isVisibleCam}
            cancelPhoto={toggleCamVisibility}
            savePhoto={handleSavePhoto}
            isSavingPhoto={isLoading}
          />
        )}
      </ScrollView>
    </View>
  );
}

export default PhotoReregisterDrawerScreen;
