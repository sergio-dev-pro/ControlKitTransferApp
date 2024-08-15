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

function Navigators() {
  const {
    userToken,
    selectedEventId,
    events,
    canCreateTicket,
    canChangeEmail,
    hasBraceletDeliveryPermission,
    hasBraceletRegistrationPermission,
    hasChangeEmailPermission,
    hasItinerariesPermission,
    hasKitDeliveryPermission,
    hasManualBoxOfficeRegistrationPermission,
    hasManualRegistrationPermission,
    hasNewTicketPermission,
    hasPhotoReregisterPermission,
  } = React.useContext(AuthContext);
  const hasOnlyOneEvent = events && events.length === 1;
  
  return (
    <>
      {userToken && selectedEventId ? (
        <Drawer.Navigator
          initialRouteName="Kits"
          screenOptions={{
            headerShown: false,
            drawerLabelStyle: {
              fontSize: 23,
            },
            drawerContentStyle: {
              marginTop: 16,
            },
          }}>
          {hasKitDeliveryPermission && (
            <Drawer.Screen name="Kits" component={KitsDrawerScreen} />
          )}
          {hasBraceletDeliveryPermission && (
            <Drawer.Screen
              name="Entregar pulseira"
              component={DeliverBraceletDrawerScreen}
            />
          )}
          {hasBraceletRegistrationPermission && (
            <Drawer.Screen
              name="Registrar pulseira"
              component={BraceletRegistrationDrawerScreen}
            />
          )}
          {hasManualRegistrationPermission && (
            <Drawer.Screen
              name="Cadastro manual"
              component={ManualRegisterScreen}
            />
          )}
          {hasManualBoxOfficeRegistrationPermission && (
            <Drawer.Screen
              name="Cadastro - Bilheteria"
              component={TicketOfficeManualRegisterScreen}
            />
          )}
          {hasItinerariesPermission && (
            <Drawer.Screen name="Itinerários" component={ItinerariesScreen} />
          )}
          {hasPhotoReregisterPermission && (
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
          {canCreateTicket && hasNewTicketPermission && (
            <Drawer.Screen name="Novo ingresso" component={NewTicket} />
          )}
          {canCreateTicket && (
            <Drawer.Screen name="Cadastro rápido" component={NewFastTicket} />
          )}
          {canChangeEmail && hasChangeEmailPermission && (
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
