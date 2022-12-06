import {Badge, Button, Card, Divider, Icon, Input, Text} from '@rneui/themed';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import {View} from 'react-native';
import {getEventRequiredFields} from '../../api/EventApi';
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
import {useNavigation} from '@react-navigation/native';
import Modal, {ReactNativeModal} from 'react-native-modal';
import THEME from '../../style/theme';
import {useIsFocused} from '@react-navigation/native';
import DetailsForm from './DetailsForm';
import RegisterForm from './RegisterForm';
import QrCodeReader from '../../components/QrCodeReader';
import axios from 'axios';
import BASE_URL from '../../constants/api';

const getRequiredForms = requiredFields => {
  const {
    addressIsRequired,
    birthDateIsRequired,
    genreIsRequired,
    blaceletSizeIsRequired,
    footSizeIsRequired,
    shirtSizeIsRequired,
    photoIsRequired,
  } = requiredFields;
  let requiredForms = [
    {
      id: 'details',
      name: 'Detalhes',
      validation: () => {
        console.log('validing form');
      },
      formConfig: {birthDateIsRequired, genreIsRequired},
    },
  ];
  const hasSizesForm =
    shirtSizeIsRequired || footSizeIsRequired || blaceletSizeIsRequired;
  if (hasSizesForm)
    requiredForms.push({
      id: 'accessories',
      name: 'Acessórios',
      validation: () => {
        console.log('validing form');
      },
      formConfig: {
        blaceletSizeIsRequired,
        footSizeIsRequired,
        shirtSizeIsRequired,
      },
    });
  if (addressIsRequired)
    requiredForms.push({
      id: 'address',
      name: 'Endereço',
      validation: () => {
        console.log('validing form');
      },
    });
  if (photoIsRequired)
    requiredForms.push({
      id: 'photo',
      name: 'Fotografia',
    });

  return requiredForms;
};

function ManualRegisterScreen({navigation}) {
  // const [requiredForms, setRequiredForms] = useState();
  const [user, setUser] = useState();
  // TODO: setado tru temporariamente
  const [registerData, setRegisterData] = useState();
  const {requiredFieldsForUserRegistration, setUserToken, userToken} =
    useContext(AuthContext);
  const isFocused = useIsFocused();
  const [isVisible, setIsVisible] = useState(true);
  const [getTicketIdType, setGetTicketIdType] = useState();
  const [loading, setLoading] = useState(false);
  const [dayCodes, setDayCodes] = useState();
  const ref = useRef();
  const setAlertMessage = useAlert();

  useEffect(() => {
    // O ref.current e utilizado para verificar se
    //  o componente ja foi renderizado pela primeira vez.
    ref.current ? isFocused && setIsVisible(true) : (ref.current = true);
  }, [isFocused]);

  const requiredForms = useMemo(
    () => getRequiredForms(requiredFieldsForUserRegistration),
    [requiredFieldsForUserRegistration],
  );

  const handleUserFound = userFounded => {
    setIsVisible(false);
    setUser(userFounded);
    setUserToken(userFounded.token);
  };

  const handleReadCodes = readCodes => {
    let codes = {};
    readCodes.forEach(code => {
      codes = {...codes, ...code};
    });
    setDayCodes(codes);
  };

  const completeRegister = async () => {
    const payload = {
      ...registerData,
      token: user.token,
      dayCodes,
    };
    try {
      setLoading(true);
      await completeManualRegister(payload, userToken);
      setLoading(false);
      const clearStates = () => {
        setUser();
        setRegisterData();
        setGetTicketIdType();
        setDayCodes();
      };
      clearStates();
      navigation.navigate('Kits');
      setAlertMessage(`Usuário ${user.id} cadastrado com sucesso!`);
    } catch (error) {
      console.log('error', error);
      console.log('error error.response.data', error.response.data);
      setAlertMessage(error.response.data.errors);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // console.log('@@@ user', user);
  // console.log('@@@ dayCodes', dayCodes);

  return (
    <>
      <View style={{...GStyles.view}}>
        <Header
          style={{marginBottom: 0}}
          openDrawer={() => navigation.openDrawer()}
        />
        <Loading isActive={loading} />
        <View style={{width: '100%', backgroundColor: THEME.cor.whitesmoke}}>
          <Text h3 h3Style={{padding: 8, textAlign: 'center'}}>
            Cadastro manual
          </Text>
          <Divider />
        </View>
        <View style={[{maxWidth: 600}, GStyles.container]}>
          {user && (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text h5 style={{paddingLeft: 4}}>
                  {'Usuário encontrado: '}
                </Text>
                <Badge value={user.id} status="success" />
              </View>
            </>
          )}
          {user && !registerData && (
            <RegisterForm
              requiredForms={requiredForms}
              onRegistered={setRegisterData}
            />
          )}
          {user && registerData && !getTicketIdType && (
            <View>
              <Text h4 h4Style={{marginVertical: 20}}>
                Dar baixa no sistema
              </Text>
              <Button
                containerStyle={{marginBottom: 10}}
                onPress={() => {
                  setGetTicketIdType('readBarCode');
                }}>
                Ler código de barras
              </Button>
              <Button
                containerStyle={{marginBottom: 10}}
                onPress={() => {
                  setGetTicketIdType('readQRcode');
                }}>
                Ler QRcode
              </Button>
              <Button
                containerStyle={{marginBottom: 10}}
                onPress={() => {
                  setGetTicketIdType('PDF');
                }}>
                PDF
              </Button>
            </View>
          )}
          {dayCodes && (
            <Button
              type="solid"
              size="lg"
              containerStyle={{marginTop: 20}}
              onPress={completeRegister}>
              Finalizar cadastro
            </Button>
          )}
        </View>
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
          isVisible={getTicketIdType && !dayCodes}
          onClose={() => setGetTicketIdType(undefined)}
          daysInDate={user?.days}
          type={getTicketIdType}
          onReadCodes={handleReadCodes}
        />
      </View>
    </>
  );
}
function padTo2Digits(num) {
  return num.toString().padStart(2, '0');
}

function formatDate(dateToFormat) {
  const date = new Date(dateToFormat);
  return [
    padTo2Digits(date.getDate()),
    padTo2Digits(date.getMonth() + 1),
    date.getFullYear(),
  ].join('/');
}
const CodeReaderForEachDay = ({
  isVisible,
  onClose,
  daysInDate = [],
  type,
  onReadCodes,
}) => {
  const [readCodes, setReadCodes] = useState([]);
  const [readDayCode, setReadDayCode] = useState();

  const setAlertMessage = useAlert();
  const handleQRCodeRead = code => {
    // TODO: Validar se os codigos do dias sao diferentes
    const isValid =
      readCodes.filter(
        (readCode, index) => readCode[daysInDate[index]] === code,
      ).length === 0;
    if (!isValid) {
      setReadDayCode(undefined);
      return setAlertMessage('Código inválido: Esse código já foi lido.');
    }

    readCodes.push({[readDayCode]: code});
    setReadDayCode(undefined);
  };

  const handleClose = () => {
    setReadCodes([]);
    onClose();
  };

  const handleReadCodes = () => {
    onReadCodes(readCodes);
  };
  const selectReadDayCode = day => setReadDayCode(day);
  const unselectReadDayCode = day => setReadDayCode(undefined);

  const hasReadThePreviousDay = indexOfDaysInDate =>
    readCodes.length === indexOfDaysInDate;
  return (
    <Modal
      isVisible={isVisible}
      backdropOpacity={0.1}
      style={{alignItems: 'center'}}>
      {readDayCode ? (
        <QrCodeReader onRead={handleQRCodeRead} onClose={unselectReadDayCode} />
      ) : (
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 10,
            padding: 20,
            height: 'auto',
            width: 500,
          }}>
          <Text h4 h4Style={{marginBottom: 10, textAlign: 'center'}}>
            Leia o {type === 'readQRcode' ? 'QRcode' : 'código de barras'} de
            cada dia
          </Text>
          <View style={{padding: 16, alignItems: 'flex-start'}}>
            {daysInDate.map((day, index) => (
              <Button
                key={day}
                containerStyle={{
                  width: '100%',
                  marginBottom: 10,
                }}
                type="outline"
                size="lg"
                onPress={() => selectReadDayCode(day)}
                disabled={!hasReadThePreviousDay(index)}>
                Dia {formatDate(day)}
                {readCodes[index] ? (
                  <Badge value={readCodes[index][day]} status="success" />
                ) : (
                  <Icon
                    size={32}
                    style={{marginLeft: 20}}
                    color={
                      !hasReadThePreviousDay(index)
                        ? THEME.cor.grey
                        : THEME.cor.primary
                    }
                    type="materialicons"
                    name="qr-code-scanner"
                  />
                )}
              </Button>
            ))}
          </View>
          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <Button
              title="Voltar"
              size="lg"
              type="clear"
              onPress={handleClose}
            />
            <Button
              type="solid"
              size="lg"
              containerStyle={{marginLeft: 16}}
              title="Pronto"
              onPress={handleReadCodes}
            />
          </View>
        </View>
      )}
    </Modal>
  );
};

const INPUT_VALUE_TYPE = {
  email: 'email',
  cpf: 'cpf',
};
const SearchUserModal = ({onUserFound, isVisible, onClose}) => {
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [invalidInputValue, setInvalidInputValue] = useState();
  const setAlertMessage = useAlert();
  const authContext = useContext(AuthContext);
  const ref = useRef();
  const isFocused = useIsFocused();
  useEffect(() => {
    isFocused && ref.current && ref.current.focus();
  }, [isFocused]);

  const validateInputValue = () => {
    if (!inputValue)
      return invalidInputValue ? setInvalidInputValue(null) : null;

    const isValid = isValidEmail(inputValue);
    const isValidCPF = cpfValidation(inputValue);

    const isInputValueValid = isValid || isValidCPF;
    if (!isInputValueValid) {
      return !invalidInputValue
        ? setInvalidInputValue('E-mail ou CPF inválido.')
        : null;
    }

    invalidInputValue && setInvalidInputValue(null);

    const successValidatedType = isValid
      ? INPUT_VALUE_TYPE.email
      : INPUT_VALUE_TYPE.cpf;
    return successValidatedType;
  };

  const handleSearch = async () => {
    const validatedInputValueType = validateInputValue();
    if (!validatedInputValueType) return;
    try {
      setLoading(true);
      const {data: user} =
        validatedInputValueType === INPUT_VALUE_TYPE.email
          ? await getUserByEmail(inputValue, authContext.selectedEventId)
          : await getUserByCpf(inputValue, authContext.selectedEventId);

      onUserFound({...user, id: inputValue});
    } catch (error) {
      if (error.response.data.errors)
        return setAlertMessage(
          `${
            validatedInputValueType === INPUT_VALUE_TYPE.email
              ? 'e-mail não encontrado.'
              : 'CPF não encontrado.'
          }`,
        );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      backdropOpacity={0.1}
      style={{alignItems: 'center'}}
      onBackdropPress={onClose}>
      <View
        style={{
          backgroundColor: 'white',
          borderRadius: 10,
          padding: 20,
          height: 'auto',
          width: 500,
        }}>
        <Text h4 h4Style={{marginBottom: 10}}>
          Busque o usuário que deseja cadastrar
        </Text>
        <Input
          ref={ref}
          value={inputValue}
          placeholder="Digite o e-mail ou CPF"
          onChangeText={value => setInputValue(value.trim().replace(/\s/g, ''))}
          errorMessage={invalidInputValue}
        />
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Button title="Voltar" size="lg" type="clear" onPress={onClose} />
          <Button
            type="solid"
            loading={loading}
            size="lg"
            containerStyle={{marginLeft: 16}}
            title="Buscar"
            onPress={handleSearch}
            on
          />
        </View>
      </View>
    </Modal>
  );
};

export default ManualRegisterScreen;
