import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

const mockMeals = [
  { id: '1', slot: 'Breakfast', meal_name: 'Oats with banana' },
  { id: '2', slot: 'Lunch', meal_name: 'Peanut butter sandwich' },
  { id: '3', slot: 'Dinner', meal_name: 'Rice and canned beans' },
];

const mockShopping = [
  { id: '1', name: 'Eggs', estimated_price: 35, purchased: false },
  { id: '2', name: 'Bread', estimated_price: 20, purchased: false },
  { id: '3', name: 'Long life milk', estimated_price: 18, purchased: false },
];

const mockPantry = [
  { id: '1', name: 'Oats', days_remaining: 3 },
  { id: '2', name: 'Cooking oil', days_remaining: 5 },
];

export default function GroceryScreen() {
  const [meals, setMeals] = useState<any[]>([]);
  const [shopping, setShopping] = useState<any[]>([]);
  const [pantryAlerts, setPantryAlerts] = useState<any[]>([]);
  const [foodBudget, setFoodBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setMeals(mockMeals);
      setShopping(mockShopping);
      setPantryAlerts(mockPantry);
      setFoodBudget({ budget: 500, spent: 220 });
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    const [mealsRes, shoppingRes, pantryRes, budgetRes] = await Promise.all([
      supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('slot'),
      supabase
        .from('shopping_list')
        .select('*')
        .eq('user_id', user.id)
        .eq('purchased', false)
        .order('created_at', { ascending: false }),
      supabase
        .from('pantry')
        .select('*')
        .eq('user_id', user.id)
        .lte('days_remaining', 5)
        .order('days_remaining'),
      supabase
        .from('food_budget')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', now.getMonth() + 1)
        .eq('year', now.getFullYear())
        .single(),
    ]);

    setMeals(mealsRes.data || []);
    setShopping(shoppingRes.data || []);
    setPantryAlerts(pantryRes.data || []);
    setFoodBudget(budgetRes.data);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleMarkPurchased = async (item: any) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setShopping(prev => prev.filter(s => s.id !== item.id));
      return;
    }

    await supabase
      .from('shopping_list')
      .update({ purchased: true })
      .eq('id', item.id);

    loadData();
  };

  const budgetLeft = foodBudget
    ? foodBudget.budget - foodBudget.spent
    : 0;

  const shoppingTotal = shopping.reduce(
    (sum, s) => sum + (s.estimated_price || 0), 0
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color="#16A34A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Grocery</Text>
        <TouchableOpacity
          onPress={() => Alert.alert(
            'Scan receipt',
            'Receipt scanning coming in the next update.'
          )}
        >
          <Ionicons name="camera-outline" size={22} color="#16A34A" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.budgetArea}>
          <Text style={styles.budgetAmount}>
            R{budgetLeft.toFixed(0)}
          </Text>
          <Text style={styles.budgetSub}>
            food budget left this month
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Today's Meals</Text>
            <TouchableOpacity>
              <Text style={styles.sectionMore}>Full plan</Text>
            </TouchableOpacity>
          </View>

          {meals.length === 0 ? (
            <Text style={styles.emptyText}>
              No meals planned for today yet.
            </Text>
          ) : (
            meals.map((meal, i) => (
              <View
                key={meal.id}
                style={[
                  styles.mealRow,
                  i === meals.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Text style={styles.mealSlot}>{meal.slot}</Text>
                <Text style={styles.mealName}>{meal.meal_name}</Text>
                <TouchableOpacity>
                  <Text style={styles.mealLink}>Recipe</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.cardsRow}>
          <TouchableOpacity style={styles.accessCard}>
            <Ionicons name="list-outline" size={24} color="#16A34A" />
            <Text style={styles.accessCardTitle}>Shopping List</Text>
            <Text style={styles.accessCardSub}>
              {shopping.length} items · Est. R{shoppingTotal.toFixed(0)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.accessCard}>
            <Ionicons name="cube-outline" size={24} color="#16A34A" />
            <Text style={styles.accessCardTitle}>Pantry</Text>
            <Text style={styles.accessCardSub}>
              {pantryAlerts.length > 0
                ? `${pantryAlerts.length} items running low`
                : 'All stocked up'
              }
            </Text>
          </TouchableOpacity>
        </View>

        {shopping.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Shop</Text>
            {shopping.slice(0, 3).map((item, i) => (
              <View
                key={item.id}
                style={[
                  styles.shopRow,
                  i === Math.min(shopping.length, 3) - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleMarkPurchased(item)}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#16A34A"
                  />
                </TouchableOpacity>
                <Text style={styles.shopName}>{item.name}</Text>
                <Text style={styles.shopPrice}>
                  Est. R{item.estimated_price}
                </Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.scanCard}
          onPress={() => Alert.alert(
            'Scan receipt',
            'Receipt scanning coming in the next update.'
          )}
        >
          <Ionicons name="camera-outline" size={24} color="#DCFCE7" />
          <View style={styles.scanText}>
            <Text style={styles.scanTitle}>Scan a receipt</Text>
            <Text style={styles.scanSub}>
              Updates your pantry and budget automatically
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#DCFCE7" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 16, paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 22, fontFamily: 'Roboto_700Bold', color: '#333333',
  },
  budgetArea: {
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4,
  },
  budgetAmount: {
    fontSize: 42, fontFamily: 'Roboto_700Bold',
    color: '#333333', letterSpacing: -1,
  },
  budgetSub: {
    fontSize: 13, fontFamily: 'Roboto_400Regular',
    color: '#6B7280', marginTop: 2,
  },
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15, fontFamily: 'Roboto_700Bold', color: '#333333',
  },
  sectionMore: {
    fontSize: 12, fontFamily: 'Roboto_400Regular', color: '#16A34A',
  },
  mealRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
  mealSlot: {
    width: 64, fontSize: 12, fontFamily: 'Roboto_400Regular',
    color: '#6B7280',
  },
  mealName: {
    flex: 1, fontSize: 13, fontFamily: 'Roboto_500Medium', color: '#333333',
  },
  mealLink: {
    fontSize: 12, fontFamily: 'Roboto_400Regular', color: '#16A34A',
  },
  cardsRow: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 20, marginTop: 28,
  },
  accessCard: {
    flex: 1, borderWidth: 0.5, borderColor: '#DCFCE7',
    borderRadius: 14, padding: 14, gap: 6,
    shadowColor: '#041202', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  accessCardTitle: {
    fontSize: 13, fontFamily: 'Roboto_700Bold', color: '#333333',
  },
  accessCardSub: {
    fontSize: 11, fontFamily: 'Roboto_400Regular', color: '#6B7280',
  },
  shopRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
  shopName: {
    flex: 1, fontSize: 13, fontFamily: 'Roboto_500Medium', color: '#333333',
  },
  shopPrice: {
    fontSize: 12, fontFamily: 'Roboto_400Regular', color: '#6B7280',
  },
  scanCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#041202', borderRadius: 14, padding: 16,
    marginHorizontal: 20, marginTop: 20, marginBottom: 32,
  },
  scanText: { flex: 1 },
  scanTitle: {
    fontSize: 13, fontFamily: 'Roboto_700Bold', color: '#DCFCE7',
  },
  scanSub: {
    fontSize: 11, fontFamily: 'Roboto_400Regular',
    color: 'rgba(220,252,231,0.6)', marginTop: 2,
  },
  emptyText: {
    fontSize: 13, fontFamily: 'Roboto_400Regular',
    color: '#9CA3AF', paddingVertical: 16, lineHeight: 20,
  },
});