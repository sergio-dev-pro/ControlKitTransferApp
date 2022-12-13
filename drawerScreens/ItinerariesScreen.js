import {Modal, StyleSheet, View} from 'react-native';
import React, {useContext, useEffect, useState} from 'react';
import GStyles from '../style/global';
import Header from '../components/Header';
import Loading from '../components/Loading';
import {Button, Divider, Text} from '@rneui/themed';
import THEME from '../style/theme';
import SelectModal from '../components/SelectModal';
import {useAlert} from '../context/AlertContext';
import QrCodeReader from '../components/QrCodeReader';
import {getItineraries, registerItineraryAccess} from '../api/TransferApi';
import {AuthContext} from '../context/AuthContext';

export default function ItinerariesScreen({navigation}) {
  const [loading, setLoading] = useState();
  const [selectedItinerarie, setSelectedItinerarie] = useState();
  const [countEntryByReadingCode, setCountEntryByReadingCode] = useState(false);
  const [itineraries, setItineraries] = useState([]);
  const {selectedEventId, userToken} = useContext(AuthContext);

  useEffect(() => {
    getItineraries(selectedEventId, userToken).then(data => {
      if (data) {
        setItineraries(
          data.map(intinerary => ({
            key: intinerary.id,
            value: intinerary.originDestiny,
          })),
        );
      }
    });
  }, []);

  const setAlertMessage = useAlert();

  const handleQRCodeRead = code => {
    registerItineraryAccess(userToken, code, selectedItinerarie).then(
      wasSaved => {
        console.log('code', code);
        console.log('selectedItinerarie', selectedItinerarie);
        console.log('wasSaved', wasSaved);
        setCountEntryByReadingCode(false);
        if (wasSaved) {
          alert(
            'Usuário encontrado! Registro de acesso realizado com sucesso.',
          );
        }
      },
    );
  };

  return (
    <View style={{...GStyles.view}}>
      <Header
        style={{marginBottom: 0}}
        openDrawer={() => navigation.openDrawer()}
      />
      <Loading isActive={loading} />
      <View style={{width: '100%', backgroundColor: THEME.cor.whitesmoke}}>
        <Text h3 h3Style={{padding: 8, textAlign: 'center'}}>
          Itinerários
        </Text>
        <Divider />
      </View>
      <View style={[{maxWidth: 600}, GStyles.container]}>
        <SelectModal
          label="Selecione o Itinerário"
          items={itineraries}
          setValue={setSelectedItinerarie}
          value={selectedItinerarie}
        />
        {selectedItinerarie && (
          <Button onPress={() => setCountEntryByReadingCode(true)}>
            Contabilizar entrada
          </Button>
        )}
      </View>

      {/* <Modal
        isVisible={countEntryByReadingCode}
        backdropOpacity={0.1}
        style={{alignItems: 'center'}}>
         */}
      {countEntryByReadingCode && (
        <QrCodeReader
          onRead={handleQRCodeRead}
          onClose={() => setCountEntryByReadingCode(false)}
        />
      )}
      {/* </Modal> */}
    </View>
  );
}

const styles = StyleSheet.create({});
