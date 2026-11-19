import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Snackbar } from '../../components/snackbar';
import { DEV_MOCK } from '../../lib/dev';
import { supabase } from '../../lib/supabase';
import { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

const mockShopping = [
  { id: '1', name: 'Eggs', estimated_price: 35, purchased: false },
  { id: '2', name: 'Bread', estimated_price: 20, purchased: false },
  { id: '3', name: 'Long life milk', estimated_price: 18, purchased: false },
];

export default function ShoppingListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('shopping_list')
      .select('*')
      .eq('user_id', user.id)
      .eq('purchased', false)
      .order('created_at', { ascending: false });

    if (error) setToast(error.message);
    setItems(data || []);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const total = items.reduce((s, i) => s + (i.estimated_price || 0), 0);

  const markPurchased = async (item: { id: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (DEV_MOCK) setItems(prev => prev.filter(x => x.id !== item.id));
      return;
    }
    await supabase.from('shopping_list').update({ purchased: true }).eq('id', item.id);
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

      <Text style={styles.sub}>Est. total R{total.toFixed(0)}</Text>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        <View style={styles.card}>
          {items.length === 0 ? (
            <Text style={styles.empty}>Your list is clear.</Text>
          ) : (
            items.map((item, i) => (
              <View
                key={item.id}
                style={[styles.row, i === items.length - 1 && { borderBottomWidth: 0 }]}
              >
                <TouchableOpacity onPress={() => markPurchased(item)}>
                  <Ionicons name="checkmark-circle-outline" size={22} color={colors.green} />
                </TouchableOpacity>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>R{item.estimated_price}</Text>
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
    sub: {
      fontSize: 13,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
      paddingHorizontal: 16,
      marginBottom: 16,
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
      gap: 12,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    name: { flex: 1, fontSize: 14, fontFamily: 'Roboto_500Medium', color: colors.textDark },
    price: { fontSize: 13, fontFamily: 'Roboto_400Regular', color: colors.grey },
    empty: { textAlign: 'center', paddingVertical: 24, color: colors.muted, fontFamily: 'Roboto_400Regular' },
  });
}