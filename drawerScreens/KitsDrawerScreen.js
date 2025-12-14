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
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Header from '../components/Header';
import QrCodeReader from '../components/QrCodeReader';
import { useAlert } from '../context/AlertContext';
import { AuthContext } from '../context/AuthContext';
import { getDeviceId } from 'react-native-device-info';
import GStyles from '../style/global';
import { fetchTickets, getDeliveryByCode, getTicketDelivery } from '../api/TicketApi';
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

  const [shirtCodesRead, setShirtCodesRead] = useState({});

  // ✅ --- ESTADOS PARA A LÓGICA DO "FLUXO 1" (Leitura Direta) ---
  const [kitCodesRead, setKitCodesRead] = useState({}); // Substitui 'kitCodes'
  const [nextTicketToScan, setNextTicketToScan] = useState(null); // Para o destaque verde
  const [reasonType, setReasonType] = useState(null);


  useEffect(() => {
    (async () => {
      try {
        setCheckingIfNeedSelectShirtSize(true);
      } catch (error) {
        console.log('KitsDrawerScreen useEffect getEventRequiredFields', error);
      } finally {
        setCheckingIfNeedSelectShirtSize(false);
      }
    })();
  }, [authContext.selectedEventId]);

  const ticketsAvailableFlow1 = useMemo(() =>
    ticketFounds
      ? ticketFounds.filter(ticket => !kitCodesRead[ticket.ticketId]) // Usa o ticketId
      : [],
    [ticketFounds, kitCodesRead]
  );

  useEffect(() => {
    if (ticketsAvailableFlow1.length > 0) {
      setNextTicketToScan(ticketsAvailableFlow1[0].ticketId);
    } else {
      setNextTicketToScan(null); // Todos lidos
    }
  }, [ticketsAvailableFlow1]);

  const handleQRCodeRead = async ticketCode => {
    const isCodeWithHashtag = ticketCode.includes('#');
    const code = isCodeWithHashtag ? ticketCode.split('#')[0] : ticketCode;

    // Verificação de duplicados na lista atual
    if (ticketFounds.length > 0) {
      const ticketCodeFounds = ticketFounds.map(ticket => ticket.code);
      if (ticketCodeFounds.includes(code))
        return setAlertMessage('Ingresso já adicionado.');
    }

    setShowQrcodereader(false);

    try {
      setLoading(true);
      const { data: ticket } = await getTicketDelivery(
        authContext.selectedEventId,
        code,
        authContext.userToken, 'Kit'
      );

      if (!ticket?.sectorVisibleToMeetingPoint) {
          throw new Error("Ingresso não encontrado.");
       }

      if (ticket.kitDeliveredAt) {
        setHasKitAlreadyDelivered(true);
        setShowModalOfReasonForKitDelivery(true);
      }

      const newTicketFound = { ...ticket, code };
      if (mustSelectShirtSize) newTicketFound.shirtSize = '';

      setTicketFounds(prevTicketFounds => {
        const newTickets = [...prevTicketFounds, newTicketFound];
        // Define este novo bilhete como o próximo a escanear (se for o primeiro)
        if (newTickets.length >= 1) {
          setNextTicketToScan(newTicketFound.ticketId);
        }
        return newTickets;
      });

    } catch (error) {
      console.error('Erro ao ler QR Code:', error);

      if (error.response) {
        // --- 1. O Servidor Respondeu com Erro ---
        const { status, data } = error.response;
        console.log('Status:', status);
        console.log('Data:', data);

        if (status === 401) {
          setAlertMessage('Sessão Expirada: A sua sessão expirou. Por favor, faça login novamente.');
          authContext.logout();
          return;
        }

        if (status === 404) {
          setAlertMessage('Ingresso não encontrado.', '#dc143c');
          return;
        }

        if (status === 400 || data?.message) {
          const apiMessage = data?.message || 'Dados do ingresso inválidos.';
          setAlertMessage(apiMessage, '#dc143c');
          return;
        }

        setAlertMessage(`Erro do servidor (${status}). Tente novamente.`, '#dc143c');

      } else if (error.request) {
        // --- 2. Erro de Rede (Sem resposta) ---
        console.error('Erro de Rede:', error.request);
        setAlertMessage('Sem conexão com a internet.', '#dc143c');

      } else {
        setAlertMessage("Ingresso não encontrado", '#dc143c');
      }

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
    setKitCodesRead({});
    setIsValidBoolean(false);
    setIncompleteRegistrationReason();
    setNextTicketToScan(null);
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

        ticketFounds.forEach((ticket, index) => {
          formData.append(`Tickets[${index}].TicketId`, ticket.ticketId);
          const scannedCode = kitCodesRead[ticket.ticketId]?.code;
          if (scannedCode) {
            formData.append(`Tickets[${index}].Code`, scannedCode);
          }
          if (reasonForKitDelivery) {
            formData.append(`Tickets[${index}].Reason`, reasonForKitDelivery);
            formData.append(`Tickets[${index}].ReasonType`, reasonType);
          }
        });
        formData.append('SignatureDocumentFile', {
          uri: documentImg,
          type: 'image/jpg',
          name: 'documentImage.jpg',
        });
        formData.append('SignatureFile', {
          uri: 'data:image/png;base64,' + signature?.encoded + ';',
          type: 'image/png',
          name: 'signatureImage.png',
        });
        formData.append('EventId', authContext.selectedEventId);
        formData.append('Type', 'Kit');

        // if (incompleteRegistrationReason) {
        //   formData.append('reasonInvalidUser', incompleteRegistrationReason);
        // }

        await ticketOwnerSignatureRegistration(authContext.userToken, formData);
        setAlertMessage('Entrega de kit registrada', '#32cd32');
        cancel();
        setKitCodesRead({});
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

  const requestSubscription = () => { setIsShow(true) };

  const addToArray = (ticketCode, ticketId) => {
    setShowModalResponse(false);
    setKitCodesRead(prevKitCodes => ({
      ...prevKitCodes,
      [ticketId]: { code: ticketCode }
    }));
  };

  useEffect(() => {
    if (authContext.kitDeliveryMode === 1) {
      setEventAllowed(true);
    }
  }, [authContext.selectedEventId]);


  useEffect(() => {
    if (ticketFounds && ticketFounds.length > 0 && !ticketFounds[0].isValid) {
      setIsValidBoolean(true);
    }
  }, [ticketFounds]);


  let enableTakeDocumentPicture = !eventAllowed || (ticketFounds.length > 0 && Object.keys(kitCodesRead).length === ticketFounds.length);

  const handleJustificationSubmit = justification => {
    setIncompleteRegistrationReason(justification);
    setIsValidBoolean(false);
  };

  const handleQRCodeCamisa = async (ticketCode) => {
    if (!ticketCode) return;

    // Validação de duplicado
    const isAlreadyScanned = Object.values(kitCodesRead).some(item => item.code === ticketCode);
    if (isAlreadyScanned) {
      setShowQrCodeCamisa(false);
      setAlertMessage('Erro: Código já escaneado.', '#dc143c');
      return;
    }

    if (!showQrCodeCamisa) return;

    // Pega o bilhete destacado (próximo da fila)
    const currentTicketId = nextTicketToScan;

    if (!currentTicketId) {
      setShowQrCodeCamisa(false);
      return setAlertMessage('Todos os bilhetes selecionados já têm um kit associado.', '#dc143c');
    }

    const currentTicket = ticketFounds.find(ticket => ticket.ticketId == currentTicketId);

    setLoading(true);
    try {
      const deliveryItemResponse = await getDeliveryByCode(authContext.selectedEventId, ticketCode, authContext.userToken, 1);
      const currentDeliveryItemEventDay = deliveryItemResponse.data?.day;
      let codeIsValid = true;

      if (!currentDeliveryItemEventDay) {
        setAlertMessage('QR CODE não encontrado.', '#dc143c');
        codeIsValid = false;
      }
      
      if (deliveryItemResponse.data.deliveredAt) {
        setAlertMessage('QR Code já escaneado.', '#dc143c');
        codeIsValid = false;
      }

      if (deliveryItemResponse.data.sector && deliveryItemResponse.data.sector != currentTicket?.sector) {
        setAlertMessage(`Setor incorreto! O QR CODE pertence ao setor "${deliveryItemResponse.data.sector}".`,'#dc143c'); 
        codeIsValid = false;
      }

      if (deliveryItemResponse.data.day && deliveryItemResponse.data.day != currentTicket?.day) {
        setAlertMessage(`Dia incorreto! QR CODE pertence ao dia: ${deliveryItemResponse.data?.day}.`);
        codeIsValid = false;
      }

      setShowQrCodeCamisa(false);

      if (codeIsValid) {
        setCurrentTicketCode(ticketCode);
        addToArray(ticketCode, currentTicketId);
      }
    }
    catch (error) {
      console.log('errooor=' + error)
    } finally {
      setLoading(false);
      setShowQrCodeCamisa(false);
    }
  };

  const editKitCode = (ticketId) => {
    setKitCodesRead(estadoAtual => {
      const novoEstado = { ...estadoAtual };
      if (novoEstado[ticketId]) {
        delete novoEstado[ticketId];
      }
      return novoEstado;
    });
    setNextTicketToScan(ticketId);
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
                setReasonForKitDelivery(reason.reason);
                setReasonType(reason.type)
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
                renderItem={({ item: ticketFound }) => {
                  // A lógica de destaque ("fundo verde")
                  // 'nextTicketToScan' é o estado que controla quem é o próximo
                  console.log('ticket=' + JSON.stringify(ticketFound))
                  const isHighlighted = nextTicketToScan === ticketFound.ticketId;

                  return (
                    <Card
                      containerStyle={[
                        styles.cardBase,
                        isHighlighted && styles.highlightedCard, // Aplica o estilo verde
                      ]}
                    >
                      <Text h4 h4Style={styles.cardTitle}>
                        {ticketFound?.day} - {ticketFound?.sector}
                      </Text>
                      {ticketFound?.document && (
                        <View
                          style={{
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            marginBottom: 8,
                          }}
                        >
                          <Text h4>Documento:</Text>
                          <Text style={{ fontSize: 18 }}>
                            {(() => {
                              const { document } = ticketFound;
                              if (document.length === 11) {
                                return document.replace(
                                  /(\d{3})(\d{3})(\d{3})(\d{2})/,
                                  '$1.$2.$3-$4',
                                );
                              }
                              return document;
                            })()}
                          </Text>
                        </View>
                      )}
                      {ticketFound?.shirtSize && (
                        <View
                          style={{
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            marginBottom: 8,
                          }}
                        >
                          <Text h4>Tamanho da camisa:</Text>
                          <Text style={{ fontSize: 18 }}>{ticketFound.shirtSize}</Text>
                        </View>
                      )}

                      {/* --- Lógica Condicional de Scan/Edição --- */}
                      {kitCodesRead[ticketFound.ticketId] && (
                        // 1. SE O CÓDIGO JÁ FOI LIDO: Mostra o código e o botão "Editar"
                        <View style={styles.kitInfoContainer}>
                          <Text style={styles.kitLabel}>Código do Kit:</Text>
                          <Text style={styles.kitCode}>
                            {kitCodesRead[ticketFound.ticketId].code}
                          </Text>
                          <Button
                            title="Ler Novamente"
                            type="clear"
                            titleStyle={styles.editButtonTitle}
                            containerStyle={styles.editButton}
                            onPress={() => editKitCode(ticketFound.ticketId)} // Chama a função de editar
                          />
                        </View>
                      )}

                      {/* --- Seletor de Tamanho de Camisa (se necessário) --- */}
                      {mustSelectShirtSize && (
                        <SelectModal
                          label="Tamanho da camisa"
                          value={ticketFound.shirtSize}
                          setValue={(value) =>
                            setTicketFounds((prevState) =>
                              prevState.map((ticketInfo) =>
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
                  );
                }}
                keyExtractor={(item) => item.code} // Certifique-se que 'code' é único, ou use 'ticketId'
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

      {/* <JustificationModal
        modalVisible={isValidBoolean}
        setModalVisible={setIsValidBoolean}
        onSubmit={handleJustificationSubmit}
        onCancel={() => {
          cancel()
        }}
        message={`Cadastro do usuário ínvalido. Informe um motivo para continuar com a entrega do kit.`}
      /> */}


    </View>


  );
}

const DeliveryByCPF = ({ onCancelDeliveryByCPF, mustSelectShirtSize }) => {
  const [user, setUser] = useState();
  const [selectedTicketCodes, setSelectedTicketCodes] = useState();
  const [documentImg, setDocumentImg] = useState();
  const [signature, setSignature] = useState();
  const [showModalToTakePhotoOfDocument, setShowModalToTakePhotoOfDocument] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isConfirmDelivery, setIsConfirmDelivery] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ticketCodeAndShirtSize, setTicketCodeAndShirtSize] = useState({});
  const [isConfirmingTheTicketCodeSelection, setIsConfirmingTheTicketCodeSelection] = useState(false);
  const [hasKitAlreadyDelivered, setHasKitAlreadyDelivered] = useState(false);
  const [reasonForKitDelivery, setReasonForKitDelivery] = useState();
  const [showModalOfReasonForKitDelivery, setShowModalOfReasonForKitDelivery] = useState(false);
  const setAlertMessage = useAlert();
  const authContext = useContext(AuthContext);

  const [showQrCodeCamisa, setShowQrCodeCamisa] = useState(false);
  const [showResponseCamisa, setShowResponseCamisa] = useState(null);
  const [showModalResponse, setShowModalResponse] = useState(false);

  const [shirtSizes, setShirtSizes] = useState([]);
  const [currentTicketCode, setCurrentTicketCode] = useState(null);
  const [eventAllowed, setEventAllowed] = useState(false);

  // ✅ ESTADO ÚNICO: Esta é agora a única fonte da verdade para os códigos lidos
  const [shirtCodesRead, setShirtCodesRead] = useState({});

  const [isValidBoolean, setIsValidBoolean] = useState(false);
  const [incompleteRegistrationReason, setIncompleteRegistrationReason] = useState();
  const [reasonType, setReasonType] = useState(null);


  const handleUserFound = (user, searchedFor) => {
    if (!user) return;

    const updatedUser = { ...user };
    updatedUser.tickets = user.tickets.filter(t => t.sectorVisibleToMeetingPoint);

    setUser(updatedUser);
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
    setShirtCodesRead({})
    setShirtSizes([]);
    setCurrentTicketCode();
    setEventAllowed(false);
    setIsValidBoolean(false)
    setIncompleteRegistrationReason()
  };

  const registerDelivery = async () => {
    console.log('selectedTicketCodes: ' + selectedTicketCodes)
    if (mustSelectShirtSize) {
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
      const formData = new FormData();

      selectedTicketCodes.forEach((ticketId, index) => {
        formData.append(`Tickets[${index}].TicketId`, ticketId);

        const scannedCode = shirtCodesRead[ticketId]?.code;
        if (scannedCode) {
          formData.append(`Tickets[${index}].Code`, scannedCode);
        }

        if (hasKitAlreadyDelivered) {
          formData.append(`Tickets[${index}].Reason`, reasonForKitDelivery);
          formData.append(`Tickets[${index}].ReasonType`, reasonType);
        }
      });

      formData.append('SignatureDocumentFile', {
        uri: documentImg,
        type: 'image/jpg',
        name: 'documentImage.jpg',
      });
      formData.append('SignatureFile', {
        uri: 'data:image/png;base64,' + signature?.encoded + ';',
        type: 'image/png',
        name: 'signatureImage.png',
      });
      formData.append('EventId', authContext.selectedEventId);
      formData.append('Type', 'Kit');

      console.log('Enviando dados para registrar a assinatura do kit...');
      await ticketOwnerSignatureRegistration(authContext.userToken, formData);
      console.log('Assinatura registrada com sucesso.');
      setAlertMessage('Entrega de kit registrada', '#32cd32');
      onCancelDeliveryByCPF();
    } catch (error) {
      console.error('Erro durante o registro da entrega:', error);

      let errorMessage = 'Não registrado, tente novamente';

      if (error.response?.data) {
        const data = error.response.data;

        if (data.message) {
          errorMessage = data.message;
        } else if (data.errors) {

          errorMessage = typeof data.errors === 'object' ? JSON.stringify(data.errors) : data.errors;
        }
        else if (typeof data === 'string') {
          errorMessage = data;
        }
        else {
          errorMessage = JSON.stringify(data);
        }
      }

      console.log('Mensagem de erro extraída:', errorMessage);

      setAlertMessage(errorMessage, '#dc143c');

      return null;
    } finally {
      setIsLoading(false);
    }
  };


  const confirmTicketCodeSelection = async (ticketIds) => {
    try {
      // Recupera a propriedade braceletDelivered e accessKey para cada ingresso

      setIsConfirmingTheTicketCodeSelection(true);

      let hasKitDelivered = false;

      if (ticketIds.length === 0) {
        console.warn("Nenhum ingresso selecionado.");
        setAlertMessage('Não foi possível localizar os ingressos selecionados.');
        return;
      }

      try {
        const selectedTickets = user.tickets.filter(ticket => ticketIds.includes(ticket.id));

        for (let i = 0; i < selectedTickets.length; i++) {
          const ticket = selectedTickets[i];
          if (ticket.kitDeliveredAt) {
            hasKitDelivered = true;
            break;
          }
        }
      } catch (error) {
        console.error("Erro no registerTicket:", error);
        setAlertMessage('Erro ao verificar se o kit já foi entregue para o ingresso.');
        throw error;
      }

      setHasKitAlreadyDelivered(hasKitDelivered);
      setShowModalOfReasonForKitDelivery(hasKitDelivered);
      setSelectedTicketCodes(ticketIds);

    } catch (error) {
      console.error("Erro inesperado na função confirmTicketCodeSelection:", error);
      setAlertMessage('Erro ao verificar se o kit já foi entregue para o ingresso.');
    } finally {
      console.log("Finalizando verificação dos tickets");
      setIsConfirmingTheTicketCodeSelection(false);
    }
  };


  const ticketRecurrence =
    selectedTicketCodes &&
    Object.entries(
      selectedTicketCodes
        .map(id => user.tickets.find(ticket => ticket.id === id))
        .filter(Boolean)
        .reduce((acc, ticket) => {
          const setor = ticket.sector || 'Setor não informado';
          const dia = ticket.day || 'Dia não informado';
          const chave = `${setor} - ${dia}`;
          acc[chave] = (acc[chave] || 0) + 1;
          return acc;
        }, {})
    );

  const handleQRCodeCamisa = async (ticketCode) => {
    if (!ticketCode) {
      console.error("ticketCode está indefinido ou nulo");
      return;
    }

    const isAlreadyScanned = Object.values(shirtCodesRead).some(item => item.code === ticketCode);
    if (isAlreadyScanned) {
      setShowQrCodeCamisa(false);
      setAlertMessage('Erro: Código já escaneado.', '#dc143c');
      return;
    }

    if (!showQrCodeCamisa) return;

    const currentTicketId = selectedTicketsAvailable[0];
    if (!currentTicketId) {
      console.warn("Código lido, mas não há mais bilhetes pendentes.");
      setShowQrCodeCamisa(false);
      setAlertMessage('Todos os bilhetes selecionados já têm um kit associado.', '#dc143c');
      return;
    }

    const currentTicket = user.tickets.find(ticket => ticket.id == currentTicketId);

    try {
      const deliveryItemResponse = await getDeliveryByCode(authContext.selectedEventId, ticketCode, authContext.userToken, 1);

      console.log('deliveryItemResponse.data.sector = ' + deliveryItemResponse.data.sector);

      const currentDeliveryItemEventDay = deliveryItemResponse.data?.day;

      if (!currentDeliveryItemEventDay) {
        throw new Error('QR CODE não encontrado.');
      }

      if (deliveryItemResponse.data.deliveredAt) {
        throw new Error('QR Code já escaneado.');
      }

      if (deliveryItemResponse.data.sector && deliveryItemResponse.data.sector != currentTicket?.sector) {
        throw new Error(`Setor incorreto! O QR CODE pertence ao setor "${deliveryItemResponse.data.sector}".`);
      }

      if (deliveryItemResponse.data.day && deliveryItemResponse.data.day != currentTicket?.day) {
        throw new Error(`Dia incorreto! QR CODE pertence ao dia: ${deliveryItemResponse.data?.day}.`);
      }

      setCurrentTicketCode(ticketCode);
      addToArray(ticketCode);

    } catch (error) {
      console.log('Erro handleQRCodeCamisa:', error);

      const errorMessage = error.response?.data?.message || error.message || 'Erro ao consultar no estoque.';

      setAlertMessage(errorMessage, '#dc143c');

    } finally {
      setShowQrCodeCamisa(false);
    }
  };

  const selectedTicketsAvailable = selectedTicketCodes && selectedTicketCodes.filter(ticketId => !shirtCodesRead[ticketId]);
  const addToArray = (ticketCode) => {
    const nextTicketId = selectedTicketsAvailable[0];
    if (nextTicketId) {
      setShirtCodesRead(prevState => ({
        ...prevState,
        [nextTicketId]: { code: ticketCode }
      }));
    } else {
      console.warn("addToArray foi chamada, mas não há mais tickets disponíveis para associar.");
    }
  };

  useEffect(() => {
    if (user) {
      if (!user.isValid) {
        setIsValidBoolean(true)
      }
    } else {
      console.log("User está indefinido");
    }

    //if (authContext.selectedEventId === '5db21f36-f4e3-42a9-87c4-2506a37de28c') {
    //if (authContext.selectedEventId === '6b6a264b-040a-4808-a550-87983fdcb5dc') {
    if (authContext.kitDeliveryMode === 1) {
      setEventAllowed(true);
    }
  }, [user, authContext.selectedEventId]);


  let enableTakeDocumentPicture = !eventAllowed || (selectedTicketCodes && Object.keys(shirtCodesRead).length === selectedTicketCodes.length);

  const hasSelectedTicketsForDay = selectedTicketCodes && showResponseCamisa && selectedTicketsAvailable.map(code => user.tickets[code]).filter(item => item.includes(showResponseCamisa.day)).length > 0

  const handleJustificationSubmit = justification => {
    setIncompleteRegistrationReason(justification);
    setIsValidBoolean(false);
  };

  const editCodeTicker = (ticketId) => {

    setShirtCodesRead(estadoAtual => {
      const novoEstado = { ...estadoAtual };

      if (novoEstado[ticketId]) {
        delete novoEstado[ticketId];
      } else {
        console.warn(`Tentativa de editar um ticketId (${ticketId}) que não existe em shirtCodesRead.`);
      }

      return novoEstado;
    });
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
          tickets={user.tickets}
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
          setReasonForKitDelivery(reason.reason);
          setReasonType(reason.type)
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
            renderItem={({ item: ticketId, index }) => {
              const ticket = user.tickets.find(t => t.id === ticketId);
              if (!ticket) return null;

              const isNextTicketToScan = selectedTicketsAvailable[0] === ticketId;

              return (
                <Card containerStyle={{
                  alignItems: 'center',
                  // A sintaxe correta: a chave recebe o valor da condição
                  backgroundColor: isNextTicketToScan ? 'rgba(221, 240, 216, 0.7)' : 'white'
                }} key={ticketId}>
                  <Text style={{ fontSize: 15, fontWeight: '700' }}>
                    {ticket.sector} - {ticket.day}
                  </Text>

                  {user.shirtSizes && user.shirtSizes[ticketId] && (
                    <Text style={{ fontWeight: '700', fontSize: 16, color: '#333' }}>
                      Tamanho da camisa: {user.shirtSizes[ticketId]}
                    </Text>
                  )}

                  {mustSelectShirtSize && (
                    <SelectModal
                      label="Tamanho da camisa"
                      value={ticketCodeAndShirtSize[ticketId] || ''}
                      setValue={value =>
                        setTicketCodeAndShirtSize(prev => ({
                          ...prev,
                          [ticketId]: value,
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

                  {shirtCodesRead[ticketId] && (
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
                        {shirtCodesRead[ticketId].code || 'Não disponível'}
                      </Text>

                      {shirtCodesRead[ticketId] && (
                        <Button containerStyle={{ margin: 10 }} onPress={() => { editCodeTicker(ticketId) }}>Editar</Button>
                      )}
                    </View>
                  )}
                </Card>
              );
            }}
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
              Quantidade de kits escaneados {Object.keys(shirtCodesRead).length} / {selectedTicketCodes.length}
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
            ListHeaderComponent={() => (
              <Text
                style={{
                  paddingBottom: 10,
                  fontSize: 16,
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}>
                Total: {selectedTicketCodes.length} ingresso{selectedTicketCodes.length > 1 ? 's' : ''}
              </Text>
            )}
            renderItem={({ item: [group, quantity] }) => (
              <View style={{ flexDirection: 'row', marginBottom: 5 }}>
                <Text style={{ fontSize: 15, fontWeight: '900' }}>
                  {quantity} ingresso{quantity > 1 ? 's' : ''} - {group}
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

      {/* <JustificationModal
        modalVisible={isValidBoolean}
        setModalVisible={setIsValidBoolean}
        onSubmit={handleJustificationSubmit}
        onCancel={() => {
          onCancelDeliveryByCPF();
          clearState();
        }}
        message={`Cadastro do usuário ínvalido. Informe um motivo para continuar com a entrega do kit.`}
      /> */}


    </View>


  );
};

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
  const toggleCheckbox = ticketId => {
    setSelecteds(prev =>
      prev.includes(ticketId)
        ? prev.filter(c => c !== ticketId)
        : [...prev, ticketId]
    );
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
      const allTicketIds = tickets.map(ticket => ticket.id);
      setSelecteds(allTicketIds);
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
          data={tickets} // Agora é um array de objetos `ticket`
          renderItem={({ item: ticket, index }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }} key={ticket.id}>
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
                checked={selecteds.includes(ticket.id)}
                onPress={() => toggleCheckbox(ticket.id)}
                iconType="material-community"
                checkedIcon="checkbox-outline"
                uncheckedIcon="checkbox-blank-outline"
              />
              <Text h5 style={{ fontSize: 15, paddingRight: 4, flex: 1 }}>
                {[ticket.sector || '', ticket.day || '', ticket.kitDeliveredAt ? "ENTREGUE" : null]
                  .filter(Boolean)
                  .join(' - ')}
              </Text>
            </View>
          )}
          keyExtractor={item => item.id}
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


const styles = StyleSheet.create({
  cardBase: {
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 5,
  },
  highlightedCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(221, 240, 216, 0.9)', // Verde-claro
    borderColor: '#5cb85c', // Verde mais escuro
    borderWidth: 2,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  kitInfoContainer: {
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    width: '100%',
  },
  kitLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#555',
  },
  kitCode: {
    fontSize: 16,
    color: '#000',
    marginBottom: 10,
  },
  editButton: {
    marginTop: 5,
  },
  editButtonTitle: {
    color: THEME.cor.primary,
    fontSize: 14,
  },
});