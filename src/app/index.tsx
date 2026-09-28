import { View, StyleSheet, ImageBackground, Text} from "react-native";
import Button from '@/components/Button'; 
import ImageViewer from '@/components/ImageViewer';
import * as SplashScreen from 'expo-splash-screen';
import Home from "./home";
import Login from "./login";
import * as Font from 'expo-font';
const PlaceholderImage = require("@/assets/images/icon.png");

const backgroundImage = require('@/assets/images/budget.webp');

export default function Index() {
  
  return (
    <ImageBackground source={backgroundImage} style={styles.backgroundImage}>
    <View style={styles.Index_container}>
      < Login/>
    
    </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  Index_container:{
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 100, 0, 0.7)',
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    
  },
});
