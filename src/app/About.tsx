import React, { useState } from 'react';
import { StyleSheet, Text, View, ImageBackground, Dimensions, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router'; // Import useRouter for navigation
import Sidebar from '@/components/sidebar';
import HeaderWithSidebar from '@/components/HeaderWithSidebar';
import Footer from '@/components/footer';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons for social media icons

const backgroundImage = require('@/assets/images/budget.webp');

export default function About() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false); // State to manage sidebar visibility

  // Function to open the URL for social media
  const openLink = (url) => {
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  };

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

          <ScrollView style={styles.aboutContent}>
            <Text style={styles.header}>About Oshota</Text>
            <Text style={styles.paragraph}>
              This app is a comprehensive platform designed to help you manage your budget efficiently and
              effectively.
            </Text>
            <Text style={styles.paragraph}>
              The idea came up about just seeing a bunch of receipts and me being as lazy as i am, I never really had the chance 
              to track down my expenses and manage my finances reasonably.
            </Text>
            <Text style={styles.paragraph}>
              So, I decided to come up with an app to help with this task(s), and if I'm being completely honest, I had no idea what 
              this app was going to look like, so I just started. I'm proud of what it is currently.
            </Text>
            <Text style={styles.paragraph}>
              There are going to be ongoing updates to this, but for the time being, here is the MVP (Minimum Viable Product). For any special assistance, feel free to contact me: +265 993 743 790.
            </Text>

            {/* Social Media Links */}
            <View style={styles.socialMedia}>
              <Text style={styles.socialHeader}>OR</Text>
              <View style={styles.socialIcons}>
                <TouchableOpacity onPress={() => openLink('https://www.instagram.com/vaccine1208')}>
                  <Ionicons name="logo-instagram" size={40} color="#C13584" style={styles.icon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openLink('https://www.facebook.com/chiyembekezo.yasini')}>
                  <Ionicons name="logo-facebook" size={40} color="#1877F2" style={styles.icon} />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  aboutContent: {
    padding: 10,
    
    marginTop: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  paragraph: {
    fontSize: 18,
    color: '#555',
    marginBottom: 10,
    lineHeight: 24,
  },
  socialMedia: {
    marginTop: 10,
    alignItems: 'center',
    paddingBottom: 80,
  },
  socialHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  icon: {
    marginHorizontal: 15,
  },
});
