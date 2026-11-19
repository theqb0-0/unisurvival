import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
};

export function Snackbar({ message, onDismiss, durationMs = 2400 }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;

    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(durationMs),
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onDismiss();
    });
  }, [message, durationMs, onDismiss, opacity]);

  if (!message) return null;

  return (
    <Animated.View style={[styles.wrap, { opacity }]} pointerEvents="none">
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 24,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      zIndex: 100,
    },
    text: {
      fontSize: 13,
      fontFamily: 'Roboto_500Medium',
      color: colors.textDark,
      textAlign: 'center',
    },
  });
}
