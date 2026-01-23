import React, { useContext, useState, useCallback } from 'react';
import { StyleSheet, View, Image, Alert, ScrollView } from 'react-native';
import { Button, Card, Divider, Icon, Text, Input } from '@rneui/themed';
import Header from '../components/Header';
import Loading from '../components/Loading';
import GStyles from '../style/global';
import THEME from '../style/theme';
import { AuthContext } from '../context/AuthContext';
import { useNavigation, useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useAlert } from '../context/AlertContext';
import SearchUserByCompanyModal from '../components/SearchUserByCompanyModal';
import { createUser } from '../api/UserApi';

const CreateUser = () => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { userToken, selectedEventId, facialProvider } = useContext(AuthContext);
    console.log('@@@facialProvider=' + facialProvider);
    const [user, setUser] = useState(null);
    const [loadingTicketId, setLoadingTicketId] = useState(null);
    const setAlertMessage = useAlert();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        documentType: 'CPF',
        document: '',
        firstName: '',
        lastName: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            return () => {
                setUser(null);
                setShowCreateForm(false);
                setFormData({
                    documentType: 'CPF',
                    document: '',
                    firstName: '',
                    lastName: '',
                    email: ''
                });
            };
        }, [])
    );

    const handleUserFound = (foundUser) => {
        console.log(foundUser.firstname)
        console.log(foundUser.lastname)
        console.log(foundUser.email)
        console.log(foundUser.document)
        console.log(foundUser.company)

        console.log('entrou')

        if (foundUser.firstname || foundUser.email || foundUser.document || foundUser.company) {
            setAlertMessage("CPF já possui conta na empresa " + foundUser.company + ".", '#dc143c');
        } else {
            handleUserNotFound(foundUser)
        }
    };

    const handleUserNotFound = (searchedValue) => {
        setFormData(prev => ({ ...prev, document: searchedValue }));
        setShowCreateForm(true);
    };

    const handleCreateUser = async () => {
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.document) {
            setAlertMessage('Preencha todos os campos', '#dc143c');
            return;
        }

        try {
            setLoading(true);
            const data = new FormData();
            data.append('DocumentType', formData.documentType);
            data.append('Document', formData.document);
            data.append('Firstname', formData.firstName);
            data.append('Lastname', formData.lastName);
            data.append('Email', formData.email);

            await createUser(data, userToken);
            setAlertMessage('Usuário criado com sucesso', 'green');
            setShowCreateForm(false);
            setUser(null);
        } catch (error) {
            console.log(error);
            let msg = 'Erro ao criar usuário';
            if (error.response?.data?.errors) {
                msg = typeof error.response.data.errors === 'string' ? error.response.data.errors : JSON.stringify(error.response.data.errors);
            }
            setAlertMessage(msg, '#dc143c');
        } finally {
            setLoading(false);
        }
    };

    const clearState = () => {
    };

    return (
        <View style={{ ...GStyles.view }}>
            <Header
                style={{ marginBottom: 0 }}
                openDrawer={() => navigation.openDrawer()}
            />
            <View style={{ width: '100%', backgroundColor: THEME.cor.whitesmoke }}>
                <Text h3 h3Style={{ padding: 8, textAlign: 'center' }}>
                    Criar conta
                </Text>
                <Divider />
            </View>

            <View style={[GStyles.container]}>
                <SearchUserByCompanyModal
                    title="Buscar Usuário"
                    onUserFound={handleUserFound}
                    placeholderText="Busque pelo CPF"
                    isVisible={!user && !showCreateForm && isFocused}
                    onClose={() => {
                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        }
                    }}
                />

                {showCreateForm && (
                    <ScrollView contentContainerStyle={{ padding: 10 }}>
                        <Card containerStyle={styles.cardBase}>
                            <Card.Title>Novo Usuário</Card.Title>
                            <Card.Divider />

                            <Input
                                label="Tipo de Documento"
                                value={formData.documentType}
                                onChangeText={text => setFormData({ ...formData, documentType: text })}
                                disabled
                            />

                            <Input
                                label="Documento"
                                value={formData.document}
                                onChangeText={text => setFormData({ ...formData, document: text })}
                                keyboardType="numeric"
                            />

                            <Input
                                label="Primeiro Nome"
                                value={formData.firstName}
                                onChangeText={text => setFormData({ ...formData, firstName: text })}
                            />

                            <Input
                                label="Sobrenome"
                                value={formData.lastName}
                                onChangeText={text => setFormData({ ...formData, lastName: text })}
                            />

                            <Input
                                label="Email"
                                value={formData.email}
                                onChangeText={text => setFormData({ ...formData, email: text })}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />

                            <Button
                                title="Criar Usuário"
                                onPress={handleCreateUser}
                                loading={loading}
                                buttonStyle={{ backgroundColor: THEME.cor.azulEscuro, marginTop: 10 }}
                            />

                            <Button
                                title="Cancelar"
                                type="clear"
                                onPress={() => setShowCreateForm(false)}
                                disabled={loading}
                            />
                        </Card>
                    </ScrollView>
                )}
            </View>
            <Loading isActive={loadingTicketId !== null} />
        </View>




    );
};

const styles = StyleSheet.create({
    cardBase: {
        width: '100%',
        padding: 15,
        borderRadius: 8,
        marginVertical: 5,
        backgroundColor: 'white',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    profileImage: {
        width: 250,
        height: 250,
        borderRadius: 125,
        marginBottom: 10
    },
    placeholderImage: {
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: '#e1e1e1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        flexWrap: 'wrap'
    },
    label: {
        fontWeight: 'bold',
        color: '#555',
        fontSize: 16,
    },
    value: {
        fontSize: 16,
        color: '#333',
        flexShrink: 1,
        textAlign: 'right'
    },
    ticketCard: {
        borderRadius: 8,
        padding: 10,
        marginVertical: 4,
    },
    ticketTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    ticketSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    statusContainer: {
        marginTop: 8,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: '#f0f0f0'
    },
    statusDelivered: {
        color: 'green',
        fontWeight: 'bold',
        fontSize: 12
    },
    statusPending: {
        color: 'orange',
        fontWeight: 'bold',
        fontSize: 12
    }
});

export default CreateUser;