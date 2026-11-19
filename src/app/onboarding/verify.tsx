import { OtpInput } from '../../components/otp-input';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { mapAuthError, profileNeedsSetup } from '../../lib/auth-helpers';

export default function VerifyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { email, name, flow } = useLocalSearchParams<{
    email: string;
    name?: string;
    flow?: string;
  }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const isSignup = flow === 'signup' || Boolean(name);

  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = useCallback(async (token: string) => {
    if (token.length < 6) {
      setInlineError('Enter the full 6-digit code.');
      return;
    }

    setLoading(true);
    setInlineError(null);

    const { data, error } = await supabase.auth.verifyOtp({
      email: email as string,
      token,
      type: 'email',
    });

    if (error) {
      setLoading(false);
      setInlineError('That code did not match. Try again.');
      return;
    }

    if (!data.user) {
      setLoading(false);
      setInlineError('Something went wrong. Try again in a moment.');
      return;
    }

    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (!existing && isSignup && name?.trim()) {
      const { error: insertError } = await supabase.from('profiles').insert({
        id: data.user.id,
        name: String(name).trim(),
        phone: '',
        allowance: 0,
        payday: 1,
      });
      if (insertError && !insertError.message.includes('duplicate')) {
        setLoading(false);
        setInlineError(mapAuthError(insertError.message));
        return;
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    setLoading(false);

    if (profileError) {
      setInlineError(mapAuthError(profileError.message));
      return;
    }

    router.replace(profileNeedsSetup(profile) ? '/onboarding/setup' : '/(tabs)');
  }, [email, isSignup, name, router]);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.body}>
        <Text style={styles.title}>Enter your code.</Text>
        <Text style={styles.sub}>
          Sent to {email}.{' '}
          <Text style={styles.edit} onPress={() => router.back()}>Edit</Text>
        </Text>

        <OtpInput
          value={code}
          onChange={(v) => {
            setCode(v);
            setInlineError(null);
          }}
          onComplete={handleVerify}
          disabled={loading}
        />

        {inlineError ? (
          <Text style={styles.inlineError}>{inlineError}</Text>
        ) : null}

        <TouchableOpacity
          onPress={async () => {
            if (!canResend) return;
            setInlineError(null);
            const { error: resendError } = await supabase.auth.signInWithOtp({
              email: email as string,
              options: { shouldCreateUser: isSignup },
            });
            if (resendError) {
              setInlineError(mapAuthError(resendError.message));
              return;
            }
            setTimer(60);
            setCanResend(false);
            setCode('');
          }}
        >
          <Text style={styles.resend}>
            {canResend
              ? <Text style={styles.resendLink}>Resend code</Text>
              : `Resend code in ${timer}s`}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.ctaBtn, loading && { opacity: 0.7 }]}
          onPress={() => handleVerify(code)}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={colors.onDeep} />
            : <Text style={styles.ctaBtnText}>Verify</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1, backgroundColor: colors.canvas, paddingHorizontal: 24,
    },
    back: { paddingTop: 16, paddingBottom: 8 },
    backText: {
      fontSize: 14, fontFamily: 'Roboto_400Regular', color: colors.grey,
    },
    body: { flex: 1, paddingTop: 40 },
    title: {
      fontSize: 28, fontFamily: 'Roboto_700Bold',
      color: colors.textDark, letterSpacing: -0.5, marginBottom: 8,
    },
    sub: {
      fontSize: 13, fontFamily: 'Roboto_400Regular',
      color: colors.grey, marginBottom: 24,
    },
    edit: { color: colors.green, fontFamily: 'Roboto_500Medium' },
    inlineError: {
      marginTop: 16,
      fontSize: 13,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
      textAlign: 'center',
      lineHeight: 18,
    },
    resend: {
      fontSize: 13, fontFamily: 'Roboto_400Regular',
      color: colors.grey, textAlign: 'center',
      marginTop: 24,
    },
    resendLink: { color: colors.green, fontFamily: 'Roboto_500Medium' },
    bottom: { paddingBottom: 32 },
    ctaBtn: {
      backgroundColor: colors.deep, borderRadius: 14,
      paddingVertical: 16, alignItems: 'center',
    },
    ctaBtnText: {
      fontSize: 15, fontFamily: 'Roboto_700Bold', color: colors.onDeep,
    },
  });
}