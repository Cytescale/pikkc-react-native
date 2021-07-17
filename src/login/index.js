import { StatusBar } from 'expo-status-bar';
import React,{useState,useEffect,useRef } from 'react';
import { AsyncStorage,StyleSheet, Text,TextInput, View,Button,PixelRatio,TouchableOpacity,Image,Dimensions } from 'react-native';
import AppLoading from 'expo-app-loading';
import { Camera } from 'expo-camera';
import styles from '../../styles/landStyle';
import {SafeAreaView,SafeAreaProvider,} from 'react-native-safe-area-context';
//host.exp.exponent
import { 
     useFonts,
     Quicksand_300Light,
     Quicksand_400Regular,
     Quicksand_500Medium,
     Quicksand_600SemiBold,
     Quicksand_700Bold 
   }from '@expo-google-fonts/quicksand';

import * as Google from 'expo-google-app-auth';
import * as GoogleSignIn from 'expo-google-sign-in';


let StorageKey = '@pikc:googleauthbearer';
let UserStorageKey = '@pikc:googleauthuser';
let RefreshTokenKey ='@pikc:googleauthrefresh';

   const windowWidth = Dimensions.get('window').width;
   const windowHeight = Dimensions.get('window').height;
   
   const asp4Height =  (windowWidth* 4)/3;
   
   class Login extends React.Component {
      constructor(props){
        super(props);
        this.state = {
          user:null
        }
        this.onPress = this.onPress.bind();
      }
      
      componentDidMount(){
          this.getCachedAuthAsync();
         this.checkIfLoged();
         this.initGoolge();
      }

      async initGoolge(){
        console.log('Google init');
        await GoogleSignIn.initAsync({
          scopes:['profile',
          'email',
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/drive.appdata',
          'https://www.googleapis.com/auth/drive.file'],
          webClientId:'578312168895-48bparsqacgtrmeu1u1fdqb63e4h3beu.apps.googleusercontent.com',
        });
        //await GoogleSignIn.signOutAsync();
      }

      async checkIfLoged(){
        let br = await this.getCachedAuthAsync();
        if(br!==null){
          console.log('int');
          this.props.navigation.reset({
            index: 0,
            routes: [{ name: 'land' }],
          });;
        }
        else{
          //alert('Not logged in');
        }
      }

      async cacheAuthAsync(bearer) {
        return await AsyncStorage.setItem(StorageKey, JSON.stringify(bearer));
      }
  
      async cacheAuthRefreshAsync(token) {
        return await AsyncStorage.setItem(RefreshTokenKey, JSON.stringify(token));
      }
  

      async getCachedAuthAsync() {
        let value = await AsyncStorage.getItem(StorageKey);
        let bearer = JSON.parse(value);
        console.log('getCachedAuthAsync', bearer);
        return bearer;
      }
  
      async cacheUserAsync(userData) {
        return await AsyncStorage.setItem(UserStorageKey, JSON.stringify(userData));
      }
  
      async getCachedUserAsync() {
        let value = await AsyncStorage.getItem(UserStorageKey);
        let userData = JSON.parse(value);
        console.log('getCachedUserAsync', userData);
        return userData;
      }
  //
      onPress = async() =>{
         console.log("Press2");
         
        try {
                    await GoogleSignIn.askForPlayServicesAsync();
                    const { type, user } = await GoogleSignIn.signInAsync();
                      if (type === "success") {
                          console.log("LoginScreen.js 17 | success");
                          console.log(user);
                          await this.cacheAuthAsync(user.auth.accessToken);
                          //await this.cacheAuthRefreshAsync(refreshToken);
                          await this.cacheUserAsync(user);
                          await this.getCachedAuthAsync();
                          await this.getCachedUserAsync();
                          this.props.navigation.reset({index: 0,routes: [{ name: 'land' }],});;
                          return true;
                    }
                    //const { type,accessToken,refreshToken, user } = await Google.logInAsync({
                    //   iosClientId:'578312168895-b5d4k76nli08ogbu7dbdfhmjqf44uotm.apps.googleusercontent.com',
                    //   iosStandaloneAppClientId:'578312168895-b5d4k76nli08ogbu7dbdfhmjqf44uotm.apps.googleusercontent.com',
                    //   androidClientId: `578312168895-hg7v853094vk0uuasfbv16k4nv4anemb.apps.googleusercontent.com`,
                    //   androidStandaloneAppClientId:`578312168895-hg7v853094vk0uuasfbv16k4nv4anemb.apps.googleusercontent.com`,
                    //   scopes: ['profile', 'email','https://www.googleapis.com/auth/drive'],
                    // });
                    // if (type === "success") {
                    //   console.log("LoginScreen.js 17 | success");
                    //   console.log(user);
                    //   await this.cacheAuthAsync(accessToken);
                    //   await this.cacheAuthRefreshAsync(refreshToken);
                    //   await this.cacheUserAsync(user);
                    //   await this.getCachedAuthAsync();
                    //   await this.getCachedUserAsync();
                    //   this.props.navigation.reset({index: 0,routes: [{ name: 'land' }],});;
                    //   return true;
                    // }
        } catch (error) {
          console.log("LoginScreen.js 19 | error with login", error);
          return false;
        }
      };

      render(){
        return(
                <SafeAreaProvider style={styles.landAct}>
                <SafeAreaView style={{backgroundColor:'#2F436E'}}>
                    <View style={styles.landAct}>
                          <StatusBar animated={true} backgroundColor="#2F436E"/> 
                          <View style={styles.loginBodyCont}>
                                <View style={styles.loginLogoCont}>
                                      <Image   style={styles.loginLogoIco} source={require('../../assets/logo.jpeg')}/>   
                                      <Text style={styles.loginLogoSubMoto} >Make datasets with ease.</Text>
                                </View>
                                <View style={styles.loginLoginFrmCont}>
                                      <TouchableOpacity style={styles.loginLoginGogButt} onPress={()=>{this.onPress()}}>
                                      <Image  source={require('../../assets/gog.png')} style={styles.loginLoginGogButtIco}/>   
                                      <Text style={styles.loginLoginGogButtLab}>Sign In with Google</Text>
                                      </TouchableOpacity>
                                      <Text style={styles.loginLoginOr}>or</Text>
                                      <TouchableOpacity 
                                      style={styles.loginLoginGogButt}
                                      
                                      >
                                      <Text style={styles.loginLoginGogButtLab}>Sign In Later</Text>
                                      </TouchableOpacity>
                                </View>
                                <View style={styles.loginLoginBottomCont}>
                                    <Text style={styles.loginLoginBottomLogo}>Pikkc</Text>
                                    <Text style={styles.loginLoginBottomSub1}>Write to us:</Text>
                                    <Text style={styles.loginLoginBottomSub2}>#pikkc #pikkco</Text>
                                </View>
                          </View>
                    </View>
                </SafeAreaView>
          </SafeAreaProvider>
        )
      }
   }

   
   const LoginAct = ({navigation} ) =>{
          let [fontsLoaded] = useFonts({
          Quicksand_700Bold,
          Quicksand_300Light,
          Quicksand_400Regular,
          Quicksand_500Medium,
          Quicksand_600SemiBold,
        })
   
        const [hasPermission, setHasPermission] = useState(null);
        useEffect(() => {
          (async () => {
            const { status } = await Camera.requestPermissionsAsync();
            setHasPermission(status === 'granted');
          })();
        }, []);
        
        return(
            <Login navigation={navigation} />
        )
     
     }

     
export default LoginAct;