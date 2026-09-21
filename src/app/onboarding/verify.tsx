import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
  
  export default function VerifyScreen() {
    const router = useRouter();
    const { email, name } = useLocalSearchParams<{ email: string; name: string }>();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const inputs = useRef<TextInput[]>([]);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
  
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

    const handleChange = (val: string, index: number) => {
      const newCode = [...code];
      newCode[index] = val;
      setCode(newCode);
      if (val && index < 5) {
        inputs.current[index + 1]?.focus();
      }
    };
  
    const handleVerify = async () => {
      const token = code.join('');
      if (token.length < 6) {
        Alert.alert('Quick check', 'Enter the full 6-digit code.');
        return;
      }
  
      setLoading(true);
  
      const { data, error } = await supabase.auth.verifyOtp({
        email: email as string,
        token,
        type: 'email',
      });
  
      if (error) {
        setLoading(false);
        Alert.alert('Incorrect code', 'That code did not match. Try again.');
        return;
      }
  
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            name: name as string,
            phone: '',
            allowance: 0,
            payday: 1,
          });
  
        if (profileError) {
          console.log('Profile error:', profileError.message);
        }
      }
  
      setLoading(false);
      router.replace('/onboarding/setup');
    };
  
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
  
        <View style={styles.body}>
          <Text style={styles.title}>Enter your code.</Text>
          <Text style={styles.sub}>
            Sent to {email}.{' '}
            <Text style={styles.edit}>Edit</Text>
          </Text>
  
          <View style={styles.boxRow}>
            {code.map((digit, i) => (
              <TextInput
                key={i}
                ref={el => { if (el) inputs.current[i] = el; }}
                style={[styles.box, digit ? styles.boxFilled : null]}
                maxLength={1}
                keyboardType="number-pad"
                value={digit}
                onChangeText={val => handleChange(val, i)}
              />
            ))}
          </View>
  
          <TouchableOpacity
            onPress={async () => {
              if (!canResend) return;
              await supabase.auth.signInWithOtp({
                email: email as string,
                options: { shouldCreateUser: false },
              });
              setTimer(60);
              setCanResend(false);
              setCode(['', '', '', '', '', '']);
            }}
          >
            <Text style={styles.resend}>
             {canResend
              ? <Text style={styles.resendLink}>Resend code</Text>
              : `Resend code in ${timer}s`
             }
            </Text>
          </TouchableOpacity>
        </View>
  
        <View style={styles.bottom}>
          <TouchableOpacity
            style={[styles.ctaBtn, loading && { opacity: 0.7 }]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#DCFCE7" />
              : <Text style={styles.ctaBtnText}>Verify</Text>
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 24,
    },
    back: { paddingTop: 16, paddingBottom: 8 },
    backText: {
      fontSize: 14, fontFamily: 'Roboto_400Regular', color: '#6B7280',
    },
    body: { flex: 1, paddingTop: 40 },
    title: {
      fontSize: 28, fontFamily: 'Roboto_700Bold',
      color: '#333333', letterSpacing: -0.5, marginBottom: 8,
    },
    sub: {
      fontSize: 13, fontFamily: 'Roboto_400Regular',
      color: '#6B7280', marginBottom: 40,
    },
    edit: { color: '#16A34A', fontFamily: 'Roboto_500Medium' },
    boxRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
    box: {
      flex: 1, height: 52, borderRadius: 10,
      backgroundColor: '#F9FAFB',
      borderBottomWidth: 1.5, borderBottomColor: '#DCFCE7',
      textAlign: 'center', fontSize: 22,
      fontFamily: 'Roboto_700Bold', color: '#333333',
    },
    boxFilled: {
      borderBottomColor: '#16A34A', backgroundColor: '#F0FDF4',
    },
    resend: {
      fontSize: 13, fontFamily: 'Roboto_400Regular',
      color: '#6B7280', textAlign: 'center',
    },
    resendLink: { color: '#16A34A', fontFamily: 'Roboto_500Medium' },
    bottom: { paddingBottom: 32 },
    ctaBtn: {
      backgroundColor: '#041202', borderRadius: 14,
      paddingVertical: 16, alignItems: 'center',
    },
    ctaBtnText: {
      fontSize: 15, fontFamily: 'Roboto_700Bold', color: '#DCFCE7',
    },
  });