import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useEffect, useState } from 'react';
import jwt_decode from 'jwt-decode';
import axios from 'axios';
import { BASE_URL } from '../constants/api';
import { useAlert } from './AlertContext';
import { getEventRequiredFields } from '../api/EventApi';
import BASE_URL_V2 from '../constants/api2';

export const AuthContext = createContext();

const getRequiredForms = requiredFields => {
  const {
    addressIsRequired,
    birthDateIsRequired,
    genreIsRequired,
    blaceletSizeIsRequired,
    footSizeIsRequired,
    shirtSizeIsRequired,
    photoIsRequired,
  } = requiredFields;
  let requiredForms = [
    {
      id: 'details',
      name: 'Detalhes',
      validation: () => {
        console.log('validing form');
      },
      formConfig: { birthDateIsRequired, genreIsRequired },
    },
  ];
  const hasSizesForm =
    shirtSizeIsRequired || footSizeIsRequired || blaceletSizeIsRequired;
  if (hasSizesForm)
    requiredForms.push({
      id: 'accessories',
      name: 'Acessórios',
      validation: () => {
        console.log('validing form');
      },
      formConfig: {
        blaceletSizeIsRequired,
        footSizeIsRequired,
        shirtSizeIsRequired,
      },
    });
  if (addressIsRequired)
    requiredForms.push({
      id: 'address',
      name: 'Endereço',
      validation: () => {
        console.log('validing form');
      },
    });
  if (photoIsRequired)
    requiredForms.push({
      id: 'photo',
      name: 'Fotografia',
    });

  return requiredForms;
};

const initialState = {
  error: null,
  userToken: null,
  selectedEventId: null,
  isAuthenticated: false,
  events: null,
  requiredForms: null,
};

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(initialState);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isSearchingEventSettings, setIsSearchingEventSettings] =
    useState(false);
  const setAlertMessage = useAlert();

  useEffect(() => {
    getUserToken();
  }, []);

  const getUserToken = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      const eventInJsonFormat = await AsyncStorage.getItem('event');
      const event = JSON.parse(eventInJsonFormat);
      var decodedToken = jwt_decode(token);
      console.log('@@@decodedToken', decodedToken);
     // const events = decodedToken?.Events ? JSON.parse(decodedToken.Events) : [];
      setAuthState({
        userToken: token,
        hasBraceletDeliveryPermission: decodedToken?.hasBraceletDeliveryPermission === "true",
        hasBraceletRegistrationPermission: decodedToken?.hasBraceletRegistrationPermission === "true",
        hasChangeEmailPermission: decodedToken?.hasChangeEmailPermission === "true",
        hasItinerariesPermission: decodedToken?.hasItinerariesPermission === "true",
        hasKitDeliveryPermission: decodedToken?.hasKitDeliveryPermission === "true",
        hasManualBoxOfficeRegistrationPermission: decodedToken?.hasManualBoxOfficeRegistrationPermission === "true",
        hasManualRegistrationPermission: decodedToken?.hasManualRegistrationPermission === "true",
        hasNewTicketPermission: decodedToken?.hasNewTicketPermission === "true",
        hasPhotoReregisterPermission: decodedToken?.hasPhotoReregisterPermission === "true",
        canCreateTicket: decodedToken.CanCreateTicket,
        canChangeEmail: decodedToken.CanChangeEmail,
        // // TODO: setado temporariamente para testar, excluir linha a baixo.
        // token: 'ZiU3aYBWAg1LPl+061DrVA==',
        isAuthenticated: true,
        selectedEventId: parseInt(event?.id),
        //requiredForms: event?.requiredForms,
       // events,
        permissions: decodedToken.Permissions ? JSON.parse(decodedToken.Permissions) : null,
      });
    } else {
      console.log('sem token')
    }
    setIsAuthenticating(false);
  };

  const setSelectedEventId = async id => {
    try {
      console.log('selectedEventIdNow=' + id)
      setIsSearchingEventSettings(true);
      //const { data: requiredFieldsForUserRegistration } = await getEventRequiredFields(id);

      await AsyncStorage.setItem(
        'event',
        JSON.stringify({
          id: id.toString(),
          //requiredForms: getRequiredForms(requiredFieldsForUserRegistration),
        }),
      );
      setIsSearchingEventSettings(false);
      setAuthState(prevState => ({
        ...prevState,
        selectedEventId: id,
        //requiredForms: getRequiredForms(requiredFieldsForUserRegistration),
      }));
    } catch (e) {
      console.log(e.response?.data?.errors)
      console.error(e);
    }
  };

  const setUserToken = token => {
    setAuthState(prevState => ({
      ...prevState,
      token,
    }));
  };

  const authenticateUser = async loginData => {
    setIsAuthenticating(true);
    try {
      const url = BASE_URL_V2 + '/users/login';
      const dataResponse = await axios({
        url,
        method: 'POST',
        data: loginData,
        headers: {
          Accept: 'text/plain',
          'Content-Type': 'application/json-patch+json',
        },
      });
      var token = dataResponse.data.accessToken;
      // save token in async storage.
      await AsyncStorage.setItem('userToken', token);
      // decode token to get events.
      var decodedToken = jwt_decode(token);
      console.log('decodedToken=' + JSON.stringify(decodedToken));
      //const events = JSON.parse(decodedToken.Events);
      // Se tiver apenas um evento, nao precisa ir para tela de selecao.
      const selectedEventId = null;

      // const eventRequiredFields = selectedEventId
      //   ? await getEventRequiredFields(selectedEventId)
      //   : null;
      // const requiredForms = eventRequiredFields
      //   ? getRequiredForms(eventRequiredFields.data)
      //   : null;
      let authStateChanges = {
        userToken: token,
        isAuthenticated: true,
        //events,
        selectedEventId,
        permissions: JSON.parse(decodedToken.Permissions),
        hasBraceletDeliveryPermission: decodedToken?.hasBraceletDeliveryPermission === "true",
        hasBraceletRegistrationPermission: decodedToken?.hasBraceletRegistrationPermission === "true",
        hasChangeEmailPermission: decodedToken?.hasChangeEmailPermission === "true",
        hasItinerariesPermission: decodedToken?.hasItinerariesPermission === "true",
        hasKitDeliveryPermission: decodedToken?.hasKitDeliveryPermission === "true",
        hasManualBoxOfficeRegistrationPermission: decodedToken?.hasManualBoxOfficeRegistrationPermission === "true",
        hasManualRegistrationPermission: decodedToken?.hasManualRegistrationPermission === "true",
        hasNewTicketPermission: decodedToken?.hasNewTicketPermission === "true",
        hasPhotoReregisterPermission: decodedToken?.hasPhotoReregisterPermission === "true",
        canCreateTicket: decodedToken.CanCreateTicket === 'True',
        canChangeEmail: decodedToken.CanChangeEmail === 'True',
      };
      // if (requiredForms) {
      //   authStateChanges.requiredForms = requiredForms;
      //   try {
      //     await AsyncStorage.setItem(
      //       'event',
      //       JSON.stringify({
      //         id: selectedEventId.toString(),
      //         requiredForms,
      //       }),
      //     );
      //   } catch (error) {
      //     console.error(error);
      //   }
      // }
      setAuthState(prevState => ({
        ...prevState,
        ...authStateChanges,
      }));
    } catch (error) {
      console.log(error);
      setAlertMessage(error.response.data.message);
      return null;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'event']);
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
        setUserToken,
        isSearchingEventSettings,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
