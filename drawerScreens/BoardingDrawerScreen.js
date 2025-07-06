import { View } from 'react-native';
import React, { useState, useContext } from 'react';
import GStyles from '../style/global';
import Header from '../components/Header';
import Loading from '../components/Loading';
import THEME from '../style/theme';
import { Button, Input, Text, Divider } from '@rneui/themed';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';

const BoardingDrawerScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const authContext = useContext(AuthContext);

  
  return (
    <View style={{ ...GStyles.view }}>
      <Header
        style={{ marginBottom: 0 }}
        openDrawer={() => navigation.openDrawer()}
      />
      <View style={{ width: '100%', backgroundColor: THEME.cor.whitesmoke }}>
        <Text h3 h3Style={{ padding: 8, textAlign: 'center' }}>
          Embarque
        </Text>
        <Divider />
      </View>
      
      <Loading isActive={loading} />
    </View>
  );
};

export default BoardingDrawerScreen;
