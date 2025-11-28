import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

import LoginScreen from '../screens/LoginScreen';
import EventSelectionScreen from '../screens/EventSelectionScreen';
import { AuthContext } from '../context/AuthContext';
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
import ManualRegisterByTickets from '../drawerScreens/ManualRegisterScreen/ManualRegisterByTickets';
import BoardingDrawerScreen from '../drawerScreens/BoardingDrawerScreen';
import CompleteRegisterDrawerScreen from '../drawerScreens/CompleteRegisterDrawerScreen';

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
    canManageBraceletDelivery,
    logout,
  } = React.useContext(AuthContext);

  const hasOnlyOneEvent = events && events.length === 1;

  const eventPermissions =
    selectedEventId &&
    permissions &&
    permissions;

  if (userToken && selectedEventId && !eventPermissions) {
    logout();
  }

  const initialRoute =
    eventPermissions && getRouteNameByPermission(eventPermissions);
  return (
    <>
      {userToken && selectedEventId && eventPermissions ? (
        <Drawer.Navigator
         key={selectedEventId}
          screenOptions={{
            headerShown: false,
            drawerLabelStyle: {
              fontSize: 23,
            },
            drawerContentStyle: {
              marginTop: 16,
            },
          }}>
          {eventPermissions.includes("page.delivery.kit") && (
            <Drawer.Screen name="Kits" component={KitsDrawerScreen} />
          )}
          {eventPermissions.includes("page.ticket.accesskeys.add") && (
            <Drawer.Screen
              name="Registrar Qr Code"
              component={BraceletRegistrationDrawerScreen}
            />
          )}
          {eventPermissions.includes("page.user.retake.photo") && (
            <Drawer.Screen
              name="Recadastrar foto"
              component={PhotoReregisterDrawerScreen}
            />
          )}
          {eventPermissions.includes("page.user.update.email") && (
            <Drawer.Screen name="Completar cadastro" component={CompleteRegisterDrawerScreen} />
          )}
          {eventPermissions.includes("page.user.update.email") && (
            <Drawer.Screen name="Alterar e-mail" component={ChangeEmail} />
          )}
          {eventPermissions.includes("page.delivery.bracelet") && canManageBraceletDelivery && (
            <Drawer.Screen
              name="Checkin"
              component={DeliverBraceletDrawerScreen}
            />
          )}
          {eventPermissions.includes("page.ticket.add") && (
            <Drawer.Screen name="Gerar ingresso" component={NewFastTicket} />
          )}
          {!hasOnlyOneEvent && (
            <Drawer.Screen
              name="Mudar evento"
              component={EventSelectionDrawerScreen}
            />
          )}
          {eventPermissions.includes("page.transport.boarding.add") && (
            <Drawer.Screen name="Embarque" component={BoardingDrawerScreen} />
          )}
        </Drawer.Navigator>
      ) : (
        <Stack.Navigator>
          <Stack.Group screenOptions={{ headerShown: false }}>
            {userToken ? (
              <>
                <Stack.Screen name="Mudar evento" component={EventSelectionScreen} />
              </>
            ) : (
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ headerShown: false }}
              />
            )}
          </Stack.Group>
        </Stack.Navigator>
      )}
    </>
  );
}

export default Navigators;
