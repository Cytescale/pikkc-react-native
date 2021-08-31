
import { StatusBar } from 'expo-status-bar';
import React,{useState,useEffect,useRef } from 'react';
import { Alert,AsyncStorage,Animated, Switch,Text,TextInput,View,TouchableOpacity,Image,Dimensions,Platform,ToastAndroid,Linking  } from 'react-native';
import AppLoading from 'expo-app-loading';
import { Camera } from 'expo-camera';
import styles from '../../styles/landStyle';
import { BottomSheet ,CheckBox} from "react-native-elements";
import {createDrawerNavigator,DrawerContentScrollView,} from '@react-navigation/drawer';
import {SafeAreaView,SafeAreaProvider,} from 'react-native-safe-area-context';
import { useFonts,Quicksand_300Light,Quicksand_400Regular,Quicksand_500Medium,Quicksand_600SemiBold,Quicksand_700Bold }from '@expo-google-fonts/quicksand';



import * as MediaLibrary from 'expo-media-library';
import * as GoogleSignIn from 'expo-google-sign-in';
import * as WebBrowser from 'expo-web-browser';

   //google Oauth configuraion and scopes

   var imageCompressionFlag = false;

   const windowWidth = Dimensions.get('window').width;
   const windowHeight = Dimensions.get('window').height;
   const asp4Height =  (windowWidth* 4)/3;
   const Drawer = createDrawerNavigator();

   //Storage uniqe keys
   const StorageKey = '@pikc:googleauthbearer';
   const UserStorageKey = '@pikc:googleauthuser';
   const RefreshTokenKey ='@pikc:googleauthrefresh';
   const LoginTypeKey ='@pikc:LoginMethod';


async function cacheLoginTypeAsync (bearer){return await AsyncStorage.setItem(LoginTypeKey, JSON.stringify(bearer));}


async function getCachedLoginTypeAsync() {
     let value = await AsyncStorage.getItem(LoginTypeKey);
     let userData = JSON.parse(value);
     console.log('getCachedLoginTypeAsync', userData);
     return userData;
}

//set brearer token
 async function  cacheAuthAsync(bearer) {
     return await AsyncStorage.setItem(StorageKey, JSON.stringify(bearer));
   }
//get refresh token (not needed function)
 async function getCachedAuthRefreshAsync() {
     let value = await AsyncStorage.getItem(RefreshTokenKey);
     let bearer = JSON.parse(value);
     console.log('getCachedAuthAsync', bearer);
     return bearer;
}
//get brearer token
 async function  getCachedAuthAsync() {
     let bearer = null;
     let value = await AsyncStorage.getItem(StorageKey);
     if(value){
          bearer = JSON.parse(value);
     }
     console.log('getCachedAuthAsync', bearer);
   return bearer;
 }
 //set user data
 async function  cacheUserAsync(userData) {
   return await AsyncStorage.setItem(UserStorageKey, JSON.stringify(userData));
 }
 //get user data
 async  function  getCachedUserAsync() {
   let value = await AsyncStorage.getItem(UserStorageKey);
   let userData = JSON.parse(value);
   console.log('getCachedUserAsync', userData.email);
   return userData;
 }
 //logout function
 async function logout(){
     let act = await getCachedAuthAsync();
     console.log(act);
     if(act){
          await GoogleSignIn.signOutAsync();     
     }
        await AsyncStorage.removeItem(UserStorageKey);
        await AsyncStorage.removeItem(StorageKey);
 }
//Drive folder list getter function
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
     let resp = await fetch("https://www.googleapis.com/drive/v2/files?key=AIzaSyCeMuCoxIBa77l1eurlBVd_OraUL3x0HTk", requestOptions).catch(e=>{console.log('Get list error'+e);});
     let json = await resp.json();
     let folderList = [];
     if(json){
          for(let d in json.items){
               if(json.items[d].mimeType=='application/vnd.google-apps.folder' && json.items[d].labels.trashed == false && json.items[d].shared == false){
                    folderList.push(json.items[d]);
               }
          }
     }
     return folderList;
}
//Drive folder creation function
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
          var details = {
               'client_id': '578312168895-9uu9tq9k9g7m3a10r3on0tf40q1d17ij.apps.googleusercontent.com',
               'access_type': 'offline',
               'grant_type': 'refresh_token',
               'refresh_token':br
          };
          var formBody = [];
          for (var property in details) {
          var encodedKey = encodeURIComponent(property);
          var encodedValue = encodeURIComponent(details[property]);
          formBody.push(encodedKey + "=" + encodedValue);
          }
          formBody = formBody.join("&");
          let requestAccOptions = {
          method: 'POST',
          headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
          body: formBody,
          redirect: 'follow'};
          let resp = await fetch("https://oauth2.googleapis.com/token",requestAccOptions).catch(error => console.log('error', error));
          let json = await resp.json();
          console.log('Refresh token res '+json);
     if(json){
          if(json.access_token){
               await cacheAuthAsync(json.access_token);
               console.log('\n\nAuth token refreshed '+json.access_token);
          }
          else{
               alert('Access token did not refresh');
          }
     }
     else{
          alert('Access token did not refresh');
     }
     
}

//Upload image to drive with base64 data and parent folder id
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
     const [ratioBool,setratioBool] = useState(false);
     const [userData,setUserData] = useState(null);
     const [folderList ,setFolderList] = useState(null);
     const [selecFolderData,setselecFolderData]= useState(null);
     const [foldername,setfoldername] = useState(null);
     const [isLoggedIn,setisLoggedIn] = useState(false);
     const fadeAnim = useRef(new Animated.Value(0)).current;
     
     const fadeIn = () => {
          console.log('anim init');     
          Animated.timing(fadeAnim, {toValue: 1,duration: 400,useNativeDriver:false}).start(({ finished }) => {
               Animated.timing(fadeAnim, {toValue: 0,duration: 400,useNativeDriver:false}).start(({ finished }) => {
               
               });
             });
     
     };      
      
     useEffect(()=>{
          const checkIfLoged = async () =>{
               let fl = await getCachedLoginTypeAsync();
               switch(fl){
                    case 'GOOGLE_LOGIN_TYPE':{
                         await setisLoggedIn(true);
                         let br = await getCachedAuthAsync();
                         if(br){
                              let usrData  = await getCachedUserAsync()
                              console.log('\n\n\n\nUSERDATA');
                              console.log(usrData);
                              setUserData(usrData);
                              console.log('\nlogged in');
                              try{
                                   let fol = await getList();
                                   if(fol){
                                        console.log("Folder length"+fol.length);
                                        setFolderList(fol);
                                   }
                              }catch(e){
                                   console.error("Error Occr geting list"+e);
                                   alert('Error occurred while getting data'+e.message)
                              }
          
                         }
                         else{alert('Missing access key');}
                         break;
                    }
                    case 'GUEST_LOGIN_TYPE':{
                         await setisLoggedIn(false);
                         alert('Logged In as Guest');
                         break;
                    }
                    case 'APPLE_LOGIN_TYPE':{
                         await setisLoggedIn(true);
                         break;
                    }
                    default:{
                         alert('Unknown Login method');
                         break;
                    }
               }
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
                                   // height:ratioBool?asp4Height:windowWidth,
                                   height:asp4Height,
                                   marginTop:52,
                                   backgroundColor:'red',
                                   overflow:'hidden',
                                 
                              }}>
                                   <Animated.View
                                   pointerEvents="none"
                                   style={{
                                   position:'absolute',
                                   zIndex:110,
                                   top:0,
                                   bottom:0,
                                   left:0,
                                   right:0,
                                   display:'flex',
                                   justifyContent:'center',
                                   alignItems:'center',
                                   backgroundColor:`rgba(255,255,255,1)`,
                                   opacity:fadeAnim,
                                   
                              }}>
                              </Animated.View>
                              <Camera
                              flashMode={flashBool?'on':'off'}
                              autoFocus="on"
                              ratio={'4:3'}
                               ref={camera}
                               style={{
                                   width:'100%',
                                   height:'100%',
                                   zIndex:100,
                                   top:!ratioBool?-((asp4Height-windowWidth)/2):0,
                                   
                               }}
                                type={type} />       
                                               
                              </View>
                              <View style={
                              {
                                   flex:1,
                                   height:'100%',
                                   backgroundColor:'#2F436E',
                                   paddingBottom:12,
                                   marginTop:!ratioBool?-((asp4Height-windowWidth)):0,
                              }}>
                                   <View style={{
                                          width:'100%',
                                          height:42,
                                          marginTop:7,
                                          display:isLoggedIn?'flex':'none',
                                          justifyContent:'center',
                                          alignItems:'center',
                                   }}>
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
                                                  let r = await camera.current.getSupportedRatiosAsync();
                                                  console.log(r);
                                                  if (camera.current) {
                                                       fadeIn();
                                                            try{
                                                                 let {uri, width, height, exif, base64 } = await camera.current.takePictureAsync({skipProcessing:true,quality:imageCompressionFlag?0.2:0.8,base64:true});
                                                                 if(uri&&base64){
                                                                      if(selecFolderData){
                                                                           uploadImage(base64,selecFolderData).then((r)=>{
                                                                                if(r){
                                                                                     console.log(r.id);
                                                                                     if(Platform.OS=='ios'){
                                                                                          alert('Image uploaded to drive'); 
                                                                                     }
                                                                                     else{
                                                                                          ToastAndroid.showWithGravityAndOffset(
                                                                                               "Image uploaded to drive",
                                                                                               ToastAndroid.SHORT,
                                                                                               ToastAndroid.BOTTOM,
                                                                                               0,50
                                                                                             );
                                                                                     }
                                                                                     
                                                                                     
                                                                                }
                                                                           });
     
                                                                      }else{
                                                                           if(Platform.OS=='ios'){
                                                                                alert('Select a folder');
                                                                           }
                                                                           else{
                                                                                ToastAndroid.showWithGravityAndOffset(
                                                                                     "Select a folder",
                                                                                     ToastAndroid.SHORT,
                                                                                     ToastAndroid.BOTTOM,
                                                                                     0,50
                                                                                   );
                                                                           }
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
                                                  <Image  style={styles.lanndBottomClickButtIco} source={!userData?require('../../assets/PikkLeaf.png'):{uri:userData.picture}}/>
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
                                   {/*FOLDER LIST  */}
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
                                                  <View style={{position:'absolute',left:0,}}>
                                                  <CheckBox disabled={true} checkedIcon='dot-circle-o' uncheckedIcon='circle-o' checked={selecFolderData?selecFolderData.id==e.id?true:false:false} />
                                                  </View>
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
                                        <TouchableOpacity 
                                        style={{
                                             overflow:'visible'
                                        }}
                                        onPress={()=>{
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
        const [imageCompression,setimageCompression] = useState(false);
        const [userData,setUserData] = useState(null);
        const [isLoggedIn,setisLoggedIn] = useState(false);
        imageCompressionFlag = imageCompression;
        
        const _handleLinkPress = async (url) => {
          let result = await WebBrowser.openBrowserAsync(url);
        };

        const logoutInit = ()=>{
          logout().then(async ()=>{
               navigation.reset({
                    index: 0,
                    routes: [{ name: 'login' }],
                  });;  
            });
        }        
        useEffect(() => {
          (async () => {
            const { status } = await Camera.requestPermissionsAsync();
            setHasPermission(status === 'granted');
          })();
          const checkIfLoged = async () =>{
               let fl = await getCachedLoginTypeAsync();
               switch(fl){
                    case 'GOOGLE_LOGIN_TYPE':{
                         setisLoggedIn(true);
                         break;
                    }
                    case 'GUEST_LOGIN_TYPE':{
                         setisLoggedIn(false);
                         break;
                    }
                    case 'APPLE_LOGIN_TYPE':{
                         setisLoggedIn(true);
                         break;
                    }
                    default:{
                         break;
                    }
               }
               let br = await getCachedAuthAsync();
               if(br){
                    await getRefreshToken();
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
          logoutInit();
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
                         <View style={{
                              //  height:windowHeight-52,
                              minHeight:windowHeight-72,
                              maxHeight:windowHeight,
                              overflow:'visible',
                              height:'100%',          
                              flexDirection:'column'
                              }}>
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
                                                              logoutInit();
                                                         } }
                                                       ]
                                                     );
                                              }}
                                             >
                                                  <Text  style={{color:'#fff',fontFamily:'Quicksand_500Medium',fontSize:17}}>
                                                       {!userData?'Not Connected':`${userData.given_name}'s Drive`}
                                                  </Text>
                                             </TouchableOpacity>
                                   </View>
                                   <View style={styles.landDrawerBottomBody}>
                                             <View  style={styles.landDrawerBottomCompBody}>
                                                  <Text style={styles.landDrawerBottomCompBodyLab} >Image Compression</Text>
                                                  <Switch
                                                       trackColor={{ false: "#767577", true: "#f4f3f4" }}
                                                       thumbColor={imageCompression ? "#11E4D1" : "#f4f3f4"}
                                                       ios_backgroundColor="#3e3e3e" 
                                                       onValueChange={()=>{
                                                            setimageCompression(!imageCompression);
                                                            imageCompressionFlag = imageCompression;
                                                       }}
                                                       value={imageCompression}
                                                       style={{position:'absolute',right:0}}
                                                       />
                                             </View>
                                             <View  style={styles.landDrawerBottomSubBody}>
                                             <View style={styles.landDrawerBottomButtCont}>
                                                  <TouchableOpacity onPress={()=>{_handleLinkPress('https://www.linkedin.com/company/pikk')}} >
                                                  <Image style={styles.landDrawerBottomIco} source={require('../../assets/lnkin.png')}/>
                                                  </TouchableOpacity>
                                             </View>
                                             <View style={styles.landDrawerBottomButtCont}>
                                                  <TouchableOpacity onPress={()=>{_handleLinkPress('https://instagram.com/pikk.co.in?igshid=1acxjy6ajc4s0')}}>
                                                  <Image style={styles.landDrawerBottomIco} source={require('../../assets/insta.png')}/>
                                                  </TouchableOpacity>
                                             </View>
                                             <View style={styles.landDrawerBottomButtCont}>
                                                  <TouchableOpacity onPress={()=>{Linking.openURL('mailto:pikkcompany@gmail.com')}}>
                                                  <Image style={styles.landDrawerBottomIco} source={require('../../assets/mess.png')}/>
                                                  </TouchableOpacity>
                                             </View>
                                             </View>

                                             
                                   </View>
                         </View>
                    </DrawerContentScrollView>}
                    overlayColor="transparent"
                    initialRouteName="Home">
                    <Drawer.Screen name="Home" component={HomeScreen}/>
                    </Drawer.Navigator>
               </SafeAreaProvider>
          )
        }
}



export default LandAct;