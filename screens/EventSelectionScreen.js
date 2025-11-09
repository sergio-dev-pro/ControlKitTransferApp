import { ListItem } from '@rneui/base';
import { Text } from '@rneui/themed';
import React, { useContext, useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import AuthHeader from '../components/AuthHeader';
import Button from '../components/Button';
import Loading from '../components/Loading';
import { AuthContext } from '../context/AuthContext';
import GStyles from '../style/global';
import AsyncStorage from '@react-native-async-storage/async-storage';

function EventSelectionScreen() {
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const { setSelectedEventId, companies, setPermission } = useContext(AuthContext);

  const selectedCompany = companies?.find(c => c.id === selectedCompanyId);


  useEffect(() => {
    const saveCompanyId = async () => {
      if (selectedCompanyId) {
        await AsyncStorage.setItem('userCompanyId', JSON.stringify(selectedCompanyId));
      }
    };

    saveCompanyId();
  }, [selectedCompanyId]);

  return (
    <View style={GStyles.view}>
      <AuthHeader />
      <View style={GStyles.container}>
        <Text h3 h3Style={{ textAlign: 'center', marginBottom: 20 }}>
          {selectedCompanyId ? 'Selecione o evento' : 'Selecione a empresa'}
        </Text>

        {selectedCompanyId && (
          <Button
            onPress={() => setSelectedCompanyId(null)}
            title="Voltar para empresas"
            type="clear"
            containerStyle={{ marginBottom: 10 }}
          />
        )}

        <FlatList
          data={selectedCompanyId ? selectedCompany?.events || [] : companies}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ListItem containerStyle={GStyles.maxWidth}>
              <Button
                onPress={() => {
                  if (selectedCompanyId) {
                    setSelectedEventId(item.id, item.kitDeliveryMode, item.canManageBraceletDelivery, item.braceletDeliveryMode);
                    setPermission(item.permissions);
                  } else {
                    setSelectedCompanyId(item.id); // Aqui seleciona a empresa
                  }
                }}
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
