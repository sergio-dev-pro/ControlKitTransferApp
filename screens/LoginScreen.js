import { StyleSheet, View } from 'react-native';
import React, { useEffect, useState, useContext, createRef } from 'react'; // Adicionado useContext e createRef
import Button from '../components/Button';
import { Text, Input } from '@rneui/themed';
import AuthHeader from '../components/AuthHeader';
import GStyles from '../style/global';
import { AuthContext } from '../context/AuthContext';
import BASE_URL_V2 from '../constants/api2';

const inputErrorMsgs = {
  global: {
    empty: 'campo obrigatório.',
  },
  cpf: 'CPF inválido.',
  code: 'Código inválido.',
};

const LoginScreen = ({ navigation }) => {
  const emailInput = createRef();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  const [emailValidation, setEmailValidation] = useState({ isValid: true, errorMsg: '' });
  const [passwordValidation, setPasswordValidation] = useState({ isValid: true, errorMsg: '' });
  const [codeValidation, setCodeValidation] = useState({ isValid: true, errorMsg: '' });

  const [showValidationStep, setShowValidationStep] = useState(false); // Renomeado para clareza

  const auth = useContext(AuthContext);

  useEffect(() => {
    emailInput.current?.focus(); // Adiciona '?' para segurança
  }, []);

  // Adapte esta função para validar CPF se necessário
  const validCPF = currentCPF => {
    const isValid = currentCPF.length >= 11;
    setEmailValidation({
      isValid,
      errorMsg: !isValid ? (currentCPF.length ? inputErrorMsgs.cpf : inputErrorMsgs.global.empty) : ''
    });
    return isValid;
  };

  const validPassword = valueToValidate => {
    // ... sua função validPassword (está boa)
    let errorMsg = valueToValidate.length ? null : inputErrorMsgs.global.empty;
    if (!errorMsg && valueToValidate.length < 6)
      errorMsg = 'Deve ter mínimo 6 caracteres.'; // Ajuste se necessário
    if (!errorMsg && /\s/g.test(valueToValidate))
      errorMsg = 'Não deve haver espaço em branco.';

    const isValid = !errorMsg;
    setPasswordValidation({ errorMsg: isValid ? '' : errorMsg, isValid });
    return isValid;
  };

  // NOVO: Função para validar o código/token
  const validCode = currentCode => {
    const isValid = currentCode.length > 0; // Exemplo: só verifica se não está vazio
    setCodeValidation({
      isValid,
      errorMsg: !isValid ? inputErrorMsgs.global.empty : ''
    });
    return isValid;
  };


  const handleEmailChange = emailChanged => {
    const cleanedCPF = emailChanged.replace(/[^\d]/g, '');
    if (!emailValidation.isValid) validCPF(cleanedCPF);
    setEmail(cleanedCPF);
  };

  const handlePasswordChange = passwordChanged => {
    if (!passwordValidation.isValid) validPassword(passwordChanged);
    setPassword(passwordChanged);
  };

  const handleCodeChange = codeChanged => {
    if (!codeValidation.isValid) validCode(codeChanged);
    setCode(codeChanged);
  };

  const isLoginButtonDisabled = !emailValidation.isValid || !passwordValidation.isValid || !email.length || !password.length;
  const isValidateButtonDisabled = !codeValidation.isValid || !code.length;


  const handleInitialLogin = async () => {
    const isCPFValid = validCPF(email);
    const isPasswordValid = validPassword(password);
    if (!isCPFValid || !isPasswordValid) return;

    const success = await auth.authenticateUser({ document: email, password });

    if (success) {
      setShowValidationStep(true);
      setCode('');
      setCodeValidation({ isValid: true, errorMsg: '' });
    } else {
      setPassword('');
    }
  };

  const handleCodeValidation = async () => {
    if (!validCode(code)) return;

    await auth.confirmLogin(code.toUpperCase(), email);
  };

  return (
    <View style={GStyles.view}>
      <AuthHeader />
      <>
        {/* Passo 1: Formulário de CPF e Senha */}
        {!showValidationStep ? (
          <View style={GStyles.container}>
            {BASE_URL_V2.includes('-dev') && (
              <View style={{ width: '100%', height: '20%', backgroundColor: '#FFEE8C', padding: 10, alignItems: 'center', justifyContent: 'center', alignItems: 'center' }}>
                <Text h4 style={{ color: "#000", textAlign: 'center' }}>AMBIENTE DE DESENVOLVIMENTO</Text>
              </View>)}
            <View style={styles.formContainer}>
              <Text h4 style={styles.formTitle}>Entrar</Text>
              <Input
                ref={emailInput}
                label="CPF"
                keyboardType="numeric"
                onChangeText={handleEmailChange}
                onBlur={() => validCPF(email)}
                value={email}
                placeholder="Digite seu CPF"
                errorMessage={!emailValidation.isValid ? emailValidation.errorMsg : ''}
              />
              <Input
                label="Senha"
                placeholder="Digite sua senha"
                onChangeText={handlePasswordChange}
                onBlur={() => validPassword(password)}
                value={password}
                secureTextEntry={true}
                errorMessage={!passwordValidation.isValid ? passwordValidation.errorMsg : ''}
              />
              <Button
                size="lg"
                title="ENTRAR"
                disabled={isLoginButtonDisabled}
                loading={auth.isAuthenticating}
                onPress={handleInitialLogin}
                containerStyle={{ width: '100%', paddingHorizontal: 10 }}
              />
            </View>
          </View>
        ) : (
          /* Passo 2: Formulário de Validação de Código */
          <View style={GStyles.container}>
            <View style={styles.formContainer}>
              <Text h4 style={styles.formTitle}>Validação</Text>
              <Input
                label="Código de Validação"
                onChangeText={handleCodeChange}
                onBlur={() => validCode(code)}
                value={code}
                placeholder="Digite o código recebido"
                errorMessage={!codeValidation.isValid ? codeValidation.errorMsg : ''}
              />
              <Button
                size="lg"
                title="VALIDAR"
                disabled={isValidateButtonDisabled}
                loading={auth.isAuthenticating}
                onPress={handleCodeValidation}
                containerStyle={{ width: '100%', paddingHorizontal: 10 }}
              />
              <Button
                type="outline"
                size="lg"
                title="VOLTAR"
                onPress={() => setShowValidationStep(false)}
                containerStyle={{ width: '100%', paddingHorizontal: 10, marginTop: 10, }}
              />
            </View>
          </View>
        )}
      </>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  headerContainer: { width: '100%', alignItems: 'center', padding: 10 },
  formContainer: { width: '100%', maxWidth: 450 },
  formTitle: { marginBottom: 4 },
});
