import { Alert, ScrollView, View } from 'react-native';
import React, { useState, useContext } from 'react';
import GStyles from '../style/global';
import Header from '../components/Header';
import THEME from '../style/theme';
import { Text, Divider, Input } from '@rneui/themed';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import Button from '../components/Button';
import { completeUserRegister } from '../api/UserApi';
import { useMaskedInputProps } from 'react-native-mask-input';
import SelectModal from '../components/SelectModal';
import TakePictureModal from '../components/TakePictureModal';
import { cpfValidation } from '../helpers/validation';
import SearchUserModal from '../components/SearchUserModal';
import AddressForm from './ManualRegisterScreen/AdressForm';
import AddressFormFields from '../components/forms/AddressFormFields';
import { listCountries } from '../helpers/listCountries';


const CompleteRegisterDrawerScreen = ({ navigation }) => {
  const { userToken, selectedEventId } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const [guestDocument, setGuestDocument] = useState('');
  const [guestFirstname, setGuestFirstname] = useState('');
  const [guestLastname, setGuestLastname] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState({
    countryCode: '',
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
    country: 'BRA',
  });

  const [stateSuggestions, setStateSuggestions] = useState([]);


  // Máscara apenas para CPF
  const maskedCPFInputProps = useMaskedInputProps({
    value: guestDocument,
    onChangeText: setGuestDocument,
    mask: [/\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/],
  });

  const regex = /^[\w.-]+@[\w.-]+\.\w+$/;

  const handleClear = () => {
    setGuestDocument('');
    setGuestFirstname('');
    setGuestLastname('');
    setGuestEmail('');
    setGuestPhone({
      countryCode: '',
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
      country: 'BRA',
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

  const continueRegistry = () => {
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

  const handleSave = (photoData) => {
    setPhotoUri(photoData);
    setTakePhoto(false);
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


    if (address.city && address.state) {
      formData.append('Address.City', address.city);
      formData.append('Address.State', address.state);
      formData.append('Address.Street', address.street);
      formData.append('Address.Zipcode', address.zipcode);
      formData.append('Address.Number', address.number);
      formData.append('Address.Neighborhood', address.neighborhood);
      formData.append('Address.Complement', address.complement);
      formData.append('Address.Country', address.country)
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
        // O request foi feito e o servidor respondeu com status fora do 2xx
        console.log('Erro response status:', error.response.status);
        console.log('Erro response data:', error.response.data);
        console.log('Erro response headers:', error.response.headers);
      } else if (error.request) {
        // O request foi feito mas nenhuma resposta foi recebida
        console.log('Erro request:', error.request);
      } else {
        // Algo aconteceu na configuração do request
        console.log('Erro message:', error.message);
      }
      console.log('Config do erro:', error.config);
      Alert.alert('Erro', (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserFound = (user) => {
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

  const countryOptions = listCountries.map(({ code, name }) => ({
    key: code,
    value: `${code} - ${name}`,
    rawValue: code
  }));


  console.log(address)
  return (
    <View style={{ ...GStyles.view }}>
      <Header style={{ marginBottom: 0 }} openDrawer={() => navigation.openDrawer()} />
      <View style={{ width: '100%', backgroundColor: THEME.cor.whitesmoke, flex: 1 }}>
        <Text h3 h3Style={{ padding: 8, textAlign: 'center' }}>Completar cadastro</Text>
        <Divider />


        {step == null && (
          <View style={[GStyles.container]}>
            <Button
              size="lg"
              containerStyle={{ width: '100%', marginTop: 30 }}
              titleStyle={{ fontSize: 18 }}
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
          <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 16 }}>
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
            <Input placeholder="Email" value={guestEmail} onChangeText={setGuestEmail} />
            <Input
              label="Data de nascimento"
              placeholder="DD/MM/AAAA"
              keyboardType="numeric"
              value={birthDate}
              onChangeText={handleDateChange}
              maxLength={10}
            />

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Input
                label="Código do País"
                placeholder="Ex: 55"
                keyboardType="numeric"
                containerStyle={{ flex: 1 }}
                value={guestPhone.countryCode}
                onChangeText={(text) =>
                  setGuestPhone(prev => ({ ...prev, countryCode: text.replace(/[^\d]/g, '') }))
                }
              />
              <Input
                label="DDD"
                placeholder="Ex: 11"
                keyboardType="numeric"
                containerStyle={{ flex: 1 }}
                value={guestPhone.dialCode}
                onChangeText={(text) =>
                  setGuestPhone(prev => ({ ...prev, dialCode: text.replace(/[^\d]/g, '') }))
                }
              />
            </View>

            <Input
              label="Número"
              placeholder="Ex: 912345678"
              keyboardType="numeric"
              value={guestPhone.nationalNumber}
              onChangeText={(text) =>
                setGuestPhone(prev => ({ ...prev, nationalNumber: text.replace(/[^\d]/g, '') }))
              }
            />

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
              items={countryOptions}  // [{key, value, label}]
              value={address.country} // ex: "BRA"
              setValue={(code) => setAddress(prev => ({ ...prev, country: code }))}
            />

            <View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
              <Button title="Continuar cadastro" onPress={continueRegistry} containerStyle={{ width: '90%' }} />
            </View>
          </ScrollView>
        )}

        {step === 2 && (
          <View
            style={{
              padding: 8,
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

            <Button
              size="lg"
              containerStyle={{ width: '100%' }}
              titleStyle={{ fontSize: 18 }}
              onPress={handleSubmit}
              loading={isLoading}
            >
              Finalizar Cadastro
            </Button>

          </View>
        )}

        {step === 3 && (
          <TakePictureModal
            isVisible={takePhoto}
            cancelPhoto={() => { setTakePhoto(false), setStep(2) }}
            savePhoto={handleSave}
            isSavingPhoto={isLoading}
          />
        )}
      </View>
    </View>
  );
};

export default CompleteRegisterDrawerScreen;
