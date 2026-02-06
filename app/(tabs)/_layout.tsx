import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF4D00', // Brand Orange
        tabBarInactiveTintColor: '#808080', // Medium Grey
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f1f1',
          height: Platform.OS === 'ios' ? 92 : 72,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={(focused ? "home-variant" : "home-variant-outline") as any}
              size={28}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="rentals"
        options={{
          title: 'Rental',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={(focused ? "sofa" : "sofa-outline") as any}
              size={26}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="businesses"
        options={{
          title: 'Businesses',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={(focused ? "office-building" : "office-building-outline") as any}
              size={26}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={(focused ? "message-text" : "message-text-outline") as any}
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* Keep listing and post routes available for navigation but hide them from the tab bar */}
      <Tabs.Screen
        name="listing/[id]"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}