import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {Alert, AsyncStorage,TouchableOpacity,Image,Dimensions ,StyleSheet, Text, View } from 'react-native';

import LandAct from './src/land';
import LoginAct from './src/login';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

const StorageKey = '@pikc:googleauthbearer';
const UserStorageKey = '@pikc:googleauthuser';
const RefreshTokenKey ='@pikc:googleauthrefresh';
const LoginTypeKey ='@pikc:LoginMethod';


export default function App() {
  
  const [logged,setlogged] = useState(null);
  const [loading,setloading] = useState(true);

  const getCachedAuthAsync = async ()=>{
    let value = await AsyncStorage.getItem(StorageKey);
    let bearer = JSON.parse(value);
    console.log('getCachedAuthAsync', bearer);
    return bearer;
  }

  useEffect(()=>{
    getCachedAuthAsync().then((r)=>{
      if(r){
        setlogged(true);
        console.log('initial load result true login');
      }else{
        setlogged(false);
        console.log('initial load result false login');
      }
      setloading(false);
    })
  },[])


  return (
    !loading?
    <NavigationContainer>
      <Stack.Navigator initialRouteName={logged?'land':'login'}>
        <Stack.Screen  options={{headerShown: false}} name="login" component={LoginAct} />
        <Stack.Screen options={{headerShown: false}}  name="land" component={LandAct} />
      </Stack.Navigator>
    </NavigationContainer>:
    <View style={{
      flex:1,
      height:'100%',
      backgroundColor:'#2F436E'
    }}></View>
  );
}
