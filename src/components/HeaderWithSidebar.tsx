import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';

interface HeaderWithSidebarProps {
  onToggleSidebar: () => void;
}

const errorchain = () => {
      alert('Only Yassin can access this page!');
    }

export default function HeaderWithSidebar({ onToggleSidebar }: HeaderWithSidebarProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onToggleSidebar}>
        <Ionicons name="menu" size={24} color="darkgreen" />
      </TouchableOpacity>

      <Image
        source={require('@/assets/images/icon.png')}
        style={styles.headerImage}
      />

      <TouchableOpacity>
        <Link href="/personal">
        <Ionicons name="person-circle-outline" size={24} color="darkgreen" />
        </Link>
        
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    backgroundColor: 'white',
    height: 60,
  },
  headerImage: {
    width: 150,
    padding: 5,
    height: 60,
    resizeMode: 'contain',
  },
});
