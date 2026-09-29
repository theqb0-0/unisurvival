import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

export default function SetupScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [allowance, setAllowance] = useState('');
  const [payday, setPayday] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    if (!allowance.trim()) {
      Alert.alert('Quick check', 'How much do you receive each month?');
      return;
    }
    if (!payday.trim()) {
      Alert.alert('Quick check', 'Which day of the month does it arrive?');
      return;
    }

    const paydayNum = parseInt(payday);
    if (paydayNum < 1 || paydayNum > 31) {
      Alert.alert('Quick check', 'Enter a valid day between 1 and 31.');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      Alert.alert('Session expired', 'Please sign in again.');
      router.replace('/onboarding/signup');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        allowance: parseFloat(allowance),
        payday: paydayNum,
      })
      .eq('id', user.id);

    if (error) {
      setLoading(false);
      Alert.alert('Something went wrong', error.message);
      return;
    }

    const now = new Date();
    await supabase
      .from('budgets')
      .insert({
        user_id: user.id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        allowance: parseFloat(allowance),
        spent: 0,
      });

    setLoading(false);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.greenHeader}>
        <Text style={styles.step}>Quick setup</Text>
        <Text style={styles.title}>Let's set you up.</Text>
        <Text style={styles.sub}>Two things. Takes 30 seconds.</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.label}>Monthly allowance</Text>
        <View style={styles.inputRow}>
          <Text style={styles.prefix}>R</Text>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="1500"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            value={allowance}
            onChangeText={setAllowance}
          />
        </View>

        <Text style={styles.label}>Arrives on the</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="1"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            maxLength={2}
            value={payday}
            onChangeText={setPayday}
          />
          <Text style={styles.suffix}>of each month</Text>
        </View>

        <Text style={styles.hint}>
          You can update these any time in your Profile.
        </Text>

        <TouchableOpacity
          style={[styles.ctaBtn, loading && { opacity: 0.7 }]}
          onPress={handleSetup}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={colors.onDeep} />
            : <Text style={styles.ctaBtnText}>Let's go</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.canvas },
    greenHeader: {
      backgroundColor: colors.green,
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 32,
      gap: 6,
    },
    step: {
      fontSize: 11, fontFamily: 'Roboto_400Regular',
      color: colors.onAccentMuted,
      letterSpacing: 0.8, textTransform: 'uppercase',
    },
    title: {
      fontSize: 24, fontFamily: 'Roboto_700Bold',
      color: colors.onAccent, letterSpacing: -0.3,
    },
    sub: {
      fontSize: 13, fontFamily: 'Roboto_400Regular',
      color: colors.onAccentMuted,
    },
    body: {
      flex: 1, paddingHorizontal: 24,
      paddingTop: 28, gap: 6,
    },
    label: {
      fontSize: 11, fontFamily: 'Roboto_400Regular',
      color: colors.grey, marginBottom: 4, marginTop: 16,
    },
    inputRow: {
      flexDirection: 'row', alignItems: 'center',
      borderBottomWidth: 1.5, borderBottomColor: colors.softGreen,
      paddingBottom: 10, gap: 8,
    },
    prefix: {
      fontSize: 15, fontFamily: 'Roboto_500Medium', color: colors.green,
    },
    suffix: {
      fontSize: 15, fontFamily: 'Roboto_400Regular', color: colors.grey,
    },
    input: {
      fontSize: 15, fontFamily: 'Roboto_400Regular', color: colors.textDark,
    },
    hint: {
      fontSize: 11, fontFamily: 'Roboto_400Regular',
      color: colors.muted, marginTop: 12,
    },
    ctaBtn: {
      backgroundColor: colors.deep, borderRadius: 14,
      paddingVertical: 16, alignItems: 'center', marginTop: 36,
    },
    ctaBtnText: {
      fontSize: 15, fontFamily: 'Roboto_700Bold', color: colors.onDeep,
    },
  });
}
