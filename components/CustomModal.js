import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

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
          {/* Renderiza título somente se existir */}
          {title ? <Text style={styles.modalTitle}>{title}</Text> : null}

          <ScrollView>
            {React.isValidElement(content) ? (
              content
            ) : (
              <Text style={styles.modalText}>{content}</Text>
            )}
          </ScrollView>

          <View style={confirm ? styles.buttonsContainer : styles.buttonsContainerCentered}>
            {/* Botão Fechar */}
            <TouchableOpacity style={[styles.button, styles.closeButton]} onPress={onClose}>
              <Text style={styles.buttonText}>Fechar</Text>
            </TouchableOpacity>

            {/* Botão Confirmar */}
            {confirm && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.confirmButton,
                  disableConfirm && styles.buttonDisabled,
                ]}
                onPress={confirm}
                disabled={disableConfirm}
              >
                <Text style={styles.buttonText}>Confirmar</Text>
              </TouchableOpacity>
            )}
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
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold'
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

  button: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#d9534f', // vermelho (alerta)
  },
  confirmButton: {
    backgroundColor: '#5cb85c', // verde (confirmar)
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  alertText: {
    marginTop: 15,
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
});

export default CustomModal;
