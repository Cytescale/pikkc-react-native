import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import LandAct from './src/land';
import LoginAct from './src/login';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();


export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="login">
        <Stack.Screen  options={{headerShown: false}} name="login" component={LoginAct} />
        <Stack.Screen options={{headerShown: false}}  name="land" component={LandAct} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
