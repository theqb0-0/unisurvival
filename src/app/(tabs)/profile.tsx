import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // DEV MODE: mock profile
      setProfile({
        name: 'Sipho Dlamini',
        phone: '+27 82 345 6789',
        allowance: 1500,
        payday: 1,
      });
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(data);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { loadProfile(); }, []));

  const handleSignOut = async () => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/onboarding/splash');
          },
        },
      ]
    );
  };

  const settings = [
    {
      icon: 'wallet-outline',
      label: 'Monthly allowance',
      value: profile ? `R${profile.allowance}` : '',
    },
    {
      icon: 'calendar-outline',
      label: 'Payday',
      value: profile ? `${profile.payday}${ordinal(profile.payday)} of month` : '',
    },
  ];

  const preferences = [
    { icon: 'notifications-outline', label: 'Notifications', chevron: true },
    { icon: 'pricetag-outline', label: 'Categories', chevron: true },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color="#16A34A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Ionicons name="settings-outline" size={22} color="#16A34A" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.name?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{profile?.name || 'Student'}</Text>
            <Text style={styles.userPhone}>
              {profile?.phone || 'No phone added'}
            </Text>
          </View>
        </View>

        <View style={styles.planRow}>
          <Text style={styles.planLabel}>Current plan</Text>
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>Free</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget</Text>
          {settings.map((s, i) => (
            <View
              key={i}
              style={[
                styles.settingRow,
                i === settings.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <Ionicons name={s.icon as any} size={18} color="#16A34A" />
              <Text style={styles.settingLabel}>{s.label}</Text>
              <Text style={styles.settingValue}>{s.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          {preferences.map((s, i) => (
            <View
              key={i}
              style={[
                styles.settingRow,
                i === preferences.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <Ionicons name={s.icon as any} size={18} color="#16A34A" />
              <Text style={styles.settingLabel}>{s.label}</Text>
              {s.chevron && (
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.signOut} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#E53E3E" />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 16, paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 22, fontFamily: 'Roboto_700Bold', color: '#333333',
  },
  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#041202',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20, fontFamily: 'Roboto_700Bold', color: '#DCFCE7',
  },
  userName: {
    fontSize: 16, fontFamily: 'Roboto_700Bold', color: '#333333',
  },
  userPhone: {
    fontSize: 12, fontFamily: 'Roboto_400Regular',
    color: '#6B7280', marginTop: 2,
  },
  planRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, marginBottom: 28,
  },
  planLabel: {
    fontSize: 13, fontFamily: 'Roboto_400Regular', color: '#6B7280',
  },
  planBadge: {
    backgroundColor: '#F0FDF4', borderWidth: 0.5,
    borderColor: '#DCFCE7', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 4,
  },
  planBadgeText: {
    fontSize: 12, fontFamily: 'Roboto_500Medium', color: '#15803D',
  },
  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionTitle: {
    fontSize: 15, fontFamily: 'Roboto_700Bold',
    color: '#333333', marginBottom: 14,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
  settingLabel: {
    flex: 1, fontSize: 13, fontFamily: 'Roboto_400Regular',
    color: '#333333',
  },
  settingValue: {
    fontSize: 13, fontFamily: 'Roboto_400Regular', color: '#6B7280',
  },
  signOut: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 20, marginBottom: 20,
  },
  signOutText: {
    fontSize: 14, fontFamily: 'Roboto_500Medium', color: '#E53E3E',
  },
});