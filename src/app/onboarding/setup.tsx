import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function SetupScreen() {
  const router = useRouter();
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
            placeholderTextColor="#9CA3AF"
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
            placeholderTextColor="#9CA3AF"
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
            ? <ActivityIndicator color="#DCFCE7" />
            : <Text style={styles.ctaBtnText}>Let's go</Text>
          }
        </TouchableOpacity>
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
    paddingBottom: 32,
    gap: 6,
  },
  step: {
    fontSize: 11, fontFamily: 'Roboto_400Regular',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  title: {
    fontSize: 24, fontFamily: 'Roboto_700Bold',
    color: '#FFFFFF', letterSpacing: -0.3,
  },
  sub: {
    fontSize: 13, fontFamily: 'Roboto_400Regular',
    color: 'rgba(255,255,255,0.7)',
  },
  body: {
    flex: 1, paddingHorizontal: 24,
    paddingTop: 28, gap: 6,
  },
  label: {
    fontSize: 11, fontFamily: 'Roboto_400Regular',
    color: '#6B7280', marginBottom: 4, marginTop: 16,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1.5, borderBottomColor: '#DCFCE7',
    paddingBottom: 10, gap: 8,
  },
  prefix: {
    fontSize: 15, fontFamily: 'Roboto_500Medium', color: '#16A34A',
  },
  suffix: {
    fontSize: 15, fontFamily: 'Roboto_400Regular', color: '#6B7280',
  },
  input: {
    fontSize: 15, fontFamily: 'Roboto_400Regular', color: '#333333',
  },
  hint: {
    fontSize: 11, fontFamily: 'Roboto_400Regular',
    color: '#9CA3AF', marginTop: 12,
  },
  ctaBtn: {
    backgroundColor: '#041202', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 36,
  },
  ctaBtnText: {
    fontSize: 15, fontFamily: 'Roboto_700Bold', color: '#DCFCE7',
  },
});