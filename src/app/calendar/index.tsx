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
import { formatDueLabel, mockMoneyTasks, MoneyTask } from '../../lib/money-tasks';
import { supabase } from '../../lib/supabase';
import { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function isoForDay(year: number, month: number, day: number) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

export default function MoneyCalendarScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tasks, setTasks] = useState<MoneyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });
  const [selectedIso, setSelectedIso] = useState(() => new Date().toISOString().slice(0, 10));

  const loadTasks = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (!DEV_MOCK) {
        setLoading(false);
        router.replace('/onboarding/splash');
        return;
      }
      setTasks(mockMoneyTasks);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('money_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'open')
      .order('due_date', { ascending: true });

    if (error) {
      setToast(error.message);
      setTasks([]);
    } else {
      setTasks((data as MoneyTask[]) || []);
    }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { loadTasks(); }, []));

  const tasksByDate = useMemo(() => {
    const map = new Map<string, MoneyTask[]>();
    for (const t of tasks) {
      const list = map.get(t.due_date) || [];
      list.push(t);
      map.set(t.due_date, list);
    }
    return map;
  }, [tasks]);

  const { year, month } = cursor;
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = firstDay.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
  const selectedTasks = tasksByDate.get(selectedIso) || [];

  const shiftMonth = (delta: number) => {
    setCursor(prev => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
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
        <Text style={styles.headerTitle}>Money calendar</Text>
        <TouchableOpacity onPress={() => router.push('/tasks')} hitSlop={12}>
          <Ionicons name="add" size={26} color={colors.green} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.monthRow}>
          <TouchableOpacity onPress={() => shiftMonth(-1)}>
            <Ionicons name="chevron-back" size={20} color={colors.green} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{monthLabel}</Text>
          <TouchableOpacity onPress={() => shiftMonth(1)}>
            <Ionicons name="chevron-forward" size={20} color={colors.green} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.weekRow}>
            {WEEKDAYS.map(w => (
              <Text key={w} style={styles.weekDay}>{w}</Text>
            ))}
          </View>
          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (day == null) {
                return <View key={`e-${i}`} style={styles.cell} />;
              }
              const iso = isoForDay(year, month, day);
              const hasTasks = tasksByDate.has(iso);
              const selected = iso === selectedIso;
              return (
                <TouchableOpacity
                  key={iso}
                  style={[styles.cell, selected && styles.cellSelected]}
                  onPress={() => setSelectedIso(iso)}
                >
                  <Text style={[styles.cellText, selected && styles.cellTextSelected]}>{day}</Text>
                  {hasTasks && <View style={styles.dot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={styles.dayHeading}>{formatDueLabel(selectedIso)}</Text>
        <View style={styles.card}>
          {selectedTasks.length === 0 ? (
            <Text style={styles.empty}>Nothing due this day. Add a task with this date.</Text>
          ) : (
            selectedTasks.map((t, i) => (
              <View
                key={t.id}
                style={[styles.taskRow, i === selectedTasks.length - 1 && { borderBottomWidth: 0 }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitle}>{t.title}</Text>
                  <Text style={styles.taskMeta}>{t.type}</Text>
                </View>
                {t.amount != null && <Text style={styles.taskAmount}>R{t.amount}</Text>}
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/tasks')}>
          <Text style={styles.linkText}>Manage all money tasks</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.green} />
        </TouchableOpacity>
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
    headerTitle: {
      fontSize: 18,
      fontFamily: 'Roboto_700Bold',
      color: colors.textDark,
    },
    monthRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      marginBottom: 8,
    },
    monthTitle: {
      fontSize: 16,
      fontFamily: 'Roboto_700Bold',
      color: colors.textDark,
    },
    card: {
      marginHorizontal: 16,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      marginBottom: 16,
    },
    weekRow: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    weekDay: {
      flex: 1,
      textAlign: 'center',
      fontSize: 10,
      fontFamily: 'Roboto_500Medium',
      color: colors.muted,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    cell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
    },
    cellSelected: {
      backgroundColor: colors.tint,
    },
    cellText: {
      fontSize: 13,
      fontFamily: 'Roboto_500Medium',
      color: colors.textDark,
    },
    cellTextSelected: {
      color: colors.green,
      fontFamily: 'Roboto_700Bold',
    },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.green,
      marginTop: 2,
    },
    dayHeading: {
      fontSize: 13,
      fontFamily: 'Roboto_700Bold',
      color: colors.textDark,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    taskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    taskTitle: {
      fontSize: 14,
      fontFamily: 'Roboto_500Medium',
      color: colors.textDark,
    },
    taskMeta: {
      fontSize: 11,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
      marginTop: 2,
    },
    taskAmount: {
      fontSize: 13,
      fontFamily: 'Roboto_700Bold',
      color: colors.textDark,
    },
    empty: {
      fontSize: 13,
      fontFamily: 'Roboto_400Regular',
      color: colors.muted,
      textAlign: 'center',
      paddingVertical: 16,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      marginTop: 8,
    },
    linkText: {
      fontSize: 13,
      fontFamily: 'Roboto_500Medium',
      color: colors.green,
    },
  });
}