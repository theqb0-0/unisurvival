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

export default function SignupScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!name.trim()) {
      Alert.alert('Quick check', 'What should we call you?');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Quick check', 'We need your email to send a verification code.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
      },
    });

    setLoading(false);

    if (error) {
      Alert.alert('Something went wrong', error.message);
      return;
    }

    router.push({
      pathname: '/onboarding/verify',
      params: { email: email.trim().toLowerCase(), name },
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
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Sipho"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        <Text style={styles.label}>Email address</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="sipho@university.ac.za"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <TouchableOpacity
          style={[styles.ctaBtn, loading && { opacity: 0.7 }]}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={colors.onAccent} />
            : <Text style={styles.ctaBtnText}>Continue</Text>
          }
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
      flexDirection: 'row', alignItems: 'center',
      borderBottomWidth: 1.5, borderBottomColor: colors.softGreen,
      paddingBottom: 10, gap: 6,
    },
    input: {
      fontSize: 15, fontFamily: 'Roboto_400Regular', color: colors.textDark,
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
