import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

const mockDebts = [
  { id: '1', name: 'Nandi', detail: 'Borrowed for groceries · 8 days ago', amount: 150, direction: 'i_owe', settled: false },
  { id: '2', name: 'Payflex', detail: 'Woolworths order · Due 30 Jul', amount: 200, direction: 'i_owe', settled: false },
  { id: '3', name: 'Thabo', detail: 'Covered his lunch · 3 days ago', amount: 80, direction: 'owed_to_me', settled: false },
];

function Avatar({ name, isStore }: { name: string; isStore?: boolean }) {
  return (
    <View style={[styles.avatar, isStore && styles.avatarStore]}>
      {isStore
        ? <Ionicons name="storefront-outline" size={14} color="#6B7280" />
        : <Text style={styles.avatarText}>{name[0]?.toUpperCase()}</Text>
      }
    </View>
  );
}

export default function DebtsScreen() {
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDetail, setNewDetail] = useState('');
  const [newDirection, setNewDirection] = useState<'i_owe' | 'owed_to_me'>('i_owe');
  const [saving, setSaving] = useState(false);

  const loadDebts = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setDebts(mockDebts);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id)
      .eq('settled', false)
      .order('created_at', { ascending: false });

    setDebts(data || []);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { loadDebts(); }, []));

  const iOwe = debts.filter(d => d.direction === 'i_owe');
  const owedToMe = debts.filter(d => d.direction === 'owed_to_me');
  const totalIOwe = iOwe.reduce((sum, d) => sum + d.amount, 0);
  const totalOwed = owedToMe.reduce((sum, d) => sum + d.amount, 0);
  const net = totalOwed - totalIOwe;

  const handleSettle = async (debt: any) => {
    Alert.alert(
      'Settle up',
      `Mark R${debt.amount} with ${debt.name} as settled?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, settled',
          onPress: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              setDebts(prev => prev.filter(d => d.id !== debt.id));
              return;
            }
            await supabase
              .from('debts')
              .update({ settled: true })
              .eq('id', debt.id);
            loadDebts();
          },
        },
      ]
    );
  };

  const handleAddDebt = async () => {
    if (!newName.trim()) {
      Alert.alert('Quick check', 'Enter a name.');
      return;
    }
    if (!newAmount.trim()) {
      Alert.alert('Quick check', 'Enter an amount.');
      return;
    }

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const mock = {
        id: Date.now().toString(),
        name: newName,
        amount: parseFloat(newAmount),
        direction: newDirection,
        detail: newDetail || 'Just added',
        settled: false,
      };
      setDebts(prev => [...prev, mock]);
      resetModal();
      return;
    }

    await supabase.from('debts').insert({
      user_id: user.id,
      name: newName.trim(),
      amount: parseFloat(newAmount),
      direction: newDirection,
      detail: newDetail.trim() || null,
      settled: false,
    });

    setSaving(false);
    resetModal();
    loadDebts();
  };

  const resetModal = () => {
    setNewName('');
    setNewAmount('');
    setNewDetail('');
    setNewDirection('i_owe');
    setSaving(false);
    setModalVisible(false);
  };

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
        <Text style={styles.headerTitle}>Debts</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={16} color="#16A34A" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>I owe</Text>
              <Text style={[styles.summaryAmount, { color: '#E53E3E' }]}>
                R{totalIOwe.toFixed(0)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.summaryLabel}>Owed to me</Text>
              <Text style={[styles.summaryAmount, { color: '#16A34A' }]}>
                R{totalOwed.toFixed(0)}
              </Text>
            </View>
          </View>
          <View style={styles.summaryNet}>
            <Text style={styles.summaryNetLabel}>Net position</Text>
            <Text style={styles.summaryNetValue}>
              {net >= 0
                ? `You are R${net.toFixed(0)} up overall`
                : `You are R${Math.abs(net).toFixed(0)} down overall`
              }
            </Text>
          </View>
        </View>

        {iOwe.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>I Owe</Text>
            {iOwe.map((debt, i) => (
              <View
                key={debt.id}
                style={[
                  styles.debtRow,
                  i === iOwe.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Avatar name={debt.name} />
                <View style={styles.debtInfo}>
                  <Text style={styles.debtName}>{debt.name}</Text>
                  <Text style={styles.debtDetail}>{debt.detail}</Text>
                </View>
                <View style={styles.debtRight}>
                  <Text style={[styles.debtAmount, { color: '#E53E3E' }]}>
                    R{debt.amount}
                  </Text>
                  <TouchableOpacity
                    style={styles.settleBtn}
                    onPress={() => handleSettle(debt)}
                  >
                    <Text style={styles.settleBtnText}>Settle up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {owedToMe.length > 0 && (
          <View style={[styles.section, { marginBottom: 32 }]}>
            <Text style={styles.sectionTitle}>Owed to Me</Text>
            {owedToMe.map((debt, i) => (
              <View
                key={debt.id}
                style={[
                  styles.debtRow,
                  i === owedToMe.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Avatar name={debt.name} />
                <View style={styles.debtInfo}>
                  <Text style={styles.debtName}>{debt.name}</Text>
                  <Text style={styles.debtDetail}>{debt.detail}</Text>
                </View>
                <View style={styles.debtRight}>
                  <Text style={[styles.debtAmount, { color: '#16A34A' }]}>
                    R{debt.amount}
                  </Text>
                  <TouchableOpacity
                    style={styles.settleBtn}
                    onPress={() => handleSettle(debt)}
                  >
                    <Text style={styles.settleBtnText}>Mark paid</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {debts.length === 0 && (
          <Text style={styles.emptyText}>
            No active debts. Tap Add to record one.
          </Text>
        )}

      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={resetModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add a debt</Text>
              <TouchableOpacity onPress={resetModal}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.directionRow}>
              <TouchableOpacity
                style={[
                  styles.dirBtn,
                  newDirection === 'i_owe' && styles.dirBtnActive,
                ]}
                onPress={() => setNewDirection('i_owe')}
              >
                <Text style={[
                  styles.dirBtnText,
                  newDirection === 'i_owe' && styles.dirBtnTextActive,
                ]}>I owe someone</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dirBtn,
                  newDirection === 'owed_to_me' && styles.dirBtnActive,
                ]}
                onPress={() => setNewDirection('owed_to_me')}
              >
                <Text style={[
                  styles.dirBtnText,
                  newDirection === 'owed_to_me' && styles.dirBtnTextActive,
                ]}>Someone owes me</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Name</Text>
            <View style={styles.modalInputRow}>
              <TextInput
                style={styles.modalInput}
                placeholder="Nandi"
                placeholderTextColor="#9CA3AF"
                value={newName}
                onChangeText={setNewName}
                autoCapitalize="words"
              />
            </View>

            <Text style={styles.modalLabel}>Amount</Text>
            <View style={styles.modalInputRow}>
              <Text style={styles.modalPrefix}>R</Text>
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                placeholder="150"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={newAmount}
                onChangeText={setNewAmount}
              />
            </View>

            <Text style={styles.modalLabel}>What for? (optional)</Text>
            <View style={styles.modalInputRow}>
              <TextInput
                style={styles.modalInput}
                placeholder="Borrowed for groceries"
                placeholderTextColor="#9CA3AF"
                value={newDetail}
                onChangeText={setNewDetail}
              />
            </View>

            <TouchableOpacity
              style={[styles.modalCta, saving && { opacity: 0.7 }]}
              onPress={handleAddDebt}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.modalCtaText}>Save debt</Text>
              }
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

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
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FDF4', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  addBtnText: {
    fontSize: 13, fontFamily: 'Roboto_500Medium', color: '#16A34A',
  },
  summaryCard: {
    backgroundColor: '#F0FDF4', borderRadius: 16, padding: 16,
    marginHorizontal: 20, marginTop: 20,
    shadowColor: '#041202', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11, fontFamily: 'Roboto_400Regular',
    color: '#6B7280', marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 24, fontFamily: 'Roboto_700Bold', letterSpacing: -0.5,
  },
  summaryDivider: {
    width: 0.5, height: 40, backgroundColor: '#DCFCE7',
  },
  summaryNet: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 12, paddingTop: 12,
    borderTopWidth: 0.5, borderTopColor: '#DCFCE7',
  },
  summaryNetLabel: {
    fontSize: 11, fontFamily: 'Roboto_400Regular', color: '#6B7280',
  },
  summaryNetValue: {
    fontSize: 12, fontFamily: 'Roboto_500Medium', color: '#333333',
  },
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionTitle: {
    fontSize: 15, fontFamily: 'Roboto_700Bold',
    color: '#333333', marginBottom: 14,
  },
  debtRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarStore: { backgroundColor: '#F3F4F6' },
  avatarText: {
    fontSize: 14, fontFamily: 'Roboto_700Bold', color: '#16A34A',
  },
  debtInfo: { flex: 1 },
  debtName: {
    fontSize: 13, fontFamily: 'Roboto_500Medium', color: '#333333',
  },
  debtDetail: {
    fontSize: 11, fontFamily: 'Roboto_400Regular',
    color: '#6B7280', marginTop: 2,
  },
  debtRight: { alignItems: 'flex-end', gap: 4 },
  debtAmount: {
    fontSize: 14, fontFamily: 'Roboto_700Bold',
  },
  settleBtn: {
    backgroundColor: '#DCFCE7', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  settleBtnText: {
    fontSize: 10, fontFamily: 'Roboto_500Medium', color: '#15803D',
  },
  emptyText: {
    fontSize: 13, fontFamily: 'Roboto_400Regular',
    color: '#9CA3AF', textAlign: 'center',
    paddingVertical: 40, paddingHorizontal: 40, lineHeight: 20,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18, fontFamily: 'Roboto_700Bold', color: '#333333',
  },
  directionRow: {
    flexDirection: 'row', gap: 10, marginBottom: 20,
  },
  dirBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 0.5, borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  dirBtnActive: {
    backgroundColor: '#F0FDF4', borderColor: '#DCFCE7',
  },
  dirBtnText: {
    fontSize: 12, fontFamily: 'Roboto_400Regular', color: '#9CA3AF',
  },
  dirBtnTextActive: {
    color: '#15803D', fontFamily: 'Roboto_500Medium',
  },
  modalLabel: {
    fontSize: 11, fontFamily: 'Roboto_400Regular',
    color: '#6B7280', marginBottom: 4, marginTop: 12,
  },
  modalInputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1.5, borderBottomColor: '#DCFCE7',
    paddingBottom: 10, gap: 6,
  },
  modalPrefix: {
    fontSize: 15, fontFamily: 'Roboto_500Medium', color: '#16A34A',
  },
  modalInput: {
    fontSize: 15, fontFamily: 'Roboto_400Regular', color: '#333333',
  },
  modalCta: {
    backgroundColor: '#16A34A', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 28,
  },
  modalCtaText: {
    fontSize: 15, fontFamily: 'Roboto_700Bold', color: '#FFFFFF',
  },
});