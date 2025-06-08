import { Input, Text } from '@rneui/themed';
import { View, FlatList } from 'react-native';
import React from 'react';

export default function AddressFormFields({ address, setAddress, stateSuggestions, setStateSuggestions, labelPrefix = '' }) {
  const brazilianStates = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT',
    'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

  return (
    <>
      <Input label={`${labelPrefix}Rua`} value={address.street} onChangeText={text => setAddress(prev => ({ ...prev, street: text }))} />
      <Input label={`${labelPrefix}Número`} keyboardType="numeric" value={address.number} onChangeText={text => setAddress(prev => ({ ...prev, number: text }))} />
      <Input label={`${labelPrefix}Complemento`} value={address.complement} onChangeText={text => setAddress(prev => ({ ...prev, complement: text }))} />
      <Input label={`${labelPrefix}Bairro`} value={address.neighborhood} onChangeText={text => setAddress(prev => ({ ...prev, neighborhood: text }))} />
      <Input label={`${labelPrefix}Cidade`} value={address.city} onChangeText={text => setAddress(prev => ({ ...prev, city: text }))} />
      <Input
        label={`${labelPrefix}Estado`}
        value={address.state}
        onChangeText={text => {
          const formatted = text.toUpperCase();
          setAddress(prev => ({ ...prev, state: formatted }));
          const filtered = brazilianStates.filter(uf => uf.startsWith(formatted));
          setStateSuggestions(formatted.length ? filtered : []);
        }}
        autoCapitalize="characters"
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
      <Input label={`${labelPrefix}CEP`} keyboardType="numeric" value={address.zipcode} onChangeText={text => setAddress(prev => ({ ...prev, zipcode: text }))} />
    </>
  );
}
