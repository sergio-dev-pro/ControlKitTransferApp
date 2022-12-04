import * as React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createDrawerNavigator} from '@react-navigation/drawer';

import LoginScreen from '../screens/LoginScreen';
import EventSelectionScreen from '../screens/EventSelectionScreen';
import {AuthContext} from '../context/AuthContext';
import KitsDrawerScreen from '../drawerScreens/KitsDrawerScreen';
import EventSelectionDrawerScreen from '../drawerScreens/EventSelectionDrawerScreen';
import ManualRegisterScreen from '../drawerScreens/ManualRegisterScreen';
// import CustomDrawer from '../components/CustomDrawer';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

function Navigators() {
  const {userToken, selectedEventId, events} = React.useContext(AuthContext);
  console.log('userToken', userToken, 'selectedEventId', selectedEventId);
  const hasOnlyOneEvent = events && events.length === 1;
  return (
    <>
      {userToken && selectedEventId ? (
        <Drawer.Navigator
          initialRouteName="Cadastro manual"
          screenOptions={{
            headerShown: false,
            drawerLabelStyle: {
              fontSize: 25,
            },
            drawerContentStyle: {
              marginTop: 16,
            },
          }}>
          <Drawer.Screen name="Kits" component={KitsDrawerScreen} />
          <Drawer.Screen
            name="Cadastro manual"
            component={ManualRegisterScreen}
          />
          {!hasOnlyOneEvent && (
            <Drawer.Screen
              name="Mudar evento"
              component={EventSelectionDrawerScreen}
            />
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
