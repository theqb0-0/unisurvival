import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const categories = [
  { label: 'Food', icon: 'basket-outline', spent: 'R340' },
  { label: 'Transport', icon: 'bus-outline', spent: 'R86' },
  { label: 'Data', icon: 'wifi-outline', spent: 'R55' },
  { label: 'Personal', icon: 'shirt-outline', spent: 'R0' },
];

const transactions = [
  { name: 'Checkers', date: 'Today · Food', amount: '− R86', icon: 'basket-outline', positive: false },
  { name: 'Taxi fare', date: 'Yesterday · Transport', amount: '− R18', icon: 'bus-outline', positive: false },
  { name: 'NSFAS allowance', date: '1 Jul · Received', amount: '+ R1,500', icon: 'arrow-down-outline', positive: true },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>UniSurvival</Text>
          <Ionicons name="notifications-outline" size={22} color="#16A34A" />
        </View>

        <View style={styles.balanceArea}>
          <Text style={styles.greeting}>Morning, Sipho</Text>
          <Text style={styles.balance}>R1,240</Text>
          <Text style={styles.balanceSub}>left this month</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Daily budget</Text>
          <Text style={styles.heroAmount}>R88 / day</Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: '53%' }]} />
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Day 16 of 30</Text>
            <View style={styles.chip}>
              <Text style={styles.chipText}>14 days left</Text>
            </View>
          </View>
        </View>

        <View style={styles.nudge}>
          <Ionicons name="time-outline" size={16} color="#16A34A" />
          <Text style={styles.nudgeText}>You owe Nandi R150 since last week.</Text>
          <TouchableOpacity>
            <Text style={styles.nudgeCta}>Log it</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Log Spending</Text>
          <View style={styles.categoryRow}>
            {categories.map((cat) => (
              <TouchableOpacity key={cat.label} style={styles.categoryItem}>
                <Ionicons name={cat.icon as any} size={26} color="#16A34A" />
                <Text style={styles.categoryLabel}>{cat.label}</Text>
                <Text style={styles.categorySpent}>{cat.spent}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { marginBottom: 32 }]}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {transactions.map((txn, i) => (
            <View
              key={i}
              style={[styles.txnRow, i === transactions.length - 1 && { borderBottomWidth: 0 }]}
            >
              <Ionicons name={txn.icon as any} size={16} color="#16A34A" />
              <View style={styles.txnInfo}>
                <Text style={styles.txnName}>{txn.name}</Text>
                <Text style={styles.txnDate}>{txn.date}</Text>
              </View>
              <Text style={[styles.txnAmount, { color: txn.positive ? '#16A34A' : '#333333' }]}>
                {txn.amount}
              </Text>
            </View>
          ))}
        </View>

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
  balanceArea: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  greeting: { fontSize: 13, fontFamily: 'Roboto_400Regular', color: '#6B7280', marginBottom: 4 },
  balance: { fontSize: 42, fontFamily: 'Roboto_700Bold', color: '#333333', letterSpacing: -1 },
  balanceSub: { fontSize: 13, fontFamily: 'Roboto_400Regular', color: '#6B7280', marginTop: 2 },
  heroCard: {
    backgroundColor: '#F0FDF4', borderRadius: 16, padding: 16,
    marginHorizontal: 20, marginTop: 20,
    shadowColor: '#041202', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  heroLabel: { fontSize: 12, fontFamily: 'Roboto_400Regular', color: '#6B7280', marginBottom: 4 },
  heroAmount: { fontSize: 22, fontFamily: 'Roboto_700Bold', color: '#15803D', marginBottom: 12 },
  progressBg: { backgroundColor: '#DCFCE7', borderRadius: 4, height: 4, marginBottom: 8 },
  progressFill: { backgroundColor: '#16A34A', borderRadius: 4, height: 4 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 11, fontFamily: 'Roboto_400Regular', color: '#6B7280' },
  chip: { backgroundColor: '#DCFCE7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  chipText: { fontSize: 11, fontFamily: 'Roboto_500Medium', color: '#15803D' },
  nudge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 14,
    borderWidth: 0.5, borderColor: '#DCFCE7', borderRadius: 12, padding: 12,
  },
  nudgeText: { flex: 1, fontSize: 12, fontFamily: 'Roboto_400Regular', color: '#333333' },
  nudgeCta: { fontSize: 12, fontFamily: 'Roboto_500Medium', color: '#16A34A' },
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontFamily: 'Roboto_700Bold', color: '#333333', marginBottom: 14 },
  seeAll: { fontSize: 12, fontFamily: 'Roboto_400Regular', color: '#16A34A' },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  categoryItem: { alignItems: 'center', gap: 5 },
  categoryLabel: { fontSize: 11, fontFamily: 'Roboto_400Regular', color: '#6B7280' },
  categorySpent: { fontSize: 11, fontFamily: 'Roboto_500Medium', color: '#333333' },
  txnRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6',
  },
  txnInfo: { flex: 1 },
  txnName: { fontSize: 13, fontFamily: 'Roboto_500Medium', color: '#333333' },
  txnDate: { fontSize: 11, fontFamily: 'Roboto_400Regular', color: '#6B7280', marginTop: 2 },
  txnAmount: { fontSize: 13, fontFamily: 'Roboto_500Medium' },
});