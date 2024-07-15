import {Button, Divider, Text, Badge} from '@rneui/themed';
import React, {useContext, useState, useEffect} from 'react';
import {View} from 'react-native';
import {braceletRegister, hasBraceleteCode} from '../api/TicketApi';
import Header from '../components/Header';
import QrCodeReader from '../components/QrCodeReader';
import {useAlert} from '../context/AlertContext';
import {AuthContext} from '../context/AuthContext';
import {formatDate, sortDates} from '../helpers/format';
import GStyles from '../style/global';
import THEME from '../style/theme';
import SelectModal from '../components/SelectModal';
import {useIsFocused} from '@react-navigation/native';
import SearchUserModal from '../components/SearchUserModal';
import {reduceArrayToJustDifferentDates} from '../helpers/reduceCallbacks';
import JustificationModal from '../components/JustificationModal';

function BraceletRegistrationDrawerScreen({navigation}) {
  const [showQrCodeReader, setShowQrcodereader] = useState(false);
  const [user, setUser] = useState();
  const [selectedDay, setSelectedDay] = useState();
  const [sectorDescription, setSectorDescription] = useState(null);
  const [ticketCode, setTicketCode] = useState();
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();
  const {userToken} = useContext(AuthContext);
  const setAlertMessage = useAlert();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isTicketPreScanned, setIsTicketPreScanned] = useState(false);
  const [reason, setReason] = useState('');


  const resetState = () => {
    setUser();
    setSelectedDay();
    setTicketCode();
    setSectorDescription(null);
  };
  const handleUserFound = (userFounded, searchedFor) => {
    if (!userFounded.isActive)
      return alert('Usuário não registrado, registre no cadastro manual.');

    // Removendo dias duplicados
    const userEventDays = sortDates(
      userFounded.days.reduce(
        reduceArrayToJustDifferentDates.callback,
        reduceArrayToJustDifferentDates.initialValue,
      ),
    );
    const userHasOnlyOneEventDay = userEventDays.length == 1;
    const userState = {...userFounded, ...searchedFor, days: userEventDays};
    // Se tiver apenas um dias, set automaticamente
    setUser(userState);
    if (userHasOnlyOneEventDay) {
      setSelectedDay(userEventDays[0]);
      verifyTicketAssociation(userEventDays[0], userState.token);
    }
    
  };
  //

  const handleQRCodeRead = async ticketCode => {
    // #
    const isCodeWithHashtag = ticketCode.includes('#');
    const code = isCodeWithHashtag ? ticketCode.split('#')[0] : ticketCode;

    setTicketCode(code);
    setShowQrcodereader(false);
  };

  const verifyTicketAssociation = async (day, token) => {
    const bearerToken = userToken;
    const tokenGetCpfOrEmail = user?.token ?? token;
    const dayTicket = day;
    try {
      const data = await hasBraceleteCode(tokenGetCpfOrEmail, dayTicket, bearerToken);
      console.log('estado: ' + data.hasCode);
      setIsTicketPreScanned(data.hasCode);
    } catch (error) {
      console.error('Erro ao verificar código da pulseira:', error);
    }
  };
 
  const handleJustificationSubmit = async (justification) => {
    setReason(justification);
    setIsModalVisible(false);
    setIsTicketPreScanned(false);
  };

  const evaluateAndAddTicket = async () => {
    if (!isTicketPreScanned) {
      await save();
    } else {
      setIsModalVisible(true);
    }
  };

  const save = async () => {
    try {
      setLoading(true);
      const {data} = await braceletRegister(
        userToken,
        user?.token,
        selectedDay,
        ticketCode,
        reason
      );
      console.log('braceletRegister data', data);
      resetState();
      setAlertMessage(`Registrado`, '#32cd32');
    } catch (error) {
      console.error(error.response);
      console.log('error by api: '+ error?.response?.data);
      if (error?.response?.data?.errors) {
        setAlertMessage(error.response.data.errors, '#dc143c');
        return null;
      }
      setAlertMessage('Não registrado, tente novamente', '#dc143c');
      return null;
    } finally {
      setLoading(false);
    }
    console.log(user.token, selectedDay, ticketCode);
  };

  const hasTicketCodeRead = !!ticketCode;
  const hasAllDataToRegisterBracelet = selectedDay && ticketCode;
  return (
    <View style={{...GStyles.view}}>
      <Header
        style={{marginBottom: 0}}
        openDrawer={() => navigation.openDrawer()}
      />
      <View style={{width: '100%', backgroundColor: THEME.cor.whitesmoke}}>
        <Text h3 h3Style={{padding: 8, textAlign: 'center'}}>
          Registrar pulseira
        </Text>
        <Divider />
      </View>
      <View style={[GStyles.container]}>
        {!user ? (
          <SearchUserModal
            title="Busque o usuário que receberá a pulseira"
            onUserFound={handleUserFound}
            isVisible={isFocused && !user}
            onClose={() => {
              navigation.navigate('Kits');
            }}
          />
        ) : (
          <>
            <Badge
              textStyle={{fontSize: 13}}
              containerStyle={{marginBottom: 30}}
              badgeStyle={{height: 25}}
              value={
                (user?.cpf && `CPF:${user?.cpf}`) ||
                (user?.email && `E-mail:${user?.email}`)
              }
              status="warning"
            />
            <SelectModal
              label="Dia do evento"
              placeholder=""
              items={user.days.map(day => ({key: day, value: formatDate(day)}))}
              value={selectedDay}
              setValue={value => {
                setSelectedDay(value);
                verifyTicketAssociation(value);
                console.log(JSON.stringify(user));
                var dayKey = value.split('T')[0];
                console.log('dayKey=' + dayKey);
                var sectorByDay = user.daySectors[dayKey];
                console.log('sectorByDay=' + sectorByDay);
                if (sectorByDay) {
                  setSectorDescription('Setor ' + sectorByDay);
                }
              }}
            />
            {sectorDescription && (
              <Text h4 h4Style={{fontSize: 18, color: '#000', paddingLeft: 16}}>
                {sectorDescription}
              </Text>
            )}
            {selectedDay && !hasTicketCodeRead && (
              <View style={{padding: 16, height: 'auto'}}>
                <Text
                  h4
                  h4Style={{fontSize: 18, color: '#86939e', marginBottom: 10}}>
                  Escaneie o código da pulseira:
                </Text>
                <Button
                  containerStyle={{
                    // flex: 1,
                    marginRight: 5,
                  }}
                  type="outline"
                  size="lg"
                  // read qrcode
                  onPress={() => setShowQrcodereader(true)}>
                  Escanear QR code ou código de barras
                </Button>
              </View>
            )}
            {selectedDay && hasTicketCodeRead && (
              <View style={{padding: 16, flex: 1}}>
                <Text
                  h4
                  h4Style={{fontSize: 18, color: '#86939e', marginBottom: 10}}>
                  Código da pulseira:{' '}
                  <Text style={{color: THEME.cor.primary}}>{ticketCode}</Text>
                </Text>
              </View>
            )}
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'flex-end',
                padding: 8,
                marginTop: 10,
              }}>
              <Button
                type="clear"
                containerStyle={{marginRight: 20}}
                size="lg"
                title="Cancelar"
                onPress={resetState}
              />
              {hasAllDataToRegisterBracelet && (
                <Button
                  loading={loading}
                  type="solid"
                  size="lg"
                  title="Salvar"
                  onPress={evaluateAndAddTicket}
                />
              )}
            </View>
          </>
        )}
      </View>
      <JustificationModal
        modalVisible={isModalVisible}
        setModalVisible={setIsModalVisible}
        onSubmit={handleJustificationSubmit}
        message="Para adicionar uma nova pulseira, por favor, forneça uma justificativa."
      />
      {showQrCodeReader && (
        <QrCodeReader
          onRead={handleQRCodeRead}
          onClose={() => setShowQrcodereader(false)}
        />
      )}
    </View>
  );
}

export default BraceletRegistrationDrawerScreen;