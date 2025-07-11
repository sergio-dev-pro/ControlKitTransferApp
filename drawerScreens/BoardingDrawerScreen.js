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
import CustomModal from '../components/CustomModal';

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
  const [boardingCount, setBoardingCount] = useState(0)
  const [confirmFinishBoarding, setConfirmFinishBoarding] = useState(false)

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
    setItineraries([]);
    setVehicles([]);
    setShowQrcodereader(false);
    setBoardingCount(0);
    setConfirmFinishBoarding(false)
    fetchAllData();
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
        boardingCount: 0
      };
      await AsyncStorage.setItem('boardingDetails', JSON.stringify(simplifiedBoardingDetails));
      setActiveBoarding(true);
      setBoardingDetails(simplifiedBoardingDetails)

    }
    setLoading(false);
  };

  const verifyBoarding = async () => {
    try {
      const response = await AsyncStorage.getItem('boardingDetails');
      const parsed = JSON.parse(response);

      console.log('parsed.uid:@@@@@@@ ' + parsed.uid)

      if (parsed) {
        setActiveBoarding(true);
        setBoardingDetails(parsed);
        setBoardingCount(parsed.boardingCount || 0);
      } else {
        setActiveBoarding(false);
      }
    } catch (e) {
      console.error('Erro ao verificar embarque:', e);
    }
  };

  console.log(boardingDetails)

  useEffect(() => {
    verifyBoarding();
  }, []);

  const addUserBoarding = async (ticketCode) => {
  setShowQrcodereader(false);

  if (!ticketCode) {
    Alert.alert('Erro', 'Código de ingresso inválido.');
    return;
  }

  if (!boardingDetails || !boardingDetails.uid) {
    Alert.alert('Erro', 'Dados do embarque ainda não carregados. Tente novamente.');
    return;
  }

  try {
    const stored = await AsyncStorage.getItem('boardingDetails');
    const parsed = JSON.parse(stored);

    if (!parsed) {
      Alert.alert('Erro', 'Dados do embarque não encontrados.');
      return;
    }

    if (parsed.seatCapacity !== null && parsed.boardingCount >= parsed.seatCapacity) {
      Alert.alert('', 'Veículo chegou à capacidade máxima.');
      return;
    }

    const success = await registerTicketBoarding(userToken, selectedEventId, parsed.uid, ticketCode);

    if (success) {
      Alert.alert('Sucesso', 'Usuário adicionado ao embarque.');

      const updatedDetails = {
        ...parsed,
        boardingCount: parsed.boardingCount + 1,
      };

      await AsyncStorage.setItem('boardingDetails', JSON.stringify(updatedDetails));
      setBoardingDetails(updatedDetails);
      setBoardingCount(updatedDetails.boardingCount);
    }

  } catch (error) {
    console.log('Erro ao registrar embarque:', error);
    const message = error?.response?.data?.message || 'Erro inesperado';
    Alert.alert('Erro', message);
  }
};


  const handleFinishBoarding = async () => {
    try {
      console.log('ENTROUUUU');
      setLoading(true);

      const response = await finishBoarding(userToken, selectedEventId, boardingDetails.uid);
      console.log('BATEU');
      console.log(response);

      if (response) {
        Alert.alert('Sucesso', 'Embarque finalizado com sucesso.');
        resetBoardingState();
      }
    } catch (error) {
      console.error('Erro ao finalizar embarque:', error);
      // Erro tratado em finishBoarding
    } finally {
      setLoading(false);
    }

  };


  //useEffect(() => {resetBoardingState()})




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
              onPress={() => { setConfirmFinishBoarding(true) }}
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
      <CustomModal
        visible={confirmFinishBoarding}
        title=""
        content="Deseja finalizar o embarque?"
        onClose={() => {
          setConfirmFinishBoarding(false);
        }}
        confirm={handleFinishBoarding}
      />





    </View>
  );
};

export default BoardingDrawerScreen;