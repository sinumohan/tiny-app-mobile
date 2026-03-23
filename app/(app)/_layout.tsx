import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../src/lib/colors';
import { typography } from '../../src/lib/typography';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    dossiers: '📓',
    new: '＋',
    profile: '◉',
  };
  return (
    <View style={styles.iconWrapper}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>
        {icons[name] ?? '○'}
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
          backgroundColor: colors.paper,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
        },
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarLabelStyle: {
          fontFamily: 'Kalam_400Regular',
          fontSize: 11,
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
    color: colors.inkMuted,
  },
  iconFocused: {
    color: colors.teal,
  },
});
