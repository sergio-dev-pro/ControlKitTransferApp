import React from 'react';
import { Modal, View, Text, Button, StyleSheet, ScrollView } from 'react-native';

const CustomModal = ({ visible, title, content, onClose, confirm, disableConfirm, alertText }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Renderização do título */}
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView>
            {React.isValidElement(content) ? (
              content
            ) : (
              <Text style={styles.modalText}>{content}</Text>
            )}
          </ScrollView>

          {/* Container para os botões */}
          <View style={confirm ? styles.buttonsContainer : styles.buttonsContainerCentered}>
            <Button title={"Fechar"} onPress={onClose} />
            {confirm && <Button title="Confirmar" onPress={confirm} disabled={disableConfirm} />}
          </View>
          {alertText && <Text style={styles.alertText}>{alertText}</Text>}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: 'black',
  },
  modalText: {
    fontSize: 14,
    color: '#333',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  buttonsContainerCentered: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginTop: 20,
  },
  alertText: {
    marginTop: 15,
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold' 
  }
});

export default CustomModal;
