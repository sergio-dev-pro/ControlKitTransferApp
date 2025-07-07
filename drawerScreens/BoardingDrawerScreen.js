import { Alert, View } from 'react-native';
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import GStyles from '../style/global';
import Header from '../components/Header';
import THEME from '../style/theme';
import { Text, Divider } from '@rneui/themed';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { finishBoarding, getItineraries, getVehicles, registerTicketBoarding, startBoarding } from '../api/BoardingApi';
import Button from '../components/Button';
import SelectModal from '../components/SelectModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QrCodeReader from '../components/QrCodeReader';

const BoardingDrawerScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const { userToken, selectedEventId } = useContext(AuthContext);
  const [itineraries, setItineraries] = useState([]);
  const [valueItinerary, setValueItinerary] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [valueVehicle, setValueVehicle] = useState(null);

  const { showAlert } = useAlert();
  const [activeBoarding, setActiveBoarding] = useState(false)
  const [boardingDetails, setBoardingDetails] = useState(null)
  const [selectedVehicleSeatCapacity, setSelectedVehicleSeatCapacity] = useState(null);
  const [showQrCodeReader, setShowQrcodereader] = useState(false);
  const [boardingCount, setBoardingCount] = useState(0);
  const [boardingId, setBoardingId] = useState(null)

  useFocusEffect(
    useCallback(() => {
      setValueItinerary(null);
      setValueVehicle(null);
    }, [userToken, selectedEventId])
  );


  const resetBoardingState = async () => {
    await AsyncStorage.removeItem('boardingDetails');

    setActiveBoarding(false);
    setBoardingDetails(null);
    setSelectedVehicleSeatCapacity(null);
    setValueItinerary(null);
    setValueVehicle(null);
    setItineraries([])
    setVehicles([])
    setShowQrcodereader(false)

    fetchAllData();

    setBoardingCount(0);


  };


  const fetchAllData = useCallback(async () => {
    setLoading(true);

    if (!userToken || !selectedEventId) {
      Alert.alert('Atenção', "Não foi possível carregar: dados incompletos.");
      setLoading(false);
      return;
    }

    const itinerariesResponse = await getItineraries(userToken, selectedEventId);
    if (itinerariesResponse) {
      setItineraries(itinerariesResponse);
    }

    const vehiclesResponse = await getVehicles(userToken, selectedEventId);
    if (vehiclesResponse) {
      setVehicles(vehiclesResponse);
    }

    setLoading(false);
  }, [userToken, selectedEventId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleSelectItinerary = (id) => {
    setValueItinerary(id);
  };

  const handleSelectVehicle = (id) => {
    setValueVehicle(id);
    const veiculoSelecionado = vehicles.find(vehicle => vehicle.id === id);
    setSelectedVehicleSeatCapacity(veiculoSelecionado.seatCapacity);
  };

  const formattedItinerariesForSelect = itineraries.map(item => ({
    key: item.id,
    value: item.destiny,
  }));

  const formattedVehiclesForSelect = vehicles.map(item => ({
    key: item.id,
    value: item.plateNumber,
  }));

  const handleStartBoarding = async () => {
    setLoading(true);

    if (!valueItinerary) {
      Alert.alert('Atenção', 'Por favor, selecione um itinerário antes de iniciar o embarque.');
      return;
    }
    if (!valueVehicle) {
      Alert.alert('Atenção', 'Por favor, selecione um veículo antes de iniciar o embarque.');
      return;
    }

    const response = await startBoarding(userToken, selectedEventId, valueItinerary, valueVehicle);
    if (response) {
      Alert.alert('Sucesso', 'Embarque iniciado com sucesso!');

      const simplifiedBoardingDetails = {
        uid: response.uid,
        seatCapacity: selectedVehicleSeatCapacity,
      };
      await AsyncStorage.setItem('boardingDetails', JSON.stringify(simplifiedBoardingDetails));
      setActiveBoarding(true);
      setBoardingDetails(simplifiedBoardingDetails)

    }
    setLoading(false);
  };

  const verifyBoarding = async () => {
    const response = await AsyncStorage.getItem('boardingDetails');
    const parsed = JSON.parse(response);
    if (response) {
      setActiveBoarding(true);
      setBoardingId(parsed.uid)
      setBoardingDetails(parsed)
    } else {
      setActiveBoarding(false);
    }
  };


  useEffect(() => {
    verifyBoarding();
  }, []);

  const addUserBoarding = async ticketCode => {

    if (boardingDetails?.seatCapacity === boardingCount) {
      Alert.alert('', 'Veículo chegou à capacidade máxima.');
      return; // ← Evita registrar e incrementar
    }

    // await registerTicketBoarding(userToken, selectedEventId, boardingId, ticketCode)
    setBoardingCount(prev => prev + 1);
  };

  const handleFinishBoarding = async () => {

    //await finishBoarding(userToken, selectedEventId, boardingId)
    resetBoardingState()
  }

  return (
    <View style={{ ...GStyles.view }}>
      <Header
        style={{ marginBottom: 0 }}
        openDrawer={() => navigation.openDrawer()}
      />
      <View style={{ width: '100%', backgroundColor: THEME.cor.whitesmoke, flex: 1 }}>
        <Text h3 h3Style={{ padding: 8, textAlign: 'center' }}>
          Embarque
        </Text>
        <Divider />


        {!activeBoarding ? (
          <>
            <SelectModal
              label="Selecione o Itinerário"
              value={valueItinerary}
              setValue={handleSelectItinerary}
              items={formattedItinerariesForSelect}
              style={{ marginHorizontal: 10, marginTop: 10 }}
            />

            <SelectModal
              label="Selecione o Veículo"
              value={valueVehicle}
              setValue={handleSelectVehicle}
              items={formattedVehiclesForSelect}
              style={{ marginHorizontal: 10, marginTop: 10 }}
            />

            <Button
              title="Iniciar Embarque"
              onPress={handleStartBoarding}
              disabled={!valueItinerary || !valueVehicle || loading}
              containerStyle={{ margin: 10 }}
            />
          </>
        ) : (
          <View style={{ padding: 10, alignItems: 'center' }}>
            <Text h4 style={{ marginBottom: 10 }}>
              Capacidade do Veículo: {boardingDetails?.seatCapacity || 'N/A'}
            </Text>
            <Text style={{ fontSize: 16, marginBottom: 20 }}>
              Passageiros embarcados: {boardingCount}
            </Text>


            <Button
              title="Registrar Entrada"
              onPress={() => setShowQrcodereader(true)}
              containerStyle={{ width: 200, marginBottom: 10 }}
            />

            <Button
              title="Finalizar Embarque"
              onPress={handleFinishBoarding}
              containerStyle={{ width: 200 }}
            />
          </View>


        )}
      </View>

      {showQrCodeReader && (
        <QrCodeReader
          onRead={addUserBoarding}
          onClose={() => setShowQrcodereader(false)}
        />
      )}
    </View>
  );
};

export default BoardingDrawerScreen;