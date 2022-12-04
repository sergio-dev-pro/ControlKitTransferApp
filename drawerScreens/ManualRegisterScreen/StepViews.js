import React from 'react';
import {ScrollView, View} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Button from '../../components/Button';
import Text from '../../components/Text';
import {theme} from '../../style/theme';

export default function StepViews({children, currentStepNumber}) {
  const childrens = children.filter(child => child);
  return (
    <View style={{flex: 1}}>
      <StepStatusGroup
        currentStepNumber={currentStepNumber}
        steps={childrens.map((_, index) => ++index)}
      />
      <ScrollView style={{height: '100%', flex: 2}}>
        {React.Children.map(childrens, (child, index) =>
          currentStepNumber === ++index ? child : null,
        )}
      </ScrollView>
      {/* <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: theme.size.xs,
          borderTopWidth: 1,
          borderColor: theme.color.secondary,
        }}>
        <Button variant="secondary" onPress={() => prevView()}>
          Voltar
        </Button>
        <Button
          disabled={currentStepNumber === childrens.length}
          onPress={() => nextView()}>
          {currentStepNumber === childrens.length ? 'Finalizar' : 'Continuar'}
        </Button>
      </View> */}
    </View>
  );
}

const StepStatusGroup = ({currentStepNumber, steps}) => {
  console.log('steps', steps);
  return (
    <View
      style={{
        width: '100%',
        flexDirection: 'row',
        marginBottom: theme.size.xs,
        justifyContent: 'center',
      }}>
      {steps.map((number, index, originOfSteps) => (
        <StepStatus
          isCurrentStep={currentStepNumber === number}
          isCompleted={currentStepNumber > number}
          positionNumber={number}
          isLast={number === originOfSteps.length}
        />
      ))}
    </View>
  );
};

const StepStatus = ({
  title,
  positionNumber,
  isCompleted,
  isLast,
  isCurrentStep,
}) => {
  return (
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <View
        style={{
          backgroundColor: isCompleted
            ? 'transparent'
            : isCurrentStep
            ? theme.color.primary
            : theme.color.secondary,
          width: theme.size.sm,
          height: theme.size.sm,
          borderRadius: 20,
          flex: 0,
          justifyContent: 'center',
          alignItems: 'center',
          // marginRight: isCompleted ? 0 : theme.size.xs,
        }}>
        <Text as="H4" style={{color: 'transparent'}}>
          {isCompleted ? (
            <Icon
              name="check"
              size={theme.size.sm}
              color={theme.color.primary}
            />
          ) : (
            positionNumber
          )}
        </Text>
      </View>

      <Text
        as="P1"
        style={{
          color: isCurrentStep ? theme.color.primary : theme.color.secondary,
          marginRight: theme.size.xs,
        }}>
        {title}
      </Text>
      {!isLast && (
        <Text
          style={{
            borderTopWidth: 1,
            borderColor: !isCompleted ? '#ada8a8' : theme.color.primary,
            width: theme.size.xs,
            height: 1,
            marginRight: theme.size.xs,
          }}
        />
      )}
    </View>
  );
};
