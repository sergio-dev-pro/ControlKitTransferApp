import { useIsFocused } from '@react-navigation/native';
import { Button, Input, Text } from '@rneui/themed';
import { useContext, useEffect, useRef, useState } from 'react';
import { Modal, View } from 'react-native';
import ReactNativeModal from 'react-native-modal';
import { getUserByCpf, getUserByCpfWithAuth, getUserByEmail } from '../api/UserApi';
import { useAlert } from '../context/AlertContext';
import { AuthContext } from '../context/AuthContext';
import { cpfValidation, isValidEmail } from '../helpers/validation';

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
  fromBlaceletRegistration = false,
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

  const validateStrictCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let soma = 0;
    let resto;
    for (let i = 1; i <= 9; i++)
      soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++)
      soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    return true;
  };

  const validateInputValue = () => {
    if (!inputValue)
      return invalidInputValue ? setInvalidInputValue(null) : null;

    if (isValidEmail(inputValue)) {
      invalidInputValue && setInvalidInputValue(null);
      return INPUT_VALUE_TYPE.email;
    }

    // Verifica se contém letras
    const hasLetters = /[a-zA-Z]/.test(inputValue);

    if (hasLetters) {
      // Se tem letras, assumimos que é um documento estrangeiro/passaporte
      if (inputValue.length >= 4) {
        invalidInputValue && setInvalidInputValue(null);
        return INPUT_VALUE_TYPE.passport;
      }
    } else {
      // Se NÃO tem letras, assumimos que é CPF (ou tentativa de CPF)
      // Removemos caracteres não numéricos para validar
      const cleanedValue = inputValue.replace(/\D/g, '');

      if (validateStrictCPF(cleanedValue)) {
        invalidInputValue && setInvalidInputValue(null);
        return INPUT_VALUE_TYPE.cpf;
      } else {
        // Se for apenas números e falhar na validação do CPF, é inválido.
        // Isso impede que "000000000000" passe como passaporte.
        setInvalidInputValue('CPF inválido.');
        return null;
      }
    }

    setInvalidInputValue('E-mail ou documento inválido.');
    return null;
  };

  const handleSearch = async () => {
    const validatedInputValueType = validateInputValue();
    if (!validatedInputValueType) return;

    try {
      setLoading(true);
      const isEmailSearch = validatedInputValueType === INPUT_VALUE_TYPE.email;

      const userResponse = isEmailSearch
        ? await getUserByEmail(inputValue, authContext.selectedEventId, authContext.userToken)
        : await getUserByCpfWithAuth(inputValue, authContext.selectedEventId, authContext.userToken, fromKitDelivery, fromBlaceletRegistration);

      // Nota: Assumindo que a sua API retorna o objeto user diretamente ou dentro de .data
      // Se as suas funções 'getUser...' já retornam response.data, então 'user' já é os dados.
      // Se retornam o objeto axios completo, então use 'userResponse.data'.
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

export default SearchUserModal;
