import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  Alert,
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
import { completeManualRegisterByTickets, saveUserPhotoAgain } from '../../api/UserApi';
import { AuthContext } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { cpfValidation } from '../../helpers/validation';
import TakePictureModal from '../../components/TakePictureModal';

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
  const [eventKeysGuests, setEventKeysGuests] = useState([]);
  const [guests, setGuests] = useState([]);
  const [guestDocument, setGuestDocument] = useState('');
  const [guestFirstname, setGuestFirstname] = useState('');
  const [guestLastname, setGuestLastname] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState({
    countryCode: '',
    dialCode: '',
    nationalNumber: '',
    internationalNumber: '',
  });
  const [guestAccessKeys, setGuestAccessKeys] = useState([]);
  const [usedGuestAccessKeys, setUsedGuestAccessKeys] = useState([]);

  const [isVisibleCam, setIsVisibleCam] = useState();
  const toggleCamVisibility = () => setIsVisibleCam(is => !is);
  const [isLoading, setIsLoading] = useState();
  const [documents, setDocuments] = useState([])
  const [currentDocument, setCurrentDocument] = useState('')
  const [cpfEntrgue, setCpfEntrgue] = useState([]);

  const handleClear = () => {
    setSelectedEventKeys([]);
    setCountryCode('');
    setDialCode('');
    setNationalNumber('');
    setStep(1);  // <-- resetar para o passo 1
    navigation.navigate('Cadastro rápido');
    setGuests([])
    setEventKeysGuests([])
    setGuestDocument('')
    setGuestFirstname('')
    setGuestLastname('')
    setGuestEmail('')
    setGuestAccessKeys([]);
    setUsedGuestAccessKeys([]);
    setGuestPhone({
      countryCode: '',
      dialCode: '',
      nationalNumber: '',
      internationalNumber: '',
    });
  };


  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);


  const cpfOnChange = step === 2 ? setCpf : setGuestDocument;
  const cpfValueOnChange = step === 2 ? cpf : guestDocument;

  const maskedCPFInputProps = useMaskedInputProps({
    value: cpfValueOnChange,
    onChangeText: cpfOnChange,
    mask: [/\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/],
  });

  const handleToggleTicket = (code, setor) => {

    if (code) {
      setEventKeysGuests(prev =>
        prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
      );
    }
  };

  useEffect(() => {
    setGuestAccessKeys(eventKeysGuests);
  }, [eventKeysGuests]);


  const handleNextStep = () => {
    if (selectedEventKeys.length === 0) {
      Alert.alert('', 'Selecione ao menos um ingresso.');
      return;
    }
    setStep(2);
  };

  const continueRegistryTickets = () => {
    if (step === 2) {
      const cleanCpf = cpf.replace(/[^\d]/g, '');
      if (!cpfValidation(cleanCpf)) {
        Alert.alert('', 'CPF inválido. Verifique o número digitado.');
        return;
      }

      if (
        countryCode.length < 1 || countryCode.length > 3 ||
        dialCode.length < 1 || dialCode.length > 4 ||
        nationalNumber.length < 6 || nationalNumber.length > 12
      ) {
        Alert.alert('', 'Preencha um número de telefone válido.');
        return;
      }

      setStep(3);
      return;
    }

    if (step === 3) {
      if (eventKeysGuests.length === 0) {
        Alert.alert('', 'Selecione ao menos um ingresso para o convidado.');
        return;
      }

      setStep(4);
      return;
    }
  };


  const handleFinishRegistration = async () => {
    if (guestDocument) {
      addGuest(true);
    }

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
      guests,
    };

    console.log('📦 Payload enviado:', JSON.stringify(payload, null, 2));

    try {
      setLoading(true);

      await completeManualRegisterByTickets(payload, authContext.userToken);
      setAlertMessage('Cadastro finalizado com sucesso!');
      setStep(6);
    } catch (error) {
      console.error('❌ Erro no cadastro:', error?.response?.data || error.message);
      if (error.response?.data?.errors) {
        alert(error.response.data.errors);
      } else {
        alert('Erro inesperado ao cadastrar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };



  const addGuest = (goBackToStep3 = false) => {
    const cleanCpf = guestDocument.replace(/[^\d]/g, '');

    if (!cpfValidation(cleanCpf)) {
      Alert.alert('', 'CPF do convidado inválido.');
      return;
    }


    if (!guestFirstname || !guestLastname) {
      Alert.alert('', 'Preencha o nome e sobrenome do convidado.');
      return;
    }

    if (
      guestPhone.countryCode.length < 1 || guestPhone.countryCode.length > 3 ||
      guestPhone.dialCode.length < 1 || guestPhone.dialCode.length > 4 ||
      guestPhone.nationalNumber.length < 6 || guestPhone.nationalNumber.length > 12
    ) {
      Alert.alert('', 'Preencha um número de telefone válido para o convidado.');
      return;
    }

    if (guestAccessKeys.length === 0) {
      Alert.alert('', 'Selecione ao menos um ingresso para o convidado.');
      return;
    }

    const newGuest = {
      document: cleanCpf,
      firstname: guestFirstname,
      lastname: guestLastname,
      email: guestEmail,
      phone: {
        ...guestPhone,
        internationalNumber: `+${guestPhone.countryCode}${guestPhone.dialCode}${guestPhone.nationalNumber}`,
      },
      accessKeys: guestAccessKeys,
    };

    setGuests(prev => [...prev, newGuest]);
    setUsedGuestAccessKeys(prev => [...prev, ...guestAccessKeys]);

    // Limpar campos
    setGuestDocument('');
    setGuestFirstname('');
    setGuestLastname('');
    setGuestEmail('');
    setGuestPhone({
      countryCode: '',
      dialCode: '',
      nationalNumber: '',
      internationalNumber: '',
    });
    setGuestAccessKeys([]);
    setEventKeysGuests([]);

    if (goBackToStep3) setStep(3);
  };

  const handleSavePhoto = async (imgPath) => {

    const formData = new FormData();
    formData.append("file", {
      uri: imgPath,
      type: "image/jpeg",
      name: "userImage.jpg",
    });
    formData.append("eventId", authContext.selectedEventId);
    formData.append("document", currentDocument);

    console.log("eventId", authContext.selectedEventId)
    console.log('currentDocument', currentDocument)

    setIsLoading(true);

    try {
      var response = await saveUserPhotoAgain(formData, authContext.userToken);

      if (response) {
        setCpfEntrgue(prev => [...prev, currentDocument]);
        setAlertMessage("Foto atualizada com sucesso!", "#32cd32");
      } else {
        setAlertMessage("Erro ao enviar imagem, tente novamente.");
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        setAlertMessage(error.response.data.message);
        console.error("Erro no handleSavePhoto:", error.response.data);
      } else {
        setAlertMessage("Erro inesperado ao enviar imagem.");
        console.error("Erro no handleSavePhoto:", error.message || error);
      }

    }

    toggleCamVisibility();
    setIsLoading(false);
  };


  const nonHolderTicketsCount = user.tickets.filter(t => !t.isHolder).length;
  const entregaLiberada = nonHolderTicketsCount === usedGuestAccessKeys.length ? true : false;

  const fotosFinalizadas = cpfEntrgue.length === documents.length ? true : false


  useEffect(() => {
    const listaPessoas = [];

    // Adiciona o usuário principal
    if (user?.name && cpf) {
      listaPessoas.push({
        nome: user.name,
        cpf: cpf.replace(/[^\d]/g, '')
      });
    }

    // Adiciona todos os convidados já cadastrados
    guests.forEach(g => {
      listaPessoas.push({
        nome: `${g.firstname} ${g.lastname}`,
        cpf: g.document.replace(/[^\d]/g, '')
      });
    });

    // Adiciona o convidado em edição (caso ainda não tenha sido adicionado)
    if (guestFirstname && guestLastname && guestDocument) {
      listaPessoas.push({
        nome: `${guestFirstname} ${guestLastname}`,
        cpf: guestDocument.replace(/[^\d]/g, '')
      });
    }

    setDocuments(listaPessoas);
  }, [user, cpf, guests, guestFirstname, guestLastname, guestDocument]);




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
                      disabled={true}
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
            <Button title="Continuar Cadastro" onPress={continueRegistryTickets} />
          </>
        )}

        {step === 3 && (
          <>
            <Text style={{ padding: 8, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
              Cadastrar Convidado
            </Text>
            <FlatList
              data={user.tickets.filter(t => !t.isHolder)}
              keyExtractor={item => item.accessKey}
              renderItem={({ item: ticket, index }) => {
                const code = ticket.accessKey;
                const isUsed = usedGuestAccessKeys.includes(code);
                const isChecked = eventKeysGuests.includes(code);
                return (
                  <View
                    key={code}
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
                  >
                    {!isUsed ? (
                      <>
                        <Text style={{ fontWeight: 'bold', marginRight: 10 }}>{index + 1}.</Text>

                        <CheckBox
                          size={24}
                          containerStyle={{ padding: 0, marginRight: 10 }}
                          checked={isChecked}
                          onPress={() => handleToggleTicket(code)}
                          iconType="material-community"
                          checkedIcon="checkbox-outline"
                          uncheckedIcon="checkbox-blank-outline"
                          disabled={isUsed} />
                        <Text style={{ flex: 1, color: isUsed ? '#aaa' : '#000' }}>
                          {[ticket.sector, ticket.category, ticket.day, ticket.braceletDelivered ? 'ENTREGUE' : null]
                            .filter(Boolean)
                            .join(' - ')}
                        </Text>

                      </>
                    ) : null}
                  </View>
                );
              }}
            />

            {!entregaLiberada && (
              <Button title="Próximo" onPress={continueRegistryTickets} />
            )}
          </>
        )}

        {step === 4 && (
          <ScrollView contentContainerStyle={{ gap: 16 }}>
            <Text style={{ padding: 8, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
              Cadastrar Convidado
            </Text>
            <Input
              label="CPF"
              keyboardType="numeric"
              {...maskedCPFInputProps}
            />

            <Input placeholder="Nome" value={guestFirstname} onChangeText={setGuestFirstname} />
            <Input placeholder="Sobrenome" value={guestLastname} onChangeText={setGuestLastname} />
            <Input placeholder="Email" value={guestEmail} onChangeText={setGuestEmail} />

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Input
                label="Código do País"
                placeholder="Ex: 55"
                keyboardType="numeric"
                containerStyle={{ flex: 1 }}
                value={guestPhone.countryCode}
                onChangeText={(text) =>
                  setGuestPhone(prev => ({ ...prev, countryCode: text.replace(/[^\d]/g, '') }))
                }
              />

              <Input
                label="DDD"
                placeholder="Ex: 11"
                keyboardType="numeric"
                containerStyle={{ flex: 1 }}
                value={guestPhone.dialCode}
                onChangeText={(text) =>
                  setGuestPhone(prev => ({ ...prev, dialCode: text.replace(/[^\d]/g, '') }))
                }
              />
            </View>
            <Input
              label="Número"
              placeholder="Ex: 912345678"
              keyboardType="numeric"
              value={guestPhone.nationalNumber} onChangeText={(text) =>
                setGuestPhone(prev => ({ ...prev, nationalNumber: text.replace(/[^\d]/g, '') }))
              }
            />

            <Button title="Adicionar convidado" onPress={() => addGuest(true)} />
            <Button title="Cancelar" type="outline" containerStyle={{ marginTop: 10 }} onPress={handleClear} />
          </ScrollView>
        )}

        {step === 5 && (
          <ScrollView>
            <Text style={{ padding: 8, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
              Resumo dos Ingressos
            </Text>

            <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 }}>
              <Text style={{ padding: 8, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
                Usuário Principal
              </Text>
              <Text>
                <Text style={{ fontWeight: 'bold' }}>Nome:</Text>  {user.name}
              </Text>
              <Text><Text style={{ fontWeight: 'bold' }}>Documento:</Text> {user.id}</Text>
              <Text><Text style={{ fontWeight: 'bold' }}>Quantidade de ingressos:</Text> {user.tickets.filter(t => t.isHolder).length}</Text>
            </View>

            {guests.map((x, idx) => {
              const daySectorMap = x.accessKeys.reduce((acc, key) => {
                const ticket = user.tickets.find(t => t.accessKey === key);
                if (!ticket) return acc;

                const day = ticket.day || 'Dia não informado';
                const sector = ticket.sector || 'Setor não informado';

                if (!acc[day]) acc[day] = {};
                acc[day][sector] = (acc[day][sector] || 0) + 1;

                return acc;
              }, {});

              return (
                <View
                  key={idx}
                  style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginTop: 10 }}
                >
                  <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>
                    Ingresso transferido para: {x.firstname} {x.lastname}
                  </Text>
                  <Text>CPF: {x.document}</Text>
                  <Text>Email: {x.email}</Text>
                  <Text>Telefone: +{x.phone.countryCode}{x.phone.dialCode}{x.phone.nationalNumber}</Text>

                  <Text style={{ marginTop: 8, fontWeight: 'bold' }}>Ingressos:</Text>
                  {Object.entries(daySectorMap).map(([day, sectors]) => (
                    <View key={day} style={{ marginTop: 6 }}>
                      <Text style={{ fontWeight: '600' }}>Dia: {day}</Text>
                      {Object.entries(sectors).map(([sector, count]) => (
                        <Text key={sector}>• {sector}: {count} ingresso(s)</Text>
                      ))}
                    </View>
                  ))}
                </View>
              );
            })}
          </ScrollView>
        )}

        {(step == 3 || step == 4) && entregaLiberada && (
          <Button title="Resumo dos tickets" onPress={() => setStep(5)} />
        )}

        {entregaLiberada && step === 5 && (
          <View style={{ marginTop: 10 }}>
            <Button title="Finalizar cadastro" onPress={(handleFinishRegistration)} containerStyle={{ marginBottom: 5 }} />
            <Button title="Cancelar" type="outline" onPress={handleClear} />
          </View>
        )}

        {step === 6 && (
          <View>
            {documents.map((pessoa, idx) => (
              <View key={idx}>
                <Text>• {pessoa.nome} - {pessoa.cpf}</Text>

                {cpfEntrgue.includes(pessoa.cpf) ? (
                  <Text style={{ color: 'green' }}>Foto já entregue</Text>
                ) : (
                  <Button
                    onPress={() => {
                      setCurrentDocument(pessoa.cpf);
                      toggleCamVisibility();
                    }}
                    containerStyle={{ marginBottom: 5 }}
                  >
                    Tirar nova foto
                  </Button>
                )}
              </View>
            ))}

            {fotosFinalizadas && (
              <View style={{ marginTop: 10 }}>
                <Button title="Finalizar" type="outline" onPress={handleClear} />

              </View>
            )}
          </View>
        )}


        {entregaLiberada && (
          <TakePictureModal
            isVisible={isVisibleCam}
            cancelPhoto={toggleCamVisibility}
            savePhoto={handleSavePhoto}
            isSavingPhoto={isLoading}
          />
        )}

      </View>
    </View >
  );
};

export default ManualRegisterByTickets;
