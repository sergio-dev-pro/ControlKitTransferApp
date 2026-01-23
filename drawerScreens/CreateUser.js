import React, { useContext, useState, useCallback } from 'react';
import { StyleSheet, View, Image, Alert } from 'react-native';
import { Button, Card, Divider, Icon, Text } from '@rneui/themed';
import Header from '../components/Header';
import Loading from '../components/Loading';
import GStyles from '../style/global';
import THEME from '../style/theme';
import { AuthContext } from '../context/AuthContext';
import { useNavigation, useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useAlert } from '../context/AlertContext';
import SearchUserByCompanyModal from '../components/SearchUserByCompanyModal';

const CreateUser = () => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { userToken, selectedEventId, facialProvider } = useContext(AuthContext);
    console.log('@@@facialProvider='+ facialProvider);
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
       if(foundUser)
       {
            setAlertMessage("CPF já possui conta na empresa "+ foundUser.company +".", '#dc143c');
       }
       else{
        //todo: colocar para mostrar visualização do formulário deve ser enviado para 
        // a rota POST /users um formData com os parametros: DocumentType, Document, Face, Firstname, Lastname, Email
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
                    isVisible={!user && isFocused}
                    onClose={() => {
                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        }
                    }}
                />
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

export default CreateUser;