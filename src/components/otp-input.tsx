import { ComponentRef, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
};

export function OtpInput({ value, onChange, onComplete, disabled }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);
  const digits = (value + '      ').slice(0, 6).split('');

  const handleChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 6);
    onChange(cleaned);
    if (cleaned.length === 6) {
      onComplete?.(cleaned);
    }
  };

  return (
    <Pressable
      style={styles.wrap}
      onPress={() => !disabled && inputRef.current?.focus()}
      accessibilityRole="button"
      accessibilityLabel="Enter verification code"
    >
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={6}
        editable={!disabled}
        caretHidden
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.hiddenInput}
      />
      <View style={styles.boxRow} pointerEvents="none">
        {digits.map((digit, i) => {
          const filled = digit.trim().length > 0;
          return (
            <View
              key={i}
              style={[
                styles.box,
                filled && styles.boxFilled,
                i === value.length && focused && styles.boxActive,
              ]}
            >
              <Text style={styles.digit}>{filled ? digit : ''}</Text>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      position: 'relative',
      paddingVertical: 8,
    },
    hiddenInput: {
      position: 'absolute',
      opacity: 0,
      width: 1,
      height: 1,
    },
    boxRow: {
      flexDirection: 'row',
      gap: 10,
    },
    box: {
      flex: 1,
      height: 52,
      borderRadius: 10,
      backgroundColor: colors.input,
      borderBottomWidth: 1.5,
      borderBottomColor: colors.inputLine,
      alignItems: 'center',
      justifyContent: 'center',
    },
    boxFilled: {
      borderBottomColor: colors.green,
      backgroundColor: colors.tint,
    },
    boxActive: {
      borderBottomColor: colors.green,
    },
    digit: {
      fontSize: 22,
      fontFamily: 'Roboto_700Bold',
      color: colors.textDark,
    },
  });
}