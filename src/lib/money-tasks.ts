export type MoneyTaskType = 'pay' | 'save' | 'plan';
export type MoneyTaskStatus = 'open' | 'done';

export type MoneyTask = {
  id: string;
  title: string;
  amount: number | null;
  due_date: string;
  type: MoneyTaskType;
  status: MoneyTaskStatus;
  note?: string | null;
};

export const TASK_TYPES: { value: MoneyTaskType; label: string }[] = [
  { value: 'pay', label: 'Pay' },
  { value: 'save', label: 'Save' },
  { value: 'plan', label: 'Plan' },
];

export const mockMoneyTasks: MoneyTask[] = [
  {
    id: '1',
    title: "Zintle's birthday",
    amount: 600,
    due_date: new Date().toISOString().slice(0, 10),
    type: 'save',
    status: 'open',
  },
  {
    id: '2',
    title: 'Pay Nandi',
    amount: 150,
    due_date: new Date().toISOString().slice(0, 10),
    type: 'pay',
    status: 'open',
  },
];

export function formatDueLabel(isoDate: string) {
  const d = new Date(isoDate + 'T12:00:00');
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}