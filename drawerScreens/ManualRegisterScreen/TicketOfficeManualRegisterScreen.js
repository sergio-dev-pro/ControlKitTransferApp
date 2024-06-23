import {Badge, Button, Divider, Input, ListItem, Text} from '@rneui/themed';
import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {ScrollView, View} from 'react-native';
import Header from '../../components/Header';
import Loading from '../../components/Loading';
import {useAlert} from '../../context/AlertContext';
import {AuthContext} from '../../context/AuthContext';
import GStyles from '../../style/global';
import {cpfValidation, isValidEmail} from '../../helpers/validation';
import {
  completeManualRegister,
  getUserByCpf,
  getUserByEmail,
} from '../../api/UserApi';
import Modal from 'react-native-modal';
import THEME from '../../style/theme';
import {useIsFocused} from '@react-navigation/native';
import RegisterForm from './RegisterForm';
import GuestRegistrations from './GuestRegistrations';
import CodeReaderForEachDay from './CodeReaderForEachDay';
import {formatDateAaaaMmDd} from '../../helpers/format';
import SearchUserModal from '../../components/SearchUserModal';
const formatDate = date => {
  var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [day, month, year].join('/');
};
function TicketOfficeManualRegisterScreen({navigation}) {

  const [user, setUser] = useState();

  const isFocused = useIsFocused();
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const ref = useRef();

  useEffect(() => {
    // O ref.current e utilizado para verificar se
    //  o componente ja foi renderizado pela primeira vez.
    ref.current ? isFocused && setIsVisible(true) : (ref.current = true);
  }, [isFocused]);

  // TODO: Não remover
  const handleUserFound = userFounded => {
    if (userFounded.isActive) return alert('Usuário já registrado.');
    setIsVisible(false);
    setUser(userFounded);
  };

  const clearStates = () => {
    setUser(undefined);
  };  
  const daySectorArray = user && Object.entries(user?.daySectors);
  console.log('@@@ user', user);
  return (
    <>
      <View style={{...GStyles.view}}>
        <Header
          style={{marginBottom: 0}}
          openDrawer={() => navigation.openDrawer()}
        />
        <Loading isActive={loading} />
        <View style={{width: '100%', backgroundColor: THEME.cor.whitesmoke}}>
          <Text h4 h4Style={{padding: 8, textAlign: 'center'}}>
            Cadastro manual - Bilheteria
          </Text>
          <Divider />
        </View>
        <ScrollView style={[GStyles.container, {height: '100%'}]}>
          {user && (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text h5 style={{paddingLeft: 4}}>
                  CPF:
                </Text>
                <Badge value={user.id} status="success" />
              </View>
              <View>
                {daySectorArray.map(([date, sector]) => (
                  <ListItem key={date}>
                    <ListItem.Content>
                      <ListItem.Title style={{padding: 0, fontSize: 20}}>
                        Dia {formatDate(date)}, Setor {sector}.
                      </ListItem.Title>
                    </ListItem.Content>
                  </ListItem>
                ))}
              </View>
              <View>
                <Button type="solid" size="lg" color="warning" style={{}}>
                  Tirar foto
                </Button>
              </View>
            </>
          )}
        </ScrollView>
        {!user && (
          <SearchUserModal
            onUserFound={handleUserFound}
            isVisible={isVisible}
            onClose={() => {
              setIsVisible(false);
              navigation.navigate('Kits');
            }}
          />
        )}
      </View>
    </>
  );
}

export default TicketOfficeManualRegisterScreen;
