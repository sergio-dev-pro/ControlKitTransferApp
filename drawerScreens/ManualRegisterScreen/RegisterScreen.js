import React, {useState, useContext, useReducer, useEffect} from 'react';
import {TouchableOpacity, View, Linking, Dimensions} from 'react-native';
import AwesomeAlert from 'react-native-awesome-alerts';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import Icon from 'react-native-vector-icons/FontAwesome';
import {getEventRequiredFields} from '../../api/EventApi';
import {finalizeUserRegistration, saveUserPhoto} from '../../api/UserApi';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Loading from '../../components/Loading';
import Select from '../../components/SelectModal';

import Text from '../../components/Text';
import {AuthContext} from '../../context/authContext';
import {formatBirthDate, formatPhone} from '../../helpers/format';
import {validateDate} from '../../helpers/validation';
import {theme} from '../../style/theme';
import StepViews from './StepViews';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthLayout from '../../layouts/AuthLayout';
import TakePictureScreen from './TakePictureScreen';
import AddressForm from './AdressForm';
import {validateAddressForm} from './validation';

const initialState = {
  phone: '',
  password: '',
  confirmPassword: '',
  birthDate: '',
  genre: null,
  measurements: {
    shirt: null,
    blacelet: null,
    shoe: null,
  },
  address: {
    street: '',
    zipcode: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  },
};

const registerReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PHONE':
      return {
        ...state,
        ...action.payload,
      };
    case 'SET_GENRE':
      return {
        ...state,
        ...action.payload,
      };
    case 'SET_PASSWORD':
      return {
        ...state,
        password: action.payload,
      };
    case 'SET_CONFIRM_PASSWORD':
      return {
        ...state,
        confirmPassword: action.payload,
      };
    case 'SET_BIRTH':
      return {
        ...state,
        ...action.payload,
      };
    case 'SET_CEP':
      return {
        ...state,
        ...action.payload,
      };
    case 'SET_MEASUREMENTS_SHIRT':
      return {
        ...state,
        measurements: {...state.measurements, shirt: action.payload},
      };
    case 'SET_MEASUREMENTS_SHOE':
      return {
        ...state,
        measurements: {...state.measurements, shoe: action.payload},
      };
    case 'SET_MEASUREMENTS_BLACELET':
      return {
        ...state,
        measurements: {...state.measurements, blacelet: action.payload},
      };
    case 'SET_ADDRESS':
      return {
        ...state,
        address: {...state.address, ...action.payload},
      };
    case 'SET_RESET_PASSWORD':
      return {
        ...state,
        password: '',
        confirmPassword: '',
      };
  }
};

const getFormsQuantity = formConfig => {
  if (!formConfig) return null;
  const initialQuantity = 2;
  let quantity = initialQuantity;
  const {
    addressIsRequired,
    shirtSizeIsRequired,
    footSizeIsRequired,
    blaceletSizeIsRequired,
  } = formConfig;
  if (addressIsRequired) {
    quantity += 2;
  }
  if (shirtSizeIsRequired || footSizeIsRequired || blaceletSizeIsRequired)
    quantity += 1;
  return quantity;
};

const windowHeight = Dimensions.get('window').height;
const isSmallHeightScreen = windowHeight < 500;
export default function RegisterScreen({navigation}) {
  const [currentStepNumber, setCurrentStepNumber] = useState(1);
  const [showAlert, setShowAlert] = useState({
    isShowing: false,
    message: null,
  });
  const [registerState, dispatch] = useReducer(registerReducer, initialState);
  const authContext = useContext(AuthContext);
  const {resetInitialState, setAuthState, token} = authContext;

  const [isBirthDateValid, setIsBirthDateValid] = useState(true);
  const [isAcceptedTermsAndUsagePolicy, setIsAcceptedTermsAndUsagePolicy] =
    useState(false);
  const [isValidPhone, setIsValidPhone] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordValid, setIsPasswordValide] = useState(true);
  const [formConfig, setFormConfig] = useState();
  const [savedPhoto, setSavedPhoto] = useState(false);
  const [openCamera, setOpenCamera] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    getEventRequiredFields().then(data => {
      setFormConfig(data);
      setIsLoading(false);
    });
  }, []);

  const savePhoto = async picturePath => {
    if (picturePath) {
      setOpenCamera(false);
      const formData = new FormData();
      formData.append('token', authContext.token);
      formData.append('file', {
        uri: picturePath,
        type: 'image/jpeg',
        name: 'userImage.jpg',
      });
      setIsLoading(true);
      var response = await saveUserPhoto(formData);
      setIsLoading(false);
      if (response) {
        setShowAlertMessage('Foto salva com sucesso!');
        setSavedPhoto(true);
      } else {
        setShowAlertMessage('Erro ao enviar imagem, tente novamente');
      }
    }
  };

  const [genres] = useState([
    {label: 'Masculino', value: 'Masculino'},
    {label: 'Feminino', value: 'Feminino'},
    {label: 'Outro', value: 'Outro'},
  ]);

  const {
    phone,
    birthDate,
    address,
    genre,
    measurements,
    password,
    confirmPassword,
  } = registerState;

  let formsQuantiy = getFormsQuantity(formConfig);

  const isLastForm = formsQuantiy === currentStepNumber;

  const setShowAlertMessage = message =>
    setShowAlert({isShowing: true, message: message});

  const hasSizesForm =
    formConfig?.shirtSizeIsRequired ||
    formConfig?.footSizeIsRequired ||
    formConfig?.blaceletSizeIsRequired;

  const validateCurrentForm = () => {
    const formValidations = {
      isValidAddress: () => {
        const firstPartRequiredFields = [
          'street',
          'zipcode',
          'complement',
          'number',
        ];
        const secondPartRequiredFields = ['neighborhood', 'city', 'state'];

        const isFirstPart = () => {
          const step = currentStepNumber;
          if (step === 2) return true;
          else if (step === 3) {
            return hasSizesForm ? true : false;
          } else if (step === 3) {
            return hasSizesForm ? true : false;
          } else if (step === 4) {
            return false;
          }
        };

        const requiredFields = isFirstPart()
          ? firstPartRequiredFields
          : secondPartRequiredFields;

        const addressFormValidation = validateAddressForm(
          address,
          requiredFields,
        );
        if (!addressFormValidation.isValid) {
          setShowAlertMessage(addressFormValidation.invalidationMessage);
          return false;
        }
        return true;
      },
    };

    const emptyFields = 'Todos os campos devem ser preenchidos.';
    if (currentStepNumber === 1) {
      if (!phone) {
        setShowAlertMessage(emptyFields);
        return false;
      }
      const isValidPhone = phone.length === 15;
      if (!isValidPhone) {
        setShowAlertMessage('Campo de telefone inválido.');
        return setIsValidPhone(false);
      }
      if (formConfig?.birthDateIsRequired) {
        if (!birthDate) {
          setShowAlertMessage(emptyFields);
          return false;
        }
        if (!validateDate(birthDate)) {
          // alert("Aquuiiii")
          setShowAlertMessage('Campo de data de nascimento inválido.');
          return false;
        }
      }
      if (formConfig?.genreIsRequired) {
        if (!genre) {
          setShowAlertMessage(emptyFields);
          return false;
        }
      }
      return true;
    }

    if (currentStepNumber === 2) {
      if (hasSizesForm) {
        const {shirt, blacelet, shoe} = measurements;
        if (!shirt || !blacelet || !shoe) {
          setShowAlertMessage(emptyFields);
          return false;
        }
      } else if (formConfig?.addressIsRequired) {
        return formValidations.isValidAddress();
      } else {
        if (!password || !confirmPassword) {
          setShowAlertMessage(emptyFields);
          return false;
        }
        if (password.length < 6) {
          setShowAlertMessage('A senha deve ter no mínimo 6 caracteres.');
          return false;
        }
        if (password !== confirmPassword) {
          setShowAlertMessage(
            'Os campos de senha e confirmação de senha devem ser iguais.',
          );
          dispatch({type: 'SET_RESET_PASSWORD'});
          return false;
        }
      }
      return true;
    }

    if (currentStepNumber === 3) {
      if (formConfig?.addressIsRequired) {
        return formValidations.isValidAddress();
      } else {
        if (!password || !confirmPassword) {
          setShowAlertMessage(emptyFields);
          return false;
        }
        if (password.length < 6) {
          setShowAlertMessage('A senha deve ter no mínimo 6 caracteres.');
          return false;
        }
        if (password !== confirmPassword) {
          setShowAlertMessage(
            'Os campos de senha e confirmação de senha devem ser iguais.',
          );
          dispatch({type: 'SET_RESET_PASSWORD'});
          return false;
        }
        if (!isAcceptedTermsAndUsagePolicy) {
          setShowAlertMessage(
            'Aceite os termos de uso e políticas de privacidade para finalizar o cadastro.',
          );
          return false;
        }
      }

      return true;
    }

    if (currentStepNumber === 4) {
      if (formConfig?.addressIsRequired) {
        return formValidations.isValidAddress();
      }
      if (!password || !confirmPassword) {
        setShowAlertMessage(emptyFields);
        return false;
      }
      if (password.length < 6) {
        setShowAlertMessage('A senha deve ter no mínimo 6 caracteres.');
        return false;
      }
      if (password !== confirmPassword) {
        setShowAlertMessage(
          'Os campos de senha e confirmação de senha devem ser iguais.',
        );
        dispatch({type: 'SET_RESET_PASSWORD'});
        return false;
      }
      if (!isAcceptedTermsAndUsagePolicy) {
        setShowAlertMessage(
          'Aceite a os termos de uso e políticas de privacidade para finalizar o cadastro.',
        );
        return false;
      }

      return true;
    }
    if (currentStepNumber === 5) {
      if (!password || !confirmPassword) {
        setShowAlertMessage(emptyFields);
        return false;
      }
      if (password.length < 6) {
        setShowAlertMessage('A senha deve ter no mínimo 6 caracteres.');
        return false;
      }
      if (password !== confirmPassword) {
        setShowAlertMessage(
          'Os campos de senha e confirmação de senha devem ser iguais.',
        );
        dispatch({type: 'SET_RESET_PASSWORD'});
        return false;
      }
      if (!isAcceptedTermsAndUsagePolicy) {
        setShowAlertMessage(
          'Aceite a os termos de uso e políticas de privacidade para finalizar o cadastro.',
        );
        return false;
      }

      return true;
    }
  };

  const isValidPassword = (password, confirmPassword) => {
    if (!password || !confirmPassword) return false;
    if (password !== confirmPassword) return false;

    return true;
  };

  const finalizeRegistration = async () => {
    let registerData = {
      token,
      phone,
      password,
    };
    if (formConfig?.birthDateIsRequired) registerData.birthDate = birthDate;
    if (formConfig?.genreIsRequired) registerData.genre = genre;
    if (formConfig?.addressIsRequired) registerData.address = address;
    if (hasSizesForm) {
      if (formConfig?.shirtSizeIsRequired)
        console.log('shirt is ', measurements.shirt);
      registerData.shirtSize = measurements.shirt;
      if (formConfig?.blaceletSizeIsRequired)
        registerData.blaceletSize = measurements.blacelet;
      if (formConfig?.footSizeIsRequired)
        registerData.footSize = measurements.shoe;
    }

    setIsLoading(true);
    const response = await finalizeUserRegistration(registerData);

    setIsLoading(false);
    if (!response) return navigation.navigate('Login');
    if (response?.status === 'error')
      return setShowAlertMessage(response.errMsg);

    await AsyncStorage.setItem('userToken', response);
    setAuthState({userToken: response});
  };

  const addressIsRequired = formConfig?.addressIsRequired;
  return (
    <View style={{flex: 1}}>
      <AuthLayout>
        <View style={{paddingHorizontal: theme.size.xs, flex: 1}}>
          <StepViews currentStepNumber={currentStepNumber}>
            <View>
              <Text as="H2" style={{marginBottom: theme.size.xs}}>
                Detalhes
              </Text>
              <Input
                label="Telefone"
                placeholder="(99) 99999-9999"
                value={phone}
                onChangeText={text => {
                  dispatch({
                    type: 'SET_PHONE',
                    payload: {phone: formatPhone(text)},
                  });
                }}
                keyboardType="numeric"
              />
              {formConfig?.birthDateIsRequired && (
                <Input
                  label="Data de nascimento"
                  placeholder="01/01/2022"
                  onChangeText={text => {
                    dispatch({
                      type: 'SET_BIRTH',
                      payload: {birthDate: formatBirthDate(text)},
                    });
                    !text && setIsBirthDateValid(false);
                    formatBirthDate(text)?.length === 10 &&
                      setIsBirthDateValid(validateDate(formatBirthDate(text)));
                  }}
                  onBlur={() => {
                    birthDate && setIsBirthDateValid(validateDate(birthDate));
                  }}
                  value={birthDate}
                  invalidValueMessage={
                    !isBirthDateValid && 'Data de nascimento inválida'
                  }
                  keyboardType="numeric"
                />
              )}
              {formConfig?.genreIsRequired && (
                <Select
                  label="Gênero"
                  placeholder="Gênero"
                  items={genres}
                  value={genre}
                  setValue={value => {
                    dispatch({type: 'SET_GENRE', payload: {genre: value}});
                  }}
                />
              )}
            </View>
            {hasSizesForm && (
              <View>
                <Text as="H2">Acessórios</Text>
                {formConfig?.shirtSizeIsRequired && (
                  <Select
                    label="Camisa"
                    value={measurements.shirt}
                    setValue={value =>
                      dispatch({
                        type: 'SET_MEASUREMENTS_SHIRT',
                        payload: value,
                      })
                    }
                    placeholder="Tamanho da camisa"
                    items={[
                      {label: 'P', value: 'P'},
                      {label: 'M', value: 'M'},
                      {label: 'G', value: 'G'},
                      {label: 'GG', value: 'GG'},
                      {label: 'EG1', value: 'EG1'},
                      {label: 'EG2', value: 'EG2'},
                    ]}
                  />
                )}
                {formConfig?.blaceletSizeIsRequired && (
                  <Select
                    label="Pulseira"
                    placeholder="Tamanho da pulseira"
                    value={measurements.blacelet}
                    setValue={value =>
                      dispatch({
                        type: 'SET_MEASUREMENTS_BLACELET',
                        payload: value,
                      })
                    }
                    items={[
                      {label: 'P', value: 'P'},
                      {label: 'M', value: 'M'},
                      {label: 'G', value: 'G'},
                    ]}
                  />
                )}
                {formConfig?.footSizeIsRequired && (
                  <Select
                    label="Calçado"
                    value={measurements.shoe}
                    setValue={value =>
                      dispatch({type: 'SET_MEASUREMENTS_SHOE', payload: value})
                    }
                    placeholder="Tamanho do calçado"
                    items={[
                      {label: '33', value: '33'},
                      {label: '34', value: '34'},
                      {label: '35', value: '35'},
                      {label: '36', value: '36'},
                      {label: '37', value: '37'},
                      {label: '38', value: '38'},
                      {label: '39', value: '39'},
                      {label: '40', value: '40'},
                      {label: '41', value: '41'},
                      {label: '42', value: '42'},
                      {label: '43', value: '43'},
                      {label: '44', value: '44'},
                      {label: '45', value: '45'},
                      {label: '46', value: '46'},
                    ]}
                  />
                )}
              </View>
            )}
            {addressIsRequired && (
              <AddressForm.FirstPartFields
                address={address}
                dispatch={dispatch}
              />
            )}
            {addressIsRequired && (
              <AddressForm.SecondPartFields
                address={address}
                dispatch={dispatch}
              />
            )}
          </StepViews>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: theme.size.xs,
              borderTopWidth: 1,
              borderColor: theme.color.secondary,
            }}>
            <Button
              size={isSmallHeightScreen ? 'small' : 'medium'}
              variant="secondary"
              onPress={() => {
                if (currentStepNumber === 1) {
                  resetInitialState();
                  navigation.goBack();
                } else {
                  setCurrentStepNumber(prevState => --prevState);
                }
              }}>
              Voltar
            </Button>
            <Button
              size={isSmallHeightScreen ? 'small' : 'medium'}
              disabled={
                currentStepNumber === formsQuantiy &&
                !isValidPassword(password, confirmPassword)
              }
              onPress={() =>
                validateCurrentForm() &&
                (isLastForm
                  ? finalizeRegistration()
                  : setCurrentStepNumber(prevState => ++prevState))
              }>
              {isLastForm ? 'Finalizar' : 'Continuar'}
            </Button>
          </View>
        </View>
        <Loading isActive={isLoading} />
      </AuthLayout>
      {openCamera && (
        <TakePictureScreen
          cancel={() => setOpenCamera(false)}
          save={savePhoto}
        />
      )}
    </View>
  );
}
