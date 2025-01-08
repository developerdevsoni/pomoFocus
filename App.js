// /**
//  * Sample React Native App
//  * https://github.com/facebook/react-native
//  *
//  * @format
//  */

import React, {Component} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import HomePage from './src/homePage';
import AllTaskScreen from './src/allTaskScreen';
import {PermissionsAndroid, Platform, View} from 'react-native';
import Toast from 'react-native-toast-message';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import DeviceInfo from 'react-native-device-info';
// import Imei from 'react-native-imei';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deviceId: '',
    };
  }

  componentDidMount() {
    this.getDeviceUniqueID();
  }

  getDeviceUniqueID = async () => {
    const imei = await DeviceInfo.getUniqueId();
    console.log('IMEI:', imei);

    // const IMEI = require('react-native-imei');
    // console.log('emi--->', IMEI.getImei); 
  }; 

  render() { 
    const Stack = createStackNavigator();
    return (
      <SafeAreaProvider>
        <View style={{flex: 1}}>
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen
                name="homePage"
                component={HomePage}
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen name="All Task" component={AllTaskScreen} />
            </Stack.Navigator>
          </NavigationContainer>
          <Toast />
        </View>
      </SafeAreaProvider>
    );
  }
}
