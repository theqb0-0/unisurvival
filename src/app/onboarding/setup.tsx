import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SetupScreen() {
  const router = useRouter();
  const [allowance, setAllowance] = useState('');
  const [payday, setPayday] = useState('');

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
            placeholder="1st of each month"
            placeholderTextColor="#9CA3AF"
            value={payday}
            onChangeText={setPayday}
          />
        </View>

        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.ctaBtnText}>Let's go</Text>
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
    fontSize: 11,
    fontFamily: 'Roboto_400Regular',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Roboto_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 13,
    fontFamily: 'Roboto_400Regular',
    color: 'rgba(255,255,255,0.7)',
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Roboto_400Regular',
    color: '#6B7280',
    marginBottom: 4,
    marginTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#DCFCE7',
    paddingBottom: 10,
    gap: 6,
  },
  prefix: {
    fontSize: 15,
    fontFamily: 'Roboto_500Medium',
    color: '#16A34A',
  },
  input: {
    fontSize: 15,
    fontFamily: 'Roboto_400Regular',
    color: '#333333',
  },
  ctaBtn: {
    backgroundColor: '#041202',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 36,
  },
  ctaBtnText: {
    fontSize: 15,
    fontFamily: 'Roboto_700Bold',
    color: '#DCFCE7',
  },
});