import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useEffect, useState } from 'react';
import jwt_decode from 'jwt-decode';
import axios from 'axios';
import { BASE_URL } from '../constants/api';
import { useAlert } from './AlertContext';
import { getEventRequiredFields, getKitDelivery } from '../api/EventApi';
import BASE_URL_V2 from '../constants/api2';
import { setupAxiosInterceptor } from '../api/InterceptorApi';
import { getAndroidId } from 'react-native-device-info';

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
  kitDeliveryMode: null,
  braceletDeliveryMode: null
};

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(initialState);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isSearchingEventSettings, setIsSearchingEventSettings] =
    useState(false);
  const setAlertMessage = useAlert();

  const updateTokens = ({ accessToken, refreshToken }) => {
    setAuthState((prev) => ({
      ...prev,
      userToken: accessToken,
      refreshToken: refreshToken,
    }));
  };

  useEffect(() => {
  getUserToken().then(() => {
    //setupAxiosInterceptor(updateTokens);
  });
  }, []);

  

  const getUserToken = async () => {
    const token = await AsyncStorage.getItem('userToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    const companiesString = await AsyncStorage.getItem('userCompanies');
    if (token) {
      const eventInJsonFormat = await AsyncStorage.getItem('event');
      const event = JSON.parse(eventInJsonFormat);
      var decodedToken = jwt_decode(token);
      // const events = decodedToken?.Events ? JSON.parse(decodedToken.Events) : [];
      const companies = companiesString ? JSON.parse(companiesString) : [];
      setAuthState({
        userToken: token,
        refreshToken: refreshToken,
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
        companies: companies,
        kitDeliveryMode: event?.kitDeliveryMode,
        braceletDeliveryMode: event?.braceletDeliveryMode,
        braceletDeliveryRequireSignature: event?.braceletDeliveryRequireSignature,
        canManageBraceletDelivery: event?.canManageBraceletDelivery
      });
    } else {
      console.log('sem token')
    }
    setIsAuthenticating(false);
  };

  const setSelectedEventId = async (id, kitdeliveryMode, canManageBraceletDelivery, braceletDeliveryMode, braceletDeliveryRequireSignature) => {
    try {
      setIsSearchingEventSettings(true);
      //const { data: requiredFieldsForUserRegistration } = await getEventRequiredFields(id);

      await AsyncStorage.setItem(
        'event',
        JSON.stringify({
          id: id.toString(),
          kitDeliveryMode: kitdeliveryMode,
          braceletDeliveryMode: braceletDeliveryMode,
          canManageBraceletDelivery: canManageBraceletDelivery,
          braceletDeliveryRequireSignature: braceletDeliveryRequireSignature
        }),
      );
      setIsSearchingEventSettings(false);
      setAuthState(prevState => ({
        ...prevState,
        selectedEventId: id,
        kitDeliveryMode: kitdeliveryMode,
        braceletDeliveryMode: braceletDeliveryMode,
        canManageBraceletDelivery: canManageBraceletDelivery,
        braceletDeliveryRequireSignature: braceletDeliveryRequireSignature
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

  const confirmLogin = async (code, document) => {
    setIsAuthenticating(true);
    var deviceId = await getAndroidId();
    console.log('@@@deviceId='+ deviceId);
    try {
      const url = BASE_URL_V2 + '/companyusers/loginConfirm';
      const dataResponse = await axios({
        url,
        method: 'POST',
        data: { code, document },
        headers: {
          Accept: 'text/plain',
          'Content-Type': 'application/json-patch+json',
          'X-Device-Id': deviceId
        },
      });

      var token = dataResponse.data.accessToken;
      var refreshToken = dataResponse.data.refreshToken;
      // save token in async storage.
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('userCompanies', JSON.stringify(dataResponse.data.companies));
      // decode token to get events.
      var decodedToken = jwt_decode(token);
      console.log('decodedToken=' + JSON.stringify(decodedToken));

      const selectedEventId = null;

      let authStateChanges = {
        userToken: token,
        refreshToken: refreshToken,
        isAuthenticated: true,
        //events,
        selectedEventId,
        companies: dataResponse.data.companies,
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


  const authenticateUser = async loginData => {
    setIsAuthenticating(true);
    try {
      const url = BASE_URL_V2 + '/companyusers/login';
      await axios({
        url,
        method: 'POST',
        data: loginData,
        headers: {
          Accept: 'text/plain',
          'Content-Type': 'application/json-patch+json',
          'X-Device-Id': await getAndroidId()
        },
      });

      return true;
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

  const setPermission = (selectedEventPermissions) => {
    setAuthState(prevState => ({
      ...prevState,
      permissions: selectedEventPermissions,
    }));
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        isAuthenticating,
        confirmLogin,
        authenticateUser,
        resetInitialState,
        setAuthState,
        setIsAuthenticating,
        setSelectedEventId,
        setPermission,
        logout,
        setUserToken,
        isSearchingEventSettings,

      }}>
      {children}
    </AuthContext.Provider>
  );
}
