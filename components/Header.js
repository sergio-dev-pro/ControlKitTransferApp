import { Dialog, Header as HeaderRNE, Text, Icon } from '@rneui/themed';
import React, { useContext, useState } from 'react';
import { View } from 'react-native';
import THEME from '../style/theme';
import { AuthContext } from '../context/AuthContext';
import { IS_MOBILE } from '../constants/layout';

/* @props openDrawer */
function Header({ openDrawer, style = {} }) {
  const [showDialog, setShowDialog] = useState(false);
  const { logout, userName } = useContext(AuthContext);

  if (!openDrawer) {
    console.error('openDrawer props is required');
    return null;
  }

  const toggleDialog = () => setShowDialog(prevState => !prevState);

  return (
    <>
      <HeaderRNE
        containerStyle={[
          {
            backgroundColor: 'white',
            flex: 0,
            borderBottomWidth: 3,
            marginBottom: 16,
            paddingVertical: 20,
            paddingHorizontal: 40,
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}
        centerComponent={
          IS_MOBILE ? (
            <Text h4 style={{ color: THEME.cor.primary }}>
              Controle Kit/Transfer
            </Text>
          ) : (
            <Text h3 style={{ color: THEME.cor.primary }}>
              Controle Kit/Transfer
            </Text>
          )
        }
        leftComponent={{
          icon: 'menu',
          iconStyle: { paddingTop: 8 },
          color: THEME.cor.primary,
          size: 35,
          onPress: openDrawer,
        }}
        rightComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {userName ? (
              <Text
                style={{
                  marginRight: 12,
                  color: THEME.cor.primary,
                  fontWeight: '600',
                }}
                numberOfLines={1}
              >
                {userName}
              </Text>
            ) : null}

            <Icon
              name="logout"
              size={30}
              color={THEME.cor.grey}
              onPress={toggleDialog}
            />
          </View>
        }
      />

      <Dialog isVisible={showDialog} onBackdropPress={toggleDialog}>
        <Dialog.Title titleStyle={{ fontSize: 32 }} title="Deseja sair?" />
        <Dialog.Actions>
          <Dialog.Button
            type="solid"
            size="lg"
            containerStyle={{ marginLeft: 16 }}
            title="Sim"
            onPress={logout}
          />
          <Dialog.Button title="Não" size="lg" onPress={toggleDialog} />
        </Dialog.Actions>
      </Dialog>
    </>
  );
}

export default Header;