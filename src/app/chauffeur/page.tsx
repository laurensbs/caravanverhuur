'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Loader2, ChevronDown, ChevronRight, Check, Circle, PlayCircle,
  MapPin, User, Phone, Calendar, CreditCard, FileText, Package,
  Truck, Wrench, ClipboardCheck, AlertCircle, RefreshCw,
} from 'lucide-react';
import { useDriver } from './layout';
import { caravans as staticCaravans } from '@/data/caravans';
import { campings } from '@/data/campings';

interface Task {
  id: string;
  booking_id: string;
  task_type: string;
  status: string;
  assigned_to?: string;
  notes?: string;
  due_date?: string;
  completed_at?: string;
  completed_by?: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  booking_ref: string;
  caravan_id: string;
  camping_id: string;
  check_in: string;
  check_out: string;
  nights: number;
  booking_status: string;
  special_requests?: string;
  total_price: number;
  deposit_amount: number;
  remaining_amount: number;
  borg_amount: number;
  adults: number;
  children: number;
  spot_number?: string;
}

type Filter = 'all' | 'today' | 'upcoming' | 'completed';

const TASK_ICONS: Record<string, typeof Truck> = {
  PREP: Wrench,
  TRANSPORT: Truck,
  CHECKIN: ClipboardCheck,
  PICKUP: Truck,
  INSPECTION: ClipboardCheck,
};

const TASK_COLORS: Record<string, string> = {
  PREP: 'bg-purple-100 text-purple-700',
  TRANSPORT: 'bg-blue-100 text-blue-700',
  CHECKIN: 'bg-green-100 text-green-700',
  PICKUP: 'bg-orange-100 text-orange-700',
  INSPECTION: 'bg-amber-100 text-amber-700',
};

const STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
};

export default function DriverPage() {
  const { t, driver } = useDriver();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<string | null>(null);
  const [customCaravans, setCustomCaravans] = useState<{ id: string; name: string; reference?: string }[]>([]);

  const fetchTasks = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/driver/tasks').then(r => r.json()).then(data => setTasks(data.tasks || [])),
      fetch('/api/caravans').then(r => r.json()).then(data => setCustomCaravans(data.caravans || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    let list = tasks;
    if (filter === 'today') list = tasks.filter(t => t.due_date?.slice(0, 10) === today && t.status !== 'DONE');
    else if (filter === 'upcoming') list = tasks.filter(t => (t.due_date?.slice(0, 10) || '') >= today && t.status !== 'DONE');
    else if (filter === 'completed') list = tasks.filter(t => t.status === 'DONE');
    return list;
  }, [tasks, filter, today]);

  const todayCount = useMemo(() => tasks.filter(t => t.due_date?.slice(0, 10) === today && t.status !== 'DONE').length, [tasks, today]);

  const getCaravanName = (id: string) => {
    const s = staticCaravans.find(c => c.id === id);
    if (s) return s.name;
    const c = customCaravans.find(c => c.id === id);
    return c?.name || id;
  };

  const getCampingName = (id: string) => {
    const c = campings.find(c => c.id === id);
    return c?.name || id;
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }); }
    catch { return d; }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setUpdatingId(taskId);
    try {
      const res = await fetch('/api/driver/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status: newStatus }),
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === taskId ? {
          ...t,
          status: newStatus,
          completed_at: newStatus === 'DONE' ? new Date().toISOString() : undefined,
          completed_by: newStatus === 'DONE' ? driver.name : undefined,
        } : t));
      }
    } catch {}
    setUpdatingId(null);
  };

  const handleSaveNotes = async (taskId: string) => {
    const text = notes[taskId];
    if (text === undefined) return;
    setSavingNotes(taskId);
    try {
      await fetch('/api/driver/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, notes: text }),
      });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, notes: text } : t));
    } catch {}
    setSavingNotes(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">{t('tasks.title')}</h1>
        <button onClick={fetchTasks} className="p-2 text-gray-400 hover:text-blue-600 transition cursor-pointer">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm">
        {(['all', 'today', 'upcoming', 'completed'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filter === f ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {t(`tasks.${f}`)}
            {f === 'today' && todayCount > 0 && (
              <span className={`ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                filter === f ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
              }`}>{todayCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">{t('tasks.empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const expanded = expandedId === task.id;
            const Icon = TASK_ICONS[task.task_type] || FileText;
            const isToday = task.due_date?.slice(0, 10) === today;
            const isOverdue = task.due_date && task.due_date.slice(0, 10) < today && task.status !== 'DONE';

            return (
              <div key={task.id} className={`bg-white rounded-xl shadow-sm overflow-hidden ${isOverdue ? 'ring-2 ring-red-200' : ''}`}>
                {/* Task header - always visible */}
                <button
                  onClick={() => setExpandedId(expanded ? null : task.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left cursor-pointer"
                >
                  {/* Status indicator */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    task.status === 'DONE' ? 'bg-green-500 text-white' :
                    task.status === 'IN_PROGRESS' ? 'bg-blue-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {task.status === 'DONE' ? <Check className="w-4 h-4" /> :
                     task.status === 'IN_PROGRESS' ? <PlayCircle className="w-4 h-4" /> :
                     <Circle className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TASK_COLORS[task.task_type] || 'bg-gray-100 text-gray-600'}`}>
                        <Icon className="w-3 h-3" />
                        {t(`task.${task.task_type}`)}
                      </span>
                      {isToday && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">{t('tasks.today')}</span>}
                      {isOverdue && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">!</span>}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">{task.guest_name}</p>
                    <p className="text-xs text-gray-500">{task.due_date ? formatDate(task.due_date) : ''} · {getCampingName(task.camping_id)}</p>
                  </div>

                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded details */}
                {expanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                    {/* Customer info */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium text-gray-900">{task.guest_name}</span>
                      </div>
                      {task.guest_phone && (
                        <a href={`tel:${task.guest_phone}`} className="flex items-center gap-2 text-sm text-blue-600">
                          <Phone className="w-3.5 h-3.5" />
                          {task.guest_phone}
                        </a>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{getCampingName(task.camping_id)}</span>
                        {task.spot_number && <span className="font-semibold text-blue-600">#{task.spot_number}</span>}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Truck className="w-3.5 h-3.5 text-gray-400" />
                        <span>{getCaravanName(task.caravan_id)}</span>
                      </div>
                    </div>

                    {/* Stay details */}
                    <div className="bg-gray-50 rounded-lg p-2.5 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500"><Calendar className="w-3 h-3 inline mr-1" />{t('task.dates')}</span>
                        <span className="font-medium">{formatDate(task.check_in)} → {formatDate(task.check_out)} ({task.nights} {t('task.nights')})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('task.persons')}</span>
                        <span className="font-medium">{task.adults} {t('task.adults')}{task.children > 0 ? `, ${task.children} ${t('task.children')}` : ''}</span>
                      </div>
                      {task.special_requests && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">{t('task.extras')}</span>
                          <span className="font-medium text-right">{task.special_requests.split(' | ').join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Amounts to collect - only for CHECKIN/PICKUP tasks */}
                    {(task.task_type === 'CHECKIN' || task.task_type === 'PICKUP' || task.task_type === 'TRANSPORT') && (
                      <div className="bg-amber-50 rounded-lg p-2.5 text-xs space-y-1">
                        <p className="font-bold text-amber-800 text-[10px] uppercase tracking-wider mb-1"><CreditCard className="w-3 h-3 inline mr-1" />{t('task.toCollect')}</p>
                        <div className="flex justify-between">
                          <span className="text-amber-700">{t('task.remaining')}</span>
                          <span className="font-bold text-amber-900">€{Number(task.remaining_amount).toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-700">{t('task.deposit')}</span>
                          <span className="font-bold text-amber-900">€{Number(task.borg_amount).toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-amber-200">
                          <span className="font-bold text-amber-800">{t('task.total')}</span>
                          <span className="font-black text-amber-900 text-sm">€{(Number(task.remaining_amount) + Number(task.borg_amount)).toFixed(0)}</span>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">{t('task.notes')}</label>
                      <textarea
                        value={notes[task.id] ?? task.notes ?? ''}
                        onChange={(e) => setNotes(prev => ({ ...prev, [task.id]: e.target.value }))}
                        rows={2}
                        placeholder={t('task.notesPlaceholder')}
                        className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      {(notes[task.id] !== undefined && notes[task.id] !== (task.notes || '')) && (
                        <button
                          onClick={() => handleSaveNotes(task.id)}
                          disabled={savingNotes === task.id}
                          className="mt-1 text-xs text-blue-600 font-semibold cursor-pointer"
                        >
                          {savingNotes === task.id ? t('task.saving') : t('task.saved').replace('d', '') + '...'}
                        </button>
                      )}
                    </div>

                    {/* Status actions */}
                    <div className="flex gap-2">
                      {task.status === 'TODO' && (
                        <button
                          onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                          disabled={updatingId === task.id}
                          className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {updatingId === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                          {t('task.markInProgress')}
                        </button>
                      )}
                      {task.status === 'IN_PROGRESS' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(task.id, 'DONE')}
                            disabled={updatingId === task.id}
                            className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {updatingId === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {t('task.markDone')}
                          </button>
                          <button
                            onClick={() => handleStatusChange(task.id, 'TODO')}
                            disabled={updatingId === task.id}
                            className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-50"
                          >
                            {t('task.markTodo')}
                          </button>
                        </>
                      )}
                      {task.status === 'DONE' && (
                        <button
                          onClick={() => handleStatusChange(task.id, 'TODO')}
                          disabled={updatingId === task.id}
                          className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-50"
                        >
                          {t('task.markTodo')}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
