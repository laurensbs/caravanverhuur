'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  CarFront,
  CheckSquare,
  Clock,
  MapPin,
  User,
  ChevronRight,
  Loader2,
  Check,
  Circle,
  PlayCircle,
  Truck,
  Wrench,
  SprayCan,
  ClipboardCheck,
  LogIn,
  LogOut,
  Package,
  Search,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '@/i18n/admin-context';
import { useToast } from '@/components/AdminToast';
import {
  getBookingCaravan,
  getBookingCamping,
  formatDate,
  loadCustomData,
  type Booking,
} from '@/data/admin';
import { caravans } from '@/data/caravans';

// ===== TYPES =====

type TaskType = 'PREP' | 'TRANSPORT' | 'SETUP' | 'CHECKIN' | 'CHECKOUT' | 'PICKUP' | 'CLEANING' | 'INSPECTION';
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
type TabType = 'agenda' | 'caravans' | 'tasks';

interface BookingTask {
  id: string;
  booking_id: string;
  task_type: TaskType;
  status: TaskStatus;
  assigned_to?: string;
  notes?: string;
  due_date?: string;
  completed_at?: string;
  completed_by?: string;
  // Joined fields
  guest_name: string;
  booking_ref: string;
  caravan_id: string;
  camping_id: string;
  check_in: string;
  check_out: string;
  booking_status: string;
}

// ===== CONSTANTS =====

const TASK_ICONS: Record<TaskType, React.ElementType> = {
  PREP: Wrench,
  TRANSPORT: Truck,
  SETUP: Package,
  CHECKIN: LogIn,
  CHECKOUT: LogOut,
  PICKUP: Truck,
  CLEANING: SprayCan,
  INSPECTION: ClipboardCheck,
};

const TASK_COLORS: Record<TaskType, string> = {
  PREP: 'bg-amber-100 text-amber-700',
  TRANSPORT: 'bg-blue-100 text-blue-700',
  SETUP: 'bg-indigo-100 text-indigo-700',
  CHECKIN: 'bg-green-100 text-green-700',
  CHECKOUT: 'bg-orange-100 text-orange-700',
  PICKUP: 'bg-blue-100 text-blue-700',
  CLEANING: 'bg-pink-100 text-pink-700',
  INSPECTION: 'bg-purple-100 text-purple-700',
};

const STATUS_ICONS: Record<TaskStatus, React.ElementType> = {
  TODO: Circle,
  IN_PROGRESS: PlayCircle,
  DONE: Check,
};

// ===== HELPER =====

function getTaskLabel(taskType: TaskType, locale: string): string {
  const labels: Record<string, Record<TaskType, string>> = {
    nl: {
      PREP: 'Klaarmaken',
      TRANSPORT: 'Vervoeren',
      SETUP: 'Opzetten',
      CHECKIN: 'Inchecken',
      CHECKOUT: 'Uitchecken',
      PICKUP: 'Ophalen',
      CLEANING: 'Schoonmaken',
      INSPECTION: 'Inspectie',
    },
    en: {
      PREP: 'Prepare',
      TRANSPORT: 'Transport',
      SETUP: 'Set up',
      CHECKIN: 'Check-in',
      CHECKOUT: 'Check-out',
      PICKUP: 'Pick up',
      CLEANING: 'Clean',
      INSPECTION: 'Inspect',
    },
  };
  return (labels[locale] || labels.nl)[taskType];
}

function getTaskDescription(taskType: TaskType, locale: string): string {
  const descs: Record<string, Record<TaskType, string>> = {
    nl: {
      PREP: 'Caravan schoonmaken, inventaris checken & onderhoud',
      TRANSPORT: 'Caravan vervoeren naar de camping',
      SETUP: 'Caravan opzetten, aansluiten & voortent plaatsen',
      CHECKIN: 'Gast ontvangen, sleutels & uitleg geven',
      CHECKOUT: 'Gast uitchecken, sleutels innemen',
      PICKUP: 'Caravan ophalen van de camping',
      CLEANING: 'Caravan schoonmaken na verhuur',
      INSPECTION: 'Eindinspectie & borg afhandelen',
    },
    en: {
      PREP: 'Clean caravan, check inventory & maintenance',
      TRANSPORT: 'Transport caravan to camping',
      SETUP: 'Set up caravan, connect utilities & awning',
      CHECKIN: 'Receive guest, hand over keys & instructions',
      CHECKOUT: 'Check out guest, collect keys',
      PICKUP: 'Pick up caravan from camping',
      CLEANING: 'Clean caravan after rental',
      INSPECTION: 'Final inspection & handle deposit',
    },
  };
  return (descs[locale] || descs.nl)[taskType];
}

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

function getUrgencyColor(daysUntil: number, status: TaskStatus): string {
  if (status === 'DONE') return 'text-green-600';
  if (daysUntil < 0) return 'text-red-600 font-semibold';
  if (daysUntil === 0) return 'text-orange-600 font-semibold';
  if (daysUntil <= 2) return 'text-amber-600';
  return 'text-muted';
}

function getDueDateLabel(dateStr: string, locale: string): string {
  const days = getDaysUntil(dateStr);
  if (locale === 'en') {
    if (days < -1) return `${Math.abs(days)} days overdue`;
    if (days === -1) return 'Yesterday';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  }
  if (days < -1) return `${Math.abs(days)} dagen te laat`;
  if (days === -1) return 'Gisteren';
  if (days === 0) return 'Vandaag';
  if (days === 1) return 'Morgen';
  return `Over ${days} dagen`;
}

// ===== COMPONENTS =====

function TaskStatusButton({ task, onToggle }: { task: BookingTask; onToggle: (task: BookingTask) => void }) {
  const nextStatus: Record<TaskStatus, TaskStatus> = {
    TODO: 'IN_PROGRESS',
    IN_PROGRESS: 'DONE',
    DONE: 'TODO',
  };

  const statusColors: Record<TaskStatus, string> = {
    TODO: 'border-gray-300 bg-white',
    IN_PROGRESS: 'border-amber-400 bg-amber-50',
    DONE: 'border-green-500 bg-green-500',
  };

  const Icon = STATUS_ICONS[task.status];

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle({ ...task, status: nextStatus[task.status] }); }}
      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer active:scale-90 ${statusColors[task.status]}`}
    >
      <Icon className={`w-4 h-4 ${task.status === 'DONE' ? 'text-white' : task.status === 'IN_PROGRESS' ? 'text-amber-600' : 'text-gray-400'}`} />
    </button>
  );
}

function TaskCard({
  task,
  onToggle,
  onSelect,
  compact = false,
  locale,
}: {
  task: BookingTask;
  onToggle: (task: BookingTask) => void;
  onSelect: (task: BookingTask) => void;
  compact?: boolean;
  locale: string;
}) {
  const caravan = getBookingCaravan({ caravan_id: task.caravan_id } as Booking);
  const camping = getBookingCamping({ camping_id: task.camping_id } as Booking);
  const TaskIcon = TASK_ICONS[task.task_type];
  const daysUntil = task.due_date ? getDaysUntil(task.due_date) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl p-3 shadow-sm border border-gray-100 active:bg-gray-50 transition-colors ${task.status === 'DONE' ? 'opacity-60' : ''}`}
      onClick={() => onSelect(task)}
    >
      <div className="flex items-start gap-2.5">
        <TaskStatusButton task={task} onToggle={onToggle} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TASK_COLORS[task.task_type]}`}>
              <TaskIcon className="w-3 h-3" />
              {getTaskLabel(task.task_type, locale)}
            </span>
            {daysUntil !== null && (
              <span className={`text-xs ${getUrgencyColor(daysUntil, task.status)}`}>
                {getDueDateLabel(task.due_date!, locale)}
              </span>
            )}
          </div>
          {!compact && (
            <>
              <p className="text-sm font-medium text-foreground truncate">{task.guest_name}</p>
              <p className="text-xs text-muted truncate">
                {caravan?.name || task.caravan_id} → {camping?.name || task.camping_id}
              </p>
            </>
          )}
          {task.assigned_to && (
            <p className="text-xs text-primary mt-0.5 flex items-center gap-1">
              <User className="w-3 h-3" /> {task.assigned_to}
            </p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted shrink-0 mt-1" />
      </div>
    </motion.div>
  );
}

function TaskDetail({
  task,
  onClose,
  onToggle,
  onSave,
  locale,
}: {
  task: BookingTask;
  onClose: () => void;
  onToggle: (task: BookingTask) => void;
  onSave: (taskId: string, updates: { assignedTo?: string; notes?: string }) => void;
  locale: string;
}) {
  const [assignedTo, setAssignedTo] = useState(task.assigned_to || '');
  const [notes, setNotes] = useState(task.notes || '');
  const [saving, setSaving] = useState(false);
  const caravan = getBookingCaravan({ caravan_id: task.caravan_id } as Booking);
  const camping = getBookingCamping({ camping_id: task.camping_id } as Booking);
  const TaskIcon = TASK_ICONS[task.task_type];

  const handleSave = async () => {
    setSaving(true);
    await onSave(task.id, { assignedTo, notes });
    setSaving(false);
  };

  const isNl = locale !== 'en';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl sm:rounded-t-2xl p-4 border-b border-gray-100 z-10">
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3 sm:hidden" />
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${TASK_COLORS[task.task_type]}`}>
              <TaskIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{getTaskLabel(task.task_type, locale)}</h3>
              <p className="text-xs text-muted">{getTaskDescription(task.task_type, locale)}</p>
            </div>
            <TaskStatusButton task={task} onToggle={onToggle} />
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Booking info */}
          <div className="bg-surface rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted" />
              <span className="font-medium">{task.guest_name}</span>
              <span className="text-muted ml-auto text-xs">{task.booking_ref}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CarFront className="w-4 h-4 text-muted" />
              <span>{caravan?.name || task.caravan_id}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted" />
              <span>{camping?.name || task.camping_id}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted" />
              <span>{formatDate(task.check_in)} → {formatDate(task.check_out)}</span>
            </div>
            {task.due_date && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted" />
                <span className={getUrgencyColor(getDaysUntil(task.due_date), task.status)}>
                  {isNl ? 'Deadline' : 'Due'}: {formatDate(task.due_date)} ({getDueDateLabel(task.due_date, locale)})
                </span>
              </div>
            )}
          </div>

          {/* Assigned to */}
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">
              {isNl ? 'Toegewezen aan' : 'Assigned to'}
            </label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder={isNl ? 'Naam medewerker...' : 'Staff member name...'}
              className="w-full px-3 py-2.5 bg-surface rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-all"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">
              {isNl ? 'Notities' : 'Notes'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isNl ? 'Bijzonderheden, aandachtspunten...' : 'Details, notes...'}
              rows={3}
              className="w-full px-3 py-2.5 bg-surface rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-all resize-none"
            />
          </div>

          {/* Completed info */}
          {task.status === 'DONE' && task.completed_at && (
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs text-green-700 font-medium flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                {isNl ? 'Afgerond' : 'Completed'} {formatDate(task.completed_at)}
                {task.completed_by && ` ${isNl ? 'door' : 'by'} ${task.completed_by}`}
              </p>
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isNl ? 'Opslaan' : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ===== MAIN COMPONENT =====

export default function PlanningPage() {
  const { t, locale } = useAdmin();
  const { toast } = useToast();
  const isNl = locale !== 'en';

  const [tasks, setTasks] = useState<BookingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('agenda');
  const [selectedTask, setSelectedTask] = useState<BookingTask | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Close task detail on Escape
  useEffect(() => {
    if (!selectedTask) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedTask(null); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [selectedTask]);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/tasks');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch {
      setError(isNl ? 'Kon taken niet laden' : 'Could not load tasks');
    } finally {
      setLoading(false);
    }
  }, [isNl]);

  useEffect(() => { loadCustomData(); fetchTasks(); }, [fetchTasks]);

  const handleToggle = async (task: BookingTask) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    if (selectedTask?.id === task.id) setSelectedTask({ ...selectedTask, status: task.status });

    try {
      await fetch('/api/admin/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, status: task.status, completedBy: task.status === 'DONE' ? 'Staff' : undefined }),
      });
    } catch {
      toast(t('common.actionFailed'), 'error');
      fetchTasks(); // Revert on error
    }
  };

  const handleSave = async (taskId: string, updates: { assignedTo?: string; notes?: string }) => {
    try {
      await fetch('/api/admin/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, assignedTo: updates.assignedTo, notes: updates.notes }),
      });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assigned_to: updates.assignedTo, notes: updates.notes } : t));
      setSelectedTask(null);
      toast(t('common.saved'), 'success');
    } catch {
      toast(t('common.actionFailed'), 'error');
    }
  };

  // ===== COMPUTED DATA =====

  const filteredTasks = tasks.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.guest_name.toLowerCase().includes(q) ||
        t.booking_ref.toLowerCase().includes(q) ||
        (getBookingCaravan({ caravan_id: t.caravan_id } as Booking)?.name || '').toLowerCase().includes(q) ||
        (getBookingCamping({ camping_id: t.camping_id } as Booking)?.name || '').toLowerCase().includes(q);
    }
    return true;
  });

  // Group tasks by date for agenda view
  const tasksByDate = filteredTasks.reduce<Record<string, BookingTask[]>>((acc, task) => {
    const key = task.due_date || 'no-date';
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {});

  const sortedDates = Object.keys(tasksByDate)
    .filter(d => d !== 'no-date')
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // Group tasks by booking for caravan view
  const tasksByBooking = tasks.reduce<Record<string, BookingTask[]>>((acc, task) => {
    if (!acc[task.booking_id]) acc[task.booking_id] = [];
    acc[task.booking_id].push(task);
    return acc;
  }, {});

  // Caravan status
  const caravanStatuses = caravans.map(caravan => {
    const caravanTasks = tasks.filter(t => t.caravan_id === caravan.id);
    const activeBookingTasks = caravanTasks.filter(t => t.booking_status !== 'GEANNULEERD' && t.booking_status !== 'AFGEROND');

    // Find current/next booking
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const currentTasks = activeBookingTasks.filter(t => {
      const checkIn = new Date(t.check_in);
      const checkOut = new Date(t.check_out);
      return now >= checkIn && now <= checkOut;
    });
    const upcomingTasks = activeBookingTasks.filter(t => new Date(t.check_in) > now);

    const currentBookingId = currentTasks.length > 0 ? currentTasks[0].booking_id : null;
    const nextBookingId = upcomingTasks.length > 0 ? upcomingTasks[0].booking_id : null;

    let status: 'available' | 'on-site' | 'prep-needed' | 'in-use' = 'available';
    if (currentBookingId) status = 'in-use';
    else if (nextBookingId) {
      const nextCheckIn = new Date(upcomingTasks[0].check_in);
      const daysUntil = Math.ceil((nextCheckIn.getTime() - now.getTime()) / 86400000);
      status = daysUntil <= 7 ? 'prep-needed' : 'available';
    }

    const currentBookingTasks = currentBookingId ? tasksByBooking[currentBookingId] : null;
    const nextBookingTasks = nextBookingId ? tasksByBooking[nextBookingId] : null;

    return { caravan, status, currentBookingTasks, nextBookingTasks, currentBookingId, nextBookingId };
  });

  // Stats
  const todoCount = tasks.filter(t => t.status === 'TODO').length;
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const doneCount = tasks.filter(t => t.status === 'DONE').length;
  const overdueCount = tasks.filter(t => t.status !== 'DONE' && t.due_date && getDaysUntil(t.due_date) < 0).length;
  const todayCount = tasks.filter(t => t.status !== 'DONE' && t.due_date && getDaysUntil(t.due_date) === 0).length;

  // ===== RENDER =====

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-8 h-8 text-danger mx-auto mb-2" />
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  const tabs: { key: TabType; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'agenda', label: isNl ? 'Agenda' : 'Schedule', icon: Calendar, count: todayCount + overdueCount },
    { key: 'caravans', label: 'Caravans', icon: CarFront },
    { key: 'tasks', label: isNl ? 'Taken' : 'Tasks', icon: CheckSquare, count: todoCount + inProgressCount },
  ];

  return (
    <div className="space-y-3">
      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: isNl ? 'Te doen' : 'To do', value: todoCount, color: 'bg-gray-100 text-gray-700' },
          { label: isNl ? 'Bezig' : 'In progress', value: inProgressCount, color: 'bg-amber-100 text-amber-700' },
          { label: isNl ? 'Klaar' : 'Done', value: doneCount, color: 'bg-green-100 text-green-700' },
          { label: isNl ? 'Te laat' : 'Overdue', value: overdueCount, color: overdueCount > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-xl p-2 sm:p-3 text-center ${stat.color}`}
          >
            <p className="text-lg sm:text-2xl font-bold">{stat.value}</p>
            <p className="text-[10px] sm:text-xs font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex bg-white rounded-xl p-1 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count ? (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-white/20' : 'bg-primary-100 text-primary'
              }`}>
                {tab.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ===== AGENDA TAB ===== */}
      {activeTab === 'agenda' && (
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <Calendar className="w-10 h-10 text-muted mx-auto mb-2" />
              <p className="text-sm text-muted">
                {isNl ? 'Geen taken gevonden. Taken worden automatisch aangemaakt bij boekingen.' : 'No tasks found. Tasks are auto-created from bookings.'}
              </p>
            </div>
          ) : (
            sortedDates.map((dateStr) => {
              const dayTasks = tasksByDate[dateStr];
              const daysUntil = getDaysUntil(dateStr);
              const isToday = daysUntil === 0;
              const isPast = daysUntil < 0;
              const hasUnfinished = dayTasks.some(t => t.status !== 'DONE');

              return (
                <div key={dateStr}>
                  {/* Date header */}
                  <div className={`flex items-center gap-2 mb-2 px-1 ${isPast && hasUnfinished ? 'text-red-600' : isToday ? 'text-primary-dark' : 'text-muted'}`}>
                    <div className={`w-2 h-2 rounded-full ${isPast && hasUnfinished ? 'bg-red-500' : isToday ? 'bg-primary' : 'bg-gray-300'}`} />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {isToday ? (isNl ? '📍 Vandaag' : '📍 Today') : formatDate(dateStr)}
                    </span>
                    <span className="text-xs">
                      {getDueDateLabel(dateStr, locale)}
                    </span>
                  </div>

                  {/* Tasks for this date */}
                  <div className="space-y-1.5 ml-3 border-l-2 border-gray-200 pl-3">
                    {dayTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={handleToggle}
                        onSelect={setSelectedTask}
                        locale={locale}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ===== CARAVANS TAB ===== */}
      {activeTab === 'caravans' && (
        <div className="space-y-3">
          {caravanStatuses.map(({ caravan, status, currentBookingTasks, nextBookingTasks }) => {
            const statusLabels = {
              'available': isNl ? 'Beschikbaar' : 'Available',
              'in-use': isNl ? 'In gebruik' : 'In use',
              'prep-needed': isNl ? 'Voorbereiden' : 'Prep needed',
              'on-site': isNl ? 'Op camping' : 'On site',
            };
            const statusColors = {
              'available': 'bg-green-100 text-green-700 border-green-200',
              'in-use': 'bg-blue-100 text-blue-700 border-blue-200',
              'prep-needed': 'bg-amber-100 text-amber-700 border-amber-200',
              'on-site': 'bg-indigo-100 text-indigo-700 border-indigo-200',
            };

            const bookingTasks = currentBookingTasks || nextBookingTasks;
            const completedTasks = bookingTasks ? bookingTasks.filter(t => t.status === 'DONE').length : 0;
            const totalTasks = bookingTasks ? bookingTasks.length : 0;

            return (
              <motion.div
                key={caravan.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-3 sm:p-4 shadow-sm"
              >
                {/* Caravan header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-surface rounded-xl">
                    <CarFront className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground">{caravan.name}</h3>
                    <p className="text-xs text-muted">{caravan.reference} • {caravan.maxPersons} pers.</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[status]}`}>
                    {statusLabels[status]}
                  </span>
                </div>

                {/* Current/next booking info */}
                {bookingTasks && bookingTasks.length > 0 && (
                  <div className="bg-surface rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{bookingTasks[0].guest_name}</p>
                        <p className="text-xs text-muted flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {getBookingCamping({ camping_id: bookingTasks[0].camping_id } as Booking)?.name}
                        </p>
                        <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {formatDate(bookingTasks[0].check_in)} → {formatDate(bookingTasks[0].check_out)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{completedTasks}/{totalTasks}</p>
                        <p className="text-[10px] text-muted">{isNl ? 'taken klaar' : 'tasks done'}</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: totalTasks > 0 ? `${(completedTasks / totalTasks) * 100}%` : '0%' }}
                      />
                    </div>

                    {/* Task mini status */}
                    <div className="flex flex-wrap gap-1">
                      {bookingTasks.map(task => {
                        const TaskIcon = TASK_ICONS[task.task_type];
                        return (
                          <button
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                              task.status === 'DONE'
                                ? 'bg-green-100 text-green-700 line-through'
                                : task.status === 'IN_PROGRESS'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <TaskIcon className="w-3 h-3" />
                            {getTaskLabel(task.task_type, locale)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {(!bookingTasks || bookingTasks.length === 0) && (
                  <p className="text-xs text-muted text-center py-2">
                    {isNl ? 'Geen aankomende boekingen' : 'No upcoming bookings'}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ===== TASKS TAB ===== */}
      {activeTab === 'tasks' && (
        <div className="space-y-3">
          {/* Search & filter */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isNl ? 'Zoeken...' : 'Search...'}
                className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl text-sm border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="bg-white rounded-xl px-3 py-2.5 text-sm border border-gray-200 cursor-pointer focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="all">{isNl ? 'Alles' : 'All'}</option>
              <option value="TODO">{isNl ? 'Te doen' : 'To do'}</option>
              <option value="IN_PROGRESS">{isNl ? 'Bezig' : 'In progress'}</option>
              <option value="DONE">{isNl ? 'Klaar' : 'Done'}</option>
            </select>
          </div>

          {/* Task count */}
          <p className="text-xs text-muted px-1">
            {filteredTasks.length} {isNl ? 'taken' : 'tasks'} {t('common.found')}
          </p>

          {/* Tasks list */}
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <CheckSquare className="w-10 h-10 text-muted mx-auto mb-2" />
              <p className="text-sm text-muted">
                {isNl ? 'Geen taken gevonden' : 'No tasks found'}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  onSelect={setSelectedTask}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Task detail sheet */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetail
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onToggle={handleToggle}
            onSave={handleSave}
            locale={locale}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
