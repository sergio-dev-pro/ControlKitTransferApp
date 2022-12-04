import {View} from 'react-native';
import React from 'react';
import {Text} from '@rneui/themed';
import SelectModal from '../../components/SelectModal';
import {useRegisterState} from './registerContext';

const AccessoriesForm = ({formConfig}) => {
  const {measurements, dispatch} = useRegisterState();
  return (
    <View>
      <Text h4 style={{marginBottom: 20}}>
        Acessórios
      </Text>

      {formConfig?.shirtSizeIsRequired && (
        <SelectModal
          label="Camisa"
          value={measurements.shirt}
          setValue={value =>
            dispatch({
              type: 'SET_MEASUREMENTS_SHIRT',
              payload: value,
            })
          }
          placeholder="Tamanho da camisa"
          items={[
            {label: 'P', value: 'P'},
            {label: 'M', value: 'M'},
            {label: 'G', value: 'G'},
            {label: 'GG', value: 'GG'},
            {label: 'EG1', value: 'EG1'},
            {label: 'EG2', value: 'EG2'},
          ]}
        />
      )}
      {formConfig?.blaceletSizeIsRequired && (
        <SelectModal
          label="Pulseira"
          placeholder="Tamanho da pulseira"
          value={measurements.blacelet}
          setValue={value =>
            dispatch({
              type: 'SET_MEASUREMENTS_BLACELET',
              payload: value,
            })
          }
          items={[
            {label: 'P', value: 'P'},
            {label: 'M', value: 'M'},
            {label: 'G', value: 'G'},
          ]}
        />
      )}
      {formConfig?.footSizeIsRequired && (
        <SelectModal
          label="Calçado"
          value={measurements.shoe}
          setValue={value =>
            dispatch({type: 'SET_MEASUREMENTS_SHOE', payload: value})
          }
          placeholder="Tamanho do calçado"
          items={[
            {label: '33', value: '33'},
            {label: '34', value: '34'},
            {label: '35', value: '35'},
            {label: '36', value: '36'},
            {label: '37', value: '37'},
            {label: '38', value: '38'},
            {label: '39', value: '39'},
            {label: '40', value: '40'},
            {label: '41', value: '41'},
            {label: '42', value: '42'},
            {label: '43', value: '43'},
            {label: '44', value: '44'},
            {label: '45', value: '45'},
            {label: '46', value: '46'},
          ]}
        />
      )}
    </View>
  );
};

export default AccessoriesForm;
