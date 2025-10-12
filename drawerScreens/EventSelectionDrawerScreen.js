import { Text } from '@rneui/themed';
import React, { useContext, useEffect, useState } from 'react';
import GStyles from '../style/global';
import { Divider, ListItem } from '@rneui/base';
import { FlatList, View } from 'react-native';
import Button from '../components/Button';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';
import Loading from '../components/Loading';
import THEME from '../style/theme';
import { getEventsList } from '../api/EventApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { event } from 'react-native-reanimated';


const getRouteNameByPermission = permissions => {
  switch (true) {
    case permissions?.hasKitDeliveryPermission:
      return 'Kits';
    case permissions?.hasBraceletDeliveryPermission:
      return 'Entregar pulseira';
    case permissions?.hasBraceletRegistrationPermission:
      return 'Registrar pulseira';
    case permissions?.hasManualRegistrationPermission:
      return 'Cadastro manual';
    case permissions?.hasManualBoxOfficeRegistrationPermission:
      return 'Cadastro - Bilheteria';
    case permissions?.hasItinerariesPermission:
      return 'Itinerários';
    case permissions?.hasPhotoReregisterPermission:
      return 'Recadastrar foto';
    case permissions?.canCreateTicket:
      return 'Cadastro rápido';
    case permissions?.canChangeUserEmail:
      return 'Alterar e-mail';
    default:
      return null;
  }
};

function EventSelectionDrawerScreen({ navigation }) {
  const { setSelectedEventId, selectedEventId, permissions, userToken, setPermission } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [kitDelivery, setKitDelivery] = useState(null)



  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const storedCompanyId = await AsyncStorage.getItem('userCompanyId'); // <--- CORRETO
        const parsedCompanyId = JSON.parse(storedCompanyId);
        const eventsData = await getEventsList(userToken, parsedCompanyId);
        setKitDelivery(eventsData.kitDeliveryMode)
        setEvents(eventsData);
      } catch (error) {
        console.error('Erro ao buscar eventos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [userToken]);


  const handleEventSelection = async eventId => {
    if (eventId !== selectedEventId) {
      await setSelectedEventId(eventId, kitDelivery);
    }

    const selectedEvent = events.find(event => event.id === eventId);
    const eventPermissions = selectedEvent?.permissions || [];

    setPermission(eventPermissions);


    const permissionObj = {
      hasKitDeliveryPermission: eventPermissions.includes("page.delivery.kit"),
      hasBraceletDeliveryPermission: eventPermissions.includes("page.delivery.bracelet"),
      hasBraceletRegistrationPermission: eventPermissions.includes("page.ticket.register.qrcode"),
      hasManualRegistrationPermission: eventPermissions.includes("page.manual.registration"),
      hasManualBoxOfficeRegistrationPermission: eventPermissions.includes("page.manual.boxoffice"),
      hasItinerariesPermission: eventPermissions.includes("page.itineraries"),
      hasPhotoReregisterPermission: eventPermissions.includes("page.user.retake.photo"),
      canCreateTicket: eventPermissions.includes("page.ticket.add"),
      canChangeUserEmail: eventPermissions.includes("page.user.update.email"),
    };

    const routeName = getRouteNameByPermission(permissionObj);

    // ⚠️ Só navega se a rota for válida (evita erro de rota inexistente)
    if (routeName) {
      setTimeout(() => {
        navigation.navigate(routeName);
      }, 50);
    } else {
      console.warn('Nenhuma rota correspondente às permissões encontradas.');
    }
  };



  return (
    <>
      <View style={{ ...GStyles.view }}>
        <Header
          style={{ marginBottom: 0 }}
          openDrawer={() => navigation.openDrawer()}
        />
        <View style={{ width: '100%', backgroundColor: THEME.cor.whitesmoke }}>
          <Text h3 h3Style={{ padding: 8, textAlign: 'center' }}>
            Eventos
          </Text>
          <Divider />
        </View>
        <View style={GStyles.container}>
          {isLoading ? (
            <Loading isActive={true} />
          ) : (
            <FlatList
              data={events}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <ListItem containerStyle={GStyles.maxWidth}>
                  <Button
                    onPress={() => handleEventSelection(item.id)}
                    type={selectedEventId === item.id ? 'solid' : 'outline'}
                    size="lg"
                    containerStyle={{ width: '100%' }}
                    titleStyle={{ fontWeight: 'bold', fontSize: 20 }}>
                    {item.name}
                  </Button>
                </ListItem>
              )}
            />
          )}
        </View>
      </View>
      <Loading isActive={isLoading} />
    </>
  );
}

export default EventSelectionDrawerScreen;
