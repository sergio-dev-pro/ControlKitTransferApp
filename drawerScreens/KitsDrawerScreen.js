import {Text} from '@rneui/themed';
import React from 'react';
import {View} from 'react-native';
import Header from '../components/Header';
import GStyles from '../style/global';

function KitsDrawerScreen({navigation}) {
  return (
    <View style={{...GStyles.view}}>
      <Header openDrawer={() => navigation.openDrawer()} />
      <View style={GStyles.container}>
        <Text h3>Kits</Text>
      </View>
    </View>
  );
}

export default KitsDrawerScreen;
