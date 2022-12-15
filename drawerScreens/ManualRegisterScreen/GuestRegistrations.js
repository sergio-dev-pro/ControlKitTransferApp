import {Badge, Button, Card, Input, Text} from '@rneui/themed';
import React, {useEffect, useReducer, useState} from 'react';
import {ScrollView, View} from 'react-native';
import {useMaskedInputProps} from 'react-native-mask-input';
import {cpfValidation, isValidEmail} from '../../helpers/validation';
import CodeReaderForEachDay from './CodeReaderForEachDay';
import {
  GuestUserRegisterContext,
  initialGuestUserRegisterState,
} from './registerContext';
import RegisterForm from './RegisterForm';

function GuestRegistrations({inviteDays = [], requiredForms}) {
  const [guestRegistrations, setGuestRegistrations] = useState([]);
  const [daysToRegisterGuests, setDaysToRegisterGuests] = useState(inviteDays);

  const availableInvitationDays = daysToRegisterGuests.reduce(
    (accumulator, currentDay) => {
      if (!accumulator) return [currentDay];

      if (!accumulator.includes(currentDay))
        return [...accumulator, currentDay];
    },
  );
  const handleGuestRegister = data => {
    const invalidateRegisteredGuestDays = guestDays => {
      setDaysToRegisterGuests(prevState => {
        let avaliableDays = prevState;
        guestDays.forEach(day => {
          const indexToRemove = avaliableDays.indexOf(day);
          avaliableDays = avaliableDays.filter(
            (day, index) => index !== indexToRemove,
          );
        });
        return avaliableDays;
      });
    };
    invalidateRegisteredGuestDays(data.guestDays);
    return alert('Bateu');
    setGuestRegistrations(prevState => [...prevState, data.register]);
  };
  console.log('@@@ daysToRegisterGuests', daysToRegisterGuests);
  console.log('@@@ availableInvitationDays', availableInvitationDays);
  return (
    <Card containerStyle={{borderRadius: 10}}>
      {guestRegistrations.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text h5 style={{paddingLeft: 4}}>
            Cadastrados:
          </Text>
          <Badge value={guestRegistrations.length} status="success" />
        </View>
      )}
      <Card.Title style={{marginBottom: 10}}>Cadastro de convidados</Card.Title>

      <Card.Divider />
      <ScrollView>
        <GuestRegistration
          requiredForms={requiredForms}
          onGuestRegistrationCompleted={handleGuestRegister}
          availableInvitationDays={availableInvitationDays}
        />
      </ScrollView>
    </Card>
  );
}

const GuestRegistration = ({
  availableInvitationDays,
  requiredForms,
  onGuestRegistrationCompleted,
}) => {
  // TODO: setado tru temporariamente
  const [registerData, setRegisterData] = useState();
  const [days, setDays] = useState(availableInvitationDays);
  // TODO: setado temporariamente
  const [userData, setUserData] = useState();

  // TODO: setado tru temporariamente
  const [getTicketIdType, setGetTicketIdType] = useState();
  // TODO: setado true temporariamente
  const [dayCodes, setDayCodes] = useState();

  useEffect(() => {
    const completedRegister = () => {
      onGuestRegistrationCompleted({
        registerData: {
          ...userData,
          ...registerData,
          dayCodes,
        },
        guestDays: days,
      });
      const clearState = () => {
        setUserData(undefined);
        setRegisterData(undefined);
        setDayCodes(undefined);
        setGetTicketIdType(undefined);
      };
      clearState();
    };
    dayCodes && completedRegister();
  }, [dayCodes]);

  const handleUserFormCompleted = data => {
    setUserData(data.user);
    setDays(data.guestDays);
  };

  const handleReadCodes = readCodes => {
    let codes = {};
    readCodes.forEach(code => {
      codes = {...codes, ...code};
    });
    setDayCodes(codes);
  };

  console.log('### userData', userData);

  const isUserDataCompleted = !!userData;
  return !isUserDataCompleted ? (
    <UserForm
      onUserFormCompleted={handleUserFormCompleted}
      availableDays={availableInvitationDays}
    />
  ) : !registerData ? (
    <RegisterForm
      requiredForms={requiredForms}
      onRegistered={setRegisterData}
    />
  ) : !getTicketIdType ? (
    <View>
      <Text h4 h4Style={{marginVertical: 20}}>
        Dar baixa no sistema
      </Text>
      <Button
        containerStyle={{marginBottom: 10}}
        onPress={() => {
          setGetTicketIdType('readBarCode');
        }}>
        Ler código de barras
      </Button>
      <Button
        containerStyle={{marginBottom: 10}}
        onPress={() => {
          setGetTicketIdType('readQRcode');
        }}>
        Ler QRcode
      </Button>
      <Button
        containerStyle={{marginBottom: 10}}
        onPress={() => {
          setGetTicketIdType('PDF');
        }}>
        PDF
      </Button>
    </View>
  ) : (
    <CodeReaderForEachDay
      isVisible={getTicketIdType && !dayCodes}
      onClose={() => setGetTicketIdType(undefined)}
      daysInDate={days}
      type={getTicketIdType}
      onReadCodes={handleReadCodes}
    />
  );
};

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
  const [guestDays, setGuestDays] = useState(availableDays);

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
    onUserFormCompleted({user, guestDays});
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
      <Button style={{marginTop: 25}} onPress={handleComplete}>
        Pronto
      </Button>
    </View>
  );
};

export default GuestRegistrations;
