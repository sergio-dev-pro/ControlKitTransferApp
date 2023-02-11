import {Badge, Button, Divider, Input, Text} from '@rneui/themed';
import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {ScrollView, View} from 'react-native';
import Header from '../../components/Header';
import Loading from '../../components/Loading';
import {useAlert} from '../../context/AlertContext';
import {AuthContext} from '../../context/AuthContext';
import GStyles from '../../style/global';
import {cpfValidation, isValidEmail} from '../../helpers/validation';
import {
  completeManualRegister,
  getUserByCpf,
  getUserByEmail,
} from '../../api/UserApi';
import Modal from 'react-native-modal';
import THEME from '../../style/theme';
import {useIsFocused} from '@react-navigation/native';
import RegisterForm from './RegisterForm';
import GuestRegistrations from './GuestRegistrations';
import CodeReaderForEachDay from './CodeReaderForEachDay';
import {formatDateAaaaMmDd} from '../../helpers/format';
import SearchUserModal from '../../components/SearchUserModal';

function ManualRegisterScreen({navigation}) {
  // const [requiredForms, setRequiredForms] = useState();
  // TODO: setado temporariamente
  // {
  //   days: ['2022-11-12T00:00:00'],
  //   id: 'Sergio@spr.com',
  //   inviteDays: [
  //     '2030-08-25T00:00:00',
  //     '2030-08-25T00:00:00',
  //     '2030-08-25T00:00:00',
  //     '2030-08-26T00:00:00',
  //     '2030-08-26T00:00:00',
  //   ],
  //   isActive: false,
  //   token: 'ZiU3aYBWAg1LPl+061DrVA==',
  // }
  // TODO: setado temporariamente
  // {
  //   days: ['2023-02-13T00:00:00'],
  //   id: 'sergio@spr.com',
  //   inviteDays: ['2030-08-26T00:00:00'],
  //   isActive: false,
  //   token: 'ZiU3aYBWAg1LPl+061DrVA==',
  // }
  const [user, setUser] = useState();
  // TODO: setado temporariamente
  // {
  //   address: {
  //     city: '',
  //     complement: '',
  //     neighborhood: '',
  //     number: '',
  //     state: '',
  //     street: '',
  //     zipcode: '',
  //   },
  //   birthDate: '20/01/2000',
  //   genre: 'Masculino',
  //   invalidFields: [],
  //   measurements: {blacelet: null, shirt: 'M', shoe: null},
  //   phone: '(71) 92888-1099',
  // }
  const [registerData, setRegisterData] = useState();
  const {requiredForms, setUserToken, userToken} = useContext(AuthContext);
  const isFocused = useIsFocused();
  const [isVisible, setIsVisible] = useState(true);
  // TODO: setado tru temporariamente
  // 'readQRcode'
  const [codeReaderType, setCodeReaderType] = useState();
  const [loading, setLoading] = useState(false);
  // TODO: setado tru temporariamente
  // {'2023-02-13T00:00:00': '13124234'}
  const [dayCodes, setDayCodes] = useState();
  const ref = useRef();

  // TODO: setado tru temporariamente
  // [{"address": {"city": "Jsnsn", "complement": "ZnznnzNN", "neighborhood": "Shhsh", "number": "49944949", "state": "CE", "street": "Jsjsjjsj", "zipcode": "99779-977"}, "birthDate": "", "dayCodes": {"2030-08-25T00:00:00": "12125"}, "document": "646.749.794-99", "email": "Jsjsshsh@hotmail.com", "genre": "Feminino", "invalidFields": [], "measurements": {"blacelet": "P", "shirt": "M", "shoe": "37"}, "name": "Jxjs", "phone": "(64) 64644-6464", "token": "gv7vLgwvZYLEH4CP2QPdDQ=="}]
  const [guestRegistereds, setGuestRegistereds] = useState();

  const [showQRcodeReader, setShowQRcodeReader] = useState(false);

  useEffect(() => {
    // O ref.current e utilizado para verificar se
    //  o componente ja foi renderizado pela primeira vez.
    ref.current ? isFocused && setIsVisible(true) : (ref.current = true);
  }, [isFocused]);

  const handleUserFound = userFounded => {
    if (userFounded.isActive) return alert('Usuário já registrado.');
    setIsVisible(false);
    setUser(userFounded);
    setUserToken(userFounded.token);
  };

  const handleReadCodes = readCodes => {
    console.log('@@@@@@@@@@@@@@ handleReadCodes', readCodes);
    let codes = {};
    readCodes.forEach(code => {
      codes = {...codes, ...code};
    });
    setDayCodes(codes);
    setShowQRcodeReader(false);
  };

  const completeRegister = async () => {
    const payload = {
      ...registerData,
      birthDate: formatDateAaaaMmDd(registerData.birthDate),
      token: user.token,
      dayCodes,
      guests: guestRegistereds,
    };
    console.log('Payload @@@@@@', JSON.stringify(payload));
    try {
      setLoading(true);
      await completeManualRegister(payload, userToken);
      setLoading(false);
      const clearStates = () => {
        setUser();
        setRegisterData();
        setCodeReaderType();
        setDayCodes();
        setGuestRegistereds();
      };
      clearStates();
      navigation.navigate('Kits');
      alert(`Usuário ${user.id} cadastrado com sucesso!`);
    } catch (error) {
      console.error(error);
      console.log('error error.response.data', error.response.data);
      alert(error.response.data.errors);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearStates = () => {
    setUser(undefined);
    setRegisterData(undefined);
    setCodeReaderType(undefined);
    setDayCodes(undefined);
    setGuestRegistereds(undefined);
    setIsVisible(true);
  };

  const isCompletedUserRegistration = !!registerData && !!dayCodes;
  const isGuestUserRegistrationCompleted = !!guestRegistereds;
  const isShowingGuestRegister =
    user?.inviteDays?.length > 0 &&
    isCompletedUserRegistration &&
    !isGuestUserRegistrationCompleted;
  const hasCompleteRegistration =
    isCompletedUserRegistration && isGuestUserRegistrationCompleted;

  console.log(user);
  console.log('@@@ guestRegistereds', guestRegistereds);
  console.log(registerData, dayCodes);
  console.log("@@@codeReaderType="+ codeReaderType)
  console.log('isCompletedUserRegistration='+isCompletedUserRegistration)
  console.log('isGuestUserRegistrationCompleted='+isGuestUserRegistrationCompleted)
  return (
    <>
      <View style={{...GStyles.view}}>
        <Header
          style={{marginBottom: 0}}
          openDrawer={() => navigation.openDrawer()}
        />
        <Loading isActive={loading} />
        <View style={{width: '100%', backgroundColor: THEME.cor.whitesmoke}}>
          <Text h4 h4Style={{padding: 8, textAlign: 'center'}}>
            Cadastro manual
          </Text>
          <Divider />
        </View>
        <ScrollView
          style={[
            GStyles.container,
            {height: '100%'},
            isShowingGuestRegister ? {maxWidth: 500} : {},
          ]}>
          {user && (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text h5 style={{paddingLeft: 4}}>
                  {!isShowingGuestRegister
                    ? 'Cadastrando usuário:'
                    : 'Convidados de:'}
                </Text>
                <Badge value={user.id} status="success" />
              </View>
            </>
          )}
          {user && !registerData && (
            <RegisterForm
              requiredForms={requiredForms}
              onRegistered={setRegisterData}
              onCancel={() => {
                setUser(undefined);
                setIsVisible(true);
              }}
            />
          )}
          {user && registerData && !codeReaderType && (
            <View>
              <Text h4 h4Style={{marginVertical: 20}}>
                Leia o código do ingresso
              </Text>
              <Button
                containerStyle={{marginBottom: 10}}
                onPress={() => {
                  setCodeReaderType('readBarCode');
                  setShowQRcodeReader(true);
                }}>
                Código de barras
              </Button>
              <Button
                containerStyle={{marginBottom: 10}}
                onPress={() => {
                  setCodeReaderType('readQRcode');
                  setShowQRcodeReader(true);
                }}>
                QRcode
              </Button>
              <Button
                containerStyle={{marginBottom: 10}}
                type="outline"
                onPress={() => {
                  setRegisterData(undefined);
                }}>
                Cancelar
              </Button>
            </View>
          )}
          {isShowingGuestRegister && (
            <GuestRegistrations
              inviteDays={user?.inviteDays}
              requiredForms={requiredForms}
              onGuestRegistrations={setGuestRegistereds}
              onReturn={() => {
                setShowQRcodeReader(true);
                setDayCodes(undefined);
              }}
            />
          )}
          {(hasCompleteRegistration || (isCompletedUserRegistration && user?.inviteDays?.length == 0)) && (
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
                }}>
                Cancelar
              </Button>
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
        <CodeReaderForEachDay
          isVisible={showQRcodeReader}
          onClose={() => {
            setShowQRcodeReader(false);
            setCodeReaderType(undefined);
          }}
          daysInDate={user?.days}
          type={codeReaderType}
          onReadCodes={handleReadCodes}
        />
      </View>
    </>
  );
}

export default ManualRegisterScreen;
