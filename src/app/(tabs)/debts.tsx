import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

const iOwe = [
  { name: 'Nandi', detail: 'Borrowed for groceries · 8 days ago', amount: 'R150' },
  { name: 'Payflex', detail: 'Woolworths order · Due 30 Jul', amount: 'R200', isStore: true },
];

const owedToMe = [
  { name: 'Thabo', detail: 'Covered his lunch · 3 days ago', amount: 'R80' },
];

function Avatar({ name, isStore }: { name: string; isStore?: boolean }) {
  return (
    <View style={[styles.avatar, isStore && styles.avatarStore]}>
      {isStore
        ? <Ionicons name="storefront-outline" size={14} color="#6B7280" />
        : <Text style={styles.avatarText}>{name[0]}</Text>
      }
    </View>
  );
}

function DebtItem({ item, type }: { item: any; type: 'owe' | 'owed' }) {
  return (
    <View style={styles.debtRow}>
      <Avatar name={item.name} isStore={item.isStore} />
      <View style={styles.debtInfo}>
        <Text style={styles.debtName}>{item.name}</Text>
        <Text style={styles.debtDetail}>{item.detail}</Text>
      </View>
      <View style={styles.debtRight}>
        <Text style={[styles.debtAmount, { color: type === 'owe' ? '#E53E3E' : '#16A34A' }]}>
          {item.amount}
        </Text>
        <TouchableOpacity style={styles.settleBtn}>
          <Text style={styles.settleBtnText}>
            {type === 'owe' ? 'Settle up' : 'Mark paid'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DebtsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Debts</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={16} color="#16A34A" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>I owe</Text>
              <Text style={[styles.summaryAmount, { color: '#E53E3E' }]}>R350</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.summaryLabel}>Owed to me</Text>
              <Text style={[styles.summaryAmount, { color: '#16A34A' }]}>R80</Text>
            </View>
          </View>
          <View style={styles.summaryNet}>
            <Text style={styles.summaryNetLabel}>Net position</Text>
            <Text style={styles.summaryNetValue}>You are R270 down overall</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I Owe</Text>
          {iOwe.map((item, i) => (
            <View key={i} style={[i === iOwe.length - 1 && { borderBottomWidth: 0 }]}>
              <DebtItem item={item} type="owe" />
            </View>
          ))}
        </View>

        <View style={[styles.section, { marginBottom: 32 }]}>
          <Text style={styles.sectionTitle}>Owed to Me</Text>
          {owedToMe.map((item, i) => (
            <View key={i} style={[i === owedToMe.length - 1 && { borderBottomWidth: 0 }]}>
              <DebtItem item={item} type="owed" />
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
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FDF4', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  addBtnText: { fontSize: 13, fontFamily: 'Roboto_500Medium', color: '#16A34A' },
  summaryCard: {
    backgroundColor: '#F0FDF4', borderRadius: 16, padding: 16,
    marginHorizontal: 20, marginTop: 20,
    shadowColor: '#041202', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 11, fontFamily: 'Roboto_400Regular', color: '#6B7280', marginBottom: 4 },
  summaryAmount: { fontSize: 24, fontFamily: 'Roboto_700Bold', letterSpacing: -0.5 },
  summaryDivider: { width: 0.5, height: 40, backgroundColor: '#DCFCE7' },
  summaryNet: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 12, paddingTop: 12,
    borderTopWidth: 0.5, borderTopColor: '#DCFCE7',
  },
  summaryNetLabel: { fontSize: 11, fontFamily: 'Roboto_400Regular', color: '#6B7280' },
  summaryNetValue: { fontSize: 12, fontFamily: 'Roboto_500Medium', color: '#333333' },
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionTitle: { fontSize: 15, fontFamily: 'Roboto_700Bold', color: '#333333', marginBottom: 14 },
  debtRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6',
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
  },
  avatarStore: { backgroundColor: '#F3F4F6' },
  avatarText: { fontSize: 14, fontFamily: 'Roboto_700Bold', color: '#16A34A' },
  debtInfo: { flex: 1 },
  debtName: { fontSize: 13, fontFamily: 'Roboto_500Medium', color: '#333333' },
  debtDetail: { fontSize: 11, fontFamily: 'Roboto_400Regular', color: '#6B7280', marginTop: 2 },
  debtRight: { alignItems: 'flex-end', gap: 4 },
  debtAmount: { fontSize: 14, fontFamily: 'Roboto_700Bold' },
  settleBtn: { backgroundColor: '#DCFCE7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  settleBtnText: { fontSize: 10, fontFamily: 'Roboto_500Medium', color: '#15803D' },
});