import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.replace('/(tabs)');
    } else {
      router.replace('/onboarding/splash');
    }
  };

  return (
    <View style={{ flex: 1, alignItems: 'center',
      justifyContent: 'center', backgroundColor: '#041202' }}>
      <ActivityIndicator color="#16A34A" size="large" />
    </View>
  );
}