import { useIsFocused } from '@react-navigation/native';
import { Button, Input, Text } from '@rneui/themed';
import React, { useEffect, useRef, useState } from 'react';
import { View, Platform } from 'react-native'; // Adicionei Platform
import ReactNativeModal from 'react-native-modal';
import SelectModal from './SelectModal';

const ReasonForKitDeliveryModal = ({
  isVisible,
  onCancel,
  onConfirm,
}) => {
  const [inputValue, setInputValue] = useState(''); 
  const [invalidInputValue, setInvalidInputValue] = useState(null);
  
  // O setReasonType deve iniciar como null
  const [reasonType, setReasonType] = useState(null);
  const [releaseReason, setReleaseReason] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    if (!isVisible) {
      setInputValue('');
      setInvalidInputValue(null);
      setReasonType(null);
      setReleaseReason(false);
    }
  }, [isVisible]);

  useEffect(() => {
    if (releaseReason && inputRef.current) {
        setTimeout(() => {
            try {
                inputRef.current.focus();
            } catch (e) { console.log(e) }
        }, 300);
    }
  }, [releaseReason]);

  const validateInputValue = () => {
    if (!inputValue || inputValue.trim() === '') {
        setInvalidInputValue('Campo obrigatório.');
        return false;
    }
    if (inputValue.length < 8) {
        setInvalidInputValue('Deve ter no mínimo 8 caracteres.');
        return false;
    }
    setInvalidInputValue(null);
    return true;
  };

  const handleConfirm = () => {
    if (!validateInputValue()) return;
    onConfirm({ reason: inputValue, type: reasonType });
  };

  return (
    <ReactNativeModal
      isVisible={isVisible}
      backdropOpacity={0.3}
      style={{ alignItems: 'center' , width: '100%'}}
      onBackdropPress={onCancel}
      avoidKeyboard={true}
      panResponderThreshold={Platform.OS === 'android' ? 5 : 10}
    >
      <View
        style={{
          backgroundColor: 'white',
          borderRadius: 10,
          padding: 15,
        }}>

        <SelectModal
          label="Tipo da reentrega"
          placeholder="Selecione o tipo"
          items={[
            { key: 'Exchange', value: 'Troca' },
            { key: 'Loss', value: 'Perda' },
          ]}
          value={reasonType}
          setValue={(selectedValue) => {
            setReasonType(selectedValue);
            setReleaseReason(true);
          }}
        />

        {releaseReason && (
          <View style={{ marginTop: 15, maxHeight: '80%' }}>
            <Text style={{ marginBottom: 10, fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
              Por qual motivo o Kit deve ser entregue novamente?
            </Text>
            
            <Input
              ref={inputRef}
              value={inputValue}
              onChangeText={(text) => {
                  setInputValue(text);
                  if (invalidInputValue) setInvalidInputValue(null);
              }}
              errorMessage={invalidInputValue}
              placeholder="Digite a justificativa aqui"
              multiline={true} 
              numberOfLines={2} 
            />

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 10
              }}>
              <Button 
                title="Cancelar" 
                size="lg" 
                type="clear" 
                onPress={onCancel} 
              />
              <Button
                type="solid"
                size="lg"
                containerStyle={{ marginLeft: 16 }}
                title="Confirmar"
                onPress={handleConfirm}
              />
            </View>
          </View>
        )}

      </View>
    </ReactNativeModal>
  );
};

export default ReasonForKitDeliveryModal;