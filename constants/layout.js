import {Dimensions} from 'react-native';
const windowWidth = Dimensions.get('window').width;
export const IS_MOBILE = windowWidth < 400;
