import { Input, Text } from '@rneui/themed';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { View, Alert, ActivityIndicator, StyleSheet, FlatList, Keyboard } from 'react-native';
import { useMaskedInputProps } from 'react-native-mask-input';
import Button from '../../components/Button';
import SelectModal from '../../components/SelectModal';
import { cpfValidation, isValidationEmail } from '../../helpers/validation';
import { getAccessPolicies, getEventDays, getEventSectors, getSponsors } from '../../api/EventApi';
import { AuthContext } from '../../context/AuthContext';
import uuid from 'react-native-uuid';
import { TouchableOpacity } from 'react-native';
import { countryCodes } from '../../helpers/countryCodes';

const inputErrorMsgs = {
  cpf: 'CPF inválido.',
  global: {
    empty: 'campo obrigatório.',
  },
};

const DOMAINS = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'icloud.com',
  'live.com',
  'bol.com.br',
  'uol.com.br',
];


const BasicFastRegisterForm = ({ onUserFormCompleted, onReturn, onCancel, initialDocument, initialFirstName, initialLastName,
  selectType, initialEmail, initialSector, initialSponsor, initialDay, initialPhone, initialWorkingHours, initialAccessPolicy, initialJobDescription }) => {

  const [user, setUser] = useState({
    name: initialFirstName || '',
    cpf: initialDocument || '',
    lastname: initialLastName || '',
    email: initialEmail || '',
  });

  const [sectorId, setSectorId] = useState(null);
  const [sponsorId, setSponsorId] = useState(null);
  const [documentType, setDocumentType] = useState('cpf');
  const [eventDay, setEventDay] = useState(null);


  const [accessPolicies, setAccessPolicies] = useState([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState(null);
  const [workingHours, setWorkingHours] = useState(null);
  const [workJobDescription, setWorkJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [CPFValidation, setCPFValidation] = useState({ isValid: true, errorMsg: '' });
  const [nameValidation, setNameValidation] = useState({ isValid: true, errorMsg: '' });

  const [lastnameValidation, setLastnameValidation] = useState({ isValid: true, errorMsg: '' });
  const [passportValidation, setPassportValidation] = useState({ isValid: true, errorMsg: '' });

  const { name, lastname, cpf, email } = user;
  const authContext = useContext(AuthContext);
  const [selectedType, setSelectedType] = useState(1);
  const [days, setDays] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [suggestionsEmail, setSuggestionsEmail] = useState([]);
  const [emailValidation, setEmailValidation] = useState({ isValid: true, errorMsg: '' });

  const [guestPhone, setGuestPhone] = useState({
    countryCode: '',
    dialCode: '',
    nationalNumber: '',
  });

  useEffect(() => {
    setUser(prevState => ({
      ...prevState,
      name: initialFirstName || prevState.name,
      lastname: initialLastName || prevState.lastname,
      email: initialEmail || prevState.email,
      cpf: initialDocument || prevState.cpf,
    }));

    if (initialSector) setSectorId(initialSector);
    if (initialSponsor) setSponsorId(initialSponsor);
    if (initialDay) setEventDay(initialDay);
    if (selectType) setSelectedType(selectType);

    if (initialPhone) {
      if (typeof initialPhone === 'string') {
        try {
          // Caso venha como string JSON
          const phoneObj = JSON.parse(initialPhone);
          setGuestPhone({
            countryCode: phoneObj.CountryCode || '',
            dialCode: phoneObj.DialCode || '',
            nationalNumber: phoneObj.NationalNumber || '',
          });
        } catch (e) {
          console.warn("Erro ao parsear initialPhone", e);
          // Tenta usar direto caso seja uma string plana
          setGuestPhone(prev => ({ ...prev, nationalNumber: initialPhone }));
        }
      } else {
        setGuestPhone({
          countryCode: initialPhone.CountryCode || '',
          dialCode: initialPhone.DialCode || '',
          nationalNumber: initialPhone.NationalNumber || '',
        });
      }
    }

    if (initialWorkingHours) setWorkingHours(initialWorkingHours);
    if (initialJobDescription) setWorkJobDescription(initialJobDescription);

  }, [initialFirstName, initialLastName, initialEmail, initialDocument, initialSector, initialSponsor, initialDay, selectType, initialPhone, initialWorkingHours, initialJobDescription]);

  useEffect(() => {
    const fetchData = async () => {
      if (!authContext.selectedEventId || !authContext.userToken) {
        console.warn("⚠️ Sem eventId ou token:", {
          eventId: authContext.selectedEventId,
          token: authContext.userToken,
        });
        return;
      }

      setIsLoading(true);

      try {
        try {
          const sponsorsData = await getSponsors(authContext.selectedEventId, authContext.userToken);
          setSponsors(sponsorsData);
        } catch (sponsorError) {
          setSponsors([]);
        }

        const daysData = await getEventDays(authContext.selectedEventId, authContext.userToken);
        setDays(daysData);

        const sectorsData = await getEventSectors(authContext.selectedEventId, authContext.userToken);
        setSectors(sectorsData);

      } catch (error) {
        console.error("❌ Erro de resposta da API:", {
          status: error?.response?.status,
          data: error?.response?.data,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [authContext.selectedEventId, authContext.userToken]);

  useEffect(() => {
    const fetchPolicies = async () => {
      setSelectedPolicyId(null);

      if ((selectedType === 2 || selectedType === 3) && sponsorId) {
        setIsLoading(true);
        try {
          const policiesData = await getAccessPolicies(authContext.selectedEventId, authContext.userToken, sponsorId);
          setAccessPolicies(policiesData);

          // Se tiver uma política inicial E for o mesmo parceiro (ou primeira carga), tenta selecionar
          // Como garantimos o mesmo parceiro? Bom, se initialSponsor == sponsorId.
          if (initialAccessPolicy && policiesData.some(p => p.id === initialAccessPolicy)) {
            // Verificação simplificada: se o ID existe na lista retornada, seleciona.
            // O risco é selecionar uma política de outro parceiro se houver colisão de ID (impossível com UUID)
            // ou persistir seleção errada. Mas como a lista vem do sponsorId atual, é seguro.
            setSelectedPolicyId(initialAccessPolicy);
          }

        } catch (error) {
          console.error("❌ Erro ao buscar políticas:", error);
          if (error.response) {
            console.error("Detalhes do erro:", JSON.stringify(error.response.data, null, 2));
          }
          setAccessPolicies([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setAccessPolicies([]);
      }
    };

    if (authContext.selectedEventId && authContext.userToken) {
      fetchPolicies();
    }
  }, [sponsorId, selectedType, authContext.selectedEventId, authContext.userToken]);


  const handleComplete = () => {
    const isNameValid = validName(name);
    const isLastnameValid = validLastname(lastname); // Validação do sobrenome
    const isDocumentValid = documentType === 'cpf' ? validCPF(cpf) : validPassport(cpf);

    if (!isNameValid || !isLastnameValid || !isDocumentValid) {
      return;
    }

    if (!selectedType) {
      return Alert.alert('Campo Obrigatório', 'Selecione o tipo.');
    }

    if (selectedType === 1 && !eventDay) {
      return Alert.alert('Campo Obrigatório', 'Selecione o dia do evento do ingresso.');
    }


    if ((selectedType === 2 || selectedType === 3) && !sponsorId) {
      return Alert.alert('Campo Obrigatório', 'Selecione o parceiro.');
    }
    if (selectedType === 2 && !selectedPolicyId) {
      return Alert.alert('Campo Obrigatório', 'Selecione a política de acesso.');
    }

    if (selectedType === 2 && !workingHours) {
      return Alert.alert('Campo Obrigatório', 'Selecione a carga horária.');
    }

    if (!sectorId && selectedType === 1) {
      return Alert.alert('Campo Obrigatório', 'Selecione o setor.');
    }

    /*
    if ((selectedType === 2 || selectedType === 3) && !guestPhone.countryCode) {
      return Alert.alert('Campo Obrigatório', 'Selecione o código do país.');
    }

    if ((selectedType === 2 || selectedType === 3) && !guestPhone.dialCode) {
      return Alert.alert('Campo Obrigatório', 'Selecione o DDD.');
    }

    if ((selectedType === 2 || selectedType === 3) && !guestPhone.nationalNumber) {
      return Alert.alert('Campo Obrigatório', 'Selecione o número do telefone.');
    }
*/
    const userEmail = email;


    const payload = {
      userDocumentType: documentType === 'cpf' ? 1 : 2,
      userDocument: cpf.replace(/[^\d]/g, ''),
      userFirstname: name,
      userLastname: lastname,
      userEmail: userEmail,
      sectorId: sectorId,
      Type: selectedType,
      eventId: authContext.selectedEventId,
      partnerId: sponsorId,

    };

    if (selectedType === 2 || selectedType === 3) {
      payload.UserPhone = {
        CountryCode: guestPhone.countryCode,
        DialCode: guestPhone.dialCode,
        NationalNumber: guestPhone.nationalNumber,
      };
    }

    if (selectedType === 1) {
      payload.dayId = eventDay;
    } else {
      payload.accessPolicyId = selectedPolicyId;
      payload.workhours = workingHours || 0;
      payload.workJobDescription = workJobDescription || "";
    }

    onUserFormCompleted({ user: payload });
  };

  const itemsDay = useMemo(
    () =>
      days.map(dayObj => {
        const dateStr = dayObj.startTime; // pega o startTime
        const dayElements = dateStr.split("T")[0].split("-");
        const day = `${dayElements[2]}/${dayElements[1]}/${dayElements[0]}`;
        return { key: dayObj.id, value: day }; // usa o id do objeto como key
      }),
    [days]
  );

  const itemsSector = useMemo(() =>
    sectors.map(sector => ({ key: sector.id, value: sector.name })),
    [sectors]
  );

  const itemsSponsors = useMemo(() =>
    sponsors.map(sponsor => ({ key: sponsor.id, value: sponsor.name })),
    [sponsors]
  );

  const hourItems = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const hour = i + 1;
      return { key: hour, value: `${hour}h` };
    }), []
  );

  const validCPF = currentCPF => {
    const isValid = cpfValidation(currentCPF);
    const errorMsg = !isValid
      ? (currentCPF.length ? inputErrorMsgs.cpf : inputErrorMsgs.global.empty)
      : '';
    setCPFValidation({ errorMsg, isValid });
    return isValid;
  };

  const validName = currentName => {
    const isValid = currentName.length >= 3;
    setNameValidation({
      isValid,
      errorMsg: !isValid ? 'Nome deve ter no mínimo 3 caracteres.' : '',
    });
    return isValid;
  };

  const validLastname = currentLastname => {
    const isValid = currentLastname.length >= 3;
    setLastnameValidation({
      isValid,
      errorMsg: !isValid ? 'Sobrenome deve ter no mínimo 3 caracteres.' : '',
    });
    return isValid;
  };

  const validPassport = (passport) => {
    if (!passport || passport.length === 0) {
      setPassportValidation({ isValid: false, errorMsg: inputErrorMsgs.global.empty });
      return false;
    }
    if (passport.length < 4) {
      setPassportValidation({ isValid: false, errorMsg: 'Campo deve ter no mínimo 4 caracteres.' });
      return false;
    }
    setPassportValidation({ isValid: true, errorMsg: '' });
    return true;
  };

  const maskedCPFInputProps = useMaskedInputProps({
    value: cpf,
    onChangeText: cpfChanged => {
      setUser(prevState => ({ ...prevState, cpf: cpfChanged }));
      if (!CPFValidation.isValid) validCPF(cpfChanged);
    },
    mask: [/\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/],
  });

  const typeItems = [
    { key: 1, value: 'Ingresso' },
    { key: 2, value: 'Staff' },
    { key: 3, value: 'Montagem' },
  ];


  const handleEmailChange = (text) => {
    setUser(prev => ({ ...prev, email: text }));

    if (text.includes('@')) {
      const [localPart, domainPart] = text.split('@');
      if (localPart.length > 0) {
        const filteredDomains = DOMAINS.filter((domain) =>
          domain.startsWith(domainPart.toLowerCase())
        );
        const newSuggestions = filteredDomains.map((domain) => `${localPart}@${domain}`);
        setSuggestionsEmail(newSuggestions.slice(0, 5));
      } else {
        setSuggestionsEmail([]);
      }
    } else {
      setSuggestionsEmail([]);
    }

    // Valida em tempo real
    if (!emailValidation.isValid) {
      validEmail(text);
    }
  };

  const onSuggestionPress = (suggestion) => {
    setUser(prev => ({ ...prev, email: suggestion }));
    setSuggestionsEmail([]); // Limpa sugestões
    validEmail(suggestion); // Valida o email selecionado
  };

  const validEmail = (currentEmail) => {
    const isValid = isValidationEmail(currentEmail);
    setEmailValidation({
      isValid,
      errorMsg: !isValid ? (currentEmail.length ? inputErrorMsgs.email : inputErrorMsgs.global.empty) : '',
    });
    return isValid;
  };

  const phoneMask = (text) => {
    if (text.replace(/\D/g, '').length > 8) {
      return [/\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/]; // 9 dígitos
    } else {
      return [/\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/]; // 8 dígitos
    }
  };

  const maskedPhoneInputProps = useMaskedInputProps({
    value: guestPhone.nationalNumber,
    onChangeText: (text, rawText) => {
      setGuestPhone(prev => ({ ...prev, nationalNumber: rawText }));
    },
    mask: phoneMask,
  });

  const uniqueCodes = countryCodes.filter((item, index, self) =>
    index === self.findIndex((t) => t.code === item.code)
  );

  const ddiItems = uniqueCodes
    .sort((a, b) => a.country.localeCompare(b.country))
    .map((item) => ({
      key: item.code,
      value: `${item.country} (${item.code})`,
      dialCode: item.code
    }));


  return (
    <View style={{ flex: 1, marginBottom: 40 }}>

      <SelectModal
        label="Tipo"
        items={typeItems}
        value={selectedType}
        setValue={setSelectedType}
      />

      <Input
        label="Nome"
        value={name}
        onBlur={() => validName(name)}
        onChangeText={text => {
          setUser(prevState => ({ ...prevState, name: text }));
          if (!nameValidation.isValid) validName(text);
        }}
        errorMessage={!nameValidation.isValid ? nameValidation.errorMsg : ''}
      />
      <Input
        label="Sobrenome"
        value={lastname}
        onBlur={() => validLastname(lastname)}
        onChangeText={text => {
          setUser(prevState => ({ ...prevState, lastname: text }));
          if (!lastnameValidation.isValid) validLastname(text);
        }}
        errorMessage={!lastnameValidation.isValid ? lastnameValidation.errorMsg : ''}
      />
      <SelectModal
        label={'Tipo do documento'}
        items={[{ key: 'cpf', value: 'CPF' }, { key: 'passport', value: 'Passaporte' }]}
        setValue={value => {
          setDocumentType(value);
          setUser(prev => ({ ...prev, cpf: '' }));
        }}
        value={documentType}
      />

      {documentType === 'cpf' ? (
        <Input
          label="CPF"
          onBlur={() => validCPF(cpf)}
          keyboardType="numeric"
          {...maskedCPFInputProps}
          errorMessage={!CPFValidation.isValid ? CPFValidation.errorMsg : ''}
        />
      ) : (
        <Input
          label="Passaporte"
          value={cpf}
          onChangeText={text => setUser(prev => ({ ...prev, cpf: text }))}
          onBlur={() => validPassport(cpf)}
          errorMessage={!passportValidation.isValid ? passportValidation.errorMsg : ''}
        />
      )}

      <Input
        label="Email"
        value={email}
        onBlur={() => {
          validEmail(email);
        }}
        onChangeText={handleEmailChange}
        errorMessage={!emailValidation.isValid ? emailValidation.errorMsg : ''}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {suggestionsEmail.length > 0 && (
        <View style={styles.listContainer}>
          {suggestionsEmail.map((item, index) => (
            <TouchableOpacity
              key={item}
              onPress={() => onSuggestionPress(item)}
              style={[
                styles.listItem,
                index < suggestionsEmail.length - 1 && styles.bottomDivider,
              ]}
            >
              <Text style={styles.suggestionText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}


      {(selectedType === 2 || selectedType === 3) && (
        <>
          <SelectModal
            label="Código do país"
            placeholder="Selecione"
            items={ddiItems}
            value={guestPhone.countryCode}
            setValue={(code) => {
              setGuestPhone(prev => ({ ...prev, countryCode: code }));
            }}
          />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Input
              label="DDD"
              placeholder="11"
              keyboardType="numeric"
              containerStyle={{ flex: 1 }}
              value={guestPhone.dialCode}
              maxLength={3}
              onChangeText={(text) =>
                setGuestPhone(prev => ({
                  ...prev,
                  dialCode: text.replace(/\D/g, ''),
                }))
              }
            />

            <Input
              label="Número"
              {...maskedPhoneInputProps}
              placeholder="11111-1111"
              keyboardType="numeric"
              containerStyle={{ flex: 3, paddingHorizontal: 0 }}
            />
          </View>
        </>
      )}

      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />
      ) : (
        <>
          <SelectModal
            label={selectedType != 1 ? 'Selecione o parceiro' : 'Selecione o patrocinador'}
            items={itemsSponsors}
            setValue={setSponsorId}
            value={sponsorId}
          />

          {selectedType === 1 && (
            <>
              <SelectModal
                label={'Selecione o setor'}
                items={itemsSector}
                setValue={setSectorId}
                value={sectorId}
              />

              <SelectModal
                label={'Selecione o dia'}
                items={itemsDay}
                setValue={setEventDay}
                value={eventDay}
              />
            </>
          )}
        </>
      )}

      {selectedType === 2 && (
        <SelectModal
          label="Selecione a carga horária"
          items={hourItems}
          value={workingHours}
          setValue={setWorkingHours}
        />
      )}


      {(selectedType === 2 || selectedType === 3) && (
        <>
          {isLoading ? (
            <ActivityIndicator size="large" style={{ marginVertical: 20 }} />
          ) : (
            <SelectModal
              label="Selecione a política de acesso"
              items={accessPolicies.map(policy => ({
                key: policy.id,
                value: policy.name,
              }))}
              value={selectedPolicyId}
              setValue={setSelectedPolicyId}
            />
          )}

          <Input
            label="Função"
            value={workJobDescription}
            onChangeText={setWorkJobDescription}
          />
        </>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {!!onReturn && (
          <Button
            type="outline"
            onPress={onReturn}
            containerStyle={{ paddingRight: 16, width: '50%' }}>
            Voltar
          </Button>
        )}
        {!!onCancel && (
          <Button
            type="outline"
            onPress={onCancel}
            containerStyle={{ paddingRight: 16, width: '50%' }}>
            Voltar ao início
          </Button>
        )}
        <Button
          containerStyle={!!onReturn || !!onCancel ? { width: '50%' } : { width: '100%' }}
          onPress={handleComplete}>
          Avançar
        </Button>
      </View>
    </View>
  );
};

export default BasicFastRegisterForm;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Um fundo suave
  },
  container: {
    flex: 1,
    padding: 20,
    marginTop: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  // Estilos para o Input, imitando o @rneui/themed
  inputContainer: {
    width: '100%',
    marginBottom: 5,
    zIndex: 10, // Garante que o input fica por cima
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#86939e',
    marginBottom: 8,
    marginLeft: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderColor: '#86939e', // Cor cinzenta padrão
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 16,
    borderRadius: 5,
  },
  inputFocused: {
    borderColor: '#007bff', // Cor de foco (azul)
  },
  inputError: {
    borderColor: '#ef4444', // Cor de erro (vermelho)
  },
  errorMessage: {
    color: '#ef4444',
    fontSize: 12,
    marginLeft: 10,
    marginTop: 5,
  },
  // Estilo para o "dropdown" de sugestões
  listContainer: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderTopWidth: 0, // Remove a borda de cima
    borderRadius: 5,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    backgroundColor: '#fff',
    // Move a lista para cima para "colar" no input
    marginTop: -5,
    marginHorizontal: 1, // Pequena margem para alinhar com o input
    zIndex: 5, // Fica abaixo do input mas acima do resto
  },
  listItem: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  bottomDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee', // Divisor mais suave
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
});