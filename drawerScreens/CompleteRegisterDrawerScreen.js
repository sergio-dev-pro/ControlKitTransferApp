import { Alert, View } from 'react-native';
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import GStyles from '../style/global';
import Header from '../components/Header';
import THEME from '../style/theme';
import { Text, Divider } from '@rneui/themed';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import Button from '../components/Button';
import { completeUserRegister } from '../api/UserApi';

const CompleteRegisterDrawerScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const { userToken, selectedEventId } = useContext(AuthContext);

  const { showAlert } = useAlert();

  return (
    <View style={{ ...GStyles.view }}>
      <Header
        style={{ marginBottom: 0 }}
        openDrawer={() => navigation.openDrawer()}
      />
      <View style={{ width: '100%', backgroundColor: THEME.cor.whitesmoke, flex: 1 }}>
        <Text h3 h3Style={{ padding: 8, textAlign: 'center' }}>
          Completar cadastro
        </Text>
        <Divider />


        
      </View>

    </View>
  );
};

export default CompleteRegisterDrawerScreen;