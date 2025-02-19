import * as React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createDrawerNavigator} from '@react-navigation/drawer';

import LoginScreen from '../screens/LoginScreen';
import EventSelectionScreen from '../screens/EventSelectionScreen';
import {AuthContext} from '../context/AuthContext';
import KitsDrawerScreen from '../drawerScreens/KitsDrawerScreen';
import EventSelectionDrawerScreen from '../drawerScreens/EventSelectionDrawerScreen';
import ManualRegisterScreen from '../drawerScreens/ManualRegisterScreen';
import ItinerariesScreen from '../drawerScreens/ItinerariesScreen';
import NewTicket from '../drawerScreens/NewTicket';
import ChangeEmail from '../drawerScreens/ChangeEmail';
import PhotoReregisterDrawerScreen from '../drawerScreens/PhotoReregisterDrawerScreen';
import DeliverBraceletDrawerScreen from '../drawerScreens/DeliverBraceletDrawerScreen';
import NewFastTicket from '../drawerScreens/NewFastTicket';
import BraceletRegistrationDrawerScreen from '../drawerScreens/BraceletRegistrationDrawerScreen';
import TicketOfficeManualRegisterScreen from '../drawerScreens/ManualRegisterScreen/TicketOfficeManualRegisterScreen';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

const getRouteNameByPermission = permissions => {
  switch (true) {
    case permissions.hasKitDeliveryPermission:
      return 'Kits';
    case permissions.hasBraceletDeliveryPermission:
      return 'Entregar pulseira';
    case permissions.hasBraceletRegistrationPermission:
      return 'Registrar pulseira';
    case permissions.hasManualRegistrationPermission:
      return 'Cadastro manual';
    case permissions.hasManualBoxOfficeRegistrationPermission:
      return 'Cadastro - Bilheteria';
    case permissions.hasItinerariesPermission:
      return 'Itinerários';
    case permissions.hasPhotoReregisterPermission:
      return 'Recadastrar foto';
    case permissions.canCreateTicket:
      return 'Cadastro rápido';
    case permissions.canChangeUserEmail:
      return 'Alterar e-mail';
    default:
      return 'Kits';
  }
};

function Navigators() {
  const {
    userToken,
    selectedEventId,
    events,
    permissions,
    logout,
  } = React.useContext(AuthContext);

  const hasOnlyOneEvent = events && events.length === 1;

  const eventPermissions =
    selectedEventId &&
    permissions &&
    permissions.find(permission => permission.eventId == selectedEventId);

  if (userToken && selectedEventId && !eventPermissions) {
    logout();
  }

  const initialRoute =
    eventPermissions && getRouteNameByPermission(eventPermissions);
  return (
    <>
      {userToken && selectedEventId && eventPermissions ? (
        <Drawer.Navigator
          screenOptions={{
            headerShown: false,
            drawerLabelStyle: {
              fontSize: 23,
            },
            drawerContentStyle: {
              marginTop: 16,
            },
          }}>
          {eventPermissions.hasKitDeliveryPermission && (
            <Drawer.Screen name="Kits" component={KitsDrawerScreen} />
          )}
          {eventPermissions.hasBraceletDeliveryPermission && (
            <Drawer.Screen
              name="Entregar pulseira"
              component={DeliverBraceletDrawerScreen}
            />
          )}
          {eventPermissions.hasBraceletRegistrationPermission && (
            <Drawer.Screen
              name="Registrar Qr Code"
              component={BraceletRegistrationDrawerScreen}
            />
          )}
          {eventPermissions.hasManualRegistrationPermission && (
            <Drawer.Screen
              name="Cadastro manual"
              component={ManualRegisterScreen}
            />
          )}
          {eventPermissions.hasManualBoxOfficeRegistrationPermission && (
            <Drawer.Screen
              name="Cadastro - Bilheteria"
              component={TicketOfficeManualRegisterScreen}
            />
          )}
          {eventPermissions.hasItinerariesPermission && (
            <Drawer.Screen name="Itinerários" component={ItinerariesScreen} />
          )}
          {eventPermissions.hasPhotoReregisterPermission && (
            <Drawer.Screen
              name="Recadastrar foto"
              component={PhotoReregisterDrawerScreen}
            />
          )}
          {!hasOnlyOneEvent && (
            <Drawer.Screen
              name="Mudar evento"
              component={EventSelectionDrawerScreen}
            />
          )}
          {eventPermissions.canCreateTicket && (
            <Drawer.Screen name="Novo ingresso" component={NewTicket} />
          )}
          {eventPermissions.canCreateTicket && (
            <Drawer.Screen name="Cadastro rápido" component={NewFastTicket} />
          )}
          {eventPermissions.canChangeUserEmail && (
            <Drawer.Screen name="Alterar e-mail" component={ChangeEmail} />
          )}
        </Drawer.Navigator>
      ) : (
        <Stack.Navigator>
          <Stack.Group screenOptions={{headerShown: false}}>
            {userToken ? (
              <Stack.Screen
                name="Mudar evento"
                component={EventSelectionScreen}
                options={{headerShown: false}}
              />
            ) : (
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{headerShown: false}}
              />
            )}
          </Stack.Group>
        </Stack.Navigator>
      )}
    </>
  );
}

export default Navigators;
