import {useIsFocused} from '@react-navigation/native';
import {Button, Input, Text} from '@rneui/themed';
import {useContext, useEffect, useRef, useState} from 'react';
import {Modal, View} from 'react-native';
import ReactNativeModal from 'react-native-modal';
import {getUserByCpf, getUserByCpfWithAuth, getUserByEmail} from '../api/UserApi';
import {useAlert} from '../context/AlertContext';
import {AuthContext} from '../context/AuthContext';
import {cpfValidation, isValidEmail} from '../helpers/validation';

const INPUT_VALUE_TYPE = {
  email: 'email',
  cpf: 'cpf',
  passport: 'passport',
};
const ReasonForKitDeliveryModal = ({
  isVisible,
  onCancel,
  onConfirm
}) => {
  const [inputValue, setInputValue] = useState();
  const [invalidInputValue, setInvalidInputValue] = useState();
  const setAlertMessage = useAlert();
  const ref = useRef();
  const isFocused = useIsFocused();

  useEffect(() => {
    isFocused && ref.current && ref.current.focus();
  }, [isFocused]);

  const validateInputValue = () => {
    if (!inputValue)
      return invalidInputValue ? setInvalidInputValue(null) : null;
    
    const isValid = inputValue.length >= 8;

    if (!isValid) {
      return !invalidInputValue
        ? setInvalidInputValue('Deve ter no mínimo 8 caracteres.')
        : null;
    }

    invalidInputValue && setInvalidInputValue(null);

    return isValid;
  };

  const handleConfirm = () => {
    const isValidReason = validateInputValue();
    if (!isValidReason) return;

    onConfirm(inputValue);
  }

  return (
    <ReactNativeModal
      isVisible={isVisible}
      backdropOpacity={0.3}
      style={{alignItems: 'center'}}
      onBackdropPress={onCancel}>
      <View
        style={{
          backgroundColor: 'white',
          borderRadius: 10,
          padding: 20,
          height: 'auto',
          width: `95%`,
        }}>
        <Text h4 h4Style={{marginBottom: 10}}>
          Por qual motivo o Kit deve ser entregue novamente?
        </Text>
        <Input
          ref={ref}
          value={inputValue}
          onChangeText={value => setInputValue(value)}
          errorMessage={invalidInputValue}
          placeholder='Digite aqui'
        />
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Button title="Cancelar" size="lg" type="clear" onPress={onCancel} />
          <Button
            type="solid"
            size="lg"
            containerStyle={{marginLeft: 16}}
            title="Confirmar"
            onPress={handleConfirm}
          />
        </View>
      </View>
    </ReactNativeModal>
  );
};

export default ReasonForKitDeliveryModal;
