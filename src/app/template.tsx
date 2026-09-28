import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ImageBackground, TextInput, Dimensions, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router'; // Import useRouter for navigation
import Sidebar from '@/components/sidebar';
import HeaderWithSidebar from '@/components/HeaderWithSidebar';
import Footer from '@/components/footer';
const backgroundImage = require('@/assets/images/budget.webp');

export default function Budget() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false); // State to manage sidebar visibility
  const router = useRouter(); // Initialize the router for navigation
  
  return (
    <ImageBackground source={backgroundImage} style={styles.backgroundImage}>
      <View style={styles.container}>
        {/* Sidebar */}
        {isSidebarVisible && (
          <View style={styles.sidebarOverlay}>
            <Sidebar onClose={() => setIsSidebarVisible(false)} />
          </View>
        )}

        {/* Main Content */}
        <View style={styles.mainContent}>
          <HeaderWithSidebar onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)} />
     
        </View>
        <StatusBar style="auto" />
      </View>
      <Footer />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  // Keep your existing styles
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 100, 0, 0.7)',
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '45%',
    height: Dimensions.get('window').height,
    backgroundColor: 'white',
    zIndex: 20,
  },
  mainContent: {
    flex: 1,
  },
});
