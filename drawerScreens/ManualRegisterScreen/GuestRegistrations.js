import {Badge, Button, Card, CheckBox, Input, Text} from '@rneui/themed';
import React, {useEffect, useState} from 'react';
import {ScrollView, View} from 'react-native';
import {useMaskedInputProps} from 'react-native-mask-input';
import Loading from '../../components/Loading';
import {formatDate} from '../../helpers/format';
import {cpfValidation, isValidEmail} from '../../helpers/validation';
import CodeReaderForEachDay from './CodeReaderForEachDay';
import RegisterForm from './RegisterForm';

function GuestRegistrations({
  inviteDays = [],
  requiredForms,
  onGuestRegistrations,
}) {
  const [guestRegistrations, setGuestRegistrations] = useState([]);
  const [daysToRegisterGuests, setDaysToRegisterGuests] = useState(inviteDays);

  const availableInvitationDays = daysToRegisterGuests.length
    ? daysToRegisterGuests.length === 1
      ? daysToRegisterGuests
      : daysToRegisterGuests.reduce((accumulator, currentDay) => {
          const isInFirstInteraction = typeof accumulator === 'string';
          if (!isInFirstInteraction && !accumulator.includes(currentDay)) {
            return [...accumulator, currentDay];
          }
          return isInFirstInteraction ? [accumulator] : accumulator;
        })
    : null;

  const handleGuestRegister = data => {
    let avaliableDays = daysToRegisterGuests;

    data.guestDays.forEach(day => {
      const indexToRemove = avaliableDays.indexOf(day);
      avaliableDays = avaliableDays.filter(
        (day, index) => index !== indexToRemove,
      );
    });
    setDaysToRegisterGuests(avaliableDays);

    if (!avaliableDays.length)
      return onGuestRegistrations([...guestRegistrations, data.registerData]);

    setDaysToRegisterGuests(avaliableDays);
    setGuestRegistrations(prevState => [...prevState, data.registerData]);
  };

  if (!availableInvitationDays) return <Loading />;
  console.log('@@@ daysToRegisterGuests', daysToRegisterGuests);
  console.log('@@@ availableInvitationDays', availableInvitationDays);
  return (
    <ScrollView>
      <Card containerStyle={{borderRadius: 10, height: '100%'}}>
        <Card.Title style={{marginBottom: 10}}>
          Cadastro de convidados
        </Card.Title>
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

        <Card.Divider />
        <GuestRegistration
          requiredForms={requiredForms}
          onGuestRegistrationCompleted={handleGuestRegister}
          availableInvitationDays={availableInvitationDays}
        />
      </Card>
    </ScrollView>
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
      guestInfos={userData}
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
    onUserFormCompleted({
      user: {email: user.email, document: user.cpf, name: user.name},
      guestDays,
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

      {availableDays.length > 1 && (
        <View style={{paddingHorizontal: 10}}>
          <Text style={{fontSize: 17}}>
            Selecione os dias de evento do convidado:
          </Text>
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
                checked={guestDays.includes(availableDay)}
                onPress={() => {
                  const checked = guestDays.includes(availableDay);
                  const removeDay = () =>
                    setGuestDays(prevState =>
                      prevState.length === 1
                        ? prevState
                        : prevState.filter(day => day !== availableDay),
                    );
                  checked
                    ? removeDay()
                    : setGuestDays(prevState => [...prevState, availableDay]);
                }}
              />
            ))}
          </View>
        </View>
      )}
      <Button style={{marginTop: 25}} onPress={handleComplete}>
        Avançar
      </Button>
    </View>
  );
};

export default GuestRegistrations;
