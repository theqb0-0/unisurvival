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

type ShoppingItem = {
  id: string;
  name: string;
  estimated_price: number | null;
  purchased: boolean;
};

const mockShopping: ShoppingItem[] = [
  { id: '1', name: 'Eggs', estimated_price: 35, purchased: false },
  { id: '2', name: 'Bread', estimated_price: 20, purchased: false },
  { id: '3', name: 'Long life milk', estimated_price: 18, purchased: false },
];

export default function ShoppingListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [budgetLeft, setBudgetLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
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
      setItems(mockShopping);
      setBudgetLeft(500 - 220);
      setLoading(false);
      return;
    }

    const now = new Date();
    const [{ data, error }, { data: budgetRow, error: budgetError }] = await Promise.all([
      supabase
        .from('shopping_list')
        .select('*')
        .eq('user_id', user.id)
        .order('purchased', { ascending: true })
        .order('created_at', { ascending: false }),
      supabase
        .from('food_budget')
        .select('budget, spent')
        .eq('user_id', user.id)
        .eq('month', now.getMonth() + 1)
        .eq('year', now.getFullYear())
        .maybeSingle(),
    ]);

    if (error) setToast(error.message);
    else if (budgetError) setToast(budgetError.message);
    setItems((data as ShoppingItem[]) || []);
    if (budgetRow) {
      setBudgetLeft(budgetRow.budget - budgetRow.spent);
    } else {
      setBudgetLeft(null);
    }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const unbought = items.filter(i => !i.purchased);
  const unboughtTotal = unbought.reduce((s, i) => s + (i.estimated_price ?? 0), 0);

  const addItem = async () => {
    if (!newName.trim()) {
      setToast('Add a name first.');
      return;
    }
    const price = newPrice.trim() ? parseFloat(newPrice) : null;
    if (newPrice.trim() && Number.isNaN(price)) {
      setToast('Enter a valid price.');
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (DEV_MOCK) {
        setItems(prev => [...prev, {
          id: Date.now().toString(),
          name: newName.trim(),
          estimated_price: price,
          purchased: false,
        }]);
        setNewName('');
        setNewPrice('');
        setToast('Item added.');
      }
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('shopping_list').insert({
      user_id: user.id,
      name: newName.trim(),
      estimated_price: price,
      purchased: false,
    });

    setSaving(false);
    if (error) {
      setToast(error.message);
      return;
    }
    setNewName('');
    setNewPrice('');
    setToast('Item added.');
    load();
  };

  const togglePurchased = async (item: ShoppingItem) => {
    const next = !item.purchased;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (DEV_MOCK) {
        setItems(prev => prev.map(x => x.id === item.id ? { ...x, purchased: next } : x));
      }
      return;
    }

    const { error } = await supabase
      .from('shopping_list')
      .update({ purchased: next })
      .eq('id', item.id);

    if (error) {
      setToast(error.message);
      return;
    }
    load();
  };

  const deleteItem = async (item: ShoppingItem) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (DEV_MOCK) {
        setItems(prev => prev.filter(x => x.id !== item.id));
      }
      return;
    }

    const { error } = await supabase.from('shopping_list').delete().eq('id', item.id);
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
        <Text style={styles.headerTitle}>Shopping list</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Still to buy</Text>
          <Text style={styles.summaryValue}>R{unboughtTotal.toFixed(0)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Food budget left</Text>
          <Text style={styles.summaryValue}>
            {budgetLeft != null ? `R${budgetLeft.toFixed(0)}` : 'Not set'}
          </Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
      >
        <View style={styles.addCard}>
          <Text style={styles.addTitle}>Add item</Text>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Eggs"
              placeholderTextColor={colors.muted}
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              style={styles.priceInput}
              placeholder="R"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              value={newPrice}
              onChangeText={setNewPrice}
            />
          </View>
          <TouchableOpacity
            style={[styles.addBtn, saving && { opacity: 0.7 }]}
            onPress={addItem}
            disabled={saving}
          >
            <Text style={styles.addBtnText}>Add to list</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {items.length === 0 ? (
            <Text style={styles.empty}>Your list is empty. Add something above.</Text>
          ) : (
            items.map((item, i) => (
              <View
                key={item.id}
                style={[styles.row, i === items.length - 1 && { borderBottomWidth: 0 }]}
              >
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                  onPress={() => togglePurchased(item)}
                >
                  <Ionicons
                    name={item.purchased ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={item.purchased ? colors.muted : colors.green}
                  />
                  <Text
                    style={[styles.name, item.purchased && styles.nameBought]}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  {item.estimated_price != null && (
                    <Text style={[styles.price, item.purchased && styles.nameBought]}>
                      R{item.estimated_price}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteItem(item)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.muted} />
                </TouchableOpacity>
              </View>
            ))
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
    summaryCard: {
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 16,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 13,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
    },
    summaryValue: {
      fontSize: 16,
      fontFamily: 'Roboto_700Bold',
      color: colors.textDark,
    },
    addCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 16,
    },
    addTitle: {
      fontSize: 13,
      fontFamily: 'Roboto_700Bold',
      color: colors.textDark,
      marginBottom: 12,
    },
    addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    input: {
      fontSize: 15,
      fontFamily: 'Roboto_400Regular',
      color: colors.textDark,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
      paddingVertical: 8,
    },
    priceInput: {
      width: 72,
      fontSize: 15,
      fontFamily: 'Roboto_400Regular',
      color: colors.textDark,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
      paddingVertical: 8,
      textAlign: 'right',
    },
    addBtn: {
      marginTop: 16,
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
      gap: 8,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    name: { flex: 1, fontSize: 14, fontFamily: 'Roboto_500Medium', color: colors.textDark },
    nameBought: {
      textDecorationLine: 'line-through',
      color: colors.muted,
    },
    price: { fontSize: 13, fontFamily: 'Roboto_400Regular', color: colors.grey },
    empty: {
      textAlign: 'center',
      paddingVertical: 24,
      color: colors.muted,
      fontFamily: 'Roboto_400Regular',
      fontSize: 13,
    },
  });
}