import {
  Button,
  Card,
  CheckBox,
  Divider,
  Icon,
  Image,
  Input,
  Text,
} from '@rneui/themed';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Modal, Platform, ScrollView, View } from 'react-native';
import Header from '../components/Header';
import QrCodeReader from '../components/QrCodeReader';
import { useAlert } from '../context/AlertContext';
import { AuthContext } from '../context/AuthContext';
import { getDeviceId } from 'react-native-device-info';
import GStyles from '../style/global';
import { fetchTickets, registerTicket } from '../api/TicketApi';
import * as realmApi from '../api/realmApi';
import useNetinfo from './hooks/useNetinfo';
import THEME from '../style/theme';
import Signature from '../components/Signature';
import TakePictureModal from '../components/TakePictureModal';
import {
  ticketOwnerDocumentRegistration,
  ticketOwnerSignatureRegistration,
} from '../api/FilesApi';
import { FlatList } from 'react-native-gesture-handler';

import { IS_MOBILE } from '../constants/layout';
import ReactNativeModal from 'react-native-modal';
import { formatDateForTextDay } from '../helpers/format';
import { isDateGreaterThanOrEqualToToday } from '../helpers/validation';
import { getEventRequiredFields, getKitDelivery } from '../api/EventApi';
import Loading from '../components/Loading';
import SelectModal from '../components/SelectModal';
import SearchUserModal from '../components/SearchUserModal';
import ReasonForKitDeliveryModal from '../components/ReasonForKitDeliveryModal';
import CustomModal from '../components/CustomModal';
import JustificationModal from '../components/JustificationModal';
import { TouchableOpacity } from 'react-native';

function KitsDrawerScreen({ navigation }) {
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
  const { isConnected } = useNetinfo();
  const [signature, setSignature] = useState();
  const [isVisible, setIsVisible] = useState();

  const [isLoading, setIsLoading] = useState();
  const [isConfirmDelivery, setIsConfirmDelivery] = useState(false);
  const [mustSelectShirtSize, setMustSelectShirtSize] = useState(false);
  const [checkingIfNeedSelectShirtSize, setCheckingIfNeedSelectShirtSize] =
    useState(false);
  const [isDeliveryByCPF, setIsDeliveryByCPF] = useState();
  const [hasKitAlreadyDelivered, setHasKitAlreadyDelivered] = useState(false);
  const [showModalOfReasonForKitDelivery, setShowModalOfReasonForKitDelivery] =
    useState(false);
  const [reasonForKitDelivery, setReasonForKitDelivery] = useState();
  const [showQrCodeCamisa, setShowQrCodeCamisa] = useState(false); // Controla a exibição do QR Code
  const [showResponseCamisa, setShowResponseCamisa] = useState(null); // Armazena a resposta da requisição
  const [showModalResponse, setShowModalResponse] = useState(false); // Controla a exibição do modal
  const [kitCodes, setKitCodes] = useState([])
  const [shirtSizes, setShirtSizes] = useState([])
  const [currentTicketCode, setCurrentTicketCode] = useState(null);
  const [eventAllowed, setEventAllowed] = useState(false);
  const [isValidBoolean, setIsValidBoolean] = useState();
  const [incompleteRegistrationReason, setIncompleteRegistrationReason] = useState();

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
            const { data: tickets } = await fetchTickets(
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
    const isCodeWithHashtag = ticketCode.includes('#');
    const code = isCodeWithHashtag ? ticketCode.split('#')[0] : ticketCode;

    if (ticketFounds.length > 0) {
      const ticketCodeFounds = ticketFounds.map(ticket => ticket.code);
      // Verifica se o codigo lido ja foi lido.
      if (ticketCodeFounds.includes(code))
        return setAlertMessage('Ingresso já adicionado.');
    }

    setShowQrcodereader(false);
    {/* 
    if (!isConnected) {
       try {
         setLoading(false);
        const response = await realmApi.registerTicketOffline(code);
         setTicketFounds(prevTicketFounds => [...prevTicketFounds, response]);
         // setAlertMessage('Registro de entrega de kit realizado.');
       } catch (error) {
         console.error(error);
         setAlertMessage(error.message);
       } finally {
         setLoading(false);
       }
       return;
     }
       */}
    try {
      setLoading(true);
      const { data: ticket } = await registerTicket(code, authContext.userToken);
      if (ticket.kitDelivered) {
        setHasKitAlreadyDelivered(true);
        setShowModalOfReasonForKitDelivery(true);
      }
      {/*
       if (!isDateGreaterThanOrEqualToToday(ticket.day))
         return setAlertMessage(
           `O dia para esse ingresso ${formatDate(
             ticket.day,
           )} já passou! Nao é possível contabilizar a entrega para esse dia.`,
         );
        */}
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
    setShowModalOfReasonForKitDelivery(false);
    setHasKitAlreadyDelivered(false);
    setReasonForKitDelivery();
    setIsConfirmDelivery(false);
    setShowResponseCamisa(null);
    setKitCodes([]);
    setIsValidBoolean(false);
    setIncompleteRegistrationReason();

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

      // Tentando registrar o documento
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
        console.error('Erro ao registrar o documento:', error);
        setAlertMessage('Erro ao registrar o documento!', '#dc143c');
        throw error; // Relança o erro para que o fluxo de execução pare
      }

      // Tentando registrar a assinatura do kit
      try {
        const formData = new FormData();
        console.log('Kit Codes antes de adicionar ao FormData:', JSON.stringify(kitCodes));

        formData.append('kitCodes', JSON.stringify(kitCodes));
        formData.append('codes', JSON.stringify(ticketFounds.map(t => t.code)));
        formData.append('file', {
          uri: 'data:image/png;base64,' + signature?.encoded + ';',
          type: 'image/png',
          name: 'signatureImage.png',
        });

        if (reasonForKitDelivery) formData.append('reason', reasonForKitDelivery);

        if (incompleteRegistrationReason) {
          formData.append('reasonInvalidUser', incompleteRegistrationReason);
        }

        await ticketOwnerSignatureRegistration(authContext.userToken, formData);
        setAlertMessage('Entrega de kit registrada', '#32cd32');
        cancel();
        setKitCodes([]);
        setShowResponseCamisa(null);
      } catch (error) {
        console.error('Erro ao registrar a assinatura do kit:', error);
        setAlertMessage('Entrega não registrada! KIT NAO FOI ENTREGUE!');
      }
    } catch (error) {
      console.error('Erro geral no registro da entrega:', error);
      console.error(error.response.data.errors);
    } finally {
      //cancel();
      setIsLoading(false);
      //setKitCodes([]);
      //setShowResponseCamisa(null);
    }
  };



  const all = realmApi.getAllTickets().reduce((a, b) => {
    return a[b.userDocument]
      ? { ...a, [b.userDocument]: [...a[b.userDocument], b.ticketCode] }
      : { ...a, [b.userDocument]: [b.ticketCode] };
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
  console.log('@@@@@ MOCK', ticketFounds);
  const inputNameErrorMsg =
    (name.length === 0 && 'Campo de nome deve ser preenchido') ||
    (name.length < 3 && 'Campo de nome deve ter no minímo 3 caracteres') ||
    undefined;
  const requestSubscription = () => {
    setIsShow(true);
  };

  const formatDate = date => {
    var d = new Date(date.split('T')[0] + 'T00:00:01'),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [day, month, year].join('/');
  };

  const handleQRCodeCamisa = async (ticketCode) => {
    if (!ticketCode) {
      console.error("ticketCode está indefinido ou nulo");
      return;
    }

    if (kitCodes.includes(ticketCode)) {
      setShowQrCodeCamisa(false);
      setAlertMessage('Erro: Código já escaneado.', '#dc143c');
      return;
    }

    try {
      const response = await getKitDelivery(ticketCode);
      if (response) {
        setShowQrCodeCamisa(false);
        setShowResponseCamisa(response);
        setCurrentTicketCode(ticketCode);
        setShowModalResponse(true);
      } else {
        setShowQrCodeCamisa(false);
        setAlertMessage('Erro: Dados do kit não encontrados.', '#dc143c');
      }
    } catch (error) {
      setShowQrCodeCamisa(false);
      console.error("Erro em handleQRCodeCamisa:", error);
      setAlertMessage('Erro: Dados do kit não encontrados.', '#dc143c');
    }
  };

  const addToArray = () => {
    setShowModalResponse(false);
    setKitCodes(prevKitCodes => [...prevKitCodes, currentTicketCode]);
    setShirtSizes(prevShirtSizes => [...prevShirtSizes, showResponseCamisa.shirtSize]);
  };

  useEffect(() => {


    if (authContext.selectedEventId === 10 || authContext.selectedEventId === 435) {
      setEventAllowed(true);
    }
  }, [authContext.selectedEventId]);


  useEffect(() => {
    if (ticketFounds && ticketFounds.length > 0 && !ticketFounds[0].isValid) {
      setIsValidBoolean(true);
    }
  }, [ticketFounds]);


  let enableTakeDocumentPicture = !eventAllowed || kitCodes?.length == ticketFounds?.length;

  const handleJustificationSubmit = justification => {
    setIncompleteRegistrationReason(justification);
    setIsValidBoolean(false);
  };


  return (
    <View style={{ ...GStyles.view }}>
      <Header
        style={{ marginBottom: 0 }}
        openDrawer={() => navigation.openDrawer()}
      />
      <View style={{ width: '100%', backgroundColor: THEME.cor.whitesmoke }}>
        <Text h3 h3Style={{ padding: 8, textAlign: 'center' }}>
          {!syncronizingTicket
            ? 'Entrega de kits'
            : 'Aguarde: sincronizando ingressos.'}
        </Text>
        <Divider />
      </View>
      <View style={[GStyles.container]}>
        {ticketFounds.length > 0 ? (
          <>
            <ReasonForKitDeliveryModal
              isVisible={showModalOfReasonForKitDelivery}
              onCancel={cancel}
              onConfirm={reason => {
                setReasonForKitDelivery(reason);
                setShowModalOfReasonForKitDelivery(false);
              }}
            />
            {/* ticket code reader manager */}
            <View style={{ flex: 2 }}>
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
              <Text h4 style={{ textAlign: 'center' }}>
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
                renderItem={({ item: ticketFound }) => (
                  <Card containerStyle={{ flex: 1 }}>
                    <Text
                      h4
                      h4Style={{
                        fontSize: IS_MOBILE ? 14 : null,
                        textAlign: 'center',
                        marginBottom: 8,
                      }}>
                      {(() => {
                        const { name } = ticketFound;
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
                      <Text h4>Dia:</Text>
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
                        <Text h4>Documento:</Text>
                        <Text style={{ fontSize: 18 }}>
                          {(() => {
                            const { document } = ticketFound;
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
                          flexDirection: 'column-reverse',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                        }}>
                        <Text h4>Setor:</Text>
                        <Text style={{ fontSize: 18 }}>{ticketFound.sectorName}</Text>
                      </View>
                    )}

                    {ticketFound?.shirtSize && (
                      <View
                        style={{
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                        }}>
                        <Text h4>Tamanho da camisa:</Text>
                        <Text style={{ fontSize: 18 }}>{ticketFound.shirtSize}</Text>
                      </View>
                    )}

                    {ticketFounds.indexOf(ticketFound) < kitCodes?.length && eventAllowed && (
                      <View
                        style={{
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                        }}>
                        <Text h4>Código da camisa</Text>
                        <Text h4>{kitCodes[ticketFounds.indexOf(ticketFound)] + '(' + shirtSizes[ticketFounds.indexOf(ticketFound)] + ')'}</Text>
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
                                ? { ...ticketInfo, shirtSize: value }
                                : ticketInfo,
                            ),
                          )
                        }
                        errorMessage={'Campo obrigatório'}
                        placeholder="Selecione"
                        items={[
                          { key: 'P', value: 'P' },
                          { key: 'M', value: 'M' },
                          { key: 'G', value: 'G' },
                          { key: 'GG', value: 'GG' },
                          { key: 'EG1', value: 'EG1' },
                          { key: 'EG2', value: 'EG2' },
                        ]}
                      />
                    )}
                  </Card>
                )}
              />
              <Divider style={{ marginBottom: 8 }} />
            </View>
            <Card
              containerStyle={{ backgroundColor: 'ghostwhite', marginTop: 0 }}>
              {!!documentImg ? (
                <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                  <Image
                    style={{ height: 120, width: 120, marginRight: 8 }}
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
                        style={{ height: 120, width: 120, marginRight: 8 }}
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

                  {eventAllowed && !documentImg && !enableTakeDocumentPicture && (
                    <View style={{ marginVertical: 10 }}>
                      <Button
                        type="outline"
                        onPress={() => {
                          setShowQrCodeCamisa(true);
                        }}
                      >
                        Ler Código Camisa
                      </Button>
                    </View>
                  )}

                  {enableTakeDocumentPicture && (
                    <View style={{ marginVertical: 10 }}>
                      <Button
                        type="outline"
                        onPress={() => {
                          setIsVisible(true);
                        }}>
                        Tire uma foto do documento
                      </Button>
                    </View>
                  )}

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
                      containerStyle={{ marginRight: 20 }}
                      onPress={cancel}>
                      Cancelar
                    </Button>
                    <Button
                      containerStyle={{ flex: 1 }}
                      onPress={() => setIsConfirmDelivery(true)}>
                      Entregar
                    </Button>
                  </View>
                </>
              ) : (
                !!documentImg && (
                  <>
                    <Text h4 h4Style={{ fontSize: 22, marginBottom: 8 }}>
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
                  containerStyle={{ marginBottom: 16 }}
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
          !isDeliveryByCPF && (
            <Button
              loading={loading || syncronizingTicket}
              onPress={() => {
                setQrcodereader(null);
                setShowQrcodereader(true);
              }}>
              Ler código do ingresso
            </Button>
          )
        )}
        {!isDeliveryByCPF && ticketFounds.length === 0 && (
          <Button
            containerStyle={{ marginTop: 10 }}
            type="outline"
            onPress={() => {
              setIsDeliveryByCPF(true);
            }}>
            Buscar por CPF
          </Button>
        )}
        {isDeliveryByCPF && (
          <DeliveryByCPF
            onCancelDeliveryByCPF={() => setIsDeliveryByCPF(false)}
            mustSelectShirtSize={mustSelectShirtSize}
          />
        )}
      </View>
      {showQrCodeReader && (
        <QrCodeReader
          onRead={handleQRCodeRead}
          onClose={() => setShowQrcodereader(false)}
        />
      )}



      {qrCodeReader && (
        <Text style={{ color: 'black' }}>codigo do qr code: {qrCodeReader}</Text>
      )}

      {showQrCodeCamisa && (
        <QrCodeReader
          onRead={handleQRCodeCamisa}
          onClose={() => setShowQrCodeCamisa(false)} // Fecha o QR Code
        />
      )}
      {showModalResponse && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <CustomModal
            visible={showModalResponse}
            title="Informações do Kit"
            content={
              <View>
                <Text style={{ fontWeight: 'bold' }}>Setor:</Text>
                <Text>{showResponseCamisa?.sectorName || 'Não informado'}</Text>
                <Text style={{ fontWeight: 'bold' }}>Dia:</Text>
                <Text>{showResponseCamisa?.day || 'Não informado'}</Text>
                <Text style={{ fontWeight: 'bold' }}>Tamanho da Camisa:</Text>
                <Text>{showResponseCamisa?.shirtSize || 'Não informado'}</Text>
              </View>
            }
            onClose={() => setShowModalResponse(false)}
            confirm={() => { addToArray() }}
            disableConfirm={showResponseCamisa?.wasDelivered}
            alertText={showResponseCamisa?.wasDelivered ? 'Este kit já foi entregue.' : null}
          />

        </View>
      )}

      <JustificationModal
        modalVisible={isValidBoolean}
        setModalVisible={setIsValidBoolean}
        onSubmit={handleJustificationSubmit}
        onCancel={() => {
          cancel()
        }}
        message={`Cadastro do usuário ínvalido. Informe um motivo para continuar com a entrega do kit.`}
      />


    </View>


  );
}

const DeliveryByCPF = ({ onCancelDeliveryByCPF, mustSelectShirtSize }) => {
  const [user, setUser] = useState();
  const [selectedTicketCodes, setSelectedTicketCodes] = useState();
  const [documentImg, setDocumentImg] = useState();
  const [signature, setSignature] = useState();
  const [showModalToTakePhotoOfDocument, setShowModalToTakePhotoOfDocument] =
    useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isConfirmDelivery, setIsConfirmDelivery] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ticketCodeAndShirtSize, setTicketCodeAndShirtSize] = useState({});
  const [
    isConfirmingTheTicketCodeSelection,
    setIsConfirmingTheTicketCodeSelection,
  ] = useState(false);
  const [hasKitAlreadyDelivered, setHasKitAlreadyDelivered] = useState(false);
  const [reasonForKitDelivery, setReasonForKitDelivery] = useState();
  const [showModalOfReasonForKitDelivery, setShowModalOfReasonForKitDelivery] =
    useState(false);
  const setAlertMessage = useAlert();
  const authContext = useContext(AuthContext);

  const [showQrCodeCamisa, setShowQrCodeCamisa] = useState(false); // Controla a exibição do QR Code
  const [showResponseCamisa, setShowResponseCamisa] = useState(null); // Armazena a resposta da requisição
  const [showModalResponse, setShowModalResponse] = useState(false); // Controla a exibição do modal
  const [kitCodes, setKitCodes] = useState([])
  const [shirtSizes, setShirtSizes] = useState([])
  const [currentTicketCode, setCurrentTicketCode] = useState(null);
  const [eventAllowed, setEventAllowed] = useState(false);
  const [shirtCodesRead, setShirtCodesRead] = useState({});
  const [isValidBoolean, setIsValidBoolean] = useState(false);
  const [incompleteRegistrationReason, setIncompleteRegistrationReason] = useState();
  const [SspMuralhaBlocked, setSspMuralhaBlocked] = useState(false);

  const handleUserFound = (user, searchedFor) => {
    if(user?.sspMuralhaBlocked)
    return setSspMuralhaBlocked(true);
    console.log('searchedFor', searchedFor.cpf)
    console.log('@@@@@@@@user', user);
    user && setUser(user);
  };
  const clearState = () => {
    setUser();
    setSelectedTicketCodes();
    setTicketCodeAndShirtSize({});
    setDocumentImg();
    setSignature();
    setHasKitAlreadyDelivered(false);
    setReasonForKitDelivery();
    setShowModalOfReasonForKitDelivery(false);
    setShowQrCodeCamisa(false);
    setShowResponseCamisa();
    setShowModalResponse(false);
    setKitCodes([]);
    setShirtCodesRead({})
    setShirtSizes([]);
    setCurrentTicketCode();
    setEventAllowed(false);
    setIsValidBoolean(false)
    setIncompleteRegistrationReason()
  };

  const registerDelivery = async () => {
    if (mustSelectShirtSize) {
      // Verifica se foi selecionado o tamanho da camisa para cada ingresso
      let wasSelected = true;
      selectedTicketCodes.forEach(code => {
        if (!ticketCodeAndShirtSize[code]) wasSelected = false;
      });

      if (!wasSelected) {
        setIsConfirmDelivery(false);
        return setAlertMessage(
          'Selecione o tamanho da camisa para cada ingresso selecionado',
          '#dc143c',
        );
      }
    }

    try {
      setIsLoading(true);
      try {
        const formData = new FormData();

        formData.append('codes', JSON.stringify(selectedTicketCodes));

        formData.append('file', {
          uri: documentImg,
          type: 'image/jpg',
          name: 'documentImage.jpg',
        });

        if (mustSelectShirtSize) {
          formData.append('codesShirtSize', JSON.stringify(ticketCodeAndShirtSize));
        }

        await ticketOwnerDocumentRegistration(authContext.userToken, formData);
      } catch (error) {
        throw `Chamada para registrar documento, payload = ${JSON.stringify({
          formData,
        })} ${ticketOwnerDocumentRegistration}${error}`;
      }

      const formData = new FormData();
      const getQrcodeReads = () => selectedTicketCodes.map(code => shirtCodesRead[code]?.code || 'Código não encontrado');
      formData.append('kitCodes', JSON.stringify(getQrcodeReads()));
      // formData.append('kitCodes', JSON.stringify(kitCodes));
      formData.append('codes', JSON.stringify(selectedTicketCodes));
      formData.append('file', {
        uri: 'data:image/png;base64,' + signature?.encoded + ';',
        type: 'image/png',
        name: 'signatureImage.png',
      });

      if (hasKitAlreadyDelivered) {
        formData.append('reason', reasonForKitDelivery);
      }

      if (incompleteRegistrationReason) {
        formData.append('reasonInvalidUser', incompleteRegistrationReason);
      }

      console.log(
        '__________________ticketOwnerSignatureRegistration',
        formData,
      );
      await ticketOwnerSignatureRegistration(authContext.userToken, formData);
      setAlertMessage('Entrega de kit registrada', '#32cd32');
      onCancelDeliveryByCPF();
    } catch (error) {
      console.error('Erro durante o registro da entrega:', error);
      console.log('Detalhes do erro:', error?.response?.data || 'Sem resposta da API');
      setAlertMessage('Entrega não registrada! KIT NÃO FOI ENTREGUE!');
    } finally {
      //onCancelDeliveryByCPF();
      setIsLoading(false);
    }
  };

  const confirmTicketCodeSelection = async codes => {
    try {
      setIsConfirmingTheTicketCodeSelection(true);
      // Verifica se tem algum ingresso com entrega de kit realizada
      const hasKitDelivered = await new Promise((resolve, reject) => {
        codes.forEach(async (code, index) => {
          try {
            const isCodeWithHashtag = code.includes('#');
            const { data: ticket } = await registerTicket(
              isCodeWithHashtag ? code.split('#')[0] : code,
              authContext.userToken,
            );
            if (ticket.kitDelivered) resolve(true);
          } catch (error) {
            reject(error);
          } finally {
            // é a ultima chamada para verificar se o kit ja foi entregue?
            if (codes.length - 1 === index) resolve(false);
          }
        });
      });
      setHasKitAlreadyDelivered(hasKitDelivered);
      setShowModalOfReasonForKitDelivery(hasKitDelivered);
      setSelectedTicketCodes(codes);

      if (isValidBoolean) {

      }

    } catch (error) {
      setAlertMessage(
        'Erro ao verificar se o kit já foi entregue para o ingresso.',
      );
    } finally {
      setIsConfirmingTheTicketCodeSelection(false);
    }
  };
  {/* 
  console.log('@@@@@@@@ticketCodeAndShirtSize', ticketCodeAndShirtSize);
  console.log('@@@@@@@@must', mustSelectShirtSize);
  console.log('@@@@@@@@hasKitAlreadyDelivered', hasKitAlreadyDelivered);
  console.log('@@@@@@@@reasonForKitDelivery', reasonForKitDelivery);
  console.log('@@@@@@@@selectedTicketCodes', selectedTicketCodes);
  */}

  const ticketRecurrence =
    selectedTicketCodes &&
    Object.entries(
      selectedTicketCodes
        .map(code => user.tickets[code])
        .reduce((acc, text) => {
          acc[text] = (acc[text] || 0) + 1;
          return acc;
        }, {}),
    );

  const handleQRCodeCamisa = async (ticketCode) => {
    if (!ticketCode) {
      console.error("ticketCode está indefinido ou nulo");
      return;
    }

    if (kitCodes.includes(ticketCode)) {
      setShowQrCodeCamisa(false);
      setAlertMessage('Erro: Código já escaneado.', '#dc143c');
      return;
    }

    try {
      const response = await getKitDelivery(ticketCode);
      if (response) {
        setShowQrCodeCamisa(false);
        setShowResponseCamisa(response);
        setCurrentTicketCode(ticketCode);
        setShowModalResponse(true);
      } else {
        setShowQrCodeCamisa(false);
        setAlertMessage('Erro: Dados do kit não encontrados.', '#dc143c');
      }
    } catch (error) {
      setShowQrCodeCamisa(false);
      console.error("Erro em handleQRCodeCamisa:", error);
      setAlertMessage('Erro: Dados do kit não encontrados.', '#dc143c');
    }
  };

  // const ticketsWithReadCodes = Object.keys(shirtCodesRead);
  const selectedTicketsAvailable = selectedTicketCodes && selectedTicketCodes.filter(ticketId => !shirtCodesRead[ticketId]);
  const addToArray = () => {
    setShowModalResponse(false);
    setKitCodes(prevKitCodes => [...prevKitCodes, currentTicketCode]);
    setShirtSizes(prevShirtSizes => [...prevShirtSizes, showResponseCamisa.shirtSize]);
    // const getTicketIdByDayOfCodeRead = (day) => selectedTicketsAvailable.map(code => ({code: user.tickets[code]})).filter(item => item.code.includes(day))[0];
    const getTicketIdByDayOfCodeRead = (day) => selectedTicketsAvailable.filter(item => user.tickets[item].includes(day))[0];
    setShirtCodesRead(prevState => ({ ...prevState, [getTicketIdByDayOfCodeRead(showResponseCamisa.day)]: { code: currentTicketCode, ...showResponseCamisa } }))
  };

  useEffect(() => {
    if (user) {
      if (!user.isValid) {
        setIsValidBoolean(true)
      }
    } else {
      console.log("User está indefinido");
    }

    if (authContext.selectedEventId === 10 || authContext.selectedEventId === 435) {
      setEventAllowed(true);
    }
  }, [user, authContext.selectedEventId]);


  let enableTakeDocumentPicture = !eventAllowed || kitCodes?.length == selectedTicketCodes?.length;

  const hasSelectedTicketsForDay = selectedTicketCodes && showResponseCamisa && selectedTicketsAvailable.map(code => user.tickets[code]).filter(item => item.includes(showResponseCamisa.day)).length > 0

  const handleJustificationSubmit = justification => {
    setIncompleteRegistrationReason(justification);
    setIsValidBoolean(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <SearchUserModal
        title="Buscar"
        onUserFound={handleUserFound}
        placeholderText="Busque pelo CPF"
        isVisible={!user}
        fromKitDelivery={true}
        onClose={() => {
          onCancelDeliveryByCPF();
        }}
      />
      {user?.tickets && (
        <TicketCodeSelectionModal
          isVisible={user?.tickets && !selectedTicketCodes}
          tickets={Object.entries(user.tickets)}
          user={user}  // Adicionando o user como prop
          onClose={() => setUser(undefined)}
          onConfirm={confirmTicketCodeSelection}
          isConfirming={isConfirmingTheTicketCodeSelection}
        />
      )}
      <ReasonForKitDeliveryModal
        isVisible={showModalOfReasonForKitDelivery}
        onCancel={clearState}
        onConfirm={reason => {
          setReasonForKitDelivery(reason);
          setShowModalOfReasonForKitDelivery(false);
        }}
      />
      <Button
        onPress={() => {
          onCancelDeliveryByCPF();
          clearState();
        }}
        type="clear"
        size="sm">
        Cancelar
      </Button>
      {user && selectedTicketCodes && (
        <>
          <Text h4 style={{ textAlign: 'center' }}>
            {selectedTicketCodes.length} ingresso
            {selectedTicketCodes.length > 1 && 's'} selecionado{selectedTicketCodes.length > 1 && 's'}
          </Text>

          <FlatList
            data={selectedTicketCodes}
            renderItem={({ item, index }) => (
              <Card containerStyle={{ alignItems: 'center' }} key={item}>
                <Text style={{ fontSize: 15, fontWeight: '700' }}>
                  {user.tickets[item]} {/* Exibe o ingresso */}
                </Text>
                {user.shirtSizes && user.shirtSizes[item] && (
                  <Text style={{ fontWeight: '700', fontSize: 16, color: '#333' }}>Tamanho da camisa: {user.shirtSizes[item]}</Text>
                )}

                {mustSelectShirtSize && (
                  <SelectModal
                    label="Tamanho da camisa"
                    value={ticketCodeAndShirtSize[item] || ''}
                    setValue={value =>
                      setTicketCodeAndShirtSize(prev => ({
                        ...prev,
                        [item]: value,
                      }))
                    }
                    errorMessage="Campo obrigatório"
                    placeholder="Selecione"
                    items={[
                      { key: 'P', value: 'P' },
                      { key: 'M', value: 'M' },
                      { key: 'G', value: 'G' },
                      { key: 'GG', value: 'GG' },
                      { key: 'EG1', value: 'EG1' },
                      { key: 'EG2', value: 'EG2' },
                    ]}
                  />
                )}

                {shirtCodesRead[item] && (
                  <View
                    style={{
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      marginTop: 8,
                    }}
                  >
                    <Text style={{ fontWeight: '700', fontSize: 16, color: '#333' }}>
                      Código do Kit:
                    </Text>
                    <Text style={{ fontSize: 14, color: '#555', marginBottom: 10 }}>
                      {shirtCodesRead[item].code || 'Não disponível'}
                    </Text>

                    <Text style={{ fontWeight: '700', fontSize: 16, color: '#333' }}>
                      Tamanho da camisa:
                    </Text>
                    <Text style={{ fontSize: 14, color: '#555' }}>
                      ({shirtCodesRead[item].shirtSize || 'Não disponível'})
                    </Text>
                  </View>
                )}
              </Card>
            )}
            keyExtractor={item => item}
          />
        </>
      )}

      {user && selectedTicketCodes && !documentImg && (
        <>
          <TakePictureModal
            isVisible={showModalToTakePhotoOfDocument}
            cancelPhoto={() => {
              setShowModalToTakePhotoOfDocument(false);
            }}
            savePhoto={picture => {
              setShowModalToTakePhotoOfDocument(false);
              setDocumentImg(picture);
            }}
          />

          {eventAllowed && !documentImg && (
            <Text style={{ marginTop: 10, fontSize: 15, fontWeight: '900', textAlign: 'center', textDecorationLine: 'underline' }} >
              Quantidade de kits escaneados {kitCodes.length} / {selectedTicketCodes.length}
            </Text>
          )}

          {eventAllowed && !documentImg && !enableTakeDocumentPicture && (
            <View style={{ marginVertical: 10 }}>
              <Button
                type="outline"
                onPress={() => {
                  setShowQrCodeCamisa(true);
                }}
              >
                Ler Código Camisa
              </Button>
            </View>
          )}

          {enableTakeDocumentPicture && (
            <Button
              type="outline"
              containerStyle={{ paddingTop: 10 }}
              onPress={() => {
                setShowModalToTakePhotoOfDocument(true);
              }}>
              Tire uma foto do documento
            </Button>
          )}

        </>
      )}
      {user && selectedTicketCodes && documentImg && (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <Image
              style={{ height: 120, width: 120, marginRight: 8 }}
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
                  style={{ height: 120, width: 120, marginRight: 8 }}
                  source={{
                    uri:
                      Platform.OS === 'android'
                        ? 'data:image/png;base64,' + signature?.encoded + ';'
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
        </Card>
      )}
      {user && selectedTicketCodes && documentImg && !signature && (
        <>
          <Text h5 style={{ fontSize: 18, marginBottom: 8 }}>
            Colete a assinatura do proprietário do ingresso
          </Text>
          <Button
            type="outline"
            onPress={() => {
              setShowSubscriptionModal(true);
            }}>
            Assinar
          </Button>
          <Signature
            show={showSubscriptionModal}
            onNotShow={() => setShowSubscriptionModal(false)}
            onSigned={data => {
              setShowSubscriptionModal(false);
              setSignature(data);
            }}
          />
        </>
      )}
      {user && selectedTicketCodes && documentImg && signature && (
        <Button
          containerStyle={{ marginTop: 10 }}
          onPress={() => setIsConfirmDelivery(true)}>
          Entregar
        </Button>
      )}
      <ReactNativeModal
        isVisible={isConfirmDelivery}
        onBackdropPress={() => setIsConfirmDelivery(false)}>
        <View
          style={{
            backgroundColor: 'white',
            padding: 20,
          }}>
          <FlatList
            style={{ marginBottom: 5 }}
            data={ticketRecurrence}
            renderItem={({ item: [name, number] }) => (
              <View style={{ flexDirection: 'row' }}>
                <Text style={{ paddingRight: 5, fontSize: 15, fontWeight: '900' }}>
                  {number} {`ingresso${number > 1 ? 's' : ''}`}, {name}
                </Text>
              </View>
            )}
            keyExtractor={item => item[0]}
          />
          <Button
            type="outline"
            containerStyle={{ marginBottom: 16 }}
            onPress={() => setIsConfirmDelivery(false)}>
            Voltar
          </Button>
          <Button size="lg" loading={isLoading} onPress={registerDelivery}>
            Confirmar entrega
          </Button>
        </View>
      </ReactNativeModal>

      {showQrCodeCamisa && (
        <QrCodeReader
          onRead={handleQRCodeCamisa}
          onClose={() => setShowQrCodeCamisa(false)} // Fecha o QR Code
        />
      )}

      {showModalResponse && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <CustomModal
            visible={showModalResponse}
            title="Informações do Kit"
            content={hasSelectedTicketsForDay ? (
              <View>
                <Text style={{ fontWeight: 'bold' }}>Setor:</Text>
                <Text>{showResponseCamisa?.sectorName || 'Não informado'}</Text>
                <Text style={{ fontWeight: 'bold' }}>Dia:</Text>
                <Text>{showResponseCamisa?.day || 'Não informado'}</Text>
                <Text style={{ fontWeight: 'bold' }}>Tamanho da Camisa:</Text>
                <Text>{showResponseCamisa?.shirtSize || 'Não informado'}</Text>
              </View>
            ) : (<View>
              <Text style={{ fontWeight: 'bold' }}>Setor:</Text>
              <Text>{showResponseCamisa?.sectorName || 'Não informado'}</Text>
              <Text style={{ fontWeight: 'bold' }}>Dia:</Text>
              <Text>{showResponseCamisa?.day || 'Não informado'}</Text>
              <View style={{ borderWidth: 1, borderColor: 'white', backgroundColor: '#FFEBEE', padding: 15, borderRadius: 8, marginTop: 10, alignItems: 'center', }}>
                <Text style={{ color: '#D32F2F', fontSize: 14 }}>
                  Não há ingresso selecionado para esse dia.
                </Text>
              </View>
            </View>)
            }
            onClose={() => setShowModalResponse(false)}
            confirm={hasSelectedTicketsForDay ? addToArray : null}
            disableConfirm={showResponseCamisa?.wasDelivered}
            alertText={showResponseCamisa?.wasDelivered ? 'Este kit já foi entregue.' : null}
          />
        </View>
      )}

      <JustificationModal
        modalVisible={isValidBoolean}
        setModalVisible={setIsValidBoolean}
        onSubmit={handleJustificationSubmit}
        onCancel={() => {
          onCancelDeliveryByCPF();
          clearState();
        }}
        message={`Cadastro do usuário ínvalido. Informe um motivo para continuar com a entrega do kit.`}
      />

    <ReactNativeModal
              isVisible={SspMuralhaBlocked}
              backdropOpacity={0.1}
              style={{alignItems: 'center'}}
              onBackdropPress={() => {
                setSspMuralhaBlocked(false);
              }}>
                <View
                        style={{
                          backgroundColor: 'white',
                          borderRadius: 10,
                          padding: 20,
                          height: 'auto',
                          width: `95%`,
                        }}>
                        <Text h4 h4Style={{marginBottom: 20, color: '#7E22CE', fontSize: 20}}>
                          Documento com restrição. Procure um supervisor.
                        </Text>
                        <View
                          style={{
                            width: '100%',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            // alignItems: 'center',
                          }}>
                          {/* <Button
                            type="clear"
                            size="lg"
                            containerStyle={{marginLeft: 16, color: '#000'}}
                            title="Ok"
                            color={"error"}
                            onPress={()=> {setSspMuralhaBlocked(false)}}
                          /> */}
                         <TouchableOpacity
                          style={{
                            backgroundColor: '#7E22CE',
                            paddingVertical: 12,
                            paddingHorizontal: 32,
                            borderRadius: 8,
                          }}
                          onPress={()=> {setSspMuralhaBlocked(false);}}>
                          <Text
                            style={{color: '#FFFFFF', fontSize: 16, fontWeight: '600'}}>
                            Ok
                          </Text>
                        </TouchableOpacity>
                        </View>
                      </View>
              </ReactNativeModal>

    </View>


  );
};

// tickets = [[code, name]...]
const TicketCodeSelectionModal = ({
  user,
  tickets,
  onClose,
  onConfirm,
  isVisible,
  isConfirming,
}) => {
  const [selecteds, setSelecteds] = useState([]);
  const [hasAllSelected, setHasAllSelected] = useState(false);
  const setAlertMessage = useAlert();
  const toggleCheckbox = code => {
    setSelecteds(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  const handleConfirm = () => {
    if (selecteds.length === 0)
      return setAlertMessage('Nenhum dia selecionado.');
    onConfirm(selecteds);
  };

  const selectAll = () => {
    if (hasAllSelected) {
      setHasAllSelected(false);
      setSelecteds([]);
    } else {
      setHasAllSelected(true);
      const allTickestCodes = tickets.map(ticket => ticket[0]);
      setSelecteds(allTickestCodes);
    }
  }

  return (
    <ReactNativeModal
      isVisible={isVisible}
      backdropOpacity={0.1}
      style={{ alignItems: 'center' }}
      onBackdropPress={onClose}>
      {/* {tickets} */}
      <View
        style={{
          flex: 1,
          backgroundColor: 'white',
          borderRadius: 10,
          padding: 20,
          height: 'auto',
          width: `95%`,
        }}>
        <Text h4 h4Style={{ marginBottom: 8 }}>
          Selecione o dia para a entrega do kit
        </Text>

        <Text style={{ marginBottom: 8 }}>
          <Text style={{ fontWeight: 'bold' }}>Nome: {user.name ?? 'Nome não disponível'}</Text> 
        </Text>
        <Text style={{ marginBottom: 8 }}>
          <Text style={{ fontWeight: 'bold' }}>Documento: {user.id ?? 'Cpf não disponível'}</Text> 
        </Text>



        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 5,
            backgroundColor: "#F9F9F9",
            borderBottomWidth: 1,
            borderBottomColor: "#E0E0E0",
            marginBottom: 8,
          }}>
          <Text h5
            style={{ fontSize: 16, color: "#7A7A7A", fontWeight: "bold" }}
          >
            Selecionar todos
          </Text>
          <CheckBox
            size={30}
            containerStyle={{ padding: 0, backgroundColor: "#F9F9F9" }}
            uncheckedColor='#7A7A7A'
            checked={hasAllSelected}
            onPress={() => selectAll()}
            iconType="material-community"
            checkedIcon="checkbox-outline"
            uncheckedIcon={'checkbox-blank-outline'}
          />
        </View>
        <FlatList
          data={tickets}
          renderItem={({ item: [code, name], index }) => (
            <View
              style={{ flexDirection: 'row', alignItems: 'center' }}
              key={code}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: "#8F8F8F",
                  marginRight: 10,
                }}
              >
                {index + 1}.
              </Text>
              <CheckBox
                size={28}
                containerStyle={{ padding: 0, marginLeft: -5, marginRight: 10 }}
                checked={selecteds.includes(code)}
                onPress={() => toggleCheckbox(code)}
                iconType="material-community"
                checkedIcon="checkbox-outline"
                uncheckedIcon={'checkbox-blank-outline'}
              />
              <Text h5 style={{ fontSize: 15, paddingRight: 4, flex: 1 }}>
                {name}
              </Text>
            </View>
          )}
          keyExtractor={item => item[0]}
        />
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 10,
          }}>
          <Button title="Voltar" size="lg" type="clear" onPress={onClose} />
          <Button
            type="solid"
            loading={isConfirming}
            size="lg"
            containerStyle={{ marginLeft: 16 }}
            title="Confirmar"
            onPress={handleConfirm}
          />
        </View>
      </View>
    </ReactNativeModal>
  );
};

export default KitsDrawerScreen;
