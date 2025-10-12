import { Input, Text } from '@rneui/themed';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { View, Alert, ActivityIndicator } from 'react-native';
import { useMaskedInputProps } from 'react-native-mask-input';
import Button from '../../components/Button';
import SelectModal from '../../components/SelectModal';
import { cpfValidation } from '../../helpers/validation';
import { getAccessPolicies, getEventDays, getEventSectors, getSponsors } from '../../api/EventApi';
import { AuthContext } from '../../context/AuthContext';
import uuid from 'react-native-uuid';

const inputErrorMsgs = {
  cpf: 'CPF inválido.',
  global: {
    empty: 'campo obrigatório.',
  },
};

const BasicFastRegisterForm = ({ onUserFormCompleted, onReturn, onCancel, initialDocument, initialFirstName, initialLastName, selectType }) => {

  const [user, setUser] = useState({
    name: initialFirstName || '',
    cpf: initialDocument || '',
    lastname: initialLastName || ''
  });
  const [sectorId, setSectorId] = useState(null);
  const [sponsorId, setSponsorId] = useState(null);
  const [documentType, setDocumentType] = useState('cpf');

  // States for Ingresso (Type 1)
  const [eventDay, setEventDay] = useState(null);

  // States for Credencial (Type 2)
  const [accessPolicies, setAccessPolicies] = useState([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState(null);
  const [workingHours, setWorkingHours] = useState(null);
  const [workJobDescription, setWorkJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Validation States
  const [CPFValidation, setCPFValidation] = useState({ isValid: true, errorMsg: '' });
  const [nameValidation, setNameValidation] = useState({ isValid: true, errorMsg: '' });
  // CORRIGIDO: Validação separada para sobrenome
  const [lastnameValidation, setLastnameValidation] = useState({ isValid: true, errorMsg: '' });
  const [passportValidation, setPassportValidation] = useState({ isValid: true, errorMsg: '' });

  const { name, lastname, cpf } = user;
  const authContext = useContext(AuthContext);
  const [selectedType, setSelectedType] = useState(1);
  const [days, setDays] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [sponsors, setSponsors] = useState([]);

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

        const policiesData = await getAccessPolicies(authContext.selectedEventId, authContext.userToken);
        setAccessPolicies(policiesData);

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
    if (selectedType === 2 && !selectedPolicyId) {
      return Alert.alert('Campo Obrigatório', 'Selecione a política de acesso.');
    }
    if (!sectorId && selectedType === 1) {
      return Alert.alert('Campo Obrigatório', 'Selecione o setor.');
    }
    const uniqueValue = generateUniqueId();
    const userEmail = `${uniqueValue}@spr.com`;


    const payload = {
      userDocumentType: documentType === 'cpf' ? 1 : 2,
      userDocument: cpf.replace(/[^\d]/g, ''),
      userFirstname: name,
      userLastname: lastname,
      userEmail: userEmail,
      sectorId: sectorId,
      Type: selectedType,
      eventId: authContext.selectedEventId,
      sponsorId: sponsorId
    };


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

  // CORRIGIDO: Função de validação para sobrenome
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
    { key: 2, value: 'Credencial' },
  ];

  function generateUniqueId() {
    return uuid.v4().replace(/-/g, '');
  }




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

      <SelectModal
        label={'Selecione o setor'}
        items={itemsSector}
        setValue={setSectorId}
        value={sectorId}
      />

      <SelectModal
        label={'Selecione o patrocinador'}
        items={itemsSponsors}
        setValue={setSponsorId}
        value={sponsorId}
      />

      {selectedType === 1 && (
        <>
          <SelectModal
            label={'Selecione o dia'}
            items={itemsDay}
            setValue={setEventDay}
            value={eventDay}
          />
        </>
      )}

      {selectedType === 2 && (
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

          <SelectModal
            label="Selecione a carga horária"
            items={hourItems}
            value={workingHours}
            setValue={setWorkingHours}
          />
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

