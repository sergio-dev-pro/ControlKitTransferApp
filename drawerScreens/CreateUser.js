import React, { useContext, useState, useCallback } from 'react';
import { StyleSheet, View, Image, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Button, Card, Divider, Icon, Text, Input } from '@rneui/themed';
import Header from '../components/Header';
import Loading from '../components/Loading';
import GStyles from '../style/global';
import THEME from '../style/theme';
import { AuthContext } from '../context/AuthContext';
import { useNavigation, useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useAlert } from '../context/AlertContext';
import SearchUserByCompanyModal from '../components/SearchUserByCompanyModal';
import { createUser, getBasicUserByEmail } from '../api/UserApi';
import SelectModal from '../components/SelectModal';
import TakePictureScreen from './ManualRegisterScreen/TakePictureScreen';
import { RegisterStateContext } from './ManualRegisterScreen/registerContext';
import { cpfValidation } from '../helpers/validation';

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

    const [loading, setLoading] = useState(false);

    // Photo states
    const [takePhoto, setTakePhoto] = useState(false);
    const [picturePath, setPicturePath] = useState(null);
    const [isReviewing, setIsReviewing] = useState(false);
    const [suggestionsEmail, setSuggestionsEmail] = useState([]);

    useFocusEffect(
        useCallback(() => {
            return () => {
                setUser(null);
                setShowCreateForm(false);
                setTakePhoto(false);
                setPicturePath(null);
                setIsReviewing(false);
                setSuggestionsEmail([]);
            };
        }, [])
    );

    const handleUserFound = (foundUser) => {
        console.log('@@@handleUserFound=' + JSON.stringify(foundUser));

        if (foundUser.email || foundUser.document || foundUser.company) {
            setAlertMessage("CPF já possui conta na empresa " + foundUser.company + ".", '#dc143c');
        } else {
            handleUserNotFound(foundUser.id)
        }
    };

    const handleUserNotFound = (searchedValue) => {
        console.log('@@@handleUserNotFound=' + searchedValue);

        const isPassport = /[a-zA-Z]/.test(searchedValue);

        setUser({
            documentType: isPassport ? 'Passport' : 'CPF',
            document: isPassport ? searchedValue.toUpperCase() : searchedValue,
            firstName: '',
            lastName: '',
            email: ''
        });
        setShowCreateForm(true);
    };

    const validateUserData = async (checkEmail = true) => {
        const firstName = (user.firstName || '').trim();
        const lastName = (user.lastName || '').trim();
        const email = (user.email || '').trim();
        const document = (user.document || '').trim();

        if (firstName.length < 2) return 'O primeiro nome é obrigatório e deve ter no mínimo 2 caracteres.';
        if (lastName.length < 2) return 'O sobrenome é obrigatório e deve ter no mínimo 2 caracteres.';
        if (!email || !email.includes('@')) return 'E-mail inválido.';

        if (user.documentType === 'CPF') {
            if (!cpfValidation(document)) return 'CPF inválido.';
        } else {
            if (document.length < 5) return 'Passaporte deve ter no mínimo 5 caracteres.';
        }

        const isCPF = (user.documentType || '').toLowerCase() === 'cpf';

        const cleanDocument = isCPF ? document.replace(/[^\d]/g, '') : document.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        
        if (email && cleanDocument && checkEmail) {
            try {
             console.log('Check if exists document by email...');
            const userDocument = await getBasicUserByEmail(email.toLowerCase(), selectedEventId, userToken);
            console.log('user by email returned ' + userDocument);

            const existing = isCPF ? (userDocument.document || '').replace(/[^\d]/g, '') : (userDocument.document || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
            if (existing && existing !== cleanDocument) {
                const docLabel = isCPF ? 'CPF' : 'passaporte';
                return `O email enviado está vinculado ao ${docLabel}: ${userDocument.document}`;
            }
            } catch (error) {
            console.log(error);
            }
        }

        return null;
    };

    const handleContinue = async () => {
        const validationError = await validateUserData();
        if (validationError) {
            setAlertMessage(validationError, '#ffa500');
            return;
        }
        setIsReviewing(true);
    };

    const savePhoto = async (path) => {
        setPicturePath(path);
        setTakePhoto(false);
    };

    const handleEmailChange = (text) => {
        setUser({ ...user, email: text });
        if (text.includes('@')) {
            const [, domainPart] = text.split('@');
            if (!domainPart) {
                setSuggestionsEmail(DOMAINS.map((domain) => `@${domain}`));
            } else {
                const filteredDomains = DOMAINS.filter((domain) =>
                    domain.startsWith(domainPart.toLowerCase())
                );
                setSuggestionsEmail(filteredDomains.map((domain) => `@${domain}`));
            }
        } else {
            setSuggestionsEmail([]);
        }
    };

    const onSuggestionPress = (domain) => {
        const [namePart] = user.email.split('@');
        const newEmail = `${namePart}${domain}`;
        setUser({ ...user, email: newEmail });
        setSuggestionsEmail([]);
    };



    const completeUserCreation = async (photoPath) => {
        // Validação antes do envio
        const validationError = await validateUserData(false);
        if (validationError) {
            setAlertMessage(validationError, '#ffa500');
            return;
        }

        try {
            setLoading(true);
            const data = new FormData();
            data.append('DocumentType', user.documentType === 'CPF' ? 1 : 2);
            data.append('Document', user.document);
            data.append('Firstname', user.firstName);
            data.append('Lastname', user.lastName);
            data.append('Email', user.email);
            data.append('EventId', selectedEventId);

            if (photoPath) {
                data.append('Face', {
                    uri: photoPath,
                    type: 'image/jpeg',
                    name: 'userImage.jpg',
                });
            }

            console.log("🚀 Payload sendo enviado para a API (Criar Conta):", {
                DocumentType: user.documentType === 'CPF' ? 1 : 2,
                Document: user.document,
                Firstname: user.firstName,
                Lastname: user.lastName,
                Email: user.email,
                EventId: selectedEventId,
                Face: photoPath ? photoPath : 'Sem foto'
            });

            const response = await createUser(data, userToken);

            if (response) {
                setAlertMessage('Usuário criado com sucesso', '#32cd32');
            }

            // Cleanup com delay para garantir que o Alerta apareça antes do Modal de Busca (que aparece quando o user é null)
            setTimeout(() => {
                setShowCreateForm(false);
                setUser(null);
                setPicturePath(null);
                setIsReviewing(false);
            }, 1500);
        } catch (error) {
            console.error('❌ Erro ao criar usuário:', error);

            let msg = 'Erro ao processar a requisição.';

            if (error.response) {
                // Erro retornado pela API
                console.error('Status:', error.response.status);
                console.error('Data:', JSON.stringify(error.response.data, null, 2));

                if (error.response.data?.message) {
                    msg = error.response.data.message;
                } else if (error.response.data?.errors) {
                    // Caso errors seja string ou objeto
                    msg = typeof error.response.data.errors === 'string'
                        ? error.response.data.errors
                        : JSON.stringify(error.response.data.errors);
                }
            } else if (error.request) {
                // Erro de rede (sem resposta)
                msg = 'Sem resposta do servidor. Verifique sua conexão.';
            } else {
                // Erro na configuração ou outro
                msg = error.message;
            }

            setAlertMessage(msg, '#dc143c');
        } finally {
            setLoading(false);
        }
    };

    const clearState = () => {


    };

    return (
        <RegisterStateContext.Provider
            value={{
                cancelPhoto: () => setTakePhoto(false),
                savePhoto,
                isSavingPhoto: loading,
            }}>
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

                    {showCreateForm && user && (
                        <ScrollView contentContainerStyle={{ padding: 10 }}>
                            <Card containerStyle={styles.cardBase}>
                                <Card.Title>Novo Usuário</Card.Title>
                                <Card.Divider />

                                {!isReviewing ? (
                                    <>
                                        <SelectModal
                                            label={'Tipo do documento'}
                                            items={[{ key: 'CPF', value: 'CPF' }, { key: 'Passport', value: 'Passaporte' }]}
                                            setValue={value => {
                                                setUser(prev => ({
                                                    ...prev,
                                                    documentType: value,
                                                    document: ''
                                                }));
                                            }}
                                            value={user.documentType}
                                        />

                                        {user.documentType === 'CPF' ? (
                                            <Input
                                                label={`Documento (CPF)`}
                                                value={user.document}
                                                onChangeText={text => setUser({ ...user, document: text })}
                                                keyboardType="numeric"
                                            />
                                        ) : (
                                            <Input
                                                label={`Documento (Passaporte)`}
                                                value={user.document}
                                                onChangeText={text => setUser({ ...user, document: text.toUpperCase() })}
                                                autoCapitalize="characters"
                                            />
                                        )}

                                        <Input
                                            label="Nome"
                                            value={user.firstName}
                                            onChangeText={text => setUser({ ...user, firstName: text })}
                                        />

                                        <Input
                                            label="Sobrenome"
                                            value={user.lastName}
                                            onChangeText={text => setUser({ ...user, lastName: text })}
                                        />

                                        <Input
                                            label="Email"
                                            value={user.email}
                                            onChangeText={handleEmailChange}
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

                                        <Button
                                            title="Continuar"
                                            onPress={handleContinue}
                                            loading={loading}
                                            buttonStyle={{ marginTop: 10 }}
                                        />

                                        <Button
                                            title="Cancelar"
                                            type="clear"
                                            onPress={() => {
                                                setShowCreateForm(false);
                                                setUser(null);
                                            }}
                                            disabled={loading}
                                            buttonStyle={{ marginTop: 10 }}
                                        />
                                    </>
                                ) : (
                                    <View style={{ paddingHorizontal: 10 }}>
                                        {!picturePath ? (
                                            <Button
                                                type="solid"
                                                size="lg"
                                                containerStyle={{ marginTop: 20 }}
                                                onPress={() => setTakePhoto(true)}>
                                                Cadastrar foto
                                            </Button>
                                        ) : (
                                            <Button
                                                type="solid"
                                                size="lg"
                                                containerStyle={{ marginTop: 20 }}
                                                onPress={() => completeUserCreation(picturePath)}>
                                                Finalizar Cadastro
                                            </Button>
                                        )}

                                        <Button
                                            containerStyle={{ marginTop: 15 }}
                                            type="outline"
                                            onPress={() => setIsReviewing(false)}>
                                            Editar dados
                                        </Button>

                                        <Button
                                            containerStyle={{ marginTop: 30 }}
                                            titleStyle={{ color: 'gray', fontSize: 14 }}
                                            type="clear"
                                            onPress={() => {
                                                Alert.alert("Cancelar?", "Todos os dados serão perdidos.", [
                                                    { text: "Não" },
                                                    {
                                                        text: "Sim, cancelar", onPress: () => {
                                                            setShowCreateForm(false);
                                                            setUser(null);
                                                            setIsReviewing(false);
                                                            setPicturePath(null);
                                                        }
                                                    }
                                                ])
                                            }}>
                                            Cancelar processo
                                        </Button>
                                    </View>
                                )}
                            </Card>
                        </ScrollView>
                    )}
                </View>
                <Loading isActive={loadingTicketId !== null || loading} />
                {takePhoto && <TakePictureScreen />}
            </View>
        </RegisterStateContext.Provider>
    );


};

const styles = StyleSheet.create({
    cardBase: {
        padding: 15,
        borderRadius: 8,
        marginVertical: 5,
        marginHorizontal: 0,
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
    },
    listContainer: {
        borderColor: '#ddd',
        borderWidth: 1,
        borderTopWidth: 0,
        borderRadius: 5,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        backgroundColor: '#fff',
        marginTop: -5,
        marginHorizontal: 10,
        zIndex: 5,
    },
    listItem: {
        padding: 10,
    },
    bottomDivider: {
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    suggestionText: {
        fontSize: 16,
        color: '#333',
    },
});

export default CreateUser;