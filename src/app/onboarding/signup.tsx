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
import { isValidEmail, mapAuthError } from '../../lib/auth-helpers';

export default function SignupScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const nameRef = useRef<ComponentRef<typeof TextInput>>(null);
  const emailRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleContinue = async () => {
    setInlineError(null);

    if (!name.trim()) {
      setInlineError('What should we call you?');
      return;
    }
    if (!email.trim()) {
      setInlineError('We need your email to send a verification code.');
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
      options: { shouldCreateUser: true },
    });
    setLoading(false);

    if (error) {
      setInlineError(mapAuthError(error.message));
      return;
    }

    router.push({
      pathname: '/onboarding/verify',
      params: { email: normalized, name: name.trim(), flow: 'signup' },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.greenHeader}>
        <Text style={styles.step}>Create account</Text>
        <Text style={styles.title}>Let's get you in.</Text>
        <Text style={styles.sub}>Free to start. No card needed.</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.label}>First name</Text>
        <Pressable
          onPress={() => nameRef.current?.focus()}
          style={[styles.inputRow, nameFocused && styles.inputRowFocused]}
        >
          <TextInput
            ref={nameRef}
            style={styles.input}
            placeholder="Sipho"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
          />
        </Pressable>

        <Text style={styles.label}>Email address</Text>
        <Pressable
          onPress={() => emailRef.current?.focus()}
          style={[styles.inputRow, emailFocused && styles.inputRowFocused]}
        >
          <TextInput
            ref={emailRef}
            style={styles.input}
            placeholder="sipho@university.ac.za"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
          />
        </Pressable>

        {inlineError ? (
          <Text style={styles.inlineError}>{inlineError}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.ctaBtn, loading && { opacity: 0.7 }]}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={colors.onAccent} />
            : <Text style={styles.ctaBtnText}>Continue</Text>}
        </TouchableOpacity>

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.orLine} />
        </View>

        <TouchableOpacity style={styles.googleBtn}>
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing, you agree to our Terms and Privacy Policy.
        </Text>
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
      paddingBottom: 28,
      gap: 6,
    },
    step: {
      fontSize: 11, fontFamily: 'Roboto_400Regular',
      color: colors.onAccentMuted, letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    title: {
      fontSize: 24, fontFamily: 'Roboto_700Bold',
      color: colors.onAccent, letterSpacing: -0.3,
    },
    sub: {
      fontSize: 13, fontFamily: 'Roboto_400Regular',
      color: colors.onAccentMuted,
    },
    body: { flex: 1, paddingHorizontal: 24, paddingTop: 28, gap: 6 },
    label: {
      fontSize: 11, fontFamily: 'Roboto_400Regular',
      color: colors.grey, marginBottom: 4, marginTop: 12,
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
    ctaBtn: {
      backgroundColor: colors.green, borderRadius: 14,
      paddingVertical: 16, alignItems: 'center', marginTop: 28,
    },
    ctaBtnText: {
      fontSize: 15, fontFamily: 'Roboto_700Bold', color: colors.onAccent,
    },
    orRow: {
      flexDirection: 'row', alignItems: 'center',
      gap: 12, marginTop: 20,
    },
    orLine: { flex: 1, height: 0.5, backgroundColor: colors.hairline },
    orText: {
      fontSize: 12, fontFamily: 'Roboto_400Regular', color: colors.muted,
    },
    googleBtn: {
      borderWidth: 0.5, borderColor: colors.border, borderRadius: 14,
      paddingVertical: 14, alignItems: 'center', marginTop: 8,
    },
    googleBtnText: {
      fontSize: 14, fontFamily: 'Roboto_500Medium', color: colors.textDark,
    },
    terms: {
      fontSize: 11, fontFamily: 'Roboto_400Regular',
      color: colors.muted, textAlign: 'center',
      marginTop: 20, lineHeight: 16,
    },
  });
}