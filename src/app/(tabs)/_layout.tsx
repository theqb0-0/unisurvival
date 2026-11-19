import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(
  filled: IconName,
  outlined: IconName,
  colors: ThemeColors,
) {
  return ({ focused }: { focused: boolean }) => (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        paddingHorizontal: 16,
      }}
    >
      <Ionicons
        name={focused ? filled : outlined}
        size={22}
        color={focused ? colors.navActive : colors.navInactive}
      />
    </View>
  );
}

function tabLabel(text: string, colors: ThemeColors) {
  return ({ focused }: { focused: boolean }) => (
    <Text
      style={{
        fontSize: 12,
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
          backgroundColor: colors.canvas,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: tabIcon('home', 'home-outline', colors),
          tabBarLabel: tabLabel('Home', colors),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: tabIcon('add-circle', 'add-circle-outline', colors),
          tabBarLabel: tabLabel('Log', colors),
        }}
      />
      <Tabs.Screen
        name="debts"
        options={{
          title: 'Debts',
          tabBarIcon: tabIcon('people', 'people-outline', colors),
          tabBarLabel: tabLabel('Debts', colors),
        }}
      />
      <Tabs.Screen
        name="grocery"
        options={{
          title: 'Grocery',
          tabBarIcon: tabIcon('cart', 'cart-outline', colors),
          tabBarLabel: tabLabel('Grocery', colors),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: tabIcon('person', 'person-outline', colors),
          tabBarLabel: tabLabel('Profile', colors),
        }}
      />
    </Tabs>
  );
}
