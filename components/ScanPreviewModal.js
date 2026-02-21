import React from 'react';
import { View } from 'react-native';
import { Text, Button } from '@rneui/themed';
import ReactNativeModal from 'react-native-modal';
import THEME from '../style/theme';

const ScanPreviewModal = ({
    isVisible,
    onCancel,
    onConfirm,
    scannedCode,
    ticketData,
    title = "Confirmação de Leitura",
    labelCode = "Código"
}) => {
    return (
        <ReactNativeModal
            isVisible={isVisible}
            onBackdropPress={onCancel}
        >
            <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 8 }}>
                <Text h4 style={{ textAlign: 'center', marginBottom: 15 }}>{title}</Text>

                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Dados do Ingresso:</Text>
                    {ticketData ? (
                        <View style={{ marginTop: 5, paddingLeft: 10 }}>
                            <Text style={{ fontSize: 16 }}>Setor: {ticketData.sector || 'N/A'}</Text>
                            <Text style={{ fontSize: 16 }}>Dia: {ticketData.day || 'N/A'}</Text>
                        </View>
                    ) : (
                        <Text>Ingresso não encontrado</Text>
                    )}
                </View>

                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{labelCode}:</Text>
                    <Text style={{ fontSize: 18, color: THEME.cor.primary, textAlign: 'center', marginTop: 5, fontWeight: 'bold' }}>
                        {scannedCode}
                    </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Button
                        type="outline"
                        containerStyle={{ flex: 1, marginRight: 10 }}
                        onPress={onCancel}
                    >
                        Cancelar
                    </Button>
                    <Button
                        containerStyle={{ flex: 1, marginLeft: 10 }}
                        onPress={onConfirm}
                    >
                        Confirmar
                    </Button>
                </View>
            </View>
        </ReactNativeModal>
    );
};

export default ScanPreviewModal;
