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
import ReactNativeModal from 'react-native-modal';
import { TouchableOpacity } from 'react-native';

function PhotoReregisterDrawerScreen({navigation}) {
  const [isVisible, setIsVisible] = useState(true);
  const [user, setUser] = useState();
  const [SspMuralhaBlocked, setSspMuralhaBlocked] = useState(false);
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
    if (!userFounded.isActive && !userFounded.useFacialWeb)
      return setAlertMessage('Usuário precisa realizar o cadastro inicial.');
    
    if(userFounded?.sspMuralhaBlocked)
    return setSspMuralhaBlocked(true);

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

  console.log("@@@user user sspMuralhaBlocked SspMuralhaBlocked",user, user?.sspMuralhaBlocked, "=", user?.SspMuralhaBlocked);
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
        <ReactNativeModal
          isVisible={SspMuralhaBlocked}
          backdropOpacity={0.1}
          style={{alignItems: 'center'}}
          onBackdropPress={() => {
            setSspMuralhaBlocked(false);
          }}>
            <View
                    style={{
                      backgroundColor: 'white',
                      borderRadius: 10,
                      padding: 20,
                      height: 'auto',
                      width: `95%`,
                    }}>
                    <Text h4 h4Style={{marginBottom: 20, color: '#7E22CE', fontSize: 20}}>
                      Documento com restrição. Procure um supervisor.
                    </Text>
                    <View
                      style={{
                        width: '100%',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        // alignItems: 'center',
                      }}>
                      {/* <Button
                        type="clear"
                        size="lg"
                        containerStyle={{marginLeft: 16, color: '#000'}}
                        title="Ok"
                        color={"error"}
                        onPress={()=> {setSspMuralhaBlocked(false)}}
                      /> */}
                     <TouchableOpacity
                      style={{
                        backgroundColor: '#7E22CE',
                        paddingVertical: 12,
                        paddingHorizontal: 32,
                        borderRadius: 8,
                      }}
                      onPress={()=> {setSspMuralhaBlocked(false);}}>
                      <Text
                        style={{color: '#FFFFFF', fontSize: 16, fontWeight: '600'}}>
                        Ok
                      </Text>
                    </TouchableOpacity>
                    </View>
                  </View>
          </ReactNativeModal>
      </ScrollView>
    </View>
  );
}

export default PhotoReregisterDrawerScreen;
