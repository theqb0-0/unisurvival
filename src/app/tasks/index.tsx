import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
import {
  formatDueLabel,
  mockMoneyTasks,
  MoneyTask,
  MoneyTaskType,
  TASK_TYPES,
} from '../../lib/money-tasks';
import { supabase } from '../../lib/supabase';
import { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function MoneyTasksScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tasks, setTasks] = useState<MoneyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(todayIso());
  const [type, setType] = useState<MoneyTaskType>('plan');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  const openTasks = tasks.filter(t => t.status === 'open');
  const doneTasks = tasks.filter(t => t.status === 'done');

  const toggleDone = async (task: MoneyTask) => {
    const next = task.status === 'open' ? 'done' : 'open';
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (DEV_MOCK) {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
      }
      return;
    }

    const { error } = await supabase
      .from('money_tasks')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', task.id);

    if (error) {
      setToast(error.message);
      return;
    }
    loadTasks();
  };

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setDueDate(todayIso());
    setType('plan');
    setModalOpen(false);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setToast('Add a title for this task.');
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const parsedAmount = amount.trim() ? parseFloat(amount) : null;

    if (!user) {
      if (DEV_MOCK) {
        setTasks(prev => [...prev, {
          id: Date.now().toString(),
          title: title.trim(),
          amount: parsedAmount,
          due_date: dueDate,
          type,
          status: 'open',
        }]);
      }
      setSaving(false);
      resetForm();
      setToast('Task added.');
      return;
    }

    const { error } = await supabase.from('money_tasks').insert({
      user_id: user.id,
      title: title.trim(),
      amount: parsedAmount,
      due_date: dueDate,
      type,
      status: 'open',
    });

    setSaving(false);
    if (error) {
      setToast(error.message);
      return;
    }
    resetForm();
    setToast('Task added.');
    loadTasks();
  };

  const renderTask = (task: MoneyTask, showBorder: boolean) => (
    <View key={task.id} style={[styles.taskRow, !showBorder && { borderBottomWidth: 0 }]}>
      <TouchableOpacity onPress={() => toggleDone(task)} hitSlop={8}>
        <Ionicons
          name={task.status === 'done' ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
          color={task.status === 'done' ? colors.green : colors.muted}
        />
      </TouchableOpacity>
      <View style={styles.taskInfo}>
        <Text style={[styles.taskTitle, task.status === 'done' && styles.taskDone]}>
          {task.title}
        </Text>
        <Text style={styles.taskMeta}>
          {task.type} · {formatDueLabel(task.due_date)}
        </Text>
      </View>
      {task.amount != null && (
        <Text style={styles.taskAmount}>R{task.amount}</Text>
      )}
    </View>
  );

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
        <Text style={styles.headerTitle}>Money tasks</Text>
        <TouchableOpacity onPress={() => setModalOpen(true)} hitSlop={12}>
          <Ionicons name="add" size={26} color={colors.green} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={styles.lead}>
          Payments, savings, and plans with a due date. Done tasks stay for your records.
        </Text>

        <Text style={styles.sectionLabel}>Open</Text>
        <View style={styles.card}>
          {openTasks.length === 0 ? (
            <Text style={styles.empty}>No open tasks. Tap + to add one.</Text>
          ) : (
            openTasks.map((t, i) => renderTask(t, i < openTasks.length - 1))
          )}
        </View>

        {doneTasks.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Done</Text>
            <View style={styles.card}>
              {doneTasks.map((t, i) => renderTask(t, i < doneTasks.length - 1))}
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={resetForm}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New money task</Text>
              <TouchableOpacity onPress={resetForm}>
                <Ionicons name="close" size={22} color={colors.grey} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Zintle's birthday"
              placeholderTextColor={colors.muted}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.fieldLabel}>Amount (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="600"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={styles.fieldLabel}>Due date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder={todayIso()}
              placeholderTextColor={colors.muted}
              value={dueDate}
              onChangeText={setDueDate}
            />

            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              {TASK_TYPES.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.typeChip, type === opt.value && styles.typeChipActive]}
                  onPress={() => setType(opt.value)}
                >
                  <Text style={[styles.typeChipText, type === opt.value && styles.typeChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleCreate}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color={colors.onAccent} />
                : <Text style={styles.saveBtnText}>Save task</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    lead: {
      fontSize: 13,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
      paddingHorizontal: 16,
      marginBottom: 16,
      lineHeight: 20,
    },
    sectionLabel: {
      fontSize: 13,
      fontFamily: 'Roboto_700Bold',
      color: colors.textDark,
      paddingHorizontal: 16,
      marginBottom: 8,
      marginTop: 8,
    },
    card: {
      marginHorizontal: 16,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
    },
    taskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    taskInfo: { flex: 1 },
    taskTitle: {
      fontSize: 14,
      fontFamily: 'Roboto_500Medium',
      color: colors.textDark,
    },
    taskDone: {
      textDecorationLine: 'line-through',
      color: colors.muted,
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
      paddingVertical: 24,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontFamily: 'Roboto_700Bold',
      color: colors.textDark,
    },
    fieldLabel: {
      fontSize: 11,
      fontFamily: 'Roboto_400Regular',
      color: colors.grey,
      marginTop: 12,
      marginBottom: 6,
    },
    input: {
      fontSize: 15,
      fontFamily: 'Roboto_400Regular',
      color: colors.textDark,
      borderBottomWidth: 1,
      borderBottomColor: colors.softGreen,
      paddingVertical: 10,
    },
    typeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    typeChip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    typeChipActive: {
      backgroundColor: colors.tint,
      borderColor: colors.green,
    },
    typeChipText: {
      fontSize: 12,
      fontFamily: 'Roboto_400Regular',
      color: colors.muted,
    },
    typeChipTextActive: {
      color: colors.green,
      fontFamily: 'Roboto_500Medium',
    },
    saveBtn: {
      backgroundColor: colors.green,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 24,
    },
    saveBtnText: {
      fontSize: 15,
      fontFamily: 'Roboto_700Bold',
      color: colors.onAccent,
    },
  });
}