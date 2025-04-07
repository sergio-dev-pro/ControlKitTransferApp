import {Input, Text} from '@rneui/themed';
import {useState} from 'react';
import {View} from 'react-native';
import {useMaskedInputProps} from 'react-native-mask-input';
import Button from '../../components/Button';
import SelectModal from '../../components/SelectModal';
import {cpfValidation} from '../../helpers/validation';

const inputErrorMsgs = {
  cpf: 'CPF inválido.',
  global: {
    empty: 'campo obrigatório.',
  },
};

const BasicFastRegisterForm = ({onUserFormCompleted, availableDays, availableSectors, sponsors, onReturn, onCancel}) => {
  const [user, setUser] = useState({
    name: '',
    cpf: '', // usado para amazenar cpf ou passport
  });
  const [CPFValidation, setCPFValidation] = useState({
    isValid: true,
    errorMsg: '',
  });
  const [nameValidation, setNameValidation] = useState({
    isValid: true,
    errorMsg: '',
  });
  const [eventDay, setEventDay] = useState(null);
  const [sectorId, setSectorId] = useState(null);
  const [sponsorId, setSponsorId] = useState(null);
  const [documentType, setDocumentType] = useState('cpf');
  const [passportValidation, setPassportValidation] = useState({
    isValid: true,
    errorMsg: '',
  });

  const {name, cpf} = user;

  const maskedCPFInputProps = useMaskedInputProps({
    value: cpf,
    onChangeText: cpfChanged => {
      setUser(prevState => ({...prevState, cpf: cpfChanged}));
      !CPFValidation.isValid && validCPF(cpfChanged);
    },
    mask: [
      /\d/,
      /\d/,
      /\d/,
      '.',
      /\d/,
      /\d/,
      /\d/,
      '.',
      /\d/,
      /\d/,
      /\d/,
      '-',
      /\d/,
      /\d/,
    ],
  });

  const validCPF = currentCPF => {
    const isValid = cpfValidation(currentCPF);
    const invalidCPF = () => {
      const errorMsg = currentCPF.length
        ? inputErrorMsgs.cpf
        : inputErrorMsgs.global.empty;
      setCPFValidation({errorMsg, isValid: false});
    };
    if (!isValid) {
      invalidCPF();
      return false;
    }
    const valid = () => setCPFValidation({isValid: true});
    !CPFValidation.isValid && valid();
    return true;
  };

  const validName = name => {
    const isName = name.length >= 3;
    !isName
      ? setNameValidation({
          isValid: false,
          errorMsg: 'Nome deve ter no mínimo 3 caracteres.',
        })
      : setNameValidation({isValid: true});

    return isName;
  };

  const validPassport = (passport = cpf) => {
    if (passport.length === 0) {
      setPassportValidation({
        isValid: false,
        errorMsg: 'campo obrigatório.',
      });
      return false;
    }
    if (passport.length < 4) {
      setPassportValidation({
        isValid: false,
        errorMsg: 'campo deve ter no mínimo 4 caracteres.',
      });
      return false;
    }

    setPassportValidation({
      isValid: true,
    });
    return true;
  };

  const handleComplete = () => {
    const validDocument = documentType === 'cpf' ? validCPF : validPassport;
    if (!validDocument(cpf) || !validName(name)) return;
    if (eventDay == null)
      return alert('Selecione o dia do evento do ingresso.');
    
    if (sectorId == null)
      return alert('Selecione o setor.');

    onUserFormCompleted({
      user: {day: user.day, document: user.cpf, Firstname: user.name, Lastname: user.name, sectorId: sectorId, sponsorId: sponsorId}
    });
  };

  var itemsDay = [];
  for(var i in availableDays)
  {
    var dayElements = availableDays[i].split("T")[0].split("-");
    var day = dayElements[2] + "/" + dayElements[1] + "/"+ dayElements[0];
    itemsDay.push({key: day, value: day});
  }
  var itemsSector = [];
  for(var j in availableSectors)
  {
    itemsSector.push({key: availableSectors[j].id, value: availableSectors[j].name});
  }

  var itemsSponsors = [];
  for(var h in sponsors)
  {
    itemsSponsors.push({key: sponsors[h].id, value: sponsors[h].name});
  }

  return (
    <View style={{flex: 1, marginBottom: 40}}>
      <Input
        label="Nome"
        value={name}
        onBlur={() => {
          validName(name);
        }}
        onChangeText={name => {
          setUser(prevState => ({...prevState, name}));
        }}
        errorMessage={!nameValidation.isValid ? nameValidation.errorMsg : ''}
      />

      <SelectModal
        label={'Tipo do documento'}
        items={[
          {key: 'cpf', value: 'CPF'},
          {key: 'passport', value: 'Passaporte'},
        ]}
        setValue={value => {
          setDocumentType(value);
          setUser(prev => ({...prev, cpf: ''}));
        }}
        value={documentType}
      />

      {documentType === 'cpf' ? (
        <Input
          label="CPF"
          onBlur={() => {
            validCPF(cpf);
          }}
          keyboardType="numeric"
          // placeholder="999.999.999-99"
          {...maskedCPFInputProps}
          errorMessage={!CPFValidation.isValid ? CPFValidation.errorMsg : ''}
        />
      ) : (
        <Input
          label="Passaporte"
          value={cpf}
          onChangeText={text => setUser(prev => ({...prev, cpf: text}))}
          onBlur={validPassport}
          errorMessage={
            !passportValidation.isValid ? passportValidation.errorMsg : ''
          }
        />
      )}

      <SelectModal
        label={'Selecione o dia'}
        items={itemsDay}
        setValue={value => {
          setEventDay(value);
          setUser(prev => ({...prev, day: value}));
        }}
        value={eventDay}
      />

      <SelectModal
        label={'Selecione o setor'}
        items={itemsSector}
        setValue={value => {
          setSectorId(value);
          setUser(prev => ({...prev, sectorId: sectorId}));
        }}
        value={sectorId}
      />

      <SelectModal
        label={'Selecione o patrocinador'}
        items={itemsSponsors}
        setValue={value => {
          setSponsorId(value);
          setUser(prev => ({...prev, sponsorId: sponsorId}));
        }}
        value={sponsorId}
      />

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
        {!!onReturn && (
          <Button
            type="outline"
            onPress={onReturn}
            containerStyle={{paddingRight: 16, width: '50%'}}>
            Voltar
          </Button>
        )}
        {!!onCancel && (
          <Button
            type="outline"
            onPress={onCancel}
            containerStyle={{paddingRight: 16, width: '50%'}}>
            Voltar ao início
          </Button>
        )}
        <Button
          containerStyle={
            !!onReturn || !!onCancel ? {width: '50%'} : {width: '100%'}
          }
          onPress={handleComplete}>
          Avançar
        </Button>
      </View>
    </View>
  );
};

export default BasicFastRegisterForm;
