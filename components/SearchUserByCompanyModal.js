import { useIsFocused } from '@react-navigation/native';
import { Button, Input, Text } from '@rneui/themed';
import { useContext, useEffect, useRef, useState } from 'react';
import { Modal, View } from 'react-native';
import ReactNativeModal from 'react-native-modal';
import { getUserByCpfGeneral } from '../api/UserApi';
import { useAlert } from '../context/AlertContext';
import { AuthContext } from '../context/AuthContext';
import { cpfValidation, isValidEmail } from '../helpers/validation';

const INPUT_VALUE_TYPE = {
  email: 'email',
  cpf: 'cpf',
  passport: 'passport',
};
const SearchUserByCompanyModal = ({
  onUserFound,
  isVisible,
  onClose,
  title = 'Busque o usuário que deseja cadastrar',
  placeholderText = 'Busque por CPF ou passaporte',
  onUserIsActive,
  cpfValueNotFound
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
    if (isVisible) {
      setInputValue('');
    }
  }, [isFocused, isVisible]);

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

      const userResponse = await getUserByCpfGeneral(inputValue, authContext.selectedEventId, authContext.userToken);

      const user = userResponse; // Ajuste conforme a sua API

      const searchedFor = {};
      if (isEmailSearch) searchedFor.email = inputValue;
      else searchedFor.cpf = inputValue;

      onUserFound({ ...user, id: inputValue }, searchedFor);

      if (user?.newToken) {
        authContext.updateTokens({ accessToken: user?.newToken, refreshToken: user?.refreshToken })
      }

    } catch (error) {
      console.error('Erro geral:', error);

      if (error.response) {
        console.error('Erro response:', error.response);
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
          setAlertMessage('Sessão Expirada: A sua sessão expirou. Por favor, faça login novamente.');
          authContext.logout();
          return;
        }

        if (status === 404) {
          Alert.alert('Aviso', 'Usuário não encontrado.');
          cpfValueNotFound(inputValue);
          return;
        }

        // --- 4. TRATAMENTO DO 400 (Erro de Validação) ---
        if (status === 400 || data?.errors) {
          const errors = data.errors;
          const errorMessages = Array.isArray(errors)
            ? errors.join('\n')
            : typeof errors === 'string'
              ? errors
              : JSON.stringify(errors);

          setAlertMessage('Erro de Validação', errorMessages || 'Dados inválidos.');
          return;
        }

        setAlertMessage('Erro', `Erro inesperado do servidor (status ${status}). Tente novamente.`);

      } else if (error.request) {
        // --- 5. TRATAMENTO DE ERRO DE REDE ---
        // A requisição foi feita mas não houve resposta
        console.error('Erro de rede:', error.message);
        setAlertMessage('Erro de Conexão', 'Verifique a sua internet e tente novamente.');

      } else {
        // Erro na configuração da requisição
        console.error('Erro de configuração:', error.message);
        setAlertMessage('Erro', 'Ocorreu um erro interno na aplicação.');
      }

    } finally {
      setLoading(false);
    }
  };
  return (
    <ReactNativeModal
      isVisible={isVisible}
      backdropOpacity={0.1}
      style={{ alignItems: 'center' }}
      onBackdropPress={onClose}>
      <View
        style={{
          backgroundColor: 'white',
          borderRadius: 10,
          padding: 20,
          height: 'auto',
          width: `95%`,
        }}>
        <Text h4 h4Style={{ marginBottom: 10 }}>
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
            containerStyle={{ marginLeft: 16 }}
            title="Buscar"
            onPress={handleSearch}
            on
          />
        </View>
      </View>
    </ReactNativeModal>
  );
};

export default SearchUserByCompanyModal;
