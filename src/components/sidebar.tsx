import React, { useEffect, useRef, useState } from 'react';
import {
  View, TouchableOpacity, Text, Dimensions,
  StyleSheet, Animated, Image,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';


interface SidebarProps {
  onClose: () => void;
}

const NAV_ITEMS = [
  { label: 'Home',         icon: 'home-outline',               href: '/home' },
  { label: 'Budget',       icon: 'wallet-outline',              href: '/Budget' },
  { label: 'Categories',   icon: 'grid-outline',                href: '/categories' },
  { label: 'Transactions', icon: 'receipt-outline',             href: '/Transactions' },
  { label: 'Charts',       icon: 'bar-chart-outline',           href: '/Charts' },
  { label: 'Goals',        icon: 'flag-outline',                href: '/goal' },
  { label: 'Personal',     icon: 'person-outline',              href: '/personal' },
  { label: 'About',        icon: 'information-circle-outline',  href: '/About' },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Sidebar({ onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const screenHeight = Dimensions.get('window').height;
  const [userName, setUserName] = useState('');
  const [userOccupation, setUserOccupation] = useState('');

  const itemAnims = useRef(NAV_ITEMS.map(() => new Animated.Value(0))).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
  // Load current user
  (async () => {
    try {
      const currentUser = await AsyncStorage.getItem('currentUser');

      if (currentUser) {
        const user = JSON.parse(currentUser);

        setUserName(user.name || '');
        setUserOccupation(user.occupation || '');
      }
    } catch (e) {
      console.error('Error loading user for sidebar:', e);
    }
  })();

  Animated.stagger(45, [
    Animated.spring(headerAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
    }),
    ...itemAnims.map((anim) =>
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
      })
    ),
  ]).start();
}, []);

  const navigate = (href: string) => {
    onClose();
    setTimeout(() => router.push(href as any), 250);
  };

  const handleLogout = async () => {
    onClose();
    setTimeout(async () => {
      await AsyncStorage.removeItem('currentUser');
      router.push('/login');
    }, 250);
  };

  const occupationLabel = () => {
    if (!userOccupation) return '';
    if (userOccupation === 'fulltime') return 'Full-time';
    if (userOccupation === 'parttime') return 'Part-time';
    return userOccupation;
  };

  return (
    <View style={[styles.sidebar, { height: screenHeight }]}>
      {/* Background decoration */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      {/* Header */}
      <Animated.View style={[styles.header, {
        opacity: headerAnim,
        transform: [{ translateX: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
      }]}>
        {/* Logo image */}
        <View style={styles.logoBadge}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.headerImage}
            resizeMode="contain"
          />
        </View>

        {/* Username + occupation */}
        <View style={styles.headerText}>
          <Text style={styles.appName} numberOfLines={1}>
            {userName || 'Oshota'}
          </Text>
          {occupationLabel() ? (
            <Text style={styles.appTagline}>{occupationLabel()}</Text>
          ) : null}
        </View>

        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </Animated.View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Nav Items */}
      <View style={styles.navList}>
        {NAV_ITEMS.map((item, i) => {
          const isActive = pathname === item.href || pathname === item.href.replace('/', '');
          return (
            <Animated.View key={item.href} style={{
              opacity: itemAnims[i],
              transform: [{
                translateX: itemAnims[i].interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }),
              }],
            }}>
              <TouchableOpacity
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => navigate(item.href)}
                activeOpacity={0.75}
              >
                <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={isActive ? '#fff' : 'rgba(255,255,255,0.65)'}
                  />
                </View>
                <Text style={[styles.navText, isActive && styles.navTextActive]}>
                  {item.label}
                </Text>
                {isActive && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* Logout at bottom */}
      <View style={styles.footer}>
        <View style={styles.footerDivider} />
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
          <View style={styles.logoutIconWrap}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          </View>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: '120%',
    backgroundColor: '#052e16',
    paddingTop: 55,
    paddingHorizontal: 18,
    paddingBottom: 30,
    overflow: 'hidden',
  },

  decorCircle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(34,197,94,0.07)',
    top: -60,
    right: -70,
  },
  decorCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(34,197,94,0.05)',
    bottom: 80,
    left: -50,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  headerImage: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  appName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  appTagline: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
    marginTop: 1,
    letterSpacing: 0.4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 18,
  },

  // Nav
  navList: {
    flex: 1,
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderRadius: 12,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: 'rgba(34,197,94,0.15)',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconWrapActive: {
    backgroundColor: '#16a34a',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  navText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    flex: 1,
  },
  navTextActive: {
    color: '#fff',
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80',
  },

  // Footer / Logout
  footer: {
    paddingTop: 8,
  },
  footerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
  },
  logoutIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },
});