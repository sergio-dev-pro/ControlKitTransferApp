import {Header as HeaderRNE, Text} from '@rneui/themed';
import React, {useContext} from 'react';
import THEME from '../style/theme';
import {AuthContext} from '../context/AuthContext';
/* @props openDawer
 */
function Header({openDrawer}) {
  const {logout} = useContext(AuthContext);
  if (!openDrawer) {
    console.error(' openDrawer props is required');
    return null;
  }
  return (
    <HeaderRNE
      containerStyle={{
        backgroundColor: 'white',
        flex: 0,
        borderBottomWidth: 3,
        marginBottom: 16,
        paddingVertical: 20,
        paddingHorizontal: 40,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      centerComponent={
        <Text h3 style={{color: THEME.cor.primary}}>
          Controle Kit/Transfer
        </Text>
      }
      leftComponent={{
        icon: 'menu',
        iconStyle: {paddingTop: 8},
        color: THEME.cor.primary,
        size: 35,
        onPress: openDrawer,
      }}
      rightComponent={{
        icon: 'logout',
        iconStyle: {padding: 8},
        size: 35,
        color: THEME.cor.grey,
        onPress: logout,
      }}
    />
  );
}

export default Header;
