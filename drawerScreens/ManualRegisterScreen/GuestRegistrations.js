import {Divider} from '@rneui/base';
import {Badge, Button, Card, CheckBox, Input, Text} from '@rneui/themed';
import React, {useEffect, useState} from 'react';
import {ScrollView, View} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';
import Loading from '../../components/Loading';
import {formatDateAaaaMmDd, sortDates} from '../../helpers/format';
import CodeReaderForEachDay from './CodeReaderForEachDay';
import RegisterForm from './RegisterForm';
import UserForm from './UserForm';

function GuestRegistrations({
  // TODO: Setado temporariamente valor correto === []
  // inviteDays = ['2030-08-26T00:00:00', '2030-08-26T00:00:00'],
  inviteDays = [],
  // TODO: Setado temporariamente
  // requiredForms = [
  //   {
  //     formConfig: {birthDateIsRequired: true, genreIsRequired: true},
  //     id: 'details',
  //     name: 'Detalhes',
  //   },
  //   {
  //     formConfig: {
  //       blaceletSizeIsRequired: false,
  //       footSizeIsRequired: false,
  //       shirtSizeIsRequired: true,
  //     },
  //     id: 'accessories',
  //     name: 'Acessórios',
  //   },
  //   {id: 'photo', name: 'Fotografia'},
  // ],
  requiredForms,
  onGuestRegistrations,
  onReturn,
}) {
  const [guestRegistrations, setGuestRegistrations] = useState([]);
  const [daysToRegisterGuests, setDaysToRegisterGuests] = useState(inviteDays);
  const availableInvitationDays = daysToRegisterGuests.length
    ? daysToRegisterGuests.length === 1
      ? daysToRegisterGuests
      : daysToRegisterGuests.reduce((accumulator, currentDay) => {
          if (accumulator.length === 0) return [currentDay];
          if (accumulator.includes(currentDay)) return accumulator;
          return [...accumulator, currentDay];
        }, [])
    : null;

  console.log(
    '&&& inviteDays',
    inviteDays,
    '&&& daysToRegisterGuests',
    daysToRegisterGuests,
    'availableInvitationDays',
    availableInvitationDays,
  );
  const handleGuestRegister = data => {
    let avaliableDays = daysToRegisterGuests;

    data.guestDays.forEach(day => {
      const indexToRemove = avaliableDays.indexOf(day);
      avaliableDays = avaliableDays.filter(
        (day, index) => index !== indexToRemove,
      );
    });
    // setDaysToRegisterGuests(avaliableDays);
    if (!avaliableDays.length)
      return onGuestRegistrations([...guestRegistrations, data.registerData]);

    setDaysToRegisterGuests(avaliableDays);
    setGuestRegistrations(prevState => [...prevState, data.registerData]);
  };

  console.log('GuestRegistrations props', requiredForms, inviteDays);
  const withS = guestRegistrations.length > 1 && 's';
  if (!availableInvitationDays) return <Loading />;
  return (
    <Card containerStyle={{borderRadius: 10}}>
      {guestRegistrations.length > 0 && (
        <>
          <Card.Title style={{marginBottom: 8, flexGrow: 0, height: 20}}>
            {guestRegistrations.length} convidado{withS} cadastrado
            {withS}
          </Card.Title>
          <FlatList
            data={guestRegistrations}
            horizontal
            renderItem={({item}) => {
              return (
                <Badge key={item.name} value={item.name} status="success" />
              );
            }}
          />
          <Card.Divider style={{flexGrow: 0, height: 4, marginBottom: 8}} />
        </>
      )}
      <Card.Title style={{marginBottom: 10, flexGrow: 0, height: 20}}>
        Preencha os dados do convidado
      </Card.Title>

      <Card.Divider style={{flexGrow: 0, height: 4}} />

      <ScrollView style={{flexGrow: 1, height: '100%'}}>
        <GuestRegistration
          requiredForms={requiredForms}
          onGuestRegistrationCompleted={handleGuestRegister}
          availableInvitationDays={availableInvitationDays}
          onReturn={onReturn}
        />
      </ScrollView>
    </Card>
  );
}

const GuestRegistration = ({
  availableInvitationDays,
  requiredForms,
  onGuestRegistrationCompleted,
  onReturn,
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
          birthDate: formatDateAaaaMmDd(registerData.birthDate),
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
    setDays(data.eventDays);
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
      onReturn={onReturn}
      onUserFormCompleted={handleUserFormCompleted}
      availableDays={availableInvitationDays}
    />
  ) : !registerData ? (
    <RegisterForm
      guestInfos={userData}
      requiredForms={requiredForms}
      onRegistered={setRegisterData}
      onCancel={() => setUserData(undefined)}
    />
  ) : !getTicketIdType ? (
    <View>
      <Text h4 h4Style={{marginVertical: 20}}>
        Leia o código do ingresso
      </Text>
      <Button
        containerStyle={{marginBottom: 10}}
        onPress={() => {
          setGetTicketIdType('readBarCode');
        }}>
        Código de barras
      </Button>
      <Button
        containerStyle={{marginBottom: 10}}
        onPress={() => {
          setGetTicketIdType('readQRcode');
        }}>
        QRcode
      </Button>
      <Button
        containerStyle={{marginBottom: 10}}
        type="outline"
        onPress={() => {
          setRegisterData(undefined);
          setUserData(undefined);
        }}>
        Cancelar
      </Button>
    </View>
  ) : (
    <CodeReaderForEachDay
      isVisible={getTicketIdType && !dayCodes}
      onClose={() => setGetTicketIdType(undefined)}
      daysInDate={sortDates(days)}
      type={getTicketIdType}
      onReadCodes={handleReadCodes}
    />
  );
};

export default GuestRegistrations;
