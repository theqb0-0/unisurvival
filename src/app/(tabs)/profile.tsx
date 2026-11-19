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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Snackbar } from '../../components/snackbar';
import { DEV_MOCK } from '../../lib/dev';
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
  const [toast, setToast] = useState<string | null>(null);
  const [planTier] = useState<'Free' | 'Pro'>('Free');

  const loadProfile = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (!DEV_MOCK) {
        setLoading(false);
        router.replace('/onboarding/splash');
        return;
      }
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
      setToast('Both fields need a value.');
      return;
    }
    const paydayNum = parseInt(editPayday);
    if (paydayNum < 1 || paydayNum > 31) {
      setToast('Payday needs to be a day between 1 and 31.');
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (DEV_MOCK) {
        setProfile((prev: any) => ({
          ...prev,
          allowance: parseFloat(editAllowance),
          payday: paydayNum,
        }));
      }
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
      setToast(error.message);
      return;
    }

    setEditModalVisible(false);
    setToast('Budget updated.');
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
      icon: 'wallet-outline' as const,
      label: 'Monthly allowance',
      value: profile ? `R${profile.allowance}` : '',
    },
    {
      icon: 'calendar-outline' as const,
      label: 'Payday',
      value: profile ? `${profile.payday}${ordinal(profile.payday)} of month` : '',
    },
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
          <View style={[styles.planBadge, planTier === 'Pro' && styles.planBadgePro]}>
            <Text style={[styles.planBadgeText, planTier === 'Pro' && styles.planBadgeTextPro]}>
              {planTier}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.proCard}
          onPress={() => setToast('Pro unlocks deeper insights and partner deals. Coming soon.')}
        >
          <Text style={styles.proTitle}>Upgrade to Pro</Text>
          <Text style={styles.proSub}>
            Smarter budgets, partner top-ups, and priority tools when you need them.
          </Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget</Text>
          <View style={styles.sectionCard}>
            {settings.map((s, i) => (
              <TouchableOpacity
                key={i}
                onPress={openEditModal}
                style={[
                  styles.settingRow,
                  i === settings.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Ionicons name={s.icon} size={18} color={colors.green} />
                <Text style={styles.settingLabel}>{s.label}</Text>
                <Text style={styles.settingValue}>{s.value}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.muted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.sectionCard}>
            <View style={styles.settingRow}>
              <Ionicons name="notifications-outline" size={18} color={colors.green} />
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.soon}>Soon</Text>
            </View>
            <View style={styles.settingRow}>
              <Ionicons name="pricetag-outline" size={18} color={colors.green} />
              <Text style={styles.settingLabel}>Categories</Text>
              <Text style={styles.soon}>Soon</Text>
            </View>
            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <Ionicons name="moon-outline" size={18} color={colors.green} />
              <Text style={styles.settingLabel}>
                Dark mode
              </Text>
              <Switch
                value={mode === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.softGreen }}
                thumbColor={mode === 'dark' ? colors.green : colors.card}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.signOut} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color={colors.grey} />
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
              {saving
                ? <ActivityIndicator color={colors.onAccent} />
                : <Text style={styles.modalCtaText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Snackbar message={toast} onDismiss={() => setToast(null)} />
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    headerTitle: {
      fontSize: 22,
      fontFamily: 'Roboto_700Bold',
      color: colors.textDark,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 16,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.deep,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 20,
      fontFamily: 'Roboto_700Bold',
      color: colors.onDeep,
    },
    userName: {
      fontSize: 16,
      fontFamily: 'Roboto_700Bold',
      color: colors.textDark,
    },
    userPhone: {
      fontSize: 12,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
      marginTop: 4,
    },
    planRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    planLabel: {
      fontSize: 13,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
    },
    planBadge: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 4,
    },
    planBadgePro: {
      backgroundColor: colors.deep,
      borderColor: colors.green,
    },
    planBadgeText: {
      fontSize: 12,
      fontFamily: 'Roboto_500Medium',
      color: colors.green,
    },
    planBadgeTextPro: {
      color: colors.onDeep,
    },
    proCard: {
      marginHorizontal: 16,
      marginBottom: 24,
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    proTitle: {
      fontSize: 15,
      fontFamily: 'Roboto_700Bold',
      color: colors.textDark,
      marginBottom: 8,
    },
    proSub: {
      fontSize: 13,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
      lineHeight: 20,
    },
    section: { paddingHorizontal: 16, marginBottom: 24 },
    sectionTitle: {
      fontSize: 15,
      fontFamily: 'Roboto_700Bold',
      color: colors.textDark,
      marginBottom: 16,
    },
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    settingLabel: {
      flex: 1,
      fontSize: 13,
      fontFamily: 'Roboto_400Regular',
      color: colors.textDark,
    },
    settingValue: {
      fontSize: 13,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
    },
    soon: {
      fontSize: 12,
      fontFamily: 'Roboto_400Regular',
      color: colors.muted,
    },
    signOut: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 24,
      marginBottom: 16,
    },
    signOutText: {
      fontSize: 14,
      fontFamily: 'Roboto_500Medium',
      color: colors.grey,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontFamily: 'Roboto_700Bold',
      color: colors.textDark,
    },
    modalLabel: {
      fontSize: 11,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
      marginBottom: 8,
      marginTop: 16,
    },
    modalInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 10,
      gap: 8,
    },
    modalPrefix: {
      fontSize: 15,
      fontFamily: 'Roboto_500Medium',
      color: colors.green,
    },
    modalSuffix: {
      fontSize: 15,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
    },
    modalInput: {
      fontSize: 15,
      fontFamily: 'Roboto_400Regular',
      color: colors.textDark,
    },
    modalCta: {
      backgroundColor: colors.green,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 32,
    },
    modalCtaText: {
      fontSize: 15,
      fontFamily: 'Roboto_700Bold',
      color: colors.onAccent,
    },
  });
}
