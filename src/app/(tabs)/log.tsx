import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Snackbar } from '../../components/snackbar';
import { DEV_MOCK } from '../../lib/dev';
import { supabase } from '../../lib/supabase';
import { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

const categories = [
  { label: 'Food', icon: 'basket-outline' },
  { label: 'Transport', icon: 'bus-outline' },
  { label: 'Data', icon: 'wifi-outline' },
  { label: 'Personal', icon: 'shirt-outline' },
  { label: 'Social', icon: 'heart-outline' },
  { label: 'Emergency', icon: 'alert-circle-outline' },
  { label: 'Textbooks', icon: 'book-outline' },
  { label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

export default function LogScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [amount, setAmount] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleLog = async () => {
    if (amount === '0' || amount === '') {
      setToast('Enter an amount first.');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (!DEV_MOCK) {
        setLoading(false);
        setToast('Sign in to save expenses.');
        return;
      }
      setToast(`R${amount} in ${selectedCategory} saved.`);
      setAmount('0');
      setSelectedCategory('Food');
      setNote('');
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        amount: parseFloat(amount),
        category: selectedCategory,
        note: note.trim() || null,
        type: 'expense',
        date: new Date().toISOString(),
      });

    if (error) {
      setLoading(false);
      setToast(error.message);
      return;
    }

    setLoading(false);
    setToast(`R${amount} in ${selectedCategory} logged.`);
    setAmount('0');
    setSelectedCategory('Food');
    setNote('');
  };

  const handleNumber = (val: string) => {
    if (val === '⌫') {
      setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
      return;
    }
    if (val === '.' && amount.includes('.')) return;
    if (amount === '0' && val !== '.') {
      setAmount(val);
      return;
    }
    setAmount(prev => prev + val);
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Log Expense</Text>
      </View>

      <View style={styles.amountArea}>
        <Text style={styles.amountLabel}>How much did you spend?</Text>
        <View style={styles.amountRow}>
          <Text style={styles.amountPrefix}>R</Text>
          <Text style={styles.amountValue}>{amount}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.label}
                style={[styles.categoryBtn, selectedCategory === cat.label && styles.categoryBtnActive]}
                onPress={() => setSelectedCategory(cat.label)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={22}
                  color={selectedCategory === cat.label ? colors.green : colors.muted}
                />
                <Text style={[styles.categoryLabel, selectedCategory === cat.label && styles.categoryLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.green} />
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>Today</Text>
          </View>
          <View style={[styles.detailRow, styles.noteRow]}>
            <Ionicons name="pencil-outline" size={16} color={colors.green} />
            <TextInput
              style={styles.noteInput}
              placeholder="Note (optional)"
              placeholderTextColor={colors.muted}
              value={note}
              onChangeText={setNote}
              editable
              returnKeyType="done"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.numpad}>
        {numbers.map((num) => (
          <TouchableOpacity
            key={num}
            style={styles.numpadBtn}
            onPress={() => handleNumber(num)}
          >
            <Text style={styles.numpadText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.ctaWrap}>
        <TouchableOpacity
          style={[styles.logBtn, loading && { opacity: 0.7 }]}
          onPress={handleLog}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={colors.onAccent} />
            : <Text style={styles.logBtnText}>LOG IT</Text>
          }
        </TouchableOpacity>
      </View>

      <Snackbar message={toast} onDismiss={() => setToast(null)} />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.canvas },
    header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    headerTitle: { fontSize: 22, fontFamily: 'Roboto_700Bold', color: colors.textDark },
    amountArea: {
      alignItems: 'center',
      paddingVertical: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    amountLabel: {
      fontSize: 12,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
      marginBottom: 8,
    },
    amountRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
    amountPrefix: {
      fontSize: 20,
      fontFamily: 'Roboto_300Light',
      color: colors.grey,
      marginTop: 8,
    },
    amountValue: {
      fontSize: 48,
      fontFamily: 'Roboto_700Bold',
      color: colors.textDark,
      letterSpacing: -2,
    },
    section: { paddingHorizontal: 16, marginTop: 24 },
    sectionTitle: {
      fontSize: 15,
      fontFamily: 'Roboto_700Bold',
      color: colors.textDark,
      marginBottom: 16,
    },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    categoryBtn: {
      width: '22%',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    categoryBtnActive: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    categoryLabel: {
      fontSize: 10,
      fontFamily: 'Roboto_400Regular',
      color: colors.muted,
    },
    categoryLabelActive: {
      color: colors.green,
      fontFamily: 'Roboto_500Medium',
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    noteRow: { borderBottomWidth: 0, minHeight: 52 },
    detailLabel: {
      flex: 1,
      fontSize: 13,
      fontFamily: 'Roboto_400Regular',
      color: colors.textDark,
    },
    detailValue: {
      fontSize: 13,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
    },
    noteInput: {
      flex: 1,
      fontSize: 13,
      fontFamily: 'Roboto_400Regular',
      color: colors.textDark,
      paddingVertical: 8,
      minHeight: 40,
    },
    numpad: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 16,
      gap: 8,
      marginTop: 8,
    },
    numpadBtn: {
      width: '31%',
      paddingVertical: 14,
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.border,
    },
    numpadText: {
      fontSize: 20,
      fontFamily: 'Roboto_500Medium',
      color: colors.textDark,
    },
    ctaWrap: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    logBtn: {
      backgroundColor: colors.green,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
    },
    logBtnText: {
      fontSize: 15,
      fontFamily: 'Roboto_700Bold',
      color: colors.onAccent,
      letterSpacing: 0.5,
    },
  });
}
