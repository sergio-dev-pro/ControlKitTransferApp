import {Button, Divider, Text} from '@rneui/themed';
import React, {useContext, useEffect, useRef, useState} from 'react';
import {View} from 'react-native';
import Header from '../components/Header';
import QrCodeReader from '../components/QrCodeReader';
import {useAlert} from '../context/AlertContext';
import {AuthContext} from '../context/AuthContext';
import {getDeviceId} from 'react-native-device-info';
import GStyles from '../style/global';
import {fetchTickets, registerTicket} from '../api/TicketApi';
import * as realmApi from '../api/realmApi';
import useNetinfo from './hooks/useNetinfo';
import THEME from '../style/theme';

function KitsDrawerScreen({navigation}) {
  const authContext = useContext(AuthContext);
  const [showQrCodeReader, setShowQrcodereader] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncronizingTicket, setSyncronizingTicket] = useState(false);
  const [qrCodeReader, setQrcodereader] = useState();
  const setAlertMessage = useAlert();
  const {isConnected} = useNetinfo();

  const syncTickets = async () => {
    try {
      const getTickets = async () => {
        return new Promise(async (resolve, reject) => {
          try {
            let deviceId = getDeviceId();
            const {data: tickets} = await fetchTickets(
              deviceId,
              authContext.selectedEventId,
              authContext.userToken,
            );
            resolve(tickets);
          } catch (error) {
            console.error(JSON.stringify(error));
            reject();
          }
        });
      };
      const tickets = await getTickets();
      tickets.length && (await realmApi.saveTickets(tickets));
      await realmApi.sendLocallySavedPendingRegisteredTickets(
        authContext.userToken,
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    setInterval(() => {
      7;
      console.log('Kits sincroonizando a cada 30 seg...');
      syncTickets();
    }, 30000);
  }, []);

  const isFirstSyncRef = useRef(false);
  useEffect(() => {
    if (isConnected !== null) {
      isFirstSyncRef.current = true;
      if (isFirstSyncRef.current) {
        isConnected &&
          (async () => {
            setSyncronizingTicket(true);
            await syncTickets();
            setSyncronizingTicket(false);
          })();
      } else isConnected && syncTickets();
    }
  }, [isConnected]);

  const handleQRCodeRead = async ticketCode => {
    // #
    const isCodeWithHashtag = ticketCode.includes('#');
    const code = isCodeWithHashtag ? ticketCode.split('#')[0] : ticketCode;
    setShowQrcodereader(false);
    if (!isConnected) {
      try {
        setLoading(false);
        await realmApi.registerTicketOffline(code);
        setAlertMessage('Registro de entrega de kit realizado.');
      } catch (error) {
        console.error(error);
        setAlertMessage(error.message);
      } finally {
        setLoading(false);
      }
      return;
    }
    try {
      setLoading(true);
      await registerTicket(code, authContext.userToken);
      setAlertMessage(
        'Ingresso encontrado! Registro de entrega de kit realizado.',
      );
    } catch (error) {
      console.error(error);
      setAlertMessage(error.response.data.errors);
      return null;
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={{...GStyles.view}}>
      <Header
        style={{marginBottom: 0}}
        openDrawer={() => navigation.openDrawer()}
      />
      <View style={{width: '100%', backgroundColor: THEME.cor.whitesmoke}}>
        <Text h3 h3Style={{padding: 8, textAlign: 'center'}}>
          {!syncronizingTicket
            ? 'Entrega de kits'
            : 'Aguarde: sincronizando ingressos.'}
        </Text>
        <Divider />
      </View>
      <View style={GStyles.container}>
        {/* <Text h3 h3Style={{marginBottom: 10}}>
          {!syncronizingTicket
            ? 'Entrega de kits'
            : 'Aguarde: sincronizando ingressos.'}
        </Text> */}
        <Button
          loading={loading || syncronizingTicket}
          onPress={() => {
            setQrcodereader(null);
            setShowQrcodereader(true);
          }}>
          Ler código do ingresso
        </Button>
      </View>
      {showQrCodeReader && (
        <QrCodeReader
          onRead={handleQRCodeRead}
          onClose={() => setShowQrcodereader(false)}
        />
      )}
      {qrCodeReader && (
        <Text style={{color: 'black'}}>codigo do qr code: {qrCodeReader}</Text>
      )}
    </View>
  );
}

export default KitsDrawerScreen;
