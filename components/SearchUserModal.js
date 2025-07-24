import {useIsFocused} from '@react-navigation/native';
import {Button, Input, Text} from '@rneui/themed';
import {useContext, useEffect, useRef, useState} from 'react';
import {Modal, View} from 'react-native';
import ReactNativeModal from 'react-native-modal';
import {getUserByCpf, getUserByCpfWithAuth, getUserByEmail} from '../api/UserApi';
import {useAlert} from '../context/AlertContext';
import {AuthContext} from '../context/AuthContext';
import {cpfValidation, isValidEmail} from '../helpers/validation';

const INPUT_VALUE_TYPE = {
  email: 'email',
  cpf: 'cpf',
  passport: 'passport',
};
const SearchUserModal = ({
  onUserFound,
  isVisible,
  onClose,
  title = 'Busque o usuário que deseja cadastrar',
  placeholderText = 'Busque por e-mail ou CPF ou passaporte',
  onUserIsActive,
  fromKitDelivery = false,
  fromBlaceletRegistration = false
}) => {
  const [loading, setLoading] = useState(false);
  // TODO: Setado temporariamente
  // 'sergio@spr.com'
  const [inputValue, setInputValue] = useState();
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
    const isValidPassport = inputValue.length >= 4;

    const isInputValueValid = isValid || isValidCPF || isValidPassport;
    if (!isInputValueValid) {
      return !invalidInputValue
        ? setInvalidInputValue('E-mail ou documento inválido.')
        : null;
    }

    invalidInputValue && setInvalidInputValue(null);

    if (isValid) return INPUT_VALUE_TYPE.email;
    if (isValidCPF) return INPUT_VALUE_TYPE.cpf;
    if (isValidPassport) return INPUT_VALUE_TYPE.passport;
  };

  const handleSearch = async () => {
    const validatedInputValueType = validateInputValue();
    if (!validatedInputValueType) return;
    try {
      setLoading(true);
      const isEmailSearch = validatedInputValueType === INPUT_VALUE_TYPE.email;
      const {data: user} = isEmailSearch
        ? await getUserByEmail(inputValue, authContext.selectedEventId)
        : await getUserByCpfWithAuth(inputValue, authContext.selectedEventId, authContext.userToken, fromKitDelivery, fromBlaceletRegistration);
      const searchedFor = {};
      if (isEmailSearch) searchedFor.email = inputValue;
      else searchedFor.cpf = inputValue;
      onUserFound({...user, id: inputValue}, searchedFor);
    } catch (error) {
      console.log('@@@ error.response.data', error.response.data)
      console.error(error);
      console.error(error.response.data.errors);
      if (error?.request?.status == 404) {
        alert('Usuário não econtrado.');
        return;
      }
      if (error?.response?.data?.errors) {
        console.error(error.response.data.errors);
        alert(error.response.data.errors);
        return;
      }
      alert('Erro ao procurar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ReactNativeModal
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
          width: `95%`,
        }}>
        <Text h4 h4Style={{marginBottom: 10}}>
          {title}
        </Text>
        <Input
          ref={ref}
          value={inputValue}
          placeholder={placeholderText}
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
    </ReactNativeModal>
  );
};

export default SearchUserModal;
