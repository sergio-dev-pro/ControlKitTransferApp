import {Text} from '@rneui/themed';
import React, {useContext} from 'react';
import GStyles from '../style/global';
import {ListItem} from '@rneui/base';
import {FlatList, View} from 'react-native';
import Button from '../components/Button';
import {AuthContext} from '../context/AuthContext';
import Header from '../components/Header';

function EventSelectionDrawerScreen({navigation}) {
  const {setSelectedEventId, selectedEventId, events} = useContext(AuthContext);
  const handleEventSelection = async eventId => {
    setSelectedEventId(eventId);
    navigation.navigate('Kits');
  };

  return (
    <View style={{...GStyles.view}}>
      <Header openDrawer={() => navigation.openDrawer()} />
      <View style={GStyles.container}>
        <Text h3>Eventos</Text>
        <FlatList
          data={events}
          renderItem={({item}) => (
            <ListItem containerStyle={GStyles.maxWidth} key={item.id}>
              <Button
                onPress={() => handleEventSelection(item.id)}
                type={selectedEventId === item.id ? 'solid' : 'outline'}
                size="lg"
                containerStyle={{width: '100%'}}
                titleStyle={{fontWeight: 'bold', fontSize: 20}}>
                {item.name}
              </Button>
            </ListItem>
          )}
        />
      </View>
    </View>
  );
}

export default EventSelectionDrawerScreen;
