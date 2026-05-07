import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { theme } from '../src/theme';
import { FilesIcon, FindIcon, EditIcon, RunIcon, GitIcon } from '../src/components/TabIcons';

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.fgMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => <View style={styles.tabBarBg} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Files',
          tabBarIcon: ({ color }) => <FilesIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="find"
        options={{
          title: 'Find',
          tabBarIcon: ({ color }) => <FindIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="edit"
        options={{
          title: 'Edit',
          tabBarIcon: ({ color }) => <EditIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="run"
        options={{
          title: 'Run',
          tabBarIcon: ({ color }) => <RunIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="git"
        options={{
          title: 'Git',
          tabBarIcon: ({ color }) => <GitIcon color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0,
    elevation: 0,
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  tabBarBg: {
    flex: 1,
    backgroundColor: 'rgba(13,15,22,0.92)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.10)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
});
