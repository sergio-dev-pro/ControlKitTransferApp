import {Text} from '@rneui/themed';
import React, {useContext, useEffect, useState} from 'react';
import GStyles from '../style/global';
import {Divider, ListItem} from '@rneui/base';
import {FlatList, View} from 'react-native';
import Button from '../components/Button';
import {AuthContext} from '../context/AuthContext';
import Header from '../components/Header';
import Loading from '../components/Loading';
import THEME from '../style/theme';
import { getEventsList } from '../api/EventApi';

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
      return 'Kits';
  }
};

function EventSelectionDrawerScreen({navigation}) {
  const {setSelectedEventId, selectedEventId, permissions, authToken} =
    useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const eventsData = await getEventsList(authToken);
        setEvents(eventsData);
      } catch (error) {
        console.error('Erro ao buscar eventos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [authToken]);

  const handleEventSelection = async eventId => {
    if (eventId !== selectedEventId) {
      await setSelectedEventId(eventId);
    }

    const eventPermissions =
      permissions?.find(permission => permission.eventId === eventId);

      

    navigation.navigate(getRouteNameByPermission(eventPermissions));
  };

  return (
    <>
      <View style={{...GStyles.view}}>
        <Header
          style={{marginBottom: 0}}
          openDrawer={() => navigation.openDrawer()}
        />
        <View style={{width: '100%', backgroundColor: THEME.cor.whitesmoke}}>
          <Text h3 h3Style={{padding: 8, textAlign: 'center'}}>
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
              renderItem={({item}) => (
                <ListItem containerStyle={GStyles.maxWidth}>
                  <Button
                    onPress={() => handleEventSelection(item.id)}
                    type={selectedEventId === item.id ? 'solid' : 'outline'}
                    size="lg"
                    containerStyle={{width: '100%'}}
                    titleStyle={{fontWeight: 'bold', fontSize: 20}}>
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
