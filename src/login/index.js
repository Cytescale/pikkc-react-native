import { StatusBar } from 'expo-status-bar';
import React,{useState,useEffect } from 'react';
import {Alert, AsyncStorage, Text, View,TouchableOpacity,Image,Dimensions } from 'react-native';
import { Camera } from 'expo-camera';
import styles from '../../styles/landStyle';
import {SafeAreaView,SafeAreaProvider,} from 'react-native-safe-area-context';
import { useFonts,Quicksand_300Light,Quicksand_400Regular,Quicksand_500Medium,Quicksand_600SemiBold,Quicksand_700Bold }from '@expo-google-fonts/quicksand';
import * as GoogleSignIn from 'expo-google-sign-in';
import * as WebBrowser from 'expo-web-browser';
import * as GoogleSession from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

/*
  LOGIN WITH GOOGLE ID => GOOGLE_LOGIN_TYPE
  apple type => APPLE_LOGIN_TYPE
  guest type => GUEST_LOGIN_TYPE

*/

//Storage uniqe keys
const StorageKey = '@pikc:googleauthbearer';
const UserStorageKey = '@pikc:googleauthuser';
const RefreshTokenKey ='@pikc:googleauthrefresh';
const LoginTypeKey ='@pikc:LoginMethod';

class Login extends React.Component {
      constructor(props){
        super(props);
        this.state = {user:null}
        this.onPress = this.onPress.bind();
      }
      
      componentDidMount(){
          this.getCachedAuthAsync();
          this.checkIfLoged();
      }
      async checkIfLoged(){
        let br = await this.getCachedAuthAsync();
        if(br!==null){
          console.log('int');        
          if(this.props.hasPermission){
            this.props.navigation.reset({index: 0,routes: [{ name: 'land' }],});;
          }else{
            alert('Please grant camera permissions to keep using app');
            (async () => {
              const { status } = await Camera.requestPermissionsAsync();
              this.props.setHasPermission(status === 'granted');
              if(status === 'granted'){
                this.checkIfLoged();
              }
            })();
          }
        }
        else{
          //alert('Not logged in');
        }
      }

      //set brearer token key in storage
      async cacheAuthAsync(bearer) {
        return await AsyncStorage.setItem(StorageKey, JSON.stringify(bearer));
      }
      

      //get brearer token key in storage
      async getCachedAuthAsync() {
        let value = await AsyncStorage.getItem(StorageKey);
        let bearer = JSON.parse(value);
        console.log('getCachedAuthAsync', bearer);
        return bearer;
      }
  
      //set user data in storage
      async cacheUserAsync(userData) {
        return await AsyncStorage.setItem(UserStorageKey, JSON.stringify(userData));
      }
  
      //set user data in storage
      async getCachedUserAsync() {
        let value = await AsyncStorage.getItem(UserStorageKey);
        let userData = JSON.parse(value);
        console.log('getCachedUserAsync', userData);
        return userData;
      }
      async cacheLoginTypeAsync (bearer){return await AsyncStorage.setItem(LoginTypeKey, JSON.stringify(bearer));}
      //init login process
      onPress = async() =>{
         console.log("login process init");           
               this.props.promptAsync().then(r=>{
                 console.log('\n\n\prompt result');
                 console.log(r);
               }).catch((e)=>{
                console.error('\n\n\prompt error');
                console.log(e);
               });
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
                                      onPress={()=>{
                                        this.cacheLoginTypeAsync('GUEST_LOGIN_TYPE').then(()=>{
                                            if(this.props.hasPermission){
                                              this.props.navigation.reset({index: 0,routes: [{ name: 'land' }],});;
                                            }else{
                                              alert('Please grant camera permissions to keep using app');
                                              (async () => {
                                                const { status } = await Camera.requestPermissionsAsync();
                                                setHasPermission(status === 'granted');
                                              })();
                                            }
                                        });
                                      }}
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

   //Login class wrapper 
   const LoginAct = ({navigation} ) =>{
          let [fontsLoaded] = useFonts({
          Quicksand_700Bold,
          Quicksand_300Light,
          Quicksand_400Regular,
          Quicksand_500Medium,
          Quicksand_600SemiBold,
        })
        const [hasPermission, setHasPermission] = useState(null);
      
      const cacheAuthAsync = async (bearer)=>{return await AsyncStorage.setItem(StorageKey, JSON.stringify(bearer));}
      const cacheLoginTypeAsync = async (bearer)=>{return await AsyncStorage.setItem(LoginTypeKey, JSON.stringify(bearer));}
      const cacheUserAsync = async (userData)=>{return await AsyncStorage.setItem(UserStorageKey, JSON.stringify(userData));}
      const cacheAuthRefreshAsync = async (refreshToken)=>{return await AsyncStorage.setItem(RefreshTokenKey, JSON.stringify(refreshToken));}
      const [request, response, promptAsync] = GoogleSession.useAuthRequest({
          expoClientId:'578312168895-dljgsvuub3t8rjl72feckaodf2e0tvd2.apps.googleusercontent.com',  
          iosClientId: '578312168895-2esimi4sqqerqf6ig92ejc82u1mlj1pd.apps.googleusercontent.com',
          androidClientId: '578312168895-9uu9tq9k9g7m3a10r3on0tf40q1d17ij.apps.googleusercontent.com',
          webClientId: '578312168895-2ousc8d8ubp82clrkth98pbgakisg75e.apps.googleusercontent.com',

          selectAccount:true,
          scopes:['profile',
          'https://www.googleapis.com/auth/userinfo.profile',
          'email',
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/drive.appdata',
          'https://www.googleapis.com/auth/drive.file']
        })

        const getUserData = async(accTok)=>{
          let myHeaders = new Headers();
          myHeaders.append("Authorization", `Bearer ${accTok}`);
          var requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
          };
          let resp = await fetch("https://www.googleapis.com/userinfo/v2/me", requestOptions).catch(e=>{
                  console.log('User info gather error'+e);
            });
          let json = await resp.json();
          if(json){
            await cacheUserAsync(json);
          }
          console.log(json);
        }
        
        useEffect(() => {
          (async () => {
            const { status } = await Camera.requestPermissionsAsync();
            setHasPermission(status === 'granted');
          })();
        },[]);
     
        useEffect(() => {
          if (response?.type === 'success') {
            const { authentication,errorCode,error } = response;
            console.log('\n\n\nAuthentication result')
                console.log(authentication); 
                cacheAuthAsync(authentication.accessToken).then(()=>{
                  cacheAuthRefreshAsync(authentication.refreshToken).then(()=>{ 
                    cacheLoginTypeAsync('GOOGLE_LOGIN_TYPE').then(()=>{
                        getUserData(authentication.accessToken).then(()=>{
                          if(hasPermission){
                            navigation.reset({index: 0,routes: [{ name: 'land' }],});;
                          }else{
                            alert('Please grant camera permissions to keep using app');
                            (async () => {
                              const { status } = await Camera.requestPermissionsAsync();
                              setHasPermission(status === 'granted');
                            })();
                          }
                        })
                    })
                  });
                });   
            }
            else if(response?.type === 'error'){
              console.log('\n\n\nAuthentication error');
              error?alert('Error occurred while loggin in'+error):alert('Unknown errror occurred');
            }
            else if(response?.type === 'dismiss'||response?.type === 'cancel'){
              console.log('\n\n\nAuthentication cancled or dismissed');
              alert('Google signin Canceled');
            }
            else{
              console.log('response type '+response?.type);
            }
        }, [response]);

     if (!fontsLoaded) {
       return null
     }
        return(
            <Login navigation={navigation} promptAsync={promptAsync} hasPermission={hasPermission} setHasPermission={setHasPermission} />
        )
     
     }

     
export default LoginAct;