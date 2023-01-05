import {CheckBox, Input, Text} from '@rneui/themed';
import {useState} from 'react';
import {View} from 'react-native';
import {useMaskedInputProps} from 'react-native-mask-input';
import Button from '../../components/Button';
import {formatDate} from '../../helpers/format';
import {cpfValidation, isValidEmail} from '../../helpers/validation';

const inputErrorMsgs = {
  email: 'e-mail inválido.',
  cpf: 'CPF inválido.',
  global: {
    empty: 'campo obrigatório.',
  },
};

const UserForm = ({onUserFormCompleted, availableDays}) => {
  const [user, setUser] = useState({
    name: '',
    cpf: '',
    email: '',
  });
  const [emailValidation, setEmailValidation] = useState({
    isValid: true,
    errorMsg: '',
  });
  const [CPFValidation, setCPFValidation] = useState({
    isValid: true,
    errorMsg: '',
  });
  const [nameValidation, setNameValidation] = useState({
    isValid: true,
    errorMsg: '',
  });
  const [eventDays, setEventDays] = useState(availableDays);

  const {name, cpf, email} = user;

  const maskedCPFInputProps = useMaskedInputProps({
    value: cpf,
    onChangeText: cpfChanged => {
      setUser(prevState => ({...prevState, cpf: cpfChanged}));
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

  const validEmail = currentEmail => {
    const isValid = isValidEmail(currentEmail);
    const invalidEmail = () => {
      const errorMsg = currentEmail.length
        ? inputErrorMsgs.email
        : inputErrorMsgs.global.empty;
      setEmailValidation({errorMsg, isValid: false});
    };
    if (!isValid) {
      invalidEmail();
      return false;
    }
    const valid = () => setEmailValidation({isValid: true});
    !emailValidation.isValid && valid();
    return true;
  };
  const validCPF = currentCPF => {
    const isValid = cpfValidation(currentCPF);
    const invalidCPF = () => {
      const errorMsg = currentCPF.length
        ? inputErrorMsgs.cpf
        : inputErrorMsgs.global.empty;
      setCPFValidation({errorMsg, isValid: false});
    };
    if (!isValid) {
      invalidCPF();
      return false;
    }
    const valid = () => setCPFValidation({isValid: true});
    !CPFValidation.isValid && valid();
    return true;
  };
  const validName = name => {
    const isName = name.length >= 3;
    !isName
      ? setNameValidation({
          isValid: false,
          errorMsg: 'Nome deve ter no mínimo 3 caracteres.',
        })
      : setNameValidation({isValid: true});

    return isName;
  };

  const handleEmailChange = emailChanged => {
    !emailValidation.isValid && validEmail(emailChanged);
    setUser(prevState => ({...prevState, email: emailChanged}));
  };

  const handleComplete = () => {
    if (!validCPF(cpf) || !validEmail(email) || !validName(name)) return;
    onUserFormCompleted({
      user: {email: user.email, document: user.cpf, name: user.name},
      eventDays,
    });
  };

  return (
    <View style={{marginTop: 10}}>
      <Input
        label="Nome"
        value={name}
        onBlur={() => {
          validName(name);
        }}
        onChangeText={name => {
          setUser(prevState => ({...prevState, name}));
        }}
        errorMessage={!nameValidation.isValid ? nameValidation.errorMsg : ''}
      />
      <Input
        label="E-mail"
        onBlur={() => {
          validEmail(email);
        }}
        keyboardType="email-address"
        onChangeText={handleEmailChange}
        placeholder="Digite o email"
        errorMessage={!emailValidation.isValid ? emailValidation.errorMsg : ''}
      />
      <Input
        label="CPF"
        onBlur={() => {
          validCPF(cpf);
        }}
        keyboardType="numeric"
        // placeholder="999.999.999-99"
        {...maskedCPFInputProps}
        errorMessage={!CPFValidation.isValid ? CPFValidation.errorMsg : ''}
      />

      <View style={{paddingHorizontal: 10}}>
        <Text style={{fontSize: 17}}>Dias de evento:</Text>
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginBottom: 20,
            marginTop: 10,
          }}>
          {availableDays.map(availableDay => (
            <CheckBox
              key={availableDay}
              containerStyle={{padding: 4, margin: 0, marginRight: 0}}
              center
              title={formatDate(availableDay)}
              checked={eventDays.includes(availableDay)}
              onPress={() => {
                const checked = eventDays.includes(availableDay);
                const removeDay = () =>
                  setEventDays(prevState =>
                    prevState.length === 1
                      ? prevState
                      : prevState.filter(day => day !== availableDay),
                  );
                checked
                  ? removeDay()
                  : setEventDays(prevState => [...prevState, availableDay]);
              }}
            />
          ))}
        </View>
      </View>

      <Button
        containerStyle={{width: '100%'}}
        style={{marginTop: 25}}
        onPress={handleComplete}>
        Avançar
      </Button>
    </View>
  );
};

export default UserForm;
