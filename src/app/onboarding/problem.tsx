import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

export default function ProblemScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.progress}>
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={styles.progressDot} />
      </View>

      <View style={styles.content}>
        <Text style={styles.stat}>59%</Text>
        <Text style={styles.statHead}>
          of students run out before month end.
        </Text>
        <Text style={styles.body}>
          Food goes first. Then transport. Then data. Then you borrow from
          someone who can't afford it either.{'\n\n'}
          UniSurvival was built so you're not that student this month.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.ctaBtn}
        onPress={() => router.push('/onboarding/signup')}
      >
        <Text style={styles.ctaBtnText}>That's me. Let's fix it.</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.deep,
      paddingHorizontal: 24,
      paddingBottom: 40,
      paddingTop: 20,
    },
    progress: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 48,
    },
    progressDot: {
      flex: 1,
      height: 3,
      backgroundColor: colors.onDeepIdle,
      borderRadius: 2,
    },
    progressDotActive: {
      backgroundColor: colors.green,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      gap: 16,
    },
    stat: {
      fontSize: 72,
      fontFamily: 'Roboto_700Bold',
      color: colors.green,
      letterSpacing: -3,
      lineHeight: 76,
    },
    statHead: {
      fontSize: 20,
      fontFamily: 'Roboto_700Bold',
      color: colors.onDeepTitle,
      lineHeight: 28,
    },
    body: {
      fontSize: 14,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
      lineHeight: 22,
      marginTop: 8,
    },
    ctaBtn: {
      backgroundColor: 'transparent',
      borderWidth: 0.5,
      borderColor: colors.onDeep,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
    },
    ctaBtnText: {
      fontSize: 15,
      fontFamily: 'Roboto_700Bold',
      color: colors.onDeep,
    },
  });
}
