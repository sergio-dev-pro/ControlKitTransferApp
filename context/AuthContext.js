import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {createContext, useEffect, useState} from 'react';
import jwt_decode from 'jwt-decode';
import axios from 'axios';
import BASE_URL from '../constants/api';
export const AuthContext = createContext();

const initialState = {
  error: null,
  userToken: null,
  selectedEventId: null,
  isAuthenticated: false,
  events: null,
};

export function AuthProvider({children}) {
  const [authState, setAuthState] = useState(initialState);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  useEffect(() => {
    getUserToken();
  }, []);

  const getUserToken = async () => {
    await AsyncStorage.getItem('userToken').then(async token => {
      if (token) {
        const eventId = await AsyncStorage.getItem('eventId');
        var decodedToken = jwt_decode(token);
        const events = JSON.parse(decodedToken.Events);
        setAuthState({
          userToken: token,
          isAuthenticated: true,
          selectedEventId: eventId || null,
          events,
        });
      }
    });
    setIsAuthenticating(false);
  };

  const setSelectedEventId = async id => {
    try {
      await AsyncStorage.setItem('eventId', id);
      setAuthState(prevState => ({...prevState, selectedEventId: id}));
    } catch (e) {
      console.error(e);
    }
  };

  const authenticateUser = async loginData => {
    setIsAuthenticating(true);
    try {
      const url = BASE_URL + '/api/users/loginOperator';
      const {data: token} = await axios({
        url,
        method: 'POST',
        data: loginData,
        headers: {
          Accept: 'text/plain',
          'Content-Type': 'application/json-patch+json',
        },
      });
      // save token in async storage.
      await AsyncStorage.setItem('userToken', token);
      // decode token to get events.
      var decodedToken = jwt_decode(token);
      const events = JSON.parse(decodedToken.Events);
      // Se tiver apenas um evento, nao precisa ir para tela de selecao.
      const selectedEventId =
        events.length === 1 ? events[0].id.toString() : null;
      selectedEventId &&
        (await AsyncStorage.setItem('eventId', selectedEventId));
      let authStateChanges = {
        userToken: token,
        isAuthenticated: true,
        events,
        selectedEventId,
      };
      setAuthState(prevState => ({
        ...prevState,
        ...authStateChanges,
      }));
    } catch (error) {
      console.log(error);
      alert(error.response.data.errors);
      return null;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'eventId']);
      setAuthState(initialState);
    } catch (e) {
      console.error(e);
    }
  };
  const resetInitialState = () => {
    setAuthState(initialState);
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        isAuthenticating,
        authenticateUser,
        resetInitialState,
        setAuthState,
        setIsAuthenticating,
        setSelectedEventId,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
