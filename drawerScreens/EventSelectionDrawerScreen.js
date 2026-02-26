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
import { TouchableOpacity } from 'react-native';


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
  const [companies, setCompanies] = useState([]);
  const [currentCompanyId, setCurrentCompanyId] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [changingCompany, setChangingCompany] = useState(false);
  const [kitDelivery, setKitDelivery] = useState(null)

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const storedCompanyId = await AsyncStorage.getItem('userCompanyId');
        setCurrentCompanyId(storedCompanyId);

        const stored = await AsyncStorage.getItem('userCompanies');
        if (stored) {
          setCompanies(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load userCompanies:', error);
      }
    };

    loadCompanies();
  }, []);

  const fetchEvents = async (companyId = null) => {
    setIsLoading(true);
    try {
      const storedCompanyId = await AsyncStorage.getItem('userCompanyId'); // <--- CORRETO
      const parsedCompanyId = companyId != null ? companyId : storedCompanyId;
      const eventsData = await getEventsList(userToken, parsedCompanyId);
      setKitDelivery(eventsData.kitDeliveryMode)
      setEvents(eventsData);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [userToken]);

  const changeCompany = async (companyId) => {
    await AsyncStorage.setItem('userCompanyId', companyId.toString());

    setCurrentCompanyId(companyId);

    await fetchEvents(companyId);

    setChangingCompany(false);
  }


  const handleEventSelection = async (eventId, kitDeliveryMode, canManageBraceletDelivery, braceletDeliveryMode, braceletDeliveryRequireSignature, facialProvider) => {
    if (eventId !== selectedEventId) {
      await setSelectedEventId(eventId, kitDeliveryMode, canManageBraceletDelivery, braceletDeliveryMode, braceletDeliveryRequireSignature, facialProvider);
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
            Mudar evento
          </Text>
          <Divider />
        </View>
        {changingCompany === false && (<View style={{
          width: '100%',
          padding: 10,
          alignItems: 'center',
          flex: 0.6
        }}>
          {isLoading ? (
            <Loading isActive={true} />
          ) : (
            <FlatList
              data={events}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <ListItem containerStyle={GStyles.maxWidth}>
                  <Button
                    onPress={() => handleEventSelection(item.id, item.kitDeliveryMode, item.canManageBraceletDelivery, item.braceletDeliveryMode, item.braceletDeliveryRequireSignature, item.facialProvider)}
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
        </View>)}

        {changingCompany === false && (
          <View style={{ marginTop: 10, justifyContent: 'center', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => setChangingCompany(true)}
              style={{
                backgroundColor: 'transparent',
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: 'black', fontSize: 16, fontWeight: 'bold' }}>
                Mudar empresa
              </Text>
            </TouchableOpacity>
          </View>)}

        {changingCompany && (<View style={GStyles.container}>
          <Text h4 h4Style={{ padding: 8, textAlign: 'center' }}>
            Empresas
          </Text>
          {isLoading ? (
            <Loading isActive={true} />
          ) : (
            <FlatList
              data={companies}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <ListItem containerStyle={GStyles.maxWidth}>
                  <Button
                    onPress={() => changeCompany(item.id)}
                    type={currentCompanyId === item.id ? 'solid' : 'outline'}
                    size="lg"
                    containerStyle={{ width: '100%' }}
                    titleStyle={{ fontWeight: 'bold', fontSize: 20 }}>
                    {item.name}
                  </Button>
                </ListItem>
              )}
            />
          )}
        </View>)}
      </View>
    </>
  );
}

export default EventSelectionDrawerScreen;
