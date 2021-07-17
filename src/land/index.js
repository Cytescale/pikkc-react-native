
import { StatusBar } from 'expo-status-bar';
import React,{useState,useEffect,useRef } from 'react';
import { Alert,AsyncStorage,StyleSheet, Text,TextInput, View,Button,PixelRatio,TouchableOpacity,Image,Dimensions } from 'react-native';
import AppLoading from 'expo-app-loading';
import { Camera } from 'expo-camera';
import styles from '../../styles/landStyle';
import { BottomSheet } from "react-native-elements";
import {
     createDrawerNavigator,
     DrawerContentScrollView,
     DrawerItemList,
     DrawerItem,
   } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';

import {
     SafeAreaView,
     SafeAreaProvider,
     SafeAreaInsetsContext,
     useSafeAreaInsets,
     initialWindowMetrics,    
   } from 'react-native-safe-area-context';

import { 
     useFonts,
     Quicksand_300Light,
     Quicksand_400Regular,
     Quicksand_500Medium,
     Quicksand_600SemiBold,
     Quicksand_700Bold 
   } from '@expo-google-fonts/quicksand'


import * as MediaLibrary from 'expo-media-library';
import * as AppAuth from 'expo-app-auth';
import * as GoogleSignIn from 'expo-google-sign-in';

const Authconfig = {
     issuer: 'https://accounts.google.com',
     clientId: '578312168895-hg7v853094vk0uuasfbv16k4nv4anemb.apps.googleusercontent.com',
     scopes: ['profile', 'email','https://www.googleapis.com/auth/drive'],
   };

   
   const windowWidth = Dimensions.get('window').width;
   const windowHeight = Dimensions.get('window').height;
   
   const asp4Height =  (windowWidth* 4)/3;


   const Drawer = createDrawerNavigator();
  
  
   const StorageKey = '@pikc:googleauthbearer';
   const UserStorageKey = '@pikc:googleauthuser';
   const RefreshTokenKey ='@pikc:googleauthrefresh';

 async function  cacheAuthAsync(bearer) {
     return await AsyncStorage.setItem(StorageKey, JSON.stringify(bearer));
   }
async function getCachedAuthRefreshAsync() {
     let value = await AsyncStorage.getItem(RefreshTokenKey);
     let bearer = JSON.parse(value);
     console.log('getCachedAuthAsync', bearer);
     return bearer;
}
 async function  getCachedAuthAsync() {
     let bearer = null;
     let value = await AsyncStorage.getItem(StorageKey);
     if(value){
          bearer = JSON.parse(value);
     }
     console.log('getCachedAuthAsync', bearer);
   return bearer;
 }
 async function  cacheUserAsync(userData) {
   return await AsyncStorage.setItem(UserStorageKey, JSON.stringify(userData));
 }
 async  function  getCachedUserAsync() {
   let value = await AsyncStorage.getItem(UserStorageKey);
   let userData = JSON.parse(value);
   console.log('getCachedUserAsync', userData.email);
   return userData;
 }
 async function logout(){
     let act = await getCachedAuthAsync();
     console.log(act);
     if(act){
          await GoogleSignIn.signOutAsync();     
     }
        await AsyncStorage.removeItem(UserStorageKey);
        await AsyncStorage.removeItem(StorageKey);
 }
 async function getList(){
     let myHeaders = new Headers();
     let br  = await getCachedAuthAsync();
     if(!br){return null;}
     myHeaders.append("Authorization", `Bearer ${br}`);
     var requestOptions = {
       method: 'GET',
       headers: myHeaders,
       redirect: 'follow'
     };
     let resp = await fetch("https://www.googleapis.com/drive/v2/files?key=AIzaSyCeMuCoxIBa77l1eurlBVd_OraUL3x0HTk", requestOptions);
     let json = await resp.json();
     let folderList = [];
     if(json){
          for(let d in json.items){
               if(json.items[d].mimeType=='application/vnd.google-apps.folder' && json.items[d].labels.trashed == false){
                    folderList.push(json.items[d]);
               }
          }
     }
     return folderList;
}
async function createFolder(name){
     console.log(name);
     let myHeaders = new Headers();
     let br  = await getCachedAuthAsync();
     if(!br){return new Error('No access token');}
     myHeaders.append("Authorization", `Bearer ${br}`);
     myHeaders.append("Content-Type", "application/json");
     let raw = JSON.stringify({"title":name,"mimeType": "application/vnd.google-apps.folder"});
     let requestOptions = {method: 'POST',headers: myHeaders,body: raw,redirect: 'follow'};
     let resp = await fetch("https://www.googleapis.com/drive/v2/files?key=AIzaSyCeMuCoxIBa77l1eurlBVd_OraUL3x0HTk", requestOptions);
     let json = await resp.json();
     return json;

}


async function getRefreshToken(){
     let br = await getCachedAuthRefreshAsync();
     console.log('\n refresh token: '+br);
     if(!br){return null;}
     let re = await AppAuth.refreshAsync(Authconfig,br);
     if(re){
          await cacheAuthAsync(re.accessToken);
          console.log('Auth token refreshed');
          return re.accessToken;
     }
     else{
          console.log('Auth token refresh failed');
          return null;
     }
     
}

async function uploadImage(base64Data,folderdata){
     const boundary = '-------314159265358979323846';
     const delimiter = "\r\n--" + boundary + "\r\n";
     const close_delim = "\r\n--" + boundary + "--";
     const contentType = 'image/jpeg'||'application/octet-stream';
     var metadata = {
          'title': 'pikkc-image.jpg',
          'mimeType': 'image/jpeg',
          'parents':[{"id":folderdata.id}]
     };
     var multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n' +
        'Content-Transfer-Encoding: base64\r\n' +
        '\r\n' +
        base64Data +
        close_delim;

     
     let myHeaders = new Headers();
     let br  = await getCachedAuthAsync();
     if(!br){return new Error('No access token');}
     myHeaders.append("Authorization", `Bearer ${br}`);
     myHeaders.append("Content-Type", 'multipart/mixed; boundary="' + boundary + '"');
     let requestOptions = {method: 'POST',params:{'uploadType': 'multipart'},headers: myHeaders,body:multipartRequestBody,redirect: 'follow'};
     let resp = await fetch("https://www.googleapis.com/upload/drive/v2/files?key=AIzaSyCeMuCoxIBa77l1eurlBVd_OraUL3x0HTk", requestOptions);
     let json = await resp.json();
     //console.log(json);
     return json;
     
}


   function HomeScreen({navigation }) {
     const camera = useRef(null);
     const [folderSelectBool,setfolderSelectBool] = useState(false);
     const [addFolderBool,setaddFolderBool] = useState(false);
     const [flashBool , setFlashBool] = useState(false);
     const [type, setType] = useState(Camera.Constants.Type.front);
     const [ratioBool,setratioBool] = useState(true);
     const [userData,setUserData] = useState(null);
     const [folderList ,setFolderList] = useState(null);
     const [selecFolderData,setselecFolderData]= useState(null);
     const [foldername,setfoldername] = useState(null);
     useEffect(()=>{
          const checkIfLoged = async () =>{
               let re = null;
               let br = await getCachedAuthAsync();
               // if(br){re = await getRefreshToken();}
               if(br){
                    await GoogleSignIn.initAsync({
                         scopes:['profile',
                         'email',
                         'https://www.googleapis.com/auth/drive.file',
                         'https://www.googleapis.com/auth/drive.appdata',
                         'https://www.googleapis.com/auth/drive.file'],
                         webClientId:'578312168895-48bparsqacgtrmeu1u1fdqb63e4h3beu.apps.googleusercontent.com',
                    });
                    let usrData  = await getCachedUserAsync()
                    setUserData(usrData);
                    console.log('\nlogged in');
                    try{
                         let fol = await getList();
                         if(fol){
                              console.log("Folder length"+fol.length);
                              setFolderList(fol);
                         }
                    }catch(e){
                         console.log("Error Occr geting list"+e);
                         alert('Error occurred while getting data'+e.message)
                    }

               }
               else{alert('Not logged in');}
          }
          checkIfLoged();
     },[]);

     return (
          <SafeAreaView
          style={{backgroundColor:'#2F436E'}}
          >
          <View style={styles.landAct}>
                              <StatusBar animated={true} backgroundColor="#2F436E"/> 
                              <View  style={styles.landHeadMainCont}>
                                   <View style={styles.landHeadMoreOpt}>
                                        <TouchableOpacity onPress={()=>{navigation.openDrawer()}}>
                                        <Image source={require('../../assets/round_menu_white_24dp.png')}  style={styles.landHeadFlashButtIco}/>
                                        </TouchableOpacity>
                                   </View>
                                   <View style={styles.landHeadLogoMainCont}>
                                        <Text style={styles.landHeadLogoCont}>pikkC</Text>
                                   </View>
                                   <TouchableOpacity style={styles.landHeadFlashButt}onPress={()=>{setFlashBool(!flashBool)}} >
                                   {
                                   flashBool?
                                   <Image source={require('../../assets/outline_flash_on_white_24dp.png')}  style={styles.landHeadFlashButtIco}/>
                                   :
                                   <Image source={require('../../assets/outline_flash_off_white_24dp.png')}  style={styles.landHeadFlashButtIco}/>

                                   }
                                   </TouchableOpacity>
                              </View>
                              <View style={{
                                   width:'100%',
                                   height:ratioBool?asp4Height:windowWidth,
                                   marginTop:52,
                                   backgroundColor:'red'
                              }}>
                              <Camera
                              ratio={'4:3'}
                               ref={camera}
                               style={styles.landCam} type={type} />                                 
                              </View>
                              <View style={styles.landBottomBarMainCont}>
                                   <View style={styles.landBotomFolderSelecButtCont}>
                                        <TouchableOpacity 
                                        style={styles.landBotomFolderSelecButt}
                                        onPress={()=>{setfolderSelectBool(true)}}
                                        >
                                        <Text
                                        style={styles.landBotomFolderSelecButtLab}
                                        >{selecFolderData?selecFolderData.title:'Select where to save'}</Text>
                                              <Image 
                                              style={styles.landBotomFolderSelecButtIco}
                                              source={require('../../assets/outline_expand_more_white_24dp.png')}
                                              />
                                        </TouchableOpacity>
                                   </View>
                                   <View style={styles.landBottomClickMainCont}>
                                        <View style={styles.landBottomClickMainSubCont}>    
                                             <TouchableOpacity
                                             style={styles.landBottomAsptButt}
                                             onPress={()=>{
                                                  setratioBool(!ratioBool);
                                             }}
                                             >
                                              <Text style={styles.landBottomAsptLab}>{ratioBool?'4:3':'1:1'}</Text> 
                                             </TouchableOpacity>
                                        </View>
                                        <View style={styles.landBottomClickMainSubCont}>
                                             <TouchableOpacity
                                             style={styles.lanndBottomClickButt}
                                             onPress={async ()=>{
                                                  if (camera) {
                                                            try{
                                                                 let {uri, width, height, exif, base64 } = await camera.current.takePictureAsync({quality:0.3,base64:true});
                                                                 if(uri&&base64){
                                                                      console.log('inn');
                                                                      if(selecFolderData){
                                                                           uploadImage(base64,selecFolderData).then((r)=>{
                                                                                if(r){
                                                                                     console.log(r.id);
                                                                                     alert('Image uploaded to drive'); 
                                                                                }
                                                                           });
     
                                                                      }else{
                                                                           alert('Select a folder');
                                                                      }
                                                                      
                                                                 }
                                                                 if(uri){
                                                                      console.log(uri)
                                                                      if(await (await MediaLibrary.getPermissionsAsync()).granted){
                                                                           const asset = await MediaLibrary.createAssetAsync(uri);
                                                                           if(asset){
                                                                                //alert('Image saved with name'+asset.filename)
                                                                           }
                                                                      }else{
                                                                           let res = await MediaLibrary.requestPermissionsAsync();
                                                                           if(res.granted){
                                                                                const asset = await MediaLibrary.createAssetAsync(uri);
                                                                                if(asset){
                                                                                     //alert('Image saved with name'+asset.filename)
                                                                                }
                                                                           }else{
                                                                                alert('Please grant permissions');    
                                                                           }
                                                                      }
                                                                 }
                                                            }
                                                            catch(e){
                                                                 console.log(e);
                                                                 alert('Error while capturing '+e.message);
                                                            }
                                                  }
                                             }}
                                             >
                                                  <Image  style={styles.lanndBottomClickButtIco} source={!userData?require('../../assets/PikkLeaf.png'):{uri:userData.photoURL}}/>
                                             </TouchableOpacity>
                                        </View>
                                        <View style={styles.landBottomClickMainSubCont}>
                                        <TouchableOpacity
                                             style={styles.landBottomCamButt}
                                             onPress={()=>{  
                                                  setType(
                                                  type === Camera.Constants.Type.back
                                                    ? Camera.Constants.Type.front
                                                    : Camera.Constants.Type.back
                                                );}}
                                             >
                                                  
                                                  <Image style={styles.landBottomCamButtIco} source={require('../../assets/outline_cameraswitch_white_24dp.png')}/>
                                             </TouchableOpacity>
                                        </View>
                                   </View>
                                   {
                                        !ratioBool?
                                        <View style={styles.landBottomSaveCont}>
                                        <Text style={styles.landBottomSaveContLab}>
                                             Click and Save
                                        </Text>
                                        </View>:null
                                   }
                                   
                              </View>
                              <BottomSheet
                              containerStyle={{ 
                              backgroundColor: 'rgba(0, 0,0,0.0)' }}
                              isVisible={folderSelectBool}
                              >
                              <View style={styles.landFolderSelecBottomSheet}>
                                   <View style={styles.landFolderSelecBottomSheetTop}>
                                   <Text style={styles.landFolderSelecBottomSheetTopLab}>Datasets</Text>     
                                   <View style={{
                                        position:'absolute',
                                        right:0,
                                        top:0,
                                        bottom:0,
                                        width:24,
                                        height:'100%',
                                        marginTop:16,
                                        marginRight:16,
                                   }}>
                                        <TouchableOpacity onPress={()=>{
                                             setfolderSelectBool(false);
                                        }}>
                                        <Image style={styles.landFolderSelecBottomSheetTopClose} source={require('../../assets/round_highlight_off_white_24dp.png')}/>
                                        </TouchableOpacity>
                                   </View>
                                   </View>
                                   <TouchableOpacity style={styles.landFolderBottomSheetButt} onPress={()=>{setfolderSelectBool(false);setaddFolderBool(true)}}>
                                        <Text style={styles.landFolderBottomSheetButtLab}>Add Folder +</Text>                                        
                                   </TouchableOpacity>
                                   <View>
                                   {folderList?
                                        folderList.map((e,ind)=>{
                                             return(
                                                  <TouchableOpacity style={{
                                                       width:'100%',
                                                       height:42,
                                                       borderBottomColor:'#526085',
                                                       borderBottomWidth:1,    
                                                       display:'flex',
                                                       justifyContent:'center',
                                                       alignItems:'center',
                                                       backgroundColor:selecFolderData?selecFolderData.id==e.id?'#526085':'#2F436E':'#2F436E',
                                                  }} key={ind} onPress={()=>{
                                                       selecFolderData?selecFolderData.id==e.id?setselecFolderData(null):setselecFolderData(e):setselecFolderData(e);
                                                       setfolderSelectBool(false);
                                                  }}>
                                                  <Text style={styles.landFolderBottomSheetButtLab}>{e.title}</Text>                                        
                                                  </TouchableOpacity>
                                             )
                                        })
                                   :<TouchableOpacity style={styles.landFolderBottomSheetButt}>
                                   <Text style={styles.landFolderBottomSheetButtLab}>No Folders</Text>                                        
                                   </TouchableOpacity>}
                                   </View>
                              </View>
                         </BottomSheet>
                              <BottomSheet
                              containerStyle={{ 
                                   
                                   backgroundColor: 'rgba(0, 0,0,0.0)' 
                              }}
                              isVisible={addFolderBool}
                              >
                              <View style={styles.landFolderSelecBottomSheet}>
                                   <View style={styles.landFolderSelecBottomSheetTop}>
                                   <Text style={styles.landFolderSelecBottomSheetTopLab}>Add Folder</Text>     
                                   <View style={{
                                        position:'absolute',
                                        right:0,
                                        top:0,
                                        bottom:0,
                                        width:24,
                                        height:'100%',
                                        marginTop:16,
                                        marginRight:16,
                                   }}>
                                        <TouchableOpacity onPress={()=>{
                                             setaddFolderBool(false);
                                        }}>
                                        <Image style={styles.landFolderSelecBottomSheetTopClose} source={require('../../assets/round_highlight_off_white_24dp.png')}/>
                                        </TouchableOpacity>
                                   </View>
                                   </View>
                                   <View style={styles.landFolderSelecBottomSheetAddButtCont}>
                                        <TextInput
                                        onChangeText={setfoldername}
                                        style={{height: 52,backgroundColor:'#fff',borderRadius:7,paddingLeft:12,fontSize:18,}}
                                        placeholder="Enter folder name"
                                        />
                                   </View>
                                   <View style={styles.landFolderSelecBottomSheetAddButtCont}>
                                             <TouchableOpacity  style={styles.landFolderSelecBottomSheetAddButt} onPress={async()=>{
                                                  if(foldername){
                                                       try{
                                                            let res = await createFolder(foldername);
                                                            if(res){
                                                                      alert(`Folder created`);
                                                                      setaddFolderBool(false);
                                                                      setfoldername(null);
                                                                 let fol = await getList();
                                                                 if(fol){
                                                                      console.log("Folder length"+fol.length);
                                                                      setFolderList(fol);
                                                                 }
                                                            }else{
                                                                 console.log('null result');
                                                                 alert(`Error Occured while creating folder`);     
                                                            }
                                                       }
                                                       catch(e){
                                                            console.log(e);
                                                            alert(`Error Occured `+e.message);
                                                       }
                                                  }
                                                  else{
                                                       alert("Enter any name");
                                                  }
                                             }}>
                                                  <Text style={{color:'#fff',fontSize:22,fontFamily:'Quicksand_500Medium'}}>Save</Text>
                                             </TouchableOpacity>
                                   </View>
                              </View>
                         </BottomSheet>
                          </View>
                          </SafeAreaView>
                 //   
     );
   }
const LandAct = ({navigation }) =>{
     let [fontsLoaded] = useFonts({
          Quicksand_700Bold,
          Quicksand_300Light,
          Quicksand_400Regular,
          Quicksand_500Medium,
          Quicksand_600SemiBold,
        });

        const [hasPermission, setHasPermission] = useState(null);
        
        const [userData,setUserData] = useState(null);


        useEffect(() => {
          (async () => {
            const { status } = await Camera.requestPermissionsAsync();
            setHasPermission(status === 'granted');
          })();
          const checkIfLoged = async () =>{
               let br = await getCachedAuthAsync();
               if(br){
                    let usrData  = await getCachedUserAsync()
                    setUserData(usrData);
                    console.log('\nlogged in');}
               else{alert('Not logged in');}
          }
          checkIfLoged();

          }, []);
      
        if (hasPermission === null) {
          return <View />;
        }
        if (hasPermission === false) {
          return <Text>No access to camera</Text>;
        }
     
        if (!fontsLoaded) {
             return(
                  <AppLoading/>
             )
        }
        else{
          return(
               <SafeAreaProvider style={styles.landAct}>
                      <Drawer.Navigator      
                    drawerContent={props =>
                    <DrawerContentScrollView {...props} style={styles.landDrawerMainCont}>
                         <View style={{height:windowHeight,paddingBottom:2,}}>
                                   <View style={styles.landDrawerLogoCont}>
                                             <Text style={styles.landDrawerLogo}>pikkc</Text>
                                             <Text style={styles.landDrawerSubMoto}>Make your datasets with ease.</Text>
                                   </View>
                                   <View style={styles.landDrawerBody}>
                                             <Text style={{color:'#fff',fontFamily:'Quicksand_500Medium',fontSize:22}}>Connected To:</Text>
                                             <TouchableOpacity style={styles.landDrawerSignButton}
                                              onPress={()=>{
                                                  Alert.alert(
                                                       "Logout",
                                                       "Are you sure you want logout?",
                                                       [
                                                         {
                                                           text: "Cancel",
                                                           onPress: () => console.log("Cancel Pressed"),
                                                           style: "cancel"
                                                         },
                                                         { text: "Yes", onPress: async() => {
                                                              console.log('Loged out init');
                                                              logout().then(async ()=>{
                                                                 navigation.reset({
                                                                      index: 0,
                                                                      routes: [{ name: 'login' }],
                                                                    });;  
                                                              });
                                                         } }
                                                       ]
                                                     );
                                              }}
                                             >
                                                  <Text  style={{color:'#fff',fontFamily:'Quicksand_500Medium',fontSize:17}}>
                                                       {!userData?'Not Connected':`${userData.firstName}'s Drive`}
                                                  </Text>
                                             </TouchableOpacity>
                                   </View>
                                   <View style={styles.landDrawerBottomBody}>
                                             <View style={styles.landDrawerBottomButtCont}>
                                                  <TouchableOpacity>
                                                  <Image style={styles.landDrawerBottomIco} source={require('../../assets/lnkin.png')}/>
                                                  </TouchableOpacity>
                                             </View>
                                             <View style={styles.landDrawerBottomButtCont}>
                                                  <TouchableOpacity>
                                                  <Image style={styles.landDrawerBottomIco} source={require('../../assets/insta.png')}/>
                                                  </TouchableOpacity>
                                             </View>
                                             <View style={styles.landDrawerBottomButtCont}>
                                                  <TouchableOpacity>
                                                  <Image style={styles.landDrawerBottomIco} source={require('../../assets/mess.png')}/>
                                                  </TouchableOpacity>
                                             </View>
                                   </View>
                         </View>
                    </DrawerContentScrollView>}
                    overlayColor="transparent"
                    initialRouteName="Home">
                    <Drawer.Screen name="Home" component={HomeScreen}  />
                    </Drawer.Navigator>
               </SafeAreaProvider>
          )
        }
}



export default LandAct;