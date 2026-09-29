import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { ThemeColors } from '../../theme/colors';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(iconName: IconName, colors: ThemeColors) {
  return ({ focused }: { focused: boolean }) => (
    <View
      style={{
        backgroundColor: focused ? colors.softGreen : 'transparent',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 4,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={iconName} size={22} color={focused ? colors.navActive : colors.navInactive} />
    </View>
  );
}

function tabLabel(text: string, colors: ThemeColors) {
  return ({ focused }: { focused: boolean }) => (
    <Text
      style={{
        fontSize: 13,
        fontFamily: focused ? 'Roboto_700Bold' : 'Roboto_400Regular',
        color: focused ? colors.navActive : colors.navInactive,
      }}
    >
      {text}
    </Text>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarIconStyle: { width: 60, height: 36 },
        tabBarButton: (props) => (
          <Pressable {...props} android_ripple={{ color: 'transparent' }} />
        ),
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0.5,
          borderTopColor: colors.hairline,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home', colors), tabBarLabel: tabLabel('Home', colors) }} />
      <Tabs.Screen name="log" options={{ title: 'Log', tabBarIcon: tabIcon('add-circle', colors), tabBarLabel: tabLabel('Log', colors) }} />
      <Tabs.Screen name="debts" options={{ title: 'Debts', tabBarIcon: tabIcon('people', colors), tabBarLabel: tabLabel('Debts', colors) }} />
      <Tabs.Screen name="grocery" options={{ title: 'Grocery', tabBarIcon: tabIcon('cart', colors), tabBarLabel: tabLabel('Grocery', colors) }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('person', colors), tabBarLabel: tabLabel('Profile', colors) }} />
    </Tabs>
  );
}