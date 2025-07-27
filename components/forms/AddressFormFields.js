import { Input, Text } from '@rneui/themed';
import { View, FlatList } from 'react-native';
import React from 'react';
import SelectModal from '../../components/SelectModal';

export default function AddressFormFields({
  address,
  setAddress,
  stateSuggestions,
  setStateSuggestions,
  labelPrefix = '',
}) {
  const brazilianStates = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT',
    'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

  return (
    <>
      <Text h4 style={{ marginTop: 20, marginBottom: 10 }}>
        Endereço:
      </Text>

      <Input
        label={`${labelPrefix}Rua`}
        placeholder="Ex: Avenida Paulista"
        value={address.street}
        onChangeText={text => setAddress(prev => ({ ...prev, street: text }))}
      />
      <Input
        label={`${labelPrefix}Número`}
        placeholder="Ex: 1000"
        keyboardType="numeric"
        value={address.number}
        onChangeText={text => setAddress(prev => ({ ...prev, number: text }))}
      />
      <Input
        label={`${labelPrefix}Complemento`}
        placeholder="Ex: Apto 101, Bloco B"
        value={address.complement}
        onChangeText={text => setAddress(prev => ({ ...prev, complement: text }))}
      />
      <Input
        label={`${labelPrefix}Bairro`}
        placeholder="Ex: Centro"
        value={address.neighborhood}
        onChangeText={text => setAddress(prev => ({ ...prev, neighborhood: text }))}
      />
      <Input
        label={`${labelPrefix}Cidade`}
        placeholder="Ex: São Paulo"
        value={address.city}
        onChangeText={text => setAddress(prev => ({ ...prev, city: text }))}
      />
      <SelectModal
        label={`${labelPrefix}Estado`}
        placeholder="Selecione o estado"
        items={brazilianStates.map(uf => ({ key: uf, value: uf }))}
        value={address.state}
        setValue={(value) => setAddress(prev => ({ ...prev, state: value }))}
      />

      {stateSuggestions.length > 0 && (
        <View style={{ paddingHorizontal: 10 }}>
          <FlatList
            data={stateSuggestions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Text
                onPress={() => {
                  setAddress(prev => ({ ...prev, state: item }));
                  setStateSuggestions([]);
                }}
                style={{
                  padding: 10,
                  backgroundColor: '#eee',
                  marginBottom: 2,
                  borderRadius: 4,
                }}>
                {item}
              </Text>
            )}
          />
        </View>
      )}
      <Input
        label={`${labelPrefix}CEP`}
        placeholder="Ex: 01311-200"
        keyboardType="numeric"
        value={address.zipcode}
        onChangeText={text => setAddress(prev => ({ ...prev, zipcode: text }))}
      />
    </>
  );
}
