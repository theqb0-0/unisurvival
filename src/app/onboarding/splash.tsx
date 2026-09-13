import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SplashScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.content}>
        <View style={styles.mark}>
          <Text style={styles.markText}>U</Text>
        </View>
        <Text style={styles.appName}>UniSurvival</Text>
        <Text style={styles.tagline}>Make it last.</Text>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => router.push('/onboarding/problem')}
        >
          <Text style={styles.ctaBtnText}>Get started</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>I already have an account</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#041202',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  mark: {
    width: 56,
    height: 56,
    backgroundColor: '#16A34A',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  markText: {
    fontSize: 28,
    fontFamily: 'Roboto_700Bold',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 32,
    fontFamily: 'Roboto_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Roboto_300Light',
    color: '#DCFCE7',
    letterSpacing: 0.5,
  },
  bottom: {
    gap: 12,
  },
  ctaBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaBtnText: {
    fontSize: 15,
    fontFamily: 'Roboto_700Bold',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontFamily: 'Roboto_400Regular',
    color: 'rgba(220,252,231,0.5)',
  },
});