import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function SignupScreen() {
  const router = useRouter();
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
            placeholderTextColor="#9CA3AF"
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
            placeholderTextColor="#9CA3AF"
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
            ? <ActivityIndicator color="#FFFFFF" />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  greenHeader: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
    gap: 6,
  },
  step: {
    fontSize: 11, fontFamily: 'Roboto_400Regular',
    color: 'rgba(255,255,255,0.6)', letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24, fontFamily: 'Roboto_700Bold',
    color: '#FFFFFF', letterSpacing: -0.3,
  },
  sub: {
    fontSize: 13, fontFamily: 'Roboto_400Regular',
    color: 'rgba(255,255,255,0.7)',
  },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 28, gap: 6 },
  label: {
    fontSize: 11, fontFamily: 'Roboto_400Regular',
    color: '#6B7280', marginBottom: 4, marginTop: 12,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1.5, borderBottomColor: '#DCFCE7',
    paddingBottom: 10, gap: 6,
  },
  input: {
    fontSize: 15, fontFamily: 'Roboto_400Regular', color: '#333333',
  },
  ctaBtn: {
    backgroundColor: '#16A34A', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 28,
  },
  ctaBtnText: {
    fontSize: 15, fontFamily: 'Roboto_700Bold', color: '#FFFFFF',
  },
  orRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginTop: 20,
  },
  orLine: { flex: 1, height: 0.5, backgroundColor: '#F3F4F6' },
  orText: {
    fontSize: 12, fontFamily: 'Roboto_400Regular', color: '#9CA3AF',
  },
  googleBtn: {
    borderWidth: 0.5, borderColor: '#E5E7EB', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  googleBtnText: {
    fontSize: 14, fontFamily: 'Roboto_500Medium', color: '#333333',
  },
  terms: {
    fontSize: 11, fontFamily: 'Roboto_400Regular',
    color: '#9CA3AF', textAlign: 'center',
    marginTop: 20, lineHeight: 16,
  },
});