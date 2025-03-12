import { ListItem } from '@rneui/base';
import { Text } from '@rneui/themed';
import React, { useContext, useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import AuthHeader from '../components/AuthHeader';
import Button from '../components/Button';
import Loading from '../components/Loading';
import { AuthContext } from '../context/AuthContext';
import GStyles from '../style/global';
import { getEventsList } from '../api/EventApi';
import BASE_URL_V2 from '../constants/api2';

function EventSelectionScreen() {
  const [listEvents, setListEvents] = useState([]); // Corrigido!
  const [loading, setLoading] = useState(true);

  const { setSelectedEventId, userToken } = useContext(AuthContext);
  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await getEventsList(userToken);
        console.log('Eventos retornados:', response); // Verifica o retorno da API
        setListEvents(response);
      } catch (error) {
        console.error('Erro ao carregar eventos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [userToken]); 

  if (loading) {
    return (
      <View style={GStyles.view}>
        <AuthHeader />
        <View style={GStyles.container}>
          <Loading isActive />
        </View>
      </View>
    );
  }

  console.log(listEvents)

  return (
    <View style={GStyles.view}>
      <AuthHeader />
      <View style={GStyles.container}>
        <Text h3 h3Style={{ textAlign: 'center' }}>Selecione o evento</Text>
        <FlatList
          data={listEvents} // Agora correto!
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ListItem containerStyle={GStyles.maxWidth}>
              <Button
                onPress={() => setSelectedEventId(item.id)}
                size="lg"
                type="outline"
                containerStyle={{ width: '100%' }}
                titleStyle={{ fontWeight: 'bold', fontSize: 20 }}
              >
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
