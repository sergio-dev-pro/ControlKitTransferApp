import {Badge, Button, Card, CheckBox, Input, Text} from '@rneui/themed';
import React, {useEffect, useState} from 'react';
import {ScrollView, View} from 'react-native';
import {useMaskedInputProps} from 'react-native-mask-input';
import Loading from '../../components/Loading';
import {formatDate} from '../../helpers/format';
import {cpfValidation, isValidEmail} from '../../helpers/validation';
import CodeReaderForEachDay from './CodeReaderForEachDay';
import RegisterForm from './RegisterForm';
import UserForm from './UserForm';

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

export default GuestRegistrations;
