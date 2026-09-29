import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { mode, toggleTheme, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editAllowance, setEditAllowance] = useState('');
  const [editPayday, setEditPayday] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
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

  const openEditModal = () => {
    setEditAllowance(profile?.allowance?.toString() || '');
    setEditPayday(profile?.payday?.toString() || '');
    setEditModalVisible(true);
  };

  const handleSaveBudget = async () => {
    if (!editAllowance.trim() || !editPayday.trim()) {
      Alert.alert('Quick check', 'Both fields need a value.');
      return;
    }
    const paydayNum = parseInt(editPayday);
    if (paydayNum < 1 || paydayNum > 31) {
      Alert.alert('Quick check', 'Payday needs to be a day between 1 and 31.');
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setEditModalVisible(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ allowance: parseFloat(editAllowance), payday: paydayNum })
      .eq('id', user.id);

    setSaving(false);

    if (error) {
      Alert.alert('Something went wrong', error.message);
      return;
    }

    setEditModalVisible(false);
    loadProfile();
  };

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
    { icon: 'moon-outline', label: 'Dark mode', toggle: true },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.green} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Ionicons name="settings-outline" size={22} color={colors.green} />
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
            <TouchableOpacity
              key={i}
              onPress={openEditModal}
              style={[
                styles.settingRow,
                i === settings.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <Ionicons name={s.icon as any} size={18} color={colors.green} />
              <Text style={styles.settingLabel}>{s.label}</Text>
              <Text style={styles.settingValue}>{s.value}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.muted} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
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
              <Ionicons name={s.icon as any} size={18} color={colors.green} />
              <Text style={styles.settingLabel}>{s.label}</Text>
              {s.toggle ? (
                <Switch
                  value={mode === 'dark'}
                  onValueChange={toggleTheme}
                  trackColor={{ false: colors.border, true: colors.softGreen }}
                  thumbColor={colors.card}
                />
              ) : s.chevron ? (
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              ) : null}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.signOut} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

      </ScrollView>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit budget</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.grey} />
              </TouchableOpacity>
            </View>
  
            <Text style={styles.modalLabel}>Monthly allowance</Text>
            <View style={styles.modalInputRow}>
              <Text style={styles.modalPrefix}>R</Text>
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                placeholder="1500"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                value={editAllowance}
                onChangeText={setEditAllowance}
              />
            </View>
  
            <Text style={styles.modalLabel}>Arrives on the</Text>
            <View style={styles.modalInputRow}>
              <TextInput
                style={styles.modalInput}
                placeholder="1"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                maxLength={2}
                value={editPayday}
                onChangeText={setEditPayday}
              />
              <Text style={styles.modalSuffix}>of each month</Text>
            </View>
  
            <TouchableOpacity
              style={[styles.modalCta, saving && { opacity: 0.7 }]}
              onPress={handleSaveBudget}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color={colors.onAccent} /> : <Text style={styles.modalCtaText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>    

    </SafeAreaView>
    
  );
}

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.canvas },
    header: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', paddingHorizontal: 20,
      paddingTop: 16, paddingBottom: 4,
    },
    headerTitle: {
      fontSize: 22, fontFamily: 'Roboto_700Bold', color: colors.textDark,
    },
    userRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20,
    },
    avatar: {
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: colors.deep,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarText: {
      fontSize: 20, fontFamily: 'Roboto_700Bold', color: colors.onDeep,
    },
    userName: {
      fontSize: 16, fontFamily: 'Roboto_700Bold', color: colors.textDark,
    },
    userPhone: {
      fontSize: 12, fontFamily: 'Roboto_400Regular',
      color: colors.grey, marginTop: 2,
    },
    planRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', paddingHorizontal: 20, marginBottom: 28,
    },
    planLabel: {
      fontSize: 13, fontFamily: 'Roboto_400Regular', color: colors.grey,
    },
    planBadge: {
      backgroundColor: colors.tint, borderWidth: 0.5,
      borderColor: colors.softGreen, borderRadius: 20,
      paddingHorizontal: 14, paddingVertical: 4,
    },
    planBadgeText: {
      fontSize: 12, fontFamily: 'Roboto_500Medium', color: colors.green,
    },
    section: { paddingHorizontal: 20, marginBottom: 28 },
    sectionTitle: {
      fontSize: 15, fontFamily: 'Roboto_700Bold',
      color: colors.textDark, marginBottom: 14,
    },
    settingRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 14, borderBottomWidth: 0.5,
      borderBottomColor: colors.hairline,
    },
    settingLabel: {
      flex: 1, fontSize: 13, fontFamily: 'Roboto_400Regular',
      color: colors.textDark,
    },
    settingValue: {
      fontSize: 13, fontFamily: 'Roboto_400Regular', color: colors.grey,
    },
    signOut: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', gap: 8,
      paddingVertical: 20, marginBottom: 20,
    },
    signOutText: {
      fontSize: 14, fontFamily: 'Roboto_500Medium', color: colors.danger,
    },

    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontFamily: 'Roboto_700Bold', color: colors.textDark },
    modalLabel: { fontSize: 11, fontFamily: 'Roboto_400Regular', color: colors.grey, marginBottom: 4, marginTop: 12 },
    modalInputRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1.5, borderBottomColor: colors.softGreen, paddingBottom: 10, gap: 6 },
    modalPrefix: { fontSize: 15, fontFamily: 'Roboto_500Medium', color: colors.green },
    modalSuffix: { fontSize: 15, fontFamily: 'Roboto_400Regular', color: colors.grey },
    modalInput: { fontSize: 15, fontFamily: 'Roboto_400Regular', color: colors.textDark },
    modalCta: { backgroundColor: colors.deep, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
    modalCtaText: { fontSize: 15, fontFamily: 'Roboto_700Bold', color: colors.onDeep },
    
  });
}
