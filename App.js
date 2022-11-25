import * as React from 'react';
import {DefaultTheme, NavigationContainer} from '@react-navigation/native';
import {AuthProvider} from './context/AuthContext';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {ThemeProvider, createTheme} from '@rneui/themed';
import THEME from './style/theme';
import Navigators from './navigators/Navigators';

const theme = createTheme({
  lightColors: {
    primary: THEME.cor.primary,
    black: THEME.cor.black,
  },
});

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: THEME.cor.primary,
  },
};

function App() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <SafeAreaProvider>
        <ThemeProvider theme={theme}>
          <AuthProvider>
            <Navigators />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </NavigationContainer>
  );
}

export default App;
