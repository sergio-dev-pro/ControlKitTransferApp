import { View } from 'react-native';
import React, { useState, useContext } from 'react';
import GStyles from '../style/global';
import Header from '../components/Header';
import Loading from '../components/Loading';
import { ScrollView } from 'react-native-gesture-handler';
import THEME from '../style/theme';
import { Button, Input, Text, Divider } from '@rneui/themed';
import { cpfValidation, isValidEmail } from '../helpers/validation';
import { getUserByCpfWithAuth, updateEmail } from '../api/UserApi';
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
    const isValid = validCPF(inputValue);
    if (!isValid) return;
    try {
      setLoading(true);
      const data  = await getUserByCpfWithAuth(
        inputValue,
        authContext.selectedEventId,
        authContext.userToken,
      );
      if(data.newToken)
      {
          authContext.updateTokens({accessToken: updatedUser.newToken, refreshToken: updatedUser.refreshToken})
      }
      setUserEmailFound(data.email);
      setUserEmailFoundUpdated(data.email);
      setToken(data.token);
    } catch (error) {
      console.error(error);
      console.error(error.response.data.errors);
      if (error?.request?.status == 404) {
        alert('Usuário não encontrado.');
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
          document: inputValue.replace(/\D/g, ''), 
          email: userEmailFoundUpdated,
          eventId: authContext.selectedEventId  // ADICIONADO
        },
        authContext.userToken
      );

      clearStates();
      alert('E-mail alterado com sucesso', '#32cd32');
    } catch (error) {
      console.error("Erro na requisição:", error);
      console.error("Código de status:", error?.response?.status);
      console.error("Detalhes do erro:", error?.response?.data); // ADICIONADO
      alert("Erro ao atualizar e-mail: " + JSON.stringify(error?.response?.data));
    }
    finally {
      setLoading(false);
    }
  };

  const validCPF = currentCPF => {
    const isValid = cpfValidation(currentCPF);
    const invalidCPF = () => {
      const errorMsg = currentCPF.length
        ? inputErrorMsgs.cpf
        : inputErrorMsgs.global.empty;
      setCPFValidation({ errorMsg, isValid: false });
    };
    if (!isValid) {
      invalidCPF();
      return false;
    }
    const valid = () => setCPFValidation({ isValid: true });
    !CPFValidation.isValid && valid();
    return true;
  };

  const maskedCPFInputProps = useMaskedInputProps({
    value: inputValue,
    onChangeText: cpfChanged => {
      setInputValue(cpfChanged);
      !CPFValidation.isValid && validCPF(cpfChanged);
    },
    mask: [
      /\d/,
      /\d/,
      /\d/,
      '.',
      /\d/,
      /\d/,
      /\d/,
      '.',
      /\d/,
      /\d/,
      /\d/,
      '-',
      /\d/,
      /\d/,
    ],
  });

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
              // value={inputValue}
              label="Busque pelo CPF"
              {...maskedCPFInputProps}
              // onChangeText={value =>
              //   setInputValue(value.trim().replace(/\s/g, ''))
              // }
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
