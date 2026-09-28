import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Footer() {
  return (
    <View style={styles.footer}>
      {/* Links Section */}
      <View style={styles.linksContainer}>
        {/* Home Link with Icon */}
        <Link href="/home" style={styles.link}>
          <Ionicons name="home-outline" size={24} color="darkgreen" />
        </Link>

        {/* About Link with Icon */}
        <Link href="/About" style={styles.link}>
          <Ionicons name="information-circle-outline" size={24} color="darkgreen" />
        </Link>

        {/* Logout Link with Icon */}
        <Link href="/login" style={styles.link}>
          <Ionicons name="log-out-outline" size={24} color="darkgreen" />
        </Link>
      </View>

     
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  linksContainer: {
    flexDirection: 'row',
    
    marginTop: 5,
  },
  link: {
    marginHorizontal: 45,
  },
  footerText: {
    color: 'black',
    fontSize: 12,
  },
});
