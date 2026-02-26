import { Alert, View } from 'react-native';
import React, { useState, useContext } from 'react';
import GStyles from '../style/global';
import Header from '../components/Header';
import Loading from '../components/Loading';
import { ScrollView } from 'react-native-gesture-handler';
import THEME from '../style/theme';
import { Button, Input, Text, Divider } from '@rneui/themed';
import { cpfValidation, isValidEmail } from '../helpers/validation';
import { getUserByCpfGeneral, updateEmail } from '../api/UserApi';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useMaskedInputProps } from 'react-native-mask-input';
import jwt_decode from 'jwt-decode';

const INPUT_VALUE_TYPE = {
  email: 'email',
  cpf: 'cpf',
  passport: 'passport',
};

const inputErrorMsgs = {
  cpf: 'CPF inválido.',
  global: {
    empty: 'campo obrigatório.',
  },
};

const ChangeEmail = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const authContext = useContext(AuthContext);
  const [inputValue, setInputValue] = useState('');
  const [invalidInputValue, setInvalidInputValue] = useState();
  const [invalidUserEmailFoundInputValue, setInvalidUserEmailFoundInputValue] =
    useState();
  const [userEmailFound, setUserEmailFound] = useState();
  const [userEmailFoundUpdated, setUserEmailFoundUpdated] = useState();
  const [token, setToken] = useState();

  const setAlertMessage = useAlert();
  const [CPFValidation, setCPFValidation] = useState({
    isValid: true,
    errorMsg: '',
  });

  const handleSearch = async () => {
    const isValid = validateDocument(inputValue);
    if (!isValid) return;
    try {

      setLoading(true);
      const data = await getUserByCpfGeneral(
        inputValue,
        authContext.selectedEventId,
        authContext.userToken,
      );

      console.log('data: ', data)
      if (!data) {
        setAlertMessage('Usuário não encontrado.');
      }

      if (data.newToken) {
        authContext.updateTokens({ accessToken: updatedUser.newToken, refreshToken: updatedUser.refreshToken })
      }
      setUserEmailFound(data.email);
      setUserEmailFoundUpdated(data.email);
      setToken(data.token);
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

  const saveEmailChange = async () => {
    const clearStates = () => {
      setUserEmailFound(null);
      setUserEmailFoundUpdated(null);
      invalidUserEmailFoundInputValue &&
        setInvalidUserEmailFoundInputValue(null);
      setInputValue('');
    };

    if (userEmailFound === userEmailFoundUpdated) {
      clearStates();
      return;
    }

    const isValid = isValidEmail(userEmailFoundUpdated);
    if (!isValid) return setInvalidUserEmailFoundInputValue('e-mail inválido');
    setLoading(true);
    try {
      const res = await updateEmail(
        {
          document: inputValue.replace(/[^a-zA-Z0-9]/g, ''),
          email: userEmailFoundUpdated,
          eventId: authContext.selectedEventId
        },
        authContext.userToken
      );

      if (res) {
        clearStates();
        alert('E-mail alterado com sucesso', '#32cd32');
      }


    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        console.log('Status:', status);
        console.log('Data:', data);

        if (status === 400 || status === 409 || data?.message) {
          const apiMessage = data?.message || JSON.stringify(data);
          setAlertMessage(`${apiMessage}`, '#dc143c');
        } else {
          setAlertMessage("Erro ao atualizar e-mail. Tente novamente.", '#dc143c');
        }
      }
    }
    finally {
      setLoading(false);
    }
  };

  const validateDocument = currentDoc => {
    const isDocCPF = cpfValidation(currentDoc);
    const isDocPassport = currentDoc.length >= 4;
    const isValid = isDocCPF || isDocPassport;

    const invalidDoc = () => {
      const errorMsg = currentDoc.length
        ? 'Documento inválido.'
        : inputErrorMsgs.global.empty;
      setCPFValidation({ errorMsg, isValid: false });
    };
    if (!isValid) {
      invalidDoc();
      return false;
    }
    const valid = () => setCPFValidation({ isValid: true, errorMsg: '' });
    !CPFValidation.isValid && valid();
    return true;
  };

  return (
    <View style={{ ...GStyles.view }}>
      <Header
        style={{ marginBottom: 0 }}
        openDrawer={() => navigation.openDrawer()}
      />
      <View style={{ width: '100%', backgroundColor: THEME.cor.whitesmoke }}>
        <Text h3 h3Style={{ padding: 8, textAlign: 'center' }}>
          Alterar e-mail
        </Text>
        <Divider />
      </View>
      <ScrollView style={[GStyles.container, { height: '100%' }]}>
        {userEmailFound ? (
          <>
            <Text
              h4
              h3Style={{ padding: 8, textAlign: 'center' }}
              style={{ marginBottom: 16 }}>
              Encontrado
            </Text>
            <Input
              style={{ marginBottom: 9 }}
              label="Atualize o e-mail"
              value={userEmailFoundUpdated}
              onChangeText={value =>
                setUserEmailFoundUpdated(value.trim().replace(/\s/g, ''))
              }
              errorMessage={invalidUserEmailFoundInputValue}
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                padding: 8,
                marginTop: 10,
              }}>
              <Button
                type="clear"
                containerStyle={{ marginRight: 20 }}
                size="lg"
                title="Cancelar"
                onPress={() => {
                  setUserEmailFound(null);
                  setInputValue(null);
                }}
              />
              <Button
                type="solid"
                size="lg"
                title="Salvar"
                onPress={saveEmailChange}
              />
            </View>
          </>
        ) : (
          <>
            <Input
              value={inputValue}
              label="Busque por CPF ou Passaporte"
              onChangeText={value => {
                const newValue = value.trim().replace(/\s/g, '');
                setInputValue(newValue);
                !CPFValidation.isValid && validateDocument(newValue);
              }}
              errorMessage={
                !CPFValidation.isValid ? CPFValidation.errorMsg : ''
              }
            />
            <Button
              type="solid"
              size="lg"
              title="Buscar"
              onPress={handleSearch}
            />
          </>
        )}
      </ScrollView>
      <Loading isActive={loading} />
    </View>
  );
};

export default ChangeEmail;
