import { StyleSheet, View } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import Button from '../components/Button';
import { Text, Input, Icon } from '@rneui/themed';
import { isValidEmail } from '../helpers/validation';
import AuthHeader from '../components/AuthHeader';
import GStyles from '../style/global';
import { AuthContext } from '../context/AuthContext';
import { validEmailFirstAccess } from '../api/UserApi';

const inputErrorMsgs = {
  email: 'email inválido.',
  password: {
    minimumQuantity: 'Deve ter mínimo 8 caracteres.',
    spaceNotAllowed: 'Não deve haver espaço em branco.',
  },
  global: {
    empty: 'campo obrigatório.',
  },
};

const LoginScreen = ({ navigation }) => {
  const emailInput = useRef(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [emailSended, setEmailSended] = useState(false);

  const [emailValidation, setEmailValidation] = useState({
    isValid: true,
    errorMsg: '',
  });
  const [passwordValidation, setPasswordValidation] = useState({
    isValid: true,
    errorMsg: '',
  });
  const [codeValidation, setCodeValidation] = useState({
    isValid: true,
    errorMsg: '',
  });

  const [isFirstStepLoading, setIsFirstStepLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const auth = React.useContext(AuthContext);

  useEffect(() => {
    if (emailInput.current && emailInput.current.focus) {
      emailInput.current.focus();
    }
  }, []);

  const validEmail = currentEmail => {
    const isValid = isValidEmail(currentEmail);
    if (!isValid) {
      const errorMsg = currentEmail.length ? inputErrorMsgs.email : inputErrorMsgs.global.empty;
      setEmailValidation({ errorMsg, isValid: false });
    } else {
      if (!emailValidation.isValid) setEmailValidation({ isValid: true, errorMsg: '' });
    }
  };

  const validPassword = valueToValidate => {
    let errorMsg = valueToValidate.length ? null : inputErrorMsgs.global.empty;
    if (!errorMsg && valueToValidate.length < 6) errorMsg = inputErrorMsgs.password.minimumQuantity;
    if (!errorMsg && /\s/g.test(valueToValidate)) errorMsg = inputErrorMsgs.password.spaceNotAllowed;

    const isValid = !errorMsg;
    if (!isValid) {
      setPasswordValidation({ errorMsg, isValid: false });
      return false;
    }
    if (!passwordValidation.isValid) setPasswordValidation({ isValid: true, errorMsg: '' });
    return true;
  };

  const handleEmailChange = emailChanged => {
    if (!emailValidation.isValid) validEmail(emailChanged);
    setEmail(emailChanged);
  };

  const handlePasswordChange = passwordChanged => {
    if (!passwordValidation.isValid) validPassword(passwordChanged);
    setPassword(passwordChanged);
  };

  const handleCodeChange = codeChanged => {
    // se tiver validação de código, chame aqui; evitei usar função não-definida
    setCode(codeChanged);
  };

  const isLoginButtonDisabled =
    !emailValidation.isValid ||
    !passwordValidation.isValid ||
    !email.length ||
    !password.length ||
    !code.length;

  const autenticationEmail = async () => {
    setIsFirstStepLoading(true);
    try {
      const response = await validEmailFirstAccess({ email });
      const { sended } = response.data;
      if (sended) {
        setEmailSended(true);
        console.log('O e-mail de primeiro acesso foi enviado!');
      } else {
        console.warn('O servidor informou que o e-mail não foi enviado.');
      }
    } catch (error) {
      console.error('Erro ao chamar a API de primeiro acesso:', error);
    } finally {
      setIsFirstStepLoading(false);
    }
  };

  console.log(code)

  return (
    <View style={GStyles.view}>
      <AuthHeader />
      <View style={GStyles.container}>
        <View style={styles.formContainer}>
          <Text h4 style={styles.formTitle}>Entrar</Text>

          {!emailSended ? (
            <>
              <Input
                onBlur={() => validEmail(email)}
                ref={emailInput}
                keyboardType="email-address"
                onChangeText={handleEmailChange}
                placeholder="Digite seu email"
                errorMessage={!emailValidation.isValid ? emailValidation.errorMsg : ''}
                value={email}
              />
              <Button
                size="lg"
                title="AVANÇAR"
                loading={isFirstStepLoading}
                disabled={isFirstStepLoading}
                onPress={autenticationEmail}
                containerStyle={{ width: '100%', paddingHorizontal: 10 }}
              />
            </>
          ) : (
            <>
              {/* key força remount quando isPasswordVisible muda — workaround Android */}
              <Input
                key={`pwd-${isPasswordVisible}`}
                label="Senha"
                placeholder="Digite sua senha"
                value={password}
                onChangeText={handlePasswordChange}
                onBlur={() => validPassword(password)}
                secureTextEntry={!isPasswordVisible}              // ✅ prop direta
                rightIcon={
                  <Icon
                    name={isPasswordVisible ? 'eye-off' : 'eye'}
                    type="ionicon"
                    onPress={() => setIsPasswordVisible(v => !v)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  />
                }
                errorMessage={!passwordValidation.isValid ? passwordValidation.errorMsg : ''}
              />

              <Input
                label="Código"
                placeholder="Digite o token recebido no email"
                onChangeText={handleCodeChange}
                errorMessage={!codeValidation.isValid ? codeValidation.errorMsg : ''}
                value={code}
              />

              <Button
                size="lg"
                title="ENTRAR"
                disabled={isLoginButtonDisabled}
                loading={auth.isAuthenticating}
                onPress={() => auth.authenticateUser({ email, password, code })}
                containerStyle={{ width: '100%', paddingHorizontal: 10 }}
              />
            </>
          )}
        </View>
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  headerContainer: { width: '100%', alignItems: 'center', padding: 10 },
  formContainer: { width: '100%', maxWidth: 450 },
  formTitle: { marginBottom: 4 },
});
