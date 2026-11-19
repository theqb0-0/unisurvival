import { useRouter } from 'expo-router';
import { ComponentRef, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
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
import { mapAuthError } from '../../lib/auth-helpers';

export default function SetupScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const allowanceRef = useRef<ComponentRef<typeof TextInput>>(null);
  const paydayRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [allowance, setAllowance] = useState('');
  const [payday, setPayday] = useState('');
  const [allowanceFocused, setAllowanceFocused] = useState(false);
  const [paydayFocused, setPaydayFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleSetup = async () => {
    setInlineError(null);

    if (!allowance.trim()) {
      setInlineError('How much do you receive each month?');
      return;
    }
    if (!payday.trim()) {
      setInlineError('Which day of the month does it arrive?');
      return;
    }

    const allowanceNum = parseFloat(allowance);
    const paydayNum = parseInt(payday, 10);
    if (Number.isNaN(allowanceNum) || allowanceNum <= 0) {
      setInlineError('Enter a valid allowance amount.');
      return;
    }
    if (Number.isNaN(paydayNum) || paydayNum < 1 || paydayNum > 31) {
      setInlineError('Payday needs to be a day between 1 and 31.');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setInlineError('Session expired. Sign in again.');
      router.replace('/onboarding/signin');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        allowance: allowanceNum,
        payday: paydayNum,
      })
      .eq('id', user.id);

    if (error) {
      setLoading(false);
      setInlineError(mapAuthError(error.message));
      return;
    }

    const now = new Date();
    const { error: budgetError } = await supabase
      .from('budgets')
      .insert({
        user_id: user.id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        allowance: allowanceNum,
        spent: 0,
      });

    setLoading(false);

    if (budgetError) {
      setInlineError(mapAuthError(budgetError.message));
      return;
    }

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
        <Pressable
          onPress={() => allowanceRef.current?.focus()}
          style={[styles.inputRow, allowanceFocused && styles.inputRowFocused]}
        >
          <Text style={styles.prefix}>R</Text>
          <TextInput
            ref={allowanceRef}
            style={[styles.input, { flex: 1 }]}
            placeholder="1500"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            value={allowance}
            onChangeText={setAllowance}
            onFocus={() => setAllowanceFocused(true)}
            onBlur={() => setAllowanceFocused(false)}
          />
        </Pressable>

        <Text style={styles.label}>Arrives on the</Text>
        <Pressable
          onPress={() => paydayRef.current?.focus()}
          style={[styles.inputRow, paydayFocused && styles.inputRowFocused]}
        >
          <TextInput
            ref={paydayRef}
            style={styles.input}
            placeholder="1"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            maxLength={2}
            value={payday}
            onChangeText={setPayday}
            onFocus={() => setPaydayFocused(true)}
            onBlur={() => setPaydayFocused(false)}
          />
          <Text style={styles.suffix}>of each month</Text>
        </Pressable>

        {inlineError ? (
          <Text style={styles.inlineError}>{inlineError}</Text>
        ) : null}

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
            : <Text style={styles.ctaBtnText}>Let's go</Text>}
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
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1.5,
      borderBottomColor: colors.inputLine,
      paddingVertical: 12,
      gap: 8,
    },
    inputRowFocused: {
      borderBottomColor: colors.green,
    },
    prefix: {
      fontSize: 15, fontFamily: 'Roboto_500Medium', color: colors.green,
    },
    suffix: {
      fontSize: 15, fontFamily: 'Roboto_400Regular', color: colors.grey,
    },
    input: {
      fontSize: 15,
      fontFamily: 'Roboto_400Regular',
      color: colors.textDark,
      padding: 0,
    },
    inlineError: {
      marginTop: 12,
      fontSize: 13,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
      lineHeight: 18,
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