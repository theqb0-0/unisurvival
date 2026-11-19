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
import { isNoAccountError, isValidEmail, mapAuthError } from '../../lib/auth-helpers';

export default function SigninScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [noAccount, setNoAccount] = useState(false);

  const handleContinue = async () => {
    setInlineError(null);
    setNoAccount(false);

    if (!email.trim()) {
      setInlineError('Enter the email you signed up with.');
      return;
    }
    if (!isValidEmail(email)) {
      setInlineError("That email doesn't look right. Check for typos.");
      return;
    }

    setLoading(true);
    const normalized = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: { shouldCreateUser: false },
    });
    setLoading(false);

    if (error) {
      if (isNoAccountError(error.message)) {
        setNoAccount(true);
        setInlineError(null);
        return;
      }
      setInlineError(mapAuthError(error.message));
      return;
    }

    router.push({
      pathname: '/onboarding/verify',
      params: { email: normalized, flow: 'signin' },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.body}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Enter your email. We will send a sign-in code.</Text>

        <Text style={styles.label}>Email address</Text>
        <Pressable
          onPress={() => inputRef.current?.focus()}
          style={[styles.inputRow, emailFocused && styles.inputRowFocused]}
        >
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="sipho@university.ac.za"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setInlineError(null);
              setNoAccount(false);
            }}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
          />
        </Pressable>

        {inlineError ? (
          <Text style={styles.inlineError}>{inlineError}</Text>
        ) : null}
        {noAccount ? (
          <Text style={styles.inlineError}>
            No account for that email.{' '}
            <Text
              style={styles.link}
              onPress={() => router.push('/onboarding/signup')}
            >
              Create one instead
            </Text>
          </Text>
        ) : null}

        <TouchableOpacity
          style={[styles.ctaBtn, loading && { opacity: 0.7 }]}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={colors.onAccent} />
            : <Text style={styles.ctaBtnText}>Send code</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.canvas },
    back: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
    backText: {
      fontSize: 14,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
    },
    body: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
    title: {
      fontSize: 28,
      fontFamily: 'Roboto_700Bold',
      color: colors.textDark,
      letterSpacing: -0.5,
      marginBottom: 8,
    },
    sub: {
      fontSize: 13,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
      marginBottom: 24,
      lineHeight: 20,
    },
    label: {
      fontSize: 11,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
      marginBottom: 8,
    },
    inputRow: {
      borderBottomWidth: 1.5,
      borderBottomColor: colors.inputLine,
      paddingVertical: 12,
    },
    inputRowFocused: {
      borderBottomColor: colors.green,
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
    link: {
      color: colors.green,
      fontFamily: 'Roboto_500Medium',
    },
    ctaBtn: {
      backgroundColor: colors.green,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 28,
    },
    ctaBtnText: {
      fontSize: 15,
      fontFamily: 'Roboto_700Bold',
      color: colors.onAccent,
    },
  });
}