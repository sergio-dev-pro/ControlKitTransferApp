import {ListItem} from '@rneui/base';
import React, {useContext} from 'react';
import {FlatList, View} from 'react-native';
import AuthHeader from '../components/AuthHeader';
import Button from '../components/Button';
import {AuthContext} from '../context/AuthContext';
import GStyles from '../style/global';

function EventSelectionScreen() {
  const {setSelectedEventId, events} = useContext(AuthContext);
  const handleEventSelection = async eventId => {
    setSelectedEventId(eventId);
  };

  return (
    <View style={GStyles.view}>
      <AuthHeader />
      <View style={GStyles.container}>
        <FlatList
          data={events}
          renderItem={({item}) => (
            <ListItem containerStyle={GStyles.maxWidth} key={item.id}>
              <Button
                onPress={() => handleEventSelection(item.id)}
                size="lg"
                type="outline"
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

export default EventSelectionScreen;
