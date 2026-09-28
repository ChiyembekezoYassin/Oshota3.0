import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function Welcome() {
  const router = useRouter();
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Rotate the logo slightly back and forth
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(rotation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: -1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    // Redirect to Home after 2 seconds
    const timer = setTimeout(() => {
      router.replace('/home');
    }, 2000);

    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, [router, rotation]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-10deg', '10deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('@/assets/images/icon_load2.png')}
        style={[
          styles.logo,
          { transform: [{ rotate: rotateInterpolate }] },
        ]}
        resizeMode="contain"
      />

      <Text style={styles.text}>Welcome back Oshota!</Text>

      <ActivityIndicator
        size="large"
        color="#006400"
        style={styles.loader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 100, 0, 0.1)',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#006400',
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
});