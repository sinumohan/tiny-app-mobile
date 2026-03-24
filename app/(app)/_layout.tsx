import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../src/lib/colors';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    dossiers: '\uD83D\uDCD3',
    new: '\uFF0B',
    profile: '\u25C9',
  };
  return (
    <View style={styles.iconWrapper}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>
        {icons[name] ?? '\u25CB'}
      </Text>
    </View>
  );
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.electric,
        tabBarInactiveTintColor: colors.placeholder,
        tabBarLabelStyle: {
          fontFamily: 'System',
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dossiers',
          tabBarIcon: ({ focused }) => <TabIcon name="dossiers" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="new"
        options={{
          title: 'New Idea',
          tabBarIcon: ({ focused }) => <TabIcon name="new" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="dossier/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="phase1/[dossierId]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="phase2/[dossierId]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
    color: colors.placeholder,
  },
  iconFocused: {
    color: colors.electric,
  },
});
