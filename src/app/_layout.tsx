import { Stack } from 'expo-router';
import HeaderWithSidebar from '../components/HeaderWithSidebar'; // Import the refactored header
import React from 'react';

export default function RootLayout() {
  // Define the onToggleSidebar function
  const handleToggleSidebar = () => {
    console.log('Sidebar toggled');
  };

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: 'white',
        },
        headerTintColor: 'darkgreen',
        headerTitleStyle: {
          fontWeight: 'bold',
          color: 'darkgreen',
        },
      }}
    >
      {/* Login Screen */}
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Login', 
          headerShown: false 
        }} 
      />
      
      {/* Index Screen - Hide Header */}
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'index', 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="home" 
        options={{ 
          title: 'home',
        }} 
      />
      
      {/* About Screen */}
      <Stack.Screen 
        name="About" 
        options={{ 
          title: 'About', 

        }} 
      />

      {/* About Screen */}
      <Stack.Screen 
        name="personal" 
        options={{ 
          title: 'personal', 

        }} 
      />
      {/* About Screen */}
      <Stack.Screen 
        name="goal" 
        options={{ 
          title: 'goal', 
        }} 
      />
      
      {/* Budget Screen */}
      <Stack.Screen 
        name="Budget" 
        options={{ 
          title: 'Budget', 
        }} 
      />
      {/* Budget Screen */}
      <Stack.Screen 
        name="Utilities" 
        options={{ 
          title: 'Utilities', 
        }}
      />
      <Stack.Screen 
        name="Categories" 
        options={{ 
          title: 'Categories', 
          headerTitle: () => (
            <HeaderWithSidebar onToggleSidebar={handleToggleSidebar} /> 
          ),
        }} 
      />
      <Stack.Screen 
        name="Charts" 
        options={{ 
          title: 'Charts', 
          
        }} 
      />
      <Stack.Screen 
        name="signup" 
        options={{ 
          title: 'signup',
        }} 
      />
      {/* Welcome Screen */}
      <Stack.Screen 
        name="welcome" 
        options={{ 
          title: 'welcome',
        }} 
      />
      
      <Stack.Screen 
        name="details" 
        options={{ 
          title: 'details', 
          
        }} 
      />
      <Stack.Screen 
        name="categories" 
        options={{ 
          title: 'categories', 
          
        }} 
      />
      
      <Stack.Screen 
        name="Transactions" 
        options={{ 
          title: 'Transactions', 
          
        }} 
      />
      {/* Not Found Screen */}
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
