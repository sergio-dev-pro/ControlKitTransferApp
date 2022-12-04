import React, {createContext, useContext, useReducer} from 'react';

export const initialState = {
  phone: '',
  birthDate: '',
  genre: null,
  measurements: {
    shirt: null,
    blacelet: null,
    shoe: null,
  },
  address: {
    street: '',
    zipcode: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  },
  invalidFields: [],
};

export const RegisterStateContext = createContext(initialState);

export const useRegisterState = () => {
  const context = useContext(RegisterStateContext);
  return context;
};
