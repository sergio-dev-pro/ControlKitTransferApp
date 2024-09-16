import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import Modal from 'react-native-modal';
import { Text, Button } from '@rneui/themed';

export default function JustificationModal({ modalVisible, setModalVisible, onSubmit, onCancel, message }) {
  const [justification, setJustification] = useState('');
  const [isSaveEnabled, setIsSaveEnabled] = useState(false); // Estado para habilitar/desabilitar o botão

  // Reset justification state when modal visibility changes
  useEffect(() => {
    if (!modalVisible) {
      setJustification('');
      setIsSaveEnabled(false); // Desabilita o botão ao fechar o modal
    }
  }, [modalVisible]);

  // Atualiza o estado do botão sempre que o conteúdo do campo de input mudar
  useEffect(() => {
    setIsSaveEnabled(justification.trim().length > 0);
  }, [justification]);

  const handleSave = () => {
    if (isSaveEnabled) {
      onSubmit(justification);
      setModalVisible(false);
    }
  };

  const handleCancel = () => {
   if(onCancel){
    onCancel();
   }
    setModalVisible(false); 
  };

  return (
    <Modal isVisible={modalVisible} onBackdropPress={() => setModalVisible(false)}>
      <View style={styles.modalView}>
        <Text style={styles.modalText}>{message}</Text>

        <TextInput
          style={styles.inputArea}
          numberOfLines={4}
          maxLength={200}
          onChangeText={text => setJustification(text)}
          value={justification}
          textAlignVertical="top"
          placeholder="Escreva aqui sua justificativa"
          placeholderTextColor="gray"
        />

        <View style={styles.viewButtons}>
          <Button
            title="Salvar"
            onPress={handleSave}
            containerStyle={{ marginBottom: 10 }}
            disabled={!isSaveEnabled} // Desabilita o botão se isSaveEnabled for false
          />
          <Button title="Cancelar" onPress={handleCancel} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputArea: {
    borderWidth: 1,
    height: 100,
    width: '100%',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    textAlignVertical: 'top',
    color: 'black',
  },
  viewButtons: {
    marginTop: 60,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
});
