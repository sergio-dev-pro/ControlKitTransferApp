import React, { useContext, useState, useCallback } from 'react';
import { StyleSheet, View, Image, Alert } from 'react-native';
import { Button, Card, Divider, Icon, Text } from '@rneui/themed';
import { FlatList } from 'react-native-gesture-handler';
import Header from '../components/Header';
import Loading from '../components/Loading';
import GStyles from '../style/global';
import THEME from '../style/theme';
import { AuthContext } from '../context/AuthContext';
import { useNavigation, useFocusEffect, useIsFocused } from '@react-navigation/native';
import { forceFacialSync } from '../api/TicketApi';
import { useAlert } from '../context/AlertContext';
import SearchUserByCompanyModal from '../components/SearchUserByCompanyModal';

const BuscaGeral = () => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { userToken, selectedEventId, facialProvider } = useContext(AuthContext);
    const [user, setUser] = useState(null);
    const [loadingTicketId, setLoadingTicketId] = useState(null);
    const setAlertMessage = useAlert();
    useFocusEffect(
        useCallback(() => {
            return () => {
                setUser(null);
            };
        }, [])
    );

    const handleUserFound = (foundUser) => {
        if (!foundUser) return;
        const updatedUser = { ...foundUser };
        setUser(updatedUser);
    };

    const clearState = () => {
        setUser(null);
    };

    const handleForceSync = async (ticketId) => {
        try {
            setLoadingTicketId(ticketId);
            await forceFacialSync(userToken, ticketId, selectedEventId);
            setAlertMessage("Sincronização enviada com sucesso!", '#32cd32');
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Erro ao enviar sincronização.";
            setAlertMessage(errorMessage, '#dc143c');
        } finally {
            setLoadingTicketId(null);
        }
    }

    console.log(user)

    return (
        <View style={{ ...GStyles.view }}>
            <Header
                style={{ marginBottom: 0 }}
                openDrawer={() => navigation.openDrawer()}
            />
            <View style={{ width: '100%', backgroundColor: THEME.cor.whitesmoke }}>
                <Text h3 h3Style={{ padding: 8, textAlign: 'center' }}>
                    Busca Geral
                </Text>
                <Divider />
            </View>

            <View style={[GStyles.container]}>
                <SearchUserByCompanyModal
                    title="Buscar Usuário"
                    onUserFound={handleUserFound}
                    placeholderText="Busque pelo CPF"
                    isVisible={!user && isFocused}
                    onClose={() => {
                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        }
                    }}
                />

                {user && (
                    <View style={{ flex: 1, width: '100%' }}>
                        <FlatList
                            data={user.tickets || []}
                            keyExtractor={(item) => item.id}
                            ListHeaderComponent={
                                <>
                                    <Card containerStyle={styles.cardBase}>
                                        <View style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}>
                                            <Icon
                                                name="close"
                                                type="material"
                                                color="red"
                                                size={30}
                                                onPress={clearState}
                                            />
                                        </View>
                                        <View style={{ alignItems: 'center', marginBottom: 15 }}>
                                            {user.photoUrl ? (
                                                <>
                                                    <Image
                                                        source={{ uri: user.photoUrl }}
                                                        style={styles.profileImage}
                                                    />
                                                </>
                                            ) : (
                                                <View style={styles.placeholderImage}>
                                                    <Icon name="person" type="material" size={50} color="#9e9e9e" />
                                                </View>
                                            )}
                                            <Text h4 style={{ textAlign: 'center' }}>{user.name || 'Nome não informado'}</Text>
                                        </View>

                                        <Divider style={{ marginBottom: 10 }} />

                                        <View style={styles.infoRow}>
                                            <Text style={styles.label}>Documento:</Text>
                                            <Text style={styles.value}>{user.id || user.document || 'Não informado'}</Text>
                                        </View>

                                        <View style={styles.infoRow}>
                                            <Text style={styles.label}>E-mail:</Text>
                                            <Text style={styles.value}>{user.email || 'Não informado'}</Text>
                                        </View>
                                    </Card>

                                    {user.tickets && user.tickets.length > 0 && (
                                        <Text h4 style={{ textAlign: 'center', marginTop: 15, marginBottom: 5 }}>
                                            Ingressos ({user.tickets.length})
                                        </Text>
                                    )}
                                </>
                            }
                            renderItem={({ item }) => {
                                if (item.type === 1) {
                                    return (
                                        <Card containerStyle={styles.ticketCard}>
                                            <Text style={styles.ticketSubtitle}>
                                                {item.day || 'Data não especificada'}
                                            </Text>
                                            <Text style={styles.ticketTitle}>
                                                {item.sector || 'Setor desconhecido'}
                                            </Text>
                                            {item.status === 2 && user.photoUrl && facialProvider == 3 && (
                                                <Button
                                                    title="Forçar Sincronização"
                                                    onPress={() => handleForceSync(item.id)}
                                                    loading={loadingTicketId === item.id}
                                                    disabled={loadingTicketId !== null}
                                                />
                                            )}
                                        </Card>
                                    );
                                } else if (item.type === 2 || item.type === 3) {
                                    return (
                                        <Card containerStyle={styles.ticketCard}>
                                            <Text style={styles.ticketTitle}>
                                                {item.accessPolicy || 'Política de Acesso'}
                                            </Text>
                                            <Text style={styles.ticketSubtitle}>
                                                Credencial
                                            </Text>
                                            {item.status === 2 && user.photoUrl && (
                                                <Button
                                                    title="Forçar Sincronização"
                                                    onPress={() => handleForceSync(item.id)}
                                                    loading={loadingTicketId === item.id}
                                                    disabled={loadingTicketId !== null}
                                                />
                                            )}
                                        </Card>
                                    );
                                }
                                return null;
                            }}
                            ListEmptyComponent={
                                <Text style={{ textAlign: 'center', marginTop: 20, fontSize: 16 }}>
                                    Nenhum ingresso encontrado.
                                </Text>
                            }
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    </View>
                )}
            </View>
            <Loading isActive={loadingTicketId !== null} />
        </View>
    );
};

const styles = StyleSheet.create({
    cardBase: {
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

export default BuscaGeral;