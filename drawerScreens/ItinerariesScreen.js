import {Modal, StyleSheet, View} from 'react-native';
import React, {useState} from 'react';
import GStyles from '../style/global';
import Header from '../components/Header';
import Loading from '../components/Loading';
import {Button, Divider, Text} from '@rneui/themed';
import THEME from '../style/theme';
import SelectModal from '../components/SelectModal';
import {useAlert} from '../context/AlertContext';
import QrCodeReader from '../components/QrCodeReader';

export default function ItinerariesScreen({navigation}) {
  const [loading, setLoading] = useState();
  const [selectedItinerarie, setSelectedItinerarie] = useState();
  const [countEntryByReadingCode, setCountEntryByReadingCode] = useState(false);
  const [itineraries, setItineraries] = useState([
    {key: 1, value: 'Barra para Ondina'},
    {key: 2, value: 'Ondina para Barra'},
  ]);

  const setAlertMessage = useAlert();

  const handleQRCodeRead = code => {
    setAlertMessage(`${code}: Usuário encontrado pelo código.`);
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
