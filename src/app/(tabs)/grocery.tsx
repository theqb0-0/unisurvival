import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const meals = [
  { slot: 'Breakfast', name: 'Oats with banana' },
  { slot: 'Lunch', name: 'Peanut butter sandwich' },
  { slot: 'Dinner', name: 'Rice and canned beans' },
];

export default function GroceryScreen() {
  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Grocery</Text>
        <TouchableOpacity>
          <Ionicons name="camera-outline" size={22} color="#16A34A" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.budgetArea}>
          <Text style={styles.budgetAmount}>R280</Text>
          <Text style={styles.budgetSub}>food budget left this month</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Today's Meals</Text>
            <TouchableOpacity>
              <Text style={styles.sectionMore}>Full plan</Text>
            </TouchableOpacity>
          </View>
          {meals.map((meal, i) => (
            <View
              key={i}
              style={[styles.mealRow, i === meals.length - 1 && { borderBottomWidth: 0 }]}
            >
              <Text style={styles.mealSlot}>{meal.slot}</Text>
              <Text style={styles.mealName}>{meal.name}</Text>
              <TouchableOpacity>
                <Text style={styles.mealLink}>Recipe</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.cardsRow}>
          <TouchableOpacity style={styles.accessCard}>
            <Ionicons name="list-outline" size={24} color="#16A34A" />
            <Text style={styles.accessCardTitle}>Shopping List</Text>
            <Text style={styles.accessCardSub}>7 items · Est. R180</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.accessCard}>
            <Ionicons name="cube-outline" size={24} color="#16A34A" />
            <Text style={styles.accessCardTitle}>Pantry</Text>
            <Text style={styles.accessCardSub}>2 items running low</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.scanCard}>
          <Ionicons name="camera-outline" size={24} color="#DCFCE7" />
          <View style={styles.scanText}>
            <Text style={styles.scanTitle}>Scan a receipt</Text>
            <Text style={styles.scanSub}>Updates your pantry and budget automatically</Text>
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
    alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4,
  },
  headerTitle: { fontSize: 22, fontFamily: 'Roboto_700Bold', color: '#333333' },
  budgetArea: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  budgetAmount: { fontSize: 42, fontFamily: 'Roboto_700Bold', color: '#333333', letterSpacing: -1 },
  budgetSub: { fontSize: 13, fontFamily: 'Roboto_400Regular', color: '#6B7280', marginTop: 2 },
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontFamily: 'Roboto_700Bold', color: '#333333' },
  sectionMore: { fontSize: 12, fontFamily: 'Roboto_400Regular', color: '#16A34A' },
  mealRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6',
  },
  mealSlot: { width: 64, fontSize: 12, fontFamily: 'Roboto_400Regular', color: '#6B7280' },
  mealName: { flex: 1, fontSize: 13, fontFamily: 'Roboto_500Medium', color: '#333333' },
  mealLink: { fontSize: 12, fontFamily: 'Roboto_400Regular', color: '#16A34A' },
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
  accessCardTitle: { fontSize: 13, fontFamily: 'Roboto_700Bold', color: '#333333' },
  accessCardSub: { fontSize: 11, fontFamily: 'Roboto_400Regular', color: '#6B7280' },
  scanCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#041202', borderRadius: 14, padding: 16,
    marginHorizontal: 20, marginTop: 12, marginBottom: 32,
  },
  scanText: { flex: 1 },
  scanTitle: { fontSize: 13, fontFamily: 'Roboto_700Bold', color: '#DCFCE7' },
  scanSub: { fontSize: 11, fontFamily: 'Roboto_400Regular', color: 'rgba(220,252,231,0.6)', marginTop: 2 },
});