import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import React, { useState, useContext } from 'react';
import GStyles from '../style/global';
import Header from '../components/Header';
import THEME from '../style/theme';
import { Text, Divider, Input, Button } from '@rneui/themed';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { completeUserRegister, getBasicUserByEmail } from '../api/UserApi';
import { useMaskedInputProps } from 'react-native-mask-input';
import SelectModal from '../components/SelectModal';
import TakePictureModal from '../components/TakePictureModal';
import { cpfValidation, isValidationEmail } from '../helpers/validation';
import SearchUserModal from '../components/SearchUserModal';
import AddressForm from './ManualRegisterScreen/AdressForm';
import AddressFormFields from '../components/forms/AddressFormFields';
import { listCountries } from '../helpers/listCountries';
import { DOMAINS_EMAILS } from '../helpers/emailDomains';
import { TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import TakePictureScreen from './ManualRegisterScreen/TakePictureScreen';
import { RegisterStateContext } from './ManualRegisterScreen/registerContext';
import { countryCodes } from '../helpers/countryCodes';

const inputErrorMsgs = {
  cpf: 'CPF inválido.',
  global: {
    empty: 'campo obrigatório.',
  },
};

const CompleteRegisterDrawerScreen = ({ navigation }) => {
  const { userToken, selectedEventId } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const [guestDocument, setGuestDocument] = useState('');
  const [guestFirstname, setGuestFirstname] = useState('');
  const [guestLastname, setGuestLastname] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState({
    countryCode: '+55',
    dialCode: '',
    nationalNumber: '',
    internationalNumber: '',
  });
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState(null);
  const [documentType, setDocumentType] = useState(1);

  const [step, setStep] = useState(null);
  const [takePhoto, setTakePhoto] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [photoUri, setPhotoUri] = useState(null);
  const setAlertMessage = useAlert();
  const [showSearchModalByCPF, setShowSearchModalByCPF] = useState(false);
  const [address, setAddress] = useState({
    street: '',
    zipcode: '',
    number: '',
    neighborhood: '',
    complement: '',
    city: '',
    state: '',
    country: 27,
  });

  const [stateSuggestions, setStateSuggestions] = useState([]);
  const [emailValidation, setEmailValidation] = useState({ isValid: true, errorMsg: '' });
  const [suggestionsEmail, setSuggestionsEmail] = useState([]);
  const [faceBoudingBox, setFaceBoudingBox] = useState(null)




  // Máscara apenas para CPF
  const maskedCPFInputProps = useMaskedInputProps({
    value: guestDocument,
    onChangeText: setGuestDocument,
    mask: [/\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/],
  });

  const regex = /^[\w.+-]+@[\w.-]+\.\w+$/;

  const handleClear = () => {
    setGuestDocument('');
    setGuestFirstname('');
    setGuestLastname('');
    setGuestEmail('');
    setGuestPhone({
      countryCode: '+55',
      dialCode: '',
      nationalNumber: '',
      internationalNumber: '',
    });
    setBirthDate('');
    setGender(null);
    setDocumentType(1); // volta para CPF por padrão
    setStep(null);
    setTakePhoto(false);
    setIsLoading(false);
    setPhotoUri(null);
    setShowSearchModalByCPF(false);

    setAddress({
      street: '',
      zipcode: '',
      number: '',
      neighborhood: '',
      complement: '',
      city: '',
      state: '',
      country: 27,
    });
  };



  const handleDateChange = (text) => {
    const digits = text.replace(/\D/g, '');
    let formatted = '';

    if (digits.length <= 2) {
      formatted = digits;
    } else if (digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else if (digits.length <= 8) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }

    setBirthDate(formatted);
  };

  const continueRegistry = async () => {
    // Validação do tipo documento
    if (documentType === 1) {
      // CPF
      const cleanCpf = guestDocument.replace(/[^\d]/g, '');
      if (!cpfValidation(cleanCpf)) {
        Alert.alert('', 'CPF inválido. Verifique o número digitado.');
        return;
      }
    } else if (documentType === 2) {
      // Passaporte: validação simples - pelo menos 5 caracteres alfanuméricos
      if (!guestDocument || guestDocument.length < 5 || !/^[a-zA-Z0-9]+$/.test(guestDocument)) {
        Alert.alert('', 'Passaporte inválido. Informe um número válido (mínimo 5 caracteres alfanuméricos).');
        return;
      }
    } else {
      Alert.alert('', 'Por favor, selecione o tipo de documento.');
      return;
    }

    if (!guestFirstname || !guestLastname) {
      Alert.alert('', 'Preencha o nome e sobrenome do convidado.');
      return;
    }

    if (!regex.test(guestEmail)) {
      Alert.alert('', 'Digite um e-mail válido.');
      return;
    }

    var userByApi = await getBasicUserByEmail(guestEmail, selectedEventId, userToken);
    if(userByApi?.document && guestDocument != userByApi?.document)
    {
      Alert.alert('', `O email preenchido pertence ao documento ${userByApi?.document}`);
      return;
    }

    if (
      guestPhone.countryCode.length < 1 || guestPhone.countryCode.length > 3 ||
      guestPhone.dialCode.length < 1 || guestPhone.dialCode.length > 4 ||
      guestPhone.nationalNumber.length < 6 || guestPhone.nationalNumber.length > 12
    ) {
      Alert.alert('', 'Preencha um número de telefone válido para o convidado.');
      return;
    }

    if (birthDate.length === 10) {
      const [day, month, year] = birthDate.split('/').map(Number);

      const dateObj = new Date(Date.UTC(year, month - 1, day));
      const isValidDate =
        dateObj.getUTCDate() === day &&
        dateObj.getUTCMonth() + 1 === month &&
        dateObj.getUTCFullYear() === year;

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const isReasonableYear = year >= 1900;
      const isFutureDate = dateObj > today;

      if (!isValidDate || !isReasonableYear || isFutureDate) {
        Alert.alert('', 'Digite uma data de nascimento válida.');
        return;
      }
    } else {
      Alert.alert('', 'Digite uma data de nascimento válida.');
      return;
    }

    if (!gender) {
      Alert.alert('', 'Por favor, selecione um gênero.');
      return;
    }

    if ((address.city && !address.state) || (!address.city && address.state)) {
      if (address.city && !address.state) {
        Alert.alert('', 'Você preencheu a cidade, porém não preencheu o estado');
        return;
      } else if (!address.city && address.state) {
        Alert.alert('', 'Você preencheu o estado, porém não preencheu a cidade');
        return;
      }
    }

    if (!address.city && !address.state) {
      setAddress({
        street: '',
        zipcode: '',
        number: '',
        neighborhood: '',
        complement: '',
        city: '',
        state: '',
        country: '',
      });
    }

    setStep(2);
  };

  const savePhoto = async (picturePath, faceBouding) => {
    if (!picturePath) return;

    setPhotoUri(picturePath)

    setFaceBoudingBox(faceBouding);

    setTakePhoto(false)
    setStep(2)
  };

  const handleSubmit = async () => {
    if (!photoUri) {
      Alert.alert('', 'Por favor, tire uma foto antes de finalizar.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();

    const genderMap = {
      Masculino: 'Male',
      Feminino: 'Female',
      Outro: 'Other'
    };

    formData.append('Gender', genderMap[gender]);
    formData.append('FacePhoto', {
      uri: photoUri,
      type: 'image/jpeg',
      name: 'userImage.jpg',
    });

    formData.append('EventId', selectedEventId);
    formData.append('DocumentType', documentType);
    formData.append('Document', guestDocument);
    formData.append('Email', guestEmail);
    formData.append('Firstname', guestFirstname);
    formData.append('Lastname', guestLastname);
    formData.append('Birthday', birthDate);
    formData.append('Phone.CountryCode', guestPhone.countryCode);
    formData.append('Phone.DialCode', guestPhone.dialCode);
    formData.append('Phone.NationalNumber', guestPhone.nationalNumber);
    formData.append('Phone.InternationalNumber', guestPhone.nationalNumber);
    formData.append('Gender', genderMap[gender]);

    formData.append('FaceBoundingBox', JSON.stringify(faceBoudingBox))

    if (address.city && address.state) {
      formData.append('Address.City', address.city);
      formData.append('Address.State', address.state);
      formData.append('Address.Street', address.street);
      formData.append('Address.Zipcode', address.zipcode);
      formData.append('Address.Number', address.number);
      formData.append('Address.Neighborhood', address.neighborhood);
      formData.append('Address.Complement', address.complement);
      formData.append('Address.CountryId', address.country)
    }



    try {
      await completeUserRegister(formData, userToken);
      setAlertMessage('Cadastro finalizado com sucesso!', "#32cd32");
      setPhotoUri(null);
      setTakePhoto(false);
      setStep(null);
      handleClear();
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data?.message || '';
        console.error('Erro response status:', error.response.status);
        console.error('Erro response data:', error.response.data);
        console.error('Erro response headers:', error.response.headers);

        // Se a mensagem começar com "Rosto não reconhecido"
        if (errorMessage.startsWith('Rosto não reconhecido')) {
          setPhotoUri(null);
        }

        setAlertMessage(errorMessage, '#dc143c');
      } else if (error.request) {
        console.error('Erro request:', error.request);
      } else {
        console.error('Erro message:', error.message);
        setAlertMessage(error.message, '#dc143c');
      }

      console.error('Config do erro:', error.config);
    }
    finally {
      setIsLoading(false);
    }
  };

  const handleUserFound = (user) => {
    if (user.isActive) {
      setAlertMessage('CPF já tem cadastro ativo!', '#dc143c');
      return;
    }

    if (user.tickets && user.tickets.length > 0) {
      if (user.documentType === 1) {
        setDocumentType(1);
      } else if (user.documentType === 2) {
        setDocumentType(2);
      }

      setGuestDocument(user.document);
      setGuestFirstname(user.firstname);
      setGuestLastname(user.lastname);
      setGuestEmail(user.email);

      setStep(1);
      setShowSearchModalByCPF(false);
    } else {
      setAlertMessage('Usuário não possui ingressos para completar o cadastro!', '#dc143c');
    }
  };

  const countryOptions = listCountries.map(({ id, name }) => ({
    key: id,
    value: `${name}`,
    rawValue: id
  }));

  const uniqueCodes = countryCodes.filter((item, index, self) =>
    index === self.findIndex((t) => t.code === item.code)
  );

  const ddiItems = uniqueCodes
    .sort((a, b) => a.country.localeCompare(b.country))
    .map((item) => ({
      key: item.code,
      value: `${item.country} (${item.code})`,
      dialCode: item.code
    }));

  const validEmail = (currentEmail) => {
    const isValid = isValidationEmail(currentEmail);
    setEmailValidation({
      isValid,
      errorMsg: !isValid ? (currentEmail.length ? inputErrorMsgs.email : inputErrorMsgs.global.empty) : '',
    });
    return isValid;
  };

  const handleEmailChange = (text) => {
    setGuestEmail(text);

    if (text.includes('@')) {
      const [localPart, domainPart] = text.split('@');
      if (localPart.length > 0) {
        const filteredDomains = DOMAINS_EMAILS.filter((domain) =>
          domain.startsWith(domainPart.toLowerCase())
        );
        const newSuggestions = filteredDomains.map((domain) => `${localPart}@${domain}`);
        setSuggestionsEmail(newSuggestions.slice(0, 5));
      } else {
        setSuggestionsEmail([]);
      }
    } else {
      setSuggestionsEmail([]);
    }

    // Valida em tempo real
    if (!emailValidation.isValid) {
      validEmail(text);
    }
  };

  const onSuggestionPress = (suggestion) => {
    setGuestEmail(suggestion);
    setSuggestionsEmail([]);
    validEmail(suggestion);
  };

  useFocusEffect(
    React.useCallback(() => {
      // Reset de campos de texto simples
      setGuestDocument('');
      setGuestFirstname('');
      setGuestLastname('');
      setGuestEmail('');
      setBirthDate('');

      // Reset de objetos complexos
      setGuestPhone({
        countryCode: '+55',
        dialCode: '',
        nationalNumber: '',
        internationalNumber: '',
      });

      setAddress({
        street: '',
        zipcode: '',
        number: '',
        neighborhood: '',
        complement: '',
        city: '',
        state: '',
        country: 27, // Mantém o valor padrão (Brasil?)
      });

      // Reset de validações e sugestões
      setEmailValidation({ isValid: true, errorMsg: '' });
      setSuggestionsEmail([]);
      setStateSuggestions([]);

      // Reset de fluxo e UI
      setGender(null);
      setDocumentType(1); // Valor padrão
      setStep(null);
      setTakePhoto(false);
      setIsLoading(false);
      setPhotoUri(null);
      setShowSearchModalByCPF(false);

    }, [])
  );

  

  const phoneMask = (text) => {
    if (text.replace(/\D/g, '').length > 8) {
      return [/\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/]; // 9 dígitos
    } else {
      return [/\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/]; // 8 dígitos
    }
  };

  const maskedPhoneInputProps = useMaskedInputProps({
    value: guestPhone.nationalNumber,
    onChangeText: (text, rawText) => {
      setGuestPhone(prev => ({ ...prev, nationalNumber: rawText }));
    },
    mask: phoneMask,
  });

  return (
    <RegisterStateContext.Provider
      value={{
        cancelPhoto: () => {
          setTakePhoto(false);
        },
        savePhoto,
        isSavingPhoto: isLoading,
      }}>
      <View style={{ ...GStyles.view }} >
        <Header style={{ marginBottom: 0 }} openDrawer={() => navigation.openDrawer()} />
        <View style={{ width: '100%', backgroundColor: THEME.cor.whitesmoke, flex: 1 }}>
          <Text h3 h3Style={{ padding: 8, textAlign: 'center' }}>Completar cadastro</Text>
          <Divider />


          {step == null && (
            // Adicionado justifyContent e alignItems para centralizar o botão
            <View style={[{ alignItems: 'center', width: '100%' }]}>
              <Button
                size="lg"
                titleStyle={{ fontSize: 18 }}
                type="outline"
                containerStyle={{ width: '60%', marginTop: 10 }}
                onPress={() => {
                  setShowSearchModalByCPF(true);
                }}>
                Buscar por CPF

              </Button>

              {showSearchModalByCPF && (
                <SearchUserModal
                  title="Buscar"
                  onUserFound={handleUserFound}
                  placeholderText="Busque pelo CPF"
                  isVisible={showSearchModalByCPF}
                  onClose={() => {
                    setShowSearchModalByCPF(false);
                  }}
                />
              )}
            </View>
          )}

          {step === 1 && (
            <ScrollView contentContainerStyle={{ gap: 16 }}>
              <Input
                label="Tipo de Documento"
                value={documentType === 1 ? 'CPF' : 'Passaporte'}
                editable={false}
              />
              {documentType === 1 ? (
                <Input
                  label="CPF"
                  keyboardType="numeric"
                  {...maskedCPFInputProps}
                  editable={false}
                />
              ) : (
                <Input
                  label="Passaporte"
                  placeholder="Informe o número do passaporte"
                  value={guestDocument}
                  onChangeText={setGuestDocument}
                  editable={false}
                />
              )}

              <Input placeholder="Nome" value={guestFirstname} onChangeText={setGuestFirstname} />
              <Input placeholder="Sobrenome" value={guestLastname} onChangeText={setGuestLastname} />

              <Input
                label="Email"
                value={guestEmail}
                onBlur={() => {
                  validEmail(guestEmail);
                }}
                onChangeText={handleEmailChange}
                errorMessage={!emailValidation.isValid ? emailValidation.errorMsg : ''}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {suggestionsEmail.length > 0 && (
                <View style={styles.listContainer}>
                  {suggestionsEmail.map((item, index) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => onSuggestionPress(item)}
                      style={[
                        styles.listItem,
                        index < suggestionsEmail.length - 1 && styles.bottomDivider,
                      ]}
                    >
                      <Text style={styles.suggestionText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}


              <Input
                label="Data de nascimento"
                placeholder="DD/MM/AAAA"
                keyboardType="numeric"
                value={birthDate}
                onChangeText={handleDateChange}
                maxLength={10}
              />


              <SelectModal
                label="Código do país"
                placeholder="Selecione"
                items={ddiItems}
                value={guestPhone.countryCode}
                setValue={(code) => {
                  setGuestPhone(prev => ({ ...prev, countryCode: code }))
                }}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Input
                  label="DDD"
                  placeholder="11"
                  keyboardType="numeric"
                  containerStyle={{ flex: 1}}
                  value={guestPhone.dialCode}
                  maxLength={3}
                  onChangeText={(text) =>
                    setGuestPhone(prev => ({ ...prev, dialCode: text.replace(/[^\d]/g, '') }))
                  }
                />

                <Input
                  label="Número"
                  {...maskedPhoneInputProps}
                  placeholder="11111-1111"
                  keyboardType="numeric"
                  containerStyle={{ flex: 3, paddingHorizontal: 0 }}
                  
                />

              </View>

              <SelectModal
                label="Gênero"
                placeholder="Gênero"
                items={[
                  { key: 'Masculino', value: 'Masculino' },
                  { key: 'Feminino', value: 'Feminino' },
                  { key: 'Outro', value: 'Outro' },
                ]}
                value={gender}
                setValue={setGender}
              />

              <AddressFormFields
                address={address}
                setAddress={setAddress}
                stateSuggestions={stateSuggestions}
                setStateSuggestions={setStateSuggestions}
              />

              <SelectModal
                label="País"
                placeholder="Selecione um país"
                items={countryOptions}
                value={address.country} // ex: "BRA"
                setValue={(id) => setAddress(prev => ({ ...prev, country: id }))}
              />

              <View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
                <Button title="Continuar cadastro" onPress={continueRegistry} containerStyle={{ width: '90%' }} />
              </View>
            </ScrollView>
          )}

          {step === 2 && (
            <View
              style={{

                marginTop: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Button
                size="lg"
                type="outline"
                containerStyle={{ marginBottom: 20, width: '100%' }}
                onPress={handleClear}
                titleStyle={{ fontSize: 18 }}
              >
                Cancelar
              </Button>


              {!photoUri ? (
                <Button
                  size="lg"
                  containerStyle={{ width: '100%', marginBottom: 20 }}
                  titleStyle={{ fontSize: 18 }}
                  onPress={() => {
                    setTakePhoto(true);
                    setStep(3);
                  }}
                >
                  Tirar foto
                </Button>
              ) : (
                <Button
                  size="lg"
                  containerStyle={{ width: '100%' }}
                  titleStyle={{ fontSize: 18 }}
                  onPress={handleSubmit}
                  loading={isLoading}
                >
                  Finalizar Cadastro
                </Button>
              )}


            </View>
          )}

          {step === 3 && (
            <>


              <TakePictureScreen
                onSave={(path) => {
                  handleSave(path);
                }}

                onCancel={() => {
                  setTakePhoto(false);
                  setStep(2);
                }}

                isLoadingProp={isLoading}
              />

              {/*
          
          <TakePictureModal
            isVisible={takePhoto}
            cancelPhoto={() => { setTakePhoto(false), setStep(2) }}
            savePhoto={handleSave}
            isSavingPhoto={isLoading}
          />
            */}

            </>
          )}




        </View>
      </View>
    </RegisterStateContext.Provider >
  );
};

export default CompleteRegisterDrawerScreen;

const styles = StyleSheet.create({
  listContainer: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderTopWidth: 0, // Remove a borda de cima
    borderRadius: 5,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    backgroundColor: '#fff',
    marginTop: -5,
    marginHorizontal: 1,
    zIndex: 5,
  },
  listItem: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  bottomDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee', // Divisor mais suave
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
});