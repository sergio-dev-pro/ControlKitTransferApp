import {Button, Card, Divider, Icon, Image, Input, Text} from '@rneui/themed';
import React, {useContext, useEffect, useRef, useState} from 'react';
import {Platform, ScrollView, View} from 'react-native';
import Header from '../components/Header';
import QrCodeReader from '../components/QrCodeReader';
import {useAlert} from '../context/AlertContext';
import {AuthContext} from '../context/AuthContext';
import {getDeviceId} from 'react-native-device-info';
import GStyles from '../style/global';
import {fetchTickets, registerTicket} from '../api/TicketApi';
import * as realmApi from '../api/realmApi';
import useNetinfo from './hooks/useNetinfo';
import THEME from '../style/theme';
import Signature from '../components/Signature';
import TakePictureModal from '../components/TakePictureModal';
import {
  ticketOwnerDocumentRegistration,
  ticketOwnerSignatureRegistration,
} from '../api/FilesApi';
import {FlatList} from 'react-native-gesture-handler';

import {IS_MOBILE} from '../constants/layout';
import ReactNativeModal from 'react-native-modal';
import {formatDateForTextDay} from '../helpers/format';
import {isDateGreaterThanOrEqualToToday} from '../helpers/validation';
import {getEventRequiredFields} from '../api/EventApi';
import Loading from '../components/Loading';
import SelectModal from '../components/SelectModal';

function KitsDrawerScreen({navigation}) {
  const authContext = useContext(AuthContext);
  const [showQrCodeReader, setShowQrcodereader] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncronizingTicket, setSyncronizingTicket] = useState(false);
  const [qrCodeReader, setQrcodereader] = useState();
  const [ticketFounds, setTicketFounds] = useState([]);
  const [isShowInputError, setIsShowInputError] = useState(false);
  const [isShow, setIsShow] = useState(false);
  const [documentImg, setDocumentImg] = useState(false);
  const [name, setName] = useState('');
  const setAlertMessage = useAlert();
  const {isConnected} = useNetinfo();
  const [signature, setSignature] = useState();
  const [isVisible, setIsVisible] = useState();

  const [isLoading, setIsLoading] = useState();
  const [isConfirmDelivery, setIsConfirmDelivery] = useState(false);
  const [mustSelectShirtSize, setMustSelectShirtSize] = useState(false);
  const [checkingIfNeedSelectShirtSize, setCheckingIfNeedSelectShirtSize] =
    useState(false);

  useEffect(() => {
    (async () => {
      try {
        setCheckingIfNeedSelectShirtSize(true);
        const response = await getEventRequiredFields(
          authContext.selectedEventId,
        );
        console.log(
          'KitsDrawerScreen useEffect getEventRequiredFields.data',
          response.data,
        );
        setMustSelectShirtSize(response.data.shirtSizeIsRequired);
      } catch (error) {
        console.log('KitsDrawerScreen useEffect getEventRequiredFields', error);
        alert('Erro ao buscar campos requeridos, saia e entre novamente.');
      } finally {
        setCheckingIfNeedSelectShirtSize(false);
      }
    })();
  }, [authContext.selectedEventId]);

  const syncTickets = async () => {
    try {
      const getTickets = async () => {
        return new Promise(async (resolve, reject) => {
          try {
            let deviceId = getDeviceId();
            const {data: tickets} = await fetchTickets(
              deviceId,
              authContext.selectedEventId,
              authContext.userToken,
            );
            resolve(tickets);
          } catch (error) {
            console.error(JSON.stringify(error));
            reject();
          }
        });
      };
      const tickets = await getTickets();
      tickets.length && (await realmApi.saveTickets(tickets));
      await realmApi.sendLocallySavedPendingRegisteredTickets(
        authContext.userToken,
      );
    } catch (error) {
      console.error(error);
    }
  };

  // useEffect(() => {
  //   setInterval(() => {
  //     console.log('Kits sincroonizando a cada 30 seg...');
  //     syncTickets();
  //   }, 30000);
  // }, []);

  //const isFirstSyncRef = useRef(false);
  // useEffect(() => {
  //   if (isConnected !== null) {
  //     isFirstSyncRef.current = true;
  //     if (isFirstSyncRef.current) {
  //       isConnected &&
  //         (async () => {
  //           setSyncronizingTicket(true);
  //           await syncTickets();
  //           setSyncronizingTicket(false);
  //         })();
  //     } else isConnected && syncTickets();
  //   }
  // }, [isConnected]);

  const handleQRCodeRead = async ticketCode => {
    // #
    const isCodeWithHashtag = ticketCode.includes('#');
    const code = isCodeWithHashtag ? ticketCode.split('#')[0] : ticketCode;

    if (ticketFounds.length > 0) {
      const ticketCodeFounds = ticketFounds.map(ticket => ticket.code);
      // Verifica se o codigo lido ja foi lido.
      if (ticketCodeFounds.includes(code))
        return setAlertMessage('Ingresso já adicionado.');
    }

    setShowQrcodereader(false);
    // if (!isConnected) {
    //   try {
    //     setLoading(false);
    //     const response = await realmApi.registerTicketOffline(code);
    //     setTicketFounds(prevTicketFounds => [...prevTicketFounds, response]);
    //     // setAlertMessage('Registro de entrega de kit realizado.');
    //   } catch (error) {
    //     console.error(error);
    //     setAlertMessage(error.message);
    //   } finally {
    //     setLoading(false);
    //   }
    //   return;
    // }
    try {
      setLoading(true);
      const {data: ticket} = await registerTicket(code, authContext.userToken);
      if (ticket.kitDelivered)
        return setAlertMessage(
          `O kit de ${ticket.name} para o dia ${formatDate(
            ticket.day,
          )} já foi entregue.`,
        );
      // if (!isDateGreaterThanOrEqualToToday(ticket.day))
      //   return setAlertMessage(
      //     `O dia para esse ingresso ${formatDate(
      //       ticket.day,
      //     )} já passou! Nao é possível contabilizar a entrega para esse dia.`,
      //   );
      const newTicketFound = {
        ...ticket,
        code,
      };
      if (mustSelectShirtSize) newTicketFound.shirtSize = '';
      setTicketFounds(prevTicketFounds => [
        ...prevTicketFounds,
        newTicketFound,
      ]);
    } catch (error) {
      console.error(error);
      console.error(JSON.stringify(error));
      setAlertMessage('Ingresso não encontrado.', '#dc143c');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const cancel = () => {
    setSignature(undefined);
    setName('');
    setTicketFounds([]);
    setDocumentImg(undefined);
  };
  const registerDelivery = async () => {
    if (mustSelectShirtSize) {
      const ticktesWithSelectedShirtSize = ticketFounds.filter(
        t => t.shirtSize.length > 0,
      );
      const hasShirtSizeTicketsSelected =
        ticketFounds.length === ticktesWithSelectedShirtSize.length;

      if (!hasShirtSizeTicketsSelected) {
        setIsConfirmDelivery(false);
        return setAlertMessage(
          'Selecione o tamanho da camisa para cada ingresso listado',
          '#dc143c',
        );
      }
    }

    try {
      setIsLoading(true);
      try {
        const formData = new FormData();

        formData.append('codes', JSON.stringify(ticketFounds.map(t => t.code)));

        formData.append('file', {
          uri: documentImg,
          type: 'image/jpg',
          name: 'documentImage.jpg',
        });

        if (mustSelectShirtSize) {
          const shirtSizeByCode = {};
          for (var ticket in ticketFounds) {
            shirtSizeByCode[ticketFounds[ticket].code] =
              ticketFounds[ticket].shirtSize;
          }
          formData.append('codesShirtSize', JSON.stringify(shirtSizeByCode));
        }
        await ticketOwnerDocumentRegistration(authContext.userToken, formData);
      } catch (error) {
        throw `Chamada para registrar documento, payload = ${JSON.stringify({
          formData,
        })} ${ticketOwnerDocumentRegistration}${error}`;
      }

      const formData = new FormData();

      formData.append('codes', JSON.stringify(ticketFounds.map(t => t.code)));
      formData.append('file', {
        uri: 'data:image/png;base64,' + signature?.encoded + ';',
        type: 'image/png',
        name: 'signatureImage.png',
      });
      
      console.log(
        '__________________ticketOwnerSignatureRegistration',
        formData,
      );
      await ticketOwnerSignatureRegistration(authContext.userToken, formData);
      setAlertMessage('Entrega de kit registrada', '#32cd32');
    } catch (error) {
      console.error(error);
      setAlertMessage('Entrega não registrada! KIT NAO FOI ENTREGUE!');
    } finally {
      cancel();
      setIsLoading(false);
    }
  };
  const all = realmApi.getAllTickets().reduce((a, b) => {
    return a[b.userDocument]
      ? {...a, [b.userDocument]: [...a[b.userDocument], b.ticketCode]}
      : {...a, [b.userDocument]: [b.ticketCode]};
  }, {});
  // console.log(
  //   'alltickets',
  //   JSON.stringify(
  //     Object.keys(all)
  //       .filter(a => all[a].length > 1)
  //       .map(a => all[a]),
  //   ),
  // );
  // console.log(`@@@ ticketFounds`, ticketFounds, ticketCode);
  console.log('@@@ MOCK', ticketFounds);
  const inputNameErrorMsg =
    (name.length === 0 && 'Campo de nome deve ser preenchido') ||
    (name.length < 3 && 'Campo de nome deve ter no minímo 3 caracteres') ||
    undefined;
  const requestSubscription = () => {
    setIsShow(true);
  };

  const formatDate = date => {
    var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [day, month, year].join('/');
  };

  return (
    <View style={{...GStyles.view}}>
      <Header
        style={{marginBottom: 0}}
        openDrawer={() => navigation.openDrawer()}
      />
      <View style={{width: '100%', backgroundColor: THEME.cor.whitesmoke}}>
        <Text h3 h3Style={{padding: 8, textAlign: 'center'}}>
          {!syncronizingTicket
            ? 'Entrega de kits'
            : 'Aguarde: sincronizando ingressos.'}
        </Text>
        <Divider />
      </View>
      <View style={[GStyles.container]}>
        {ticketFounds.length > 0 ? (
          <>
            {/* ticket code reader manager */}
            <View style={{flex: 2}}>
              <View
                style={{
                  flex: 0,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}>
                <Button type="outline" size="sm" onPress={cancel}>
                  Voltar
                </Button>
                <Button
                  loading={loading || syncronizingTicket}
                  onPress={() => {
                    setQrcodereader(null);
                    setShowQrcodereader(true);
                  }}>
                  Adicionar mais ingressos
                </Button>
              </View>
              <Text h4 style={{textAlign: 'center'}}>
                {ticketFounds.length} ingresso{ticketFounds.length > 1 && 's'}{' '}
                adicionado
                {ticketFounds.length > 1 && 's'}
              </Text>
              <Divider />
              <FlatList
                style={{
                  marginBottom: 8,
                  flex: 1,
                  margin: 0,
                  padding: 0,
                }}
                data={ticketFounds}
                renderItem={({item: ticketFound}) => (
                  <Card containerStyle={{flex: 1}}>
                    <Text
                      h4
                      h4Style={{
                        fontSize: IS_MOBILE ? 14 : null,
                        textAlign: 'center',
                        marginBottom: 8,
                      }}>
                      {(() => {
                        const {name} = ticketFound;
                        return name;
                      })()}
                    </Text>

                    <View
                      style={{
                        width: '100%',
                        flexDirection: IS_MOBILE ? 'column' : 'row',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        marginBottom: 8,
                      }}>
                      <Text h4>Dia</Text>
                      <View>
                        <Text h4>{formatDate(ticketFound?.day)}</Text>
                        <Text h4>{formatDateForTextDay(ticketFound?.day)}</Text>
                      </View>
                    </View>
                    {ticketFound?.document && (
                      <View
                        style={{
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                        }}>
                        <Text h4>Documento</Text>
                        <Text h4>
                          {(() => {
                            const {document} = ticketFound;
                            if (document.length === 11) {
                              return document.replace(
                                /(\d{3})(\d{3})(\d{3})(\d{2})/,
                                '$1.$2.$3-$4',
                              );
                            } else if (document.length === 9) {
                              return document;
                            } else {
                              return document;
                            }
                          })()}
                        </Text>
                      </View>
                    )}

                    {ticketFound?.sectorName && (
                      <View
                        style={{
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                        }}>
                        <Text h4>Setor</Text>
                        <Text h4>{ticketFound.sectorName}</Text>
                      </View>
                    )}
                    {checkingIfNeedSelectShirtSize && (
                      <View
                        style={{
                          flex: 1,
                          justifyContent: 'center',
                          marginTop: 20,
                          marginBottom: 10,
                        }}>
                        <Loading isActive />
                      </View>
                    )}
                    {mustSelectShirtSize && (
                      <SelectModal
                        label="Tamanho da camisa"
                        value={ticketFound.shirtSize}
                        setValue={value =>
                          setTicketFounds(prevState =>
                            prevState.map(ticketInfo =>
                              ticketInfo.code == ticketFound.code
                                ? {...ticketInfo, shirtSize: value}
                                : ticketInfo,
                            ),
                          )
                        }
                        errorMessage={'Campo obrigatório'}
                        placeholder="Selecione"
                        items={[
                          {key: 'P', value: 'P'},
                          {key: 'M', value: 'M'},
                          {key: 'G', value: 'G'},
                          {key: 'GG', value: 'GG'},
                          {key: 'EG1', value: 'EG1'},
                          {key: 'EG2', value: 'EG2'},
                        ]}
                      />
                    )}
                  </Card>
                )}
              />
              <Divider style={{marginBottom: 8}} />
            </View>
            <Card
              containerStyle={{backgroundColor: 'ghostwhite', marginTop: 0}}>
              {!!documentImg ? (
                <View style={{flexDirection: 'row', justifyContent: 'center'}}>
                  <Image
                    style={{height: 120, width: 120, marginRight: 8}}
                    source={{
                      uri:
                        Platform.OS === 'android'
                          ? 'file://' + documentImg
                          : documentImg,
                    }}
                  />
                  {!!signature && (
                    <View>
                      <Image
                        style={{height: 120, width: 120, marginRight: 8}}
                        source={{
                          uri:
                            Platform.OS === 'android'
                              ? 'data:image/png;base64,' +
                                signature?.encoded +
                                ';'
                              : signature.pathName,
                        }}
                      />
                      <Text
                        h5
                        style={{
                          color: THEME.cor.primary,
                          width: '100%',
                          textAlign: 'center',
                        }}>
                        Assinado
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <>
                  <TakePictureModal
                    isVisible={isVisible}
                    cancelPhoto={() => {
                      setIsVisible(false);
                    }}
                    savePhoto={picture => {
                      setIsVisible(false);
                      setDocumentImg(picture);
                    }}
                  />
                  {/* <Text h5 h5Style={{padding: 8}}>
                    Confira os ingressos antes de continuar.
                  </Text> */}
                  <Button
                    type="outline"
                    onPress={() => {
                      setIsVisible(true);
                    }}>
                    Tire uma foto do documento
                  </Button>
                </>
              )}
              {!!signature ? (
                <>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      // backgroundColor: THEME.cor.whitesmoke,
                      padding: 8,
                      marginTop: 20,
                    }}>
                    <Button
                      type="outline"
                      containerStyle={{marginRight: 20}}
                      onPress={cancel}>
                      Cancelar
                    </Button>
                    <Button
                      containerStyle={{flex: 1}}
                      onPress={() => setIsConfirmDelivery(true)}>
                      Entregar
                    </Button>
                  </View>
                </>
              ) : (
                !!documentImg && (
                  <>
                    <Text h4 h4Style={{fontSize: 22, marginBottom: 8}}>
                      Assinatura do proprietário do ingresso
                    </Text>
                    <Button
                      type="outline"
                      onPress={() => {
                        requestSubscription();
                      }}>
                      Assinar
                    </Button>
                  </>
                )
              )}
            </Card>
            <Signature
              show={isShow}
              onNotShow={() => setIsShow(false)}
              onSigned={data => {
                setIsShow(false);
                setSignature(data);
              }}
            />
            <ReactNativeModal
              isVisible={isConfirmDelivery}
              onBackdropPress={() => setIsConfirmDelivery(false)}>
              <View
                style={{
                  backgroundColor: 'white',
                  padding: 20,
                }}>
                <Button
                  type="outline"
                  containerStyle={{marginBottom: 16}}
                  onPress={() => setIsConfirmDelivery(false)}>
                  Voltar
                </Button>
                <Button
                  size="lg"
                  loading={isLoading}
                  onPress={registerDelivery}>
                  Confirmar entrega
                </Button>
              </View>
            </ReactNativeModal>
          </>
        ) : (
          <Button
            loading={loading || syncronizingTicket}
            onPress={() => {
              setQrcodereader(null);
              setShowQrcodereader(true);
            }}>
            Ler código do ingresso
          </Button>
        )}
      </View>
      {showQrCodeReader && (
        <QrCodeReader
          onRead={handleQRCodeRead}
          onClose={() => setShowQrcodereader(false)}
        />
      )}
      {qrCodeReader && (
        <Text style={{color: 'black'}}>codigo do qr code: {qrCodeReader}</Text>
      )}
    </View>
  );
}

export default KitsDrawerScreen;
