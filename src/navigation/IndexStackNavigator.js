import { createStackNavigator } from 'react-navigation';

import { DetailScreen, IndexScreen } from '../screens';
import { defaultStackNavigatorConfig } from './defaultStackNavigatorConfig';

export const IndexStackNavigator = createStackNavigator(
  {
    Index: {
      screen: IndexScreen,
      navigationOptions: (props) => ({
        title: props.navigation.getParam('title', '') // dynamic title depending on the route params
      })
    },
    Detail: {
      screen: DetailScreen
    }
  },
  defaultStackNavigatorConfig('Index')
);
