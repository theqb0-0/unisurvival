import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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

type PantryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  days_remaining?: number | null;
};

const mockPantry: PantryItem[] = [
  { id: '1', name: 'Oats', quantity: 2, unit: 'boxes', days_remaining: 3 },
  { id: '2', name: 'Cooking oil', quantity: 1, unit: 'bottle', days_remaining: 5 },
  { id: '3', name: 'Rice', quantity: 3, unit: 'kg', days_remaining: 12 },
];

export default function PantryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newUnit, setNewUnit] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (!DEV_MOCK) {
        setLoading(false);
        router.replace('/onboarding/splash');
        return;
      }
      setItems(mockPantry);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('pantry')
      .select('*')
      .eq('user_id', user.id)
      .order('days_remaining', { ascending: true, nullsFirst: false });

    if (error) setToast(error.message);
    setItems((data as PantryItem[]) || []);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const addItem = async () => {
    if (!newName.trim()) {
      setToast('Add a name first.');
      return;
    }
    const qty = parseInt(newQty, 10);
    if (Number.isNaN(qty) || qty < 1) {
      setToast('Quantity must be at least 1.');
      return;
    }
    if (!newUnit.trim()) {
      setToast('Add a unit (kg, bottle, etc.).');
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (DEV_MOCK) {
        setItems(prev => [...prev, {
          id: Date.now().toString(),
          name: newName.trim(),
          quantity: qty,
          unit: newUnit.trim(),
          days_remaining: 7,
        }]);
        setNewName('');
        setNewQty('1');
        setNewUnit('');
        setToast('Added to pantry.');
      }
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('pantry').insert({
      user_id: user.id,
      name: newName.trim(),
      quantity: qty,
      unit: newUnit.trim(),
      days_remaining: 7,
    });

    setSaving(false);
    if (error) {
      setToast(error.message);
      return;
    }
    setNewName('');
    setNewQty('1');
    setNewUnit('');
    setToast('Added to pantry.');
    load();
  };

  const useOne = async (item: PantryItem) => {
    const nextQty = (item.quantity ?? 1) - 1;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (DEV_MOCK) {
        if (nextQty <= 0) {
          setItems(prev => prev.filter(x => x.id !== item.id));
        } else {
          setItems(prev => prev.map(x =>
            x.id === item.id ? { ...x, quantity: nextQty } : x
          ));
        }
      }
      return;
    }

    if (nextQty <= 0) {
      const { error } = await supabase.from('pantry').delete().eq('id', item.id);
      if (error) {
        setToast(error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from('pantry')
        .update({ quantity: nextQty })
        .eq('id', item.id);
      if (error) {
        setToast(error.message);
        return;
      }
    }
    load();
  };

  const deleteItem = async (item: PantryItem) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (DEV_MOCK) setItems(prev => prev.filter(x => x.id !== item.id));
      return;
    }

    const { error } = await supabase.from('pantry').delete().eq('id', item.id);
    if (error) {
      setToast(error.message);
      return;
    }
    load();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.green} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pantry</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
      >
        <View style={styles.addCard}>
          <Text style={styles.addTitle}>Add to pantry</Text>
          <TextInput
            style={styles.input}
            placeholder="Rice"
            placeholderTextColor={colors.muted}
            value={newName}
            onChangeText={setNewName}
          />
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Qty"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              value={newQty}
              onChangeText={setNewQty}
            />
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="Unit (kg, box)"
              placeholderTextColor={colors.muted}
              value={newUnit}
              onChangeText={setNewUnit}
            />
          </View>
          <TouchableOpacity
            style={[styles.addBtn, saving && { opacity: 0.7 }]}
            onPress={addItem}
            disabled={saving}
          >
            <Text style={styles.addBtnText}>Save item</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {items.length === 0 ? (
            <Text style={styles.empty}>Pantry is empty. Stock up when you shop.</Text>
          ) : (
            items.map((item, i) => {
              const low = (item.days_remaining ?? 99) <= 5;
              return (
                <View
                  key={item.id}
                  style={[styles.row, i === items.length - 1 && { borderBottomWidth: 0 }]}
                >
                  <Ionicons name="cube-outline" size={18} color={low ? colors.green : colors.muted} />
                  <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.meta}>
                      {item.quantity} {item.unit}
                      {item.days_remaining != null ? ` · ${item.days_remaining}d left` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.usedBtn} onPress={() => useOne(item)}>
                    <Text style={styles.usedBtnText}>Used</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteItem(item)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.muted} />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
      <Snackbar message={toast} onDismiss={() => setToast(null)} />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.canvas },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
    },
    headerTitle: { fontSize: 18, fontFamily: 'Roboto_700Bold', color: colors.textDark },
    addCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 16,
      marginTop: 8,
    },
    addTitle: {
      fontSize: 13,
      fontFamily: 'Roboto_700Bold',
      color: colors.textDark,
      marginBottom: 12,
    },
    addRow: { flexDirection: 'row', gap: 12 },
    input: {
      fontSize: 15,
      fontFamily: 'Roboto_400Regular',
      color: colors.textDark,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
      paddingVertical: 8,
      marginBottom: 8,
    },
    addBtn: {
      marginTop: 8,
      backgroundColor: colors.green,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    addBtnText: {
      fontSize: 14,
      fontFamily: 'Roboto_700Bold',
      color: colors.onAccent,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    info: { flex: 1 },
    name: { fontSize: 14, fontFamily: 'Roboto_500Medium', color: colors.textDark },
    meta: {
      fontSize: 11,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
      marginTop: 2,
    },
    usedBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    usedBtnText: {
      fontSize: 11,
      fontFamily: 'Roboto_500Medium',
      color: colors.green,
    },
    empty: {
      textAlign: 'center',
      paddingVertical: 24,
      color: colors.muted,
      fontFamily: 'Roboto_400Regular',
      fontSize: 13,
    },
  });
}