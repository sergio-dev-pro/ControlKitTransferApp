import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  FlatList,
} from 'react-native';
import {
  Button,
  CheckBox,
  Divider,
  Input,
  Text,
} from '@rneui/themed';
import { useMaskedInputProps } from 'react-native-mask-input';

import Header from '../../components/Header';
import Loading from '../../components/Loading';
import GStyles from '../../style/global';
import THEME from '../../style/theme';
import { completeManualRegisterByTickets } from '../../api/UserApi';
import { AuthContext } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { cpfValidation } from '../../helpers/validation';

const ManualRegisterByTickets = ({ navigation, route }) => {
  const { user: initialUser, cpf: initialCpf } = route.params;
  const [cpf, setCpf] = useState(initialCpf || initialUser.id);

  const [user, setUser] = useState(initialUser);

  const [selectedEventKeys, setSelectedEventKeys] = useState([]);
  const [countryCode, setCountryCode] = useState('');
  const [dialCode, setDialCode] = useState('');
  const [nationalNumber, setNationalNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const authContext = useContext(AuthContext);
  const setAlertMessage = useAlert();

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const maskedCPFInputProps = useMaskedInputProps({
    value: cpf,
    onChangeText: setCpf,
    mask: [/\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/],
  });

  const handleToggleTicket = code => {
    setSelectedEventKeys(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleNextStep = () => {
    if (selectedEventKeys.length === 0) {
      alert('', 'Selecione ao menos um ingresso.');
      return;
    }
    setStep(2);
  };

  const handleCompleteRegister = async () => {

    const cleanCpf = cpf.replace(/[^\d]/g, '');

    if (!cpfValidation(cleanCpf)) {
      alert('', 'CPF inválido. Verifique o número digitado.');
      return;
    }

    if (
      countryCode.length < 1 || countryCode.length > 3 ||
      dialCode.length < 1 || dialCode.length > 4 ||
      nationalNumber.length < 6 || nationalNumber.length > 12
    ) {
      alert('Preencha um número de telefone válido.');
      return;
    }

    setLoading(true);

    const payload = {
      eventId: authContext.selectedEventId,
      document: cpf.replace(/[^\d]/g, ''),
      phone: {
        countryCode,
        dialCode,
        nationalNumber,
        internationalNumber: `+${countryCode}${dialCode}${nationalNumber}`,
      },
      accessKeys: selectedEventKeys,
    };

    try {
      const response = await completeManualRegisterByTickets(payload, authContext.userToken);
      setAlertMessage('Cadastro finalizado com sucesso!');
      console.log('✅ Status:', response.status);
      console.log('📦 Dados:', response);
      // Voltar para step 1 após sucesso
    } catch (error) {
      console.error('❌ Erro no cadastro:', error);
      if (error.response?.data?.errors) {
        alert(error.response.data.errors);
      } else {
        alert('Erro inesperado ao cadastrar. Tente novamente.');
      }
    } finally {
      handleClear()
      setLoading(false);
    }

    console.log('Payload JSON enviado:', JSON.stringify(payload, null, 2));
  };

  const handleClear = () => {
    setSelectedEventKeys([]);
    setCountryCode('');
    setDialCode('');
    setNationalNumber('');
    setStep(1);  // <-- resetar para o passo 1
    navigation.navigate('Cadastro rápido');
  };


  return (
    <View style={GStyles.view}>
      <Header openDrawer={() => navigation.openDrawer()} />
      <Loading isActive={loading} />

      <View style={{ width: '100%', backgroundColor: THEME.cor.whitesmoke }}>
        <Text h4 h4Style={{ padding: 8, textAlign: 'center' }}>
          Cadastro Manual
        </Text>
        <Divider />
      </View>

      <View style={[GStyles.container, { paddingTop: 16 }]}>
        {/* Step 1: Selecionar ingressos */}
        {step === 1 && user && (
          <>
            <CheckBox
              title="Selecionar todos"
              checked={selectedEventKeys.length === user.tickets.filter(t => t.isHolder).length}
              onPress={() => {
                const allKeys = user.tickets.filter(t => t.isHolder).map(t => t.accessKey);
                if (selectedEventKeys.length === allKeys.length) {
                  setSelectedEventKeys([]);
                } else {
                  setSelectedEventKeys(allKeys);
                }
              }}
              containerStyle={{ backgroundColor: 'transparent', marginBottom: 10 }}
            />
            <FlatList
              data={user.tickets.filter(t => t.isHolder).map(t => [t.accessKey, t])}
              keyExtractor={item => item[0]}
              renderItem={({ item, index }) => {
                const [code, ticket] = item;
                return (
                  <View
                    key={code}
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
                  >
                    <Text style={{ fontWeight: 'bold', marginRight: 10 }}>{index + 1}.</Text>
                    <CheckBox
                      size={24}
                      containerStyle={{ padding: 0, marginRight: 10 }}
                      checked={selectedEventKeys.includes(code)}
                      onPress={() => handleToggleTicket(code)}
                      iconType="material-community"
                      checkedIcon="checkbox-outline"
                      uncheckedIcon="checkbox-blank-outline"
                    />
                    <Text style={{ flex: 1 }}>
                      {[ticket.sector, ticket.category, ticket.day, ticket.braceletDelivered ? 'ENTREGUE' : null]
                        .filter(Boolean)
                        .join(' - ')}
                    </Text>
                  </View>
                );
              }}
            />
            <Button title="Próximo" onPress={handleNextStep} />
          </>
        )}

        {/* Step 2: Formulário CPF e telefone */}
        {step === 2 && (
          <>
            <Input
              label="CPF"
              keyboardType="numeric"
              {...maskedCPFInputProps}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Input
                label="Código do País"
                placeholder="Ex: 55"
                keyboardType="numeric"
                containerStyle={{ flex: 1 }}
                value={countryCode}
                onChangeText={text => setCountryCode(text.replace(/[^\d]/g, ''))}
              />
              <Input
                label="DDD"
                placeholder="Ex: 11"
                keyboardType="numeric"
                containerStyle={{ flex: 1 }}
                value={dialCode}
                onChangeText={text => setDialCode(text.replace(/[^\d]/g, ''))}
              />
            </View>
            <Input
              label="Número"
              placeholder="Ex: 912345678"
              keyboardType="numeric"
              value={nationalNumber}
              onChangeText={text => setNationalNumber(text.replace(/[^\d]/g, ''))}
            />
            <Button title="Finalizar Cadastro" onPress={handleCompleteRegister} />
          </>
        )}

        {/* Botão Cancelar (aparece em step 1 e 2) */}
        {(step === 1 || step === 2) && (
          <Button
            title="Cancelar"
            type="outline"
            containerStyle={{ marginTop: 10 }}
            onPress={handleClear}
          />
        )}
      </View>
    </View>
  );
};

export default ManualRegisterByTickets;
