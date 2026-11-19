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
import { DEV_MOCK } from '../../lib/dev';
import { supabase } from '../../lib/supabase';
import { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

const categories = [
  { label: 'Food', icon: 'basket-outline' },
  { label: 'Transport', icon: 'bus-outline' },
  { label: 'Data', icon: 'wifi-outline' },
  { label: 'Personal', icon: 'shirt-outline' },
];

type MoneyTask = {
  id: string;
  title: string;
  amount: number | null;
  due_date: string;
  type: string;
  status: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<MoneyTask[]>([]);
  const [spent, setSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (!DEV_MOCK) {
        setLoading(false);
        router.replace('/onboarding/splash');
        return;
      }
      setProfile({ name: 'Sipho', allowance: 1500, payday: 1 });
      setTransactions([
        { id: '1', category: 'Food', note: 'Checkers', amount: 86, type: 'expense', date: new Date().toISOString() },
        { id: '2', category: 'Transport', note: 'Taxi fare', amount: 18, type: 'expense', date: new Date().toISOString() },
      ]);
      setTasks([
        { id: '1', title: "Zintle's birthday", amount: 600, due_date: new Date().toISOString().slice(0, 10), type: 'save', status: 'open' },
        { id: '2', title: 'Pay Nandi', amount: 150, due_date: new Date().toISOString().slice(0, 10), type: 'pay', status: 'open' },
      ]);
      setSpent(104);
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(profileData);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const today = now.toISOString().slice(0, 10);

    const [{ data: txns }, { data: taskRows }] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', startOfMonth)
        .order('date', { ascending: false }),
      supabase
        .from('money_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .gte('due_date', today)
        .order('due_date', { ascending: true })
        .limit(3),
    ]);

    setTransactions(txns || []);
    setTasks((taskRows as MoneyTask[]) || []);
    const totalSpent = (txns || []).reduce((sum: number, t: any) => sum + t.amount, 0);
    setSpent(totalSpent);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const allowance = profile?.allowance || 0;
  const remaining = allowance - spent;
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const today = now.getDate();
  const daysLeft = daysInMonth - today;
  const dailyBudget = daysLeft > 0 ? remaining / daysLeft : 0;
  const progress = allowance > 0 ? spent / allowance : 0;

  const spentByCategory = categories.map(cat => ({
    ...cat,
    spent: transactions
      .filter(t => t.category === cat.label)
      .reduce((sum, t) => sum + t.amount, 0),
  }));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.green} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>UniSurvival</Text>
          <Ionicons name="notifications-outline" size={22} color={colors.green} />
        </View>

        <View style={styles.balanceArea}>
          <Text style={styles.greeting}>
            Morning, {profile?.name || 'there'}
          </Text>
          <Text style={styles.balance}>
            R{remaining.toFixed(0)}
          </Text>
          <Text style={styles.balanceSub}>left this month</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Daily budget</Text>
          <Text style={styles.heroAmount}>
            R{dailyBudget.toFixed(0)} / day
          </Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>
              Day {today} of {daysInMonth}
            </Text>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{daysLeft} days left</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Money tasks</Text>
            <TouchableOpacity onPress={() => router.push('/tasks')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.txnCard}>
            {tasks.length === 0 ? (
              <TouchableOpacity onPress={() => router.push('/tasks')}>
                <Text style={styles.emptyText}>
                  Plan a payment or save goal. Tap to add a money task.
                </Text>
              </TouchableOpacity>
            ) : (
              tasks.map((task, i) => (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.txnRow, i === tasks.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => router.push('/tasks')}
                >
                  <Ionicons name="checkbox-outline" size={16} color={colors.green} />
                  <View style={styles.txnInfo}>
                    <Text style={styles.txnName}>{task.title}</Text>
                    <Text style={styles.txnDate}>{task.type} · {task.due_date}</Text>
                  </View>
                  {task.amount != null && (
                    <Text style={styles.txnAmount}>R{task.amount}</Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
          <TouchableOpacity style={styles.calendarLink} onPress={() => router.push('/calendar')}>
            <Ionicons name="calendar-outline" size={16} color={colors.blue} />
            <Text style={styles.calendarLinkText}>Open money calendar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Log Spending</Text>
          <View style={styles.categoryRow}>
            {spentByCategory.map(cat => (
              <TouchableOpacity
                key={cat.label}
                style={styles.categoryItem}
                onPress={() => router.push('/(tabs)/log')}
              >
                <Ionicons name={cat.icon as any} size={26} color={colors.green} />
                <Text style={styles.categoryLabel}>{cat.label}</Text>
                <Text style={styles.categorySpent}>
                  R{cat.spent.toFixed(0)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { marginBottom: 32 }]}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Recent</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/log')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.txnCard}>
            {transactions.length === 0 ? (
              <Text style={styles.emptyText}>
                No expenses logged yet. Tap a category above to start.
              </Text>
            ) : (
              transactions.slice(0, 5).map((txn, i) => (
                <View
                  key={txn.id}
                  style={[
                    styles.txnRow,
                    i === Math.min(transactions.length, 5) - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Ionicons name="receipt-outline" size={16} color={colors.grey} />
                  <View style={styles.txnInfo}>
                    <Text style={styles.txnName}>{txn.category}</Text>
                    <Text style={styles.txnDate}>{txn.note || 'No note'}</Text>
                  </View>
                  <Text style={styles.txnAmount}>
                    - R{txn.amount.toFixed(0)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.canvas },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    headerTitle: {
      fontSize: 22,
      fontFamily: 'Roboto_700Bold',
      color: colors.textDark,
    },
    balanceArea: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    greeting: {
      fontSize: 13,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
      marginBottom: 8,
    },
    balance: {
      fontSize: 40,
      fontFamily: 'Roboto_700Bold',
      color: colors.textDark,
      letterSpacing: -1,
    },
    balanceSub: {
      fontSize: 13,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
      marginTop: 4,
    },
    heroCard: {
      backgroundColor: colors.deep,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    heroLabel: {
      fontSize: 12,
      fontFamily: 'Roboto_400Regular',
      color: colors.onDeepMuted,
      marginBottom: 8,
    },
    heroAmount: {
      fontSize: 22,
      fontFamily: 'Roboto_700Bold',
      color: colors.onDeepTitle,
      marginBottom: 16,
    },
    progressBg: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 4,
      height: 4,
      marginBottom: 8,
    },
    progressFill: {
      backgroundColor: colors.green,
      borderRadius: 4,
      height: 4,
    },
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    progressLabel: {
      fontSize: 11,
      fontFamily: 'Roboto_400Regular',
      color: colors.onDeepMuted,
    },
    chip: {
      backgroundColor: colors.softGreen,
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    chipText: {
      fontSize: 11,
      fontFamily: 'Roboto_500Medium',
      color: colors.green,
    },
    section: { paddingHorizontal: 16, marginTop: 32 },
    sectionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 15,
      fontFamily: 'Roboto_700Bold',
      color: colors.textDark,
      marginBottom: 16,
    },
    seeAll: {
      fontSize: 12,
      fontFamily: 'Roboto_500Medium',
      color: colors.green,
    },
    txnCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    calendarLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 16,
    },
    calendarLinkText: {
      fontSize: 13,
      fontFamily: 'Roboto_500Medium',
      color: colors.blue,
    },
    categoryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    categoryItem: { alignItems: 'center', gap: 8 },
    categoryLabel: {
      fontSize: 11,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
    },
    categorySpent: {
      fontSize: 11,
      fontFamily: 'Roboto_500Medium',
      color: colors.textDark,
    },
    txnRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    txnInfo: { flex: 1 },
    txnName: {
      fontSize: 13,
      fontFamily: 'Roboto_500Medium',
      color: colors.textDark,
    },
    txnDate: {
      fontSize: 11,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
      marginTop: 4,
    },
    txnAmount: {
      fontSize: 13,
      fontFamily: 'Roboto_500Medium',
      color: colors.textDark,
    },
    emptyText: {
      fontSize: 13,
      fontFamily: 'Roboto_400Regular',
      color: colors.muted,
      textAlign: 'center',
      paddingVertical: 24,
      lineHeight: 20,
    },
  });
}
