'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  CarFront,
  Clock,
  MapPin,
  User,
  ChevronDown,
  Loader2,
  Check,
  Circle,
  PlayCircle,
  Truck,
  Wrench,
  ClipboardCheck,
  LogIn,
  LogOut,
  Search,
  AlertCircle,
  Filter,
  ArrowRight,
  Shield,
  ExternalLink,
  RefreshCw,
  Mail,
  Lock,
  X,
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
type ViewMode = 'timeline' | 'transport' | 'caravans';

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
  guest_name: string;
  booking_ref: string;
  caravan_id: string;
  camping_id: string;
  check_in: string;
  check_out: string;
  booking_status: string;
}

interface BorgChecklist {
  id: string;
  booking_id: string;
  type: string;
  status: string;
}

// ===== CONSTANTS =====

const TASK_ICONS: Record<string, React.ElementType> = {
  PREP: Wrench,
  TRANSPORT: Truck,
  SETUP: Wrench,
  CHECKIN: LogIn,
  CHECKOUT: LogOut,
  PICKUP: Truck,
  INSPECTION: ClipboardCheck,
};

const TASK_COLORS: Record<string, string> = {
  PREP: 'bg-amber-100 text-amber-700',
  TRANSPORT: 'bg-blue-100 text-blue-700',
  SETUP: 'bg-indigo-100 text-indigo-700',
  CHECKIN: 'bg-green-100 text-green-700',
  CHECKOUT: 'bg-orange-100 text-orange-700',
  PICKUP: 'bg-blue-100 text-blue-700',
  INSPECTION: 'bg-purple-100 text-purple-700',
};

// Sequential order — each task requires the previous to be DONE before it can be started
const TASK_SEQUENCE: TaskType[] = ['PREP', 'TRANSPORT', 'SETUP', 'CHECKIN', 'CHECKOUT', 'PICKUP', 'INSPECTION'];

function isTaskLocked(task: BookingTask, allTasksForBooking: BookingTask[]): boolean {
  const idx = TASK_SEQUENCE.indexOf(task.task_type);
  if (idx <= 0) return false; // First task is never locked
  // Check all preceding tasks in the sequence are DONE
  for (let i = 0; i < idx; i++) {
    const prevType = TASK_SEQUENCE[i];
    const prevTask = allTasksForBooking.find(t => t.task_type === prevType);
    if (prevTask && prevTask.status !== 'DONE') return true;
  }
  return false;
}

// ===== HELPERS =====

function getTaskLabel(taskType: string, locale: string): string {
  const labels: Record<string, Record<string, string>> = {
    nl: { PREP: 'Klaarmaken', TRANSPORT: 'Bezorgen', SETUP: 'Opzetten', CHECKIN: 'Inchecken', CHECKOUT: 'Uitchecken', PICKUP: 'Ophalen', INSPECTION: 'Inspectie' },
    en: { PREP: 'Prepare', TRANSPORT: 'Deliver', SETUP: 'Set up', CHECKIN: 'Check-in', CHECKOUT: 'Check-out', PICKUP: 'Pick up', INSPECTION: 'Inspect' },
  };
  return (labels[locale] || labels.nl)[taskType] || taskType;
}

function getTaskDescription(taskType: string, locale: string): string {
  const descs: Record<string, Record<string, string>> = {
    nl: {
      PREP: 'Caravan schoonmaken, beddengoed, gasflessen en inventaris checken',
      TRANSPORT: 'Caravan naar de camping rijden en op de juiste plek neerzetten',
      SETUP: 'Luifel uitklappen, gasaansluiting, stroom aansluiten en koelkast aan',
      CHECKIN: 'Gast ontvangen, sleutels overhandigen, borginspectie doen',
      CHECKOUT: 'Sleutels innemen, uitcheck-inspectie doen, borg afhandelen',
      PICKUP: 'Caravan opruimen, afkoppelen en terugrijden naar de stalling',
      INSPECTION: 'Eindcontrole op schade en inventaris na terugkomst',
    },
    en: {
      PREP: 'Clean caravan, check bedding, gas bottles and inventory',
      TRANSPORT: 'Drive caravan to campsite and place on the correct pitch',
      SETUP: 'Set up awning, connect gas, electricity and turn on fridge',
      CHECKIN: 'Welcome guest, hand over keys, perform deposit inspection',
      CHECKOUT: 'Collect keys, perform check-out inspection, handle deposit',
      PICKUP: 'Clear caravan, disconnect and drive back to storage',
      INSPECTION: 'Final check for damage and inventory after return',
    },
  };
  return (descs[locale] || descs.nl)[taskType] || '';
}

function getDaysUntil(dateStr: string): number {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

function getDueDateLabel(dateStr: string, locale: string): string {
  const days = getDaysUntil(dateStr);
  if (locale === 'en') {
    if (days < -1) return `${Math.abs(days)}d overdue`;
    if (days === -1) return 'Yesterday';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days <= 7) return `In ${days}d`;
    return formatDate(dateStr);
  }
  if (days < -1) return `${Math.abs(days)}d te laat`;
  if (days === -1) return 'Gisteren';
  if (days === 0) return 'Vandaag';
  if (days === 1) return 'Morgen';
  if (days <= 7) return `Over ${days}d`;
  return formatDate(dateStr);
}

function getUrgencyBadge(daysUntil: number, status: TaskStatus): string {
  if (status === 'DONE') return 'bg-green-50 text-green-700';
  if (daysUntil < 0) return 'bg-red-50 text-red-700';
  if (daysUntil === 0) return 'bg-orange-50 text-orange-700';
  if (daysUntil <= 2) return 'bg-amber-50 text-amber-700';
  return 'bg-gray-50 text-gray-500';
}

// ===== STATUS BUTTON =====

function TaskStatusButton({ task, onToggle, locked }: { task: BookingTask; onToggle: (task: BookingTask) => void; locked?: boolean }) {
  const nextStatus: Record<TaskStatus, TaskStatus> = { TODO: 'IN_PROGRESS', IN_PROGRESS: 'DONE', DONE: 'TODO' };
  const statusColors: Record<TaskStatus, string> = {
    TODO: 'border-gray-300 bg-white',
    IN_PROGRESS: 'border-amber-400 bg-amber-50',
    DONE: 'border-green-500 bg-green-500',
  };
  const Icon = task.status === 'DONE' ? Check : task.status === 'IN_PROGRESS' ? PlayCircle : Circle;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); if (!locked) onToggle({ ...task, status: nextStatus[task.status] }); }}
      disabled={locked}
      title={locked ? 'Vorige taak nog niet afgerond' : undefined}
      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${locked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer active:scale-90'} ${statusColors[task.status]}`}
    >
      <Icon className={`w-3.5 h-3.5 ${task.status === 'DONE' ? 'text-white' : task.status === 'IN_PROGRESS' ? 'text-amber-600' : 'text-gray-400'}`} />
    </button>
  );
}

// ===== TRIP CARD (grouped booking view) =====

interface TripData {
  bookingId: string;
  guestName: string;
  bookingRef: string;
  caravanId: string;
  campingId: string;
  checkIn: string;
  checkOut: string;
  bookingStatus: string;
  tasks: BookingTask[];
  borgChecklists: BorgChecklist[];
}

function TripCard({
  trip, onToggleTask, onSelectTask, locale, expanded, onToggleExpand,
}: {
  trip: TripData;
  onToggleTask: (task: BookingTask) => void;
  onSelectTask: (task: BookingTask) => void;
  locale: string;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const isNl = locale !== 'en';
  const caravan = getBookingCaravan({ caravan_id: trip.caravanId } as Booking);
  const camping = getBookingCamping({ camping_id: trip.campingId } as Booking);
  const daysUntilCheckIn = getDaysUntil(trip.checkIn);
  const daysUntilCheckOut = getDaysUntil(trip.checkOut);

  const completedTasks = trip.tasks.filter(t => t.status === 'DONE').length;
  const totalTasks = trip.tasks.length;
  const allDone = completedTasks === totalTasks && totalTasks > 0;

  let phase: 'upcoming' | 'active' | 'departing' | 'done' = 'upcoming';
  if (daysUntilCheckIn <= 0 && daysUntilCheckOut > 0) phase = 'active';
  else if (daysUntilCheckOut <= 0) phase = 'departing';
  if (allDone && daysUntilCheckOut < 0) phase = 'done';

  const phaseColors = { upcoming: 'border-l-blue-500', active: 'border-l-green-500', departing: 'border-l-orange-500', done: 'border-l-gray-300' };
  const phaseLabels = {
    upcoming: isNl ? 'Aankomend' : 'Upcoming',
    active: isNl ? 'Op camping' : 'On site',
    departing: isNl ? 'Vertrokken' : 'Departed',
    done: isNl ? 'Afgerond' : 'Completed',
  };

  const incheckBorg = trip.borgChecklists.find(bc => bc.type === 'INCHECKEN');
  const uitcheckBorg = trip.borgChecklists.find(bc => bc.type === 'UITCHECKEN');
  const urgentTask = trip.tasks.find(t => t.status !== 'DONE' && t.due_date && getDaysUntil(t.due_date) <= 1);

  const deliveryTasks = trip.tasks.filter(t => ['PREP', 'TRANSPORT', 'SETUP'].includes(t.task_type));
  const stayTasks = trip.tasks.filter(t => ['CHECKIN', 'CHECKOUT'].includes(t.task_type));
  const pickupTasks = trip.tasks.filter(t => ['PICKUP', 'INSPECTION'].includes(t.task_type));
  const taskGroups = [
    { label: isNl ? '🚚 Bezorging' : '🚚 Delivery', tasks: deliveryTasks, borg: incheckBorg },
    { label: isNl ? '🏕️ Verblijf' : '🏕️ Stay', tasks: stayTasks, borg: null },
    { label: isNl ? '🔙 Ophalen' : '🔙 Pickup', tasks: pickupTasks, borg: uitcheckBorg },
  ];

  return (
    <motion.div layout initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl overflow-hidden shadow-sm border-l-4 ${phaseColors[phase]} ${phase === 'done' ? 'opacity-60' : ''}`}>
      <button onClick={onToggleExpand}
        className="w-full p-3 sm:p-4 flex items-center gap-3 text-left cursor-pointer hover:bg-gray-50/50 transition-colors">
        {/* Progress ring */}
        <div className="relative w-10 h-10 shrink-0">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
            <circle cx="18" cy="18" r="15" fill="none" stroke={allDone ? '#22c55e' : '#3b82f6'} strokeWidth="3"
              strokeDasharray={`${totalTasks > 0 ? (completedTasks / totalTasks) * 94.2 : 0} 94.2`} strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">{completedTasks}/{totalTasks}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground truncate">{trip.guestName}</span>
            <span className="text-[10px] font-medium text-muted bg-gray-100 px-1.5 py-0.5 rounded">{trip.bookingRef}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
            <span className="flex items-center gap-1"><CarFront className="w-3 h-3" />{caravan?.name || trip.caravanId}</span>
            <span>→</span>
            <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" />{camping?.name || trip.campingId}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted mt-0.5">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(trip.checkIn)} → {formatDate(trip.checkOut)}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getUrgencyBadge(daysUntilCheckIn, allDone ? 'DONE' : 'TODO')}`}>
            {phase === 'active' ? phaseLabels.active : phase === 'done' ? phaseLabels.done : getDueDateLabel(trip.checkIn, locale)}
          </span>
          {urgentTask && (
            <span className="text-[10px] font-medium text-red-600 animate-pulse">⚠️ {getTaskLabel(urgentTask.task_type, locale)}</span>
          )}
          <ChevronDown className={`w-4 h-4 text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3">
              {taskGroups.map((group) => {
                if (group.tasks.length === 0) return null;
                const groupDone = group.tasks.every(t => t.status === 'DONE');
                return (
                  <div key={group.label}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs font-semibold ${groupDone ? 'text-green-600' : 'text-foreground-light'}`}>{group.label}</span>
                      {groupDone && <Check className="w-3 h-3 text-green-500" />}
                      {/* Show driver for delivery/pickup groups */}
                      {(() => {
                        const transportTask = group.tasks.find(t => t.task_type === 'TRANSPORT' || t.task_type === 'PICKUP');
                        if (transportTask?.assigned_to) {
                          return (
                            <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ml-auto">
                              <User className="w-2.5 h-2.5" />{transportTask.assigned_to}
                            </span>
                          );
                        }
                        if (transportTask && !groupDone) {
                          return (
                            <button onClick={() => onSelectTask(transportTask)} className="text-[10px] text-amber-600 font-medium ml-auto flex items-center gap-0.5 cursor-pointer hover:text-amber-800">
                              <AlertCircle className="w-2.5 h-2.5" />{isNl ? 'Wijs chauffeur toe' : 'Assign driver'}
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div className="space-y-1">
                      {group.tasks.map(task => {
                        const TaskIcon = TASK_ICONS[task.task_type] || Wrench;
                        const daysUntil = task.due_date ? getDaysUntil(task.due_date) : null;
                        const locked = isTaskLocked(task, trip.tasks);
                        return (
                          <div key={task.id}
                            className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors ${task.status === 'DONE' ? 'bg-green-50/50' : locked ? 'bg-gray-50/50 opacity-50' : 'bg-gray-50 hover:bg-gray-100'}`}>
                            <TaskStatusButton task={task} onToggle={onToggleTask} locked={locked} />
                            <button onClick={() => !locked && onSelectTask(task)} disabled={locked}
                              className={`flex-1 flex items-center gap-2 min-w-0 text-left ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                              <span className={`inline-flex items-center gap-1 text-xs font-medium ${task.status === 'DONE' ? 'text-green-600 line-through' : 'text-foreground'}`}>
                                <TaskIcon className="w-3 h-3" />{getTaskLabel(task.task_type, locale)}
                              </span>
                              {task.assigned_to && (
                                <span className="text-[10px] text-primary flex items-center gap-0.5"><User className="w-2.5 h-2.5" />{task.assigned_to}</span>
                              )}
                            </button>
                            {daysUntil !== null && task.status !== 'DONE' && (
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getUrgencyBadge(daysUntil, task.status)}`}>
                                {getDueDateLabel(task.due_date!, locale)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Linked borg checklist for this group */}
                    {group.borg && (
                      <a href="/admin/borg"
                        className="flex items-center gap-2 mt-1.5 p-2 rounded-lg bg-purple-50/50 hover:bg-purple-100/50 transition-colors">
                        <Shield className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span className="text-xs font-medium text-foreground flex-1">
                          {group.borg.type === 'INCHECKEN' ? (isNl ? 'Incheck-inspectie' : 'Check-in inspection') : (isNl ? 'Uitcheck-inspectie' : 'Check-out inspection')}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          group.borg.status === 'KLANT_AKKOORD' ? 'bg-green-100 text-green-700' :
                          group.borg.status === 'AFGEROND' ? 'bg-blue-100 text-blue-700' :
                          group.borg.status === 'KLANT_BEZWAAR' ? 'bg-red-100 text-red-700' :
                          group.borg.status === 'IN_BEHANDELING' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {isNl
                            ? ({ OPEN: 'Open', IN_BEHANDELING: 'Bezig', AFGEROND: 'Afgerond', KLANT_AKKOORD: 'Akkoord', KLANT_BEZWAAR: 'Bezwaar' } as Record<string, string>)[group.borg.status] || group.borg.status
                            : ({ OPEN: 'Open', IN_BEHANDELING: 'In progress', AFGEROND: 'Completed', KLANT_AKKOORD: 'Agreed', KLANT_BEZWAAR: 'Objected' } as Record<string, string>)[group.borg.status] || group.borg.status
                          }
                        </span>
                        <ExternalLink className="w-3 h-3 text-muted" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ===== TASK DETAIL SHEET =====

interface DriverOption {
  id: string;
  name: string;
  phone: string | null;
}

function TaskDetail({
  task, onClose, onToggle, onSave, locale, drivers,
}: {
  task: BookingTask;
  onClose: () => void;
  onToggle: (task: BookingTask) => void;
  onSave: (taskId: string, updates: { assignedTo?: string; notes?: string }) => void;
  locale: string;
  drivers: DriverOption[];
}) {
  const [assignedTo, setAssignedTo] = useState(task.assigned_to || '');
  const [notes, setNotes] = useState(task.notes || '');
  const [saving, setSaving] = useState(false);
  const caravan = getBookingCaravan({ caravan_id: task.caravan_id } as Booking);
  const camping = getBookingCamping({ camping_id: task.camping_id } as Booking);
  const TaskIcon = TASK_ICONS[task.task_type] || Wrench;
  const isNl = locale !== 'en';

  const handleSave = async () => {
    setSaving(true);
    await onSave(task.id, { assignedTo, notes });
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white rounded-t-2xl p-4 border-b border-gray-100 z-10">
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3 sm:hidden" />
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${TASK_COLORS[task.task_type] || 'bg-gray-100 text-gray-700'}`}><TaskIcon className="w-5 h-5" /></div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{getTaskLabel(task.task_type, locale)}</h3>
              <p className="text-xs text-muted">{task.guest_name} • {task.booking_ref}</p>
            </div>
            <TaskStatusButton task={task} onToggle={onToggle} />
          </div>
        </div>
        <div className="p-4 space-y-4">
          {/* Task explanation */}
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs text-blue-700 leading-relaxed">{getTaskDescription(task.task_type, locale)}</p>
          </div>
          <div className="bg-surface rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm"><CarFront className="w-4 h-4 text-muted" /><span>{caravan?.name || task.caravan_id}</span></div>
            <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-muted" /><span>{camping?.name || task.camping_id}</span></div>
            <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-muted" /><span>{formatDate(task.check_in)} → {formatDate(task.check_out)}</span></div>
            {task.due_date && (
              <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-muted" /><span>{isNl ? 'Deadline' : 'Due'}: {formatDate(task.due_date)} ({getDueDateLabel(task.due_date, locale)})</span></div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">{isNl ? 'Toegewezen aan' : 'Assigned to'}</label>
            {drivers.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
                >
                  <option value="">{isNl ? '— Selecteer chauffeur —' : '— Select driver —'}</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.name}>{d.name}{d.phone ? ` (${d.phone})` : ''}</option>
                  ))}
                </select>
                {assignedTo && !drivers.some(d => d.name === assignedTo) && (
                  <p className="text-[10px] text-muted">{isNl ? 'Handmatig ingevoerd:' : 'Manual entry:'} {assignedTo}</p>
                )}
              </div>
            ) : (
              <input type="text" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
                placeholder={isNl ? 'Naam medewerker...' : 'Staff member...'} className="w-full px-3 py-2.5 bg-surface rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">{isNl ? 'Notities' : 'Notes'}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder={isNl ? 'Bijzonderheden...' : 'Details...'} rows={3} className="w-full px-3 py-2.5 bg-surface rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none" />
          </div>
          {task.status === 'DONE' && task.completed_at && (
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs text-green-700 font-medium flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />{isNl ? 'Afgerond' : 'Completed'} {formatDate(task.completed_at)}
                {task.completed_by && ` ${isNl ? 'door' : 'by'} ${task.completed_by}`}
              </p>
            </div>
          )}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isNl ? 'Opslaan' : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ===== CHECK-IN / CHECK-OUT SHEET =====

function CheckInOutSheet({
  task, trip, onClose, onComplete, locale,
}: {
  task: BookingTask;
  trip: TripData;
  onClose: () => void;
  onComplete: (task: BookingTask, sendEmail: boolean) => Promise<void>;
  locale: string;
}) {
  const [completing, setCompleting] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [borgLoading, setBorgLoading] = useState(true);
  const [borgChecklist, setBorgChecklist] = useState<BorgChecklist & { token?: string; items?: unknown[] } | null>(null);
  const [creatingBorg, setCreatingBorg] = useState(false);
  const caravan = getBookingCaravan({ caravan_id: task.caravan_id } as Booking);
  const camping = getBookingCamping({ camping_id: task.camping_id } as Booking);
  const isNl = locale !== 'en';
  const isCheckIn = task.task_type === 'CHECKIN';
  const borgType = isCheckIn ? 'INCHECKEN' : 'UITCHECKEN';

  // Fetch borg checklist for this booking
  useEffect(() => {
    setBorgLoading(true);
    fetch(`/api/borg?booking_id=${task.booking_id}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then((checklists: BorgChecklist[]) => {
        const match = checklists.find(bc => bc.type === borgType);
        if (match) setBorgChecklist(match as BorgChecklist & { token?: string });
      })
      .catch(() => {})
      .finally(() => setBorgLoading(false));
  }, [task.booking_id, borgType]);

  const handleCreateBorg = async () => {
    setCreatingBorg(true);
    try {
      const res = await fetch('/api/borg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: task.booking_id, type: borgType }),
      });
      if (res.ok) {
        const data = await res.json();
        setBorgChecklist({ id: data.id, booking_id: task.booking_id, type: borgType, status: 'OPEN', token: data.token });
      }
    } catch { /* ignore */ }
    setCreatingBorg(false);
  };

  const handleComplete = async () => {
    setCompleting(true);
    await onComplete(task, sendEmail);
    setCompleting(false);
  };

  const borgStatusLabel = (status: string) => {
    const labels: Record<string, Record<string, string>> = {
      nl: { OPEN: 'Open', IN_BEHANDELING: 'Bezig', AFGEROND: 'Afgerond', KLANT_AKKOORD: 'Klant akkoord', KLANT_BEZWAAR: 'Klant bezwaar' },
      en: { OPEN: 'Open', IN_BEHANDELING: 'In progress', AFGEROND: 'Completed', KLANT_AKKOORD: 'Agreed', KLANT_BEZWAAR: 'Objected' },
    };
    return (labels[locale] || labels.nl)[status] || status;
  };

  const borgStatusColor = (status: string) => {
    if (status === 'KLANT_AKKOORD') return 'bg-green-100 text-green-700';
    if (status === 'AFGEROND') return 'bg-blue-100 text-blue-700';
    if (status === 'KLANT_BEZWAAR') return 'bg-red-100 text-red-700';
    if (status === 'IN_BEHANDELING') return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-600';
  };

  const isDone = task.status === 'DONE';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl z-10 border-b border-gray-100">
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2 sm:hidden" />
          <div className={`p-4 ${isCheckIn ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 'bg-gradient-to-r from-orange-50 to-amber-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isCheckIn ? 'bg-green-100' : 'bg-orange-100'}`}>
                {isCheckIn ? <LogIn className="w-6 h-6 text-green-700" /> : <LogOut className="w-6 h-6 text-orange-700" />}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-foreground">
                  {isCheckIn ? (isNl ? 'Inchecken' : 'Check-in') : (isNl ? 'Uitchecken' : 'Check-out')}
                </h3>
                <p className="text-sm text-muted">{task.guest_name} • {task.booking_ref}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 transition-colors cursor-pointer">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Booking info */}
          <div className="bg-surface rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm"><CarFront className="w-4 h-4 text-muted" /><span className="font-medium">{caravan?.name || task.caravan_id}</span></div>
            <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-muted" /><span>{camping?.name || task.camping_id}</span></div>
            <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-muted" /><span>{formatDate(task.check_in)} → {formatDate(task.check_out)}</span></div>
            <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-muted" /><span>{task.guest_name}</span></div>
          </div>

          {/* Borg inspection section */}
          <div className={`rounded-xl border-2 ${borgChecklist ? 'border-purple-200 bg-purple-50/50' : 'border-dashed border-gray-300 bg-gray-50'} p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-sm text-foreground">
                {isCheckIn ? (isNl ? 'Incheck-inspectie (Borg)' : 'Check-in Inspection (Deposit)') : (isNl ? 'Uitcheck-inspectie (Borg)' : 'Check-out Inspection (Deposit)')}
              </h4>
            </div>

            {borgLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted"><Loader2 className="w-4 h-4 animate-spin" />{isNl ? 'Laden...' : 'Loading...'}</div>
            ) : borgChecklist ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">{isNl ? 'Status:' : 'Status:'}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${borgStatusColor(borgChecklist.status)}`}>
                    {borgStatusLabel(borgChecklist.status)}
                  </span>
                </div>
                <a
                  href={`/admin/inspectie/${borgChecklist.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-purple-600 text-white font-semibold rounded-xl text-sm hover:bg-purple-700 transition-colors cursor-pointer"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  {borgChecklist.status === 'OPEN'
                    ? (isNl ? 'Inspectie starten' : 'Start inspection')
                    : (isNl ? 'Inspectie bekijken' : 'View inspection')}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted">{isNl ? 'Er is nog geen borgchecklist voor deze stap.' : 'No deposit checklist exists for this step yet.'}</p>
                <button onClick={handleCreateBorg} disabled={creatingBorg}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-purple-600 text-white font-semibold rounded-xl text-sm hover:bg-purple-700 transition-colors cursor-pointer disabled:opacity-50">
                  {creatingBorg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  {isNl ? 'Borgchecklist aanmaken' : 'Create deposit checklist'}
                </button>
              </div>
            )}
          </div>

          {/* Task description */}
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs text-blue-700 leading-relaxed">{getTaskDescription(task.task_type, locale)}</p>
          </div>

          {/* Completed info */}
          {isDone && task.completed_at && (
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs text-green-700 font-medium flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />{isNl ? 'Afgerond' : 'Completed'} {formatDate(task.completed_at)}
                {task.completed_by && ` ${isNl ? 'door' : 'by'} ${task.completed_by}`}
              </p>
            </div>
          )}

          {/* Email toggle + complete button */}
          {!isDone && (
            <>
              <label className="flex items-center gap-3 p-3 bg-surface rounded-xl cursor-pointer">
                <input type="checkbox" checked={sendEmail} onChange={() => setSendEmail(!sendEmail)}
                  className="w-4 h-4 rounded accent-primary cursor-pointer" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-muted" />
                    {isCheckIn
                      ? (isNl ? 'Stuur klant incheck-mail met borglink' : 'Send customer check-in email with deposit link')
                      : (isNl ? 'Stuur klant uitcheck-mail met borglink' : 'Send customer check-out email with deposit link')}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {isNl ? 'Klant ontvangt een e-mail met een link naar het borgformulier' : 'Customer receives an email with a link to the deposit form'}
                  </p>
                </div>
              </label>
              <button onClick={handleComplete} disabled={completing}
                className={`w-full py-3.5 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 text-white ${
                  isCheckIn ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
                }`}>
                {completing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {isCheckIn
                  ? (isNl ? 'Inchecken voltooien' : 'Complete check-in')
                  : (isNl ? 'Uitchecken voltooien' : 'Complete check-out')}
              </button>
            </>
          )}
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
  const [borgChecklists, setBorgChecklists] = useState<BorgChecklist[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [selectedTask, setSelectedTask] = useState<BookingTask | null>(null);
  const [expandedTrips, setExpandedTrips] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    if (!selectedTask) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedTask(null); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [selectedTask]);

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, borgRes, driversRes] = await Promise.all([
        fetch('/api/admin/tasks'),
        fetch('/api/borg').catch(() => null),
        fetch('/api/admin/drivers?active=true').catch(() => null),
      ]);
      if (!tasksRes.ok) throw new Error('Tasks API error');
      const tasksData = await tasksRes.json();
      // Filter out CLEANING tasks
      setTasks((tasksData.tasks || []).filter((t: BookingTask) => t.task_type !== 'CLEANING'));

      if (borgRes?.ok) {
        const borgData = await borgRes.json();
        setBorgChecklists((borgData || []).map((bc: Record<string, unknown>) => ({
          id: bc.id as string, booking_id: bc.booking_id as string, type: bc.type as string, status: bc.status as string,
        })));
      }

      if (driversRes?.ok) {
        const driversData = await driversRes.json();
        setDrivers((driversData.drivers || []).map((d: Record<string, unknown>) => ({
          id: d.id as string, name: d.name as string, phone: d.phone as string | null,
        })));
      }
    } catch {
      setError(isNl ? 'Kon planning niet laden' : 'Could not load planning');
    } finally {
      setLoading(false);
    }
  }, [isNl]);

  useEffect(() => { loadCustomData(); fetchData(); }, [fetchData]);

  const handleToggle = async (task: BookingTask) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    if (selectedTask?.id === task.id) setSelectedTask({ ...selectedTask, status: task.status });
    try {
      await fetch('/api/admin/tasks', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, status: task.status, completedBy: task.status === 'DONE' ? 'Staff' : undefined }),
      });
    } catch { toast(t('common.actionFailed'), 'error'); fetchData(); }
  };

  const handleSave = async (taskId: string, updates: { assignedTo?: string; notes?: string }) => {
    try {
      await fetch('/api/admin/tasks', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, assignedTo: updates.assignedTo, notes: updates.notes }),
      });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assigned_to: updates.assignedTo, notes: updates.notes } : t));
      setSelectedTask(null);
      toast(t('common.saved'), 'success');
    } catch { toast(t('common.actionFailed'), 'error'); }
  };

  const handleCheckinCheckoutComplete = async (task: BookingTask, sendEmail: boolean) => {
    const updatedTask = { ...task, status: 'DONE' as TaskStatus };
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'DONE' as TaskStatus } : t));
    try {
      await fetch('/api/admin/tasks', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          status: 'DONE',
          completedBy: 'Staff',
          sendEmail,
          bookingId: task.booking_id,
          taskType: task.task_type,
        }),
      });
      setSelectedTask(null);
      toast(
        task.task_type === 'CHECKIN'
          ? (isNl ? 'Inchecken voltooid' + (sendEmail ? ' — mail verstuurd' : '') : 'Check-in completed' + (sendEmail ? ' — email sent' : ''))
          : (isNl ? 'Uitchecken voltooid' + (sendEmail ? ' — mail verstuurd' : '') : 'Check-out completed' + (sendEmail ? ' — email sent' : '')),
        'success'
      );
      fetchData();
    } catch {
      toast(t('common.actionFailed'), 'error');
      fetchData();
    }
  };

  const toggleTrip = (bookingId: string) => {
    setExpandedTrips(prev => {
      const next = new Set(prev);
      if (next.has(bookingId)) next.delete(bookingId); else next.add(bookingId);
      return next;
    });
  };

  // ===== COMPUTED =====

  const trips: TripData[] = useMemo(() => {
    const byBooking: Record<string, BookingTask[]> = {};
    tasks.forEach(task => {
      if (!byBooking[task.booking_id]) byBooking[task.booking_id] = [];
      byBooking[task.booking_id].push(task);
    });
    return Object.entries(byBooking).map(([bookingId, bookingTasks]) => {
      const first = bookingTasks[0];
      return {
        bookingId,
        guestName: first.guest_name,
        bookingRef: first.booking_ref,
        caravanId: first.caravan_id,
        campingId: first.camping_id,
        checkIn: first.check_in,
        checkOut: first.check_out,
        bookingStatus: first.booking_status,
        tasks: bookingTasks.sort((a, b) => (a.due_date || '').localeCompare(b.due_date || '')),
        borgChecklists: borgChecklists.filter(bc => bc.booking_id === bookingId),
      };
    }).sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  }, [tasks, borgChecklists]);

  const filteredTrips = useMemo(() => {
    let result = trips.filter(t => t.bookingStatus !== 'GEANNULEERD');
    if (!showDone) {
      result = result.filter(t => {
        const allDone = t.tasks.every(task => task.status === 'DONE');
        return !(allDone && getDaysUntil(t.checkOut) < -7);
      });
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(trip =>
        trip.guestName.toLowerCase().includes(q) ||
        trip.bookingRef.toLowerCase().includes(q) ||
        (getBookingCaravan({ caravan_id: trip.caravanId } as Booking)?.name || '').toLowerCase().includes(q) ||
        (getBookingCamping({ camping_id: trip.campingId } as Booking)?.name || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [trips, showDone, searchQuery]);

  // Transport view: upcoming deliveries and pickups
  const transportItems = useMemo(() => {
    const items: { type: 'delivery' | 'pickup'; date: string; trip: TripData; tasks: BookingTask[] }[] = [];
    filteredTrips.forEach(trip => {
      const deliveryTasks = trip.tasks.filter(t => ['TRANSPORT', 'SETUP'].includes(t.task_type));
      const pickupTasks = trip.tasks.filter(t => t.task_type === 'PICKUP');
      if (deliveryTasks.length > 0 && !deliveryTasks.every(t => t.status === 'DONE')) {
        items.push({ type: 'delivery', date: deliveryTasks[0].due_date || trip.checkIn, trip, tasks: deliveryTasks });
      }
      if (pickupTasks.length > 0 && !pickupTasks.every(t => t.status === 'DONE')) {
        items.push({ type: 'pickup', date: pickupTasks[0].due_date || trip.checkOut, trip, tasks: pickupTasks });
      }
    });
    return items.sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredTrips]);

  const todoCount = tasks.filter(t => t.status === 'TODO').length;
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const overdueCount = tasks.filter(t => t.status !== 'DONE' && t.due_date && getDaysUntil(t.due_date) < 0).length;
  const todayCount = tasks.filter(t => t.status !== 'DONE' && t.due_date && getDaysUntil(t.due_date) === 0).length;

  // Auto-expand trips with urgent tasks
  useEffect(() => {
    const autoExpand = new Set<string>();
    trips.forEach(trip => {
      if (trip.tasks.some(t => t.status !== 'DONE' && t.due_date && getDaysUntil(t.due_date) <= 0)) {
        autoExpand.add(trip.bookingId);
      }
    });
    if (autoExpand.size > 0) setExpandedTrips(autoExpand);
  }, [trips]);

  // ===== RENDER =====

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error) return <div className="text-center py-20"><AlertCircle className="w-8 h-8 text-danger mx-auto mb-2" /><p className="text-danger">{error}</p></div>;

  const views: { key: ViewMode; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: 'timeline', label: isNl ? 'Overzicht' : 'Overview', icon: Calendar, badge: todayCount + overdueCount || undefined },
    { key: 'transport', label: 'Transport', icon: Truck, badge: transportItems.length || undefined },
    { key: 'caravans', label: 'Caravans', icon: CarFront },
  ];

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: isNl ? 'Te doen' : 'To do', value: todoCount, color: 'bg-gray-100 text-gray-700' },
          { label: isNl ? 'Bezig' : 'Active', value: inProgressCount, color: 'bg-amber-100 text-amber-700' },
          { label: isNl ? 'Vandaag' : 'Today', value: todayCount, color: todayCount > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400' },
          { label: isNl ? 'Te laat' : 'Overdue', value: overdueCount, color: overdueCount > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400' },
        ].map((stat, i) => (
          <div key={i} className={`rounded-xl p-2 sm:p-3 text-center ${stat.color}`}>
            <p className="text-lg sm:text-2xl font-bold">{stat.value}</p>
            <p className="text-[10px] sm:text-xs font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* View tabs + search */}
      <div className="space-y-2">
        <div className="flex bg-white rounded-xl p-1 shadow-sm">
          {views.map((v) => (
            <button key={v.key} onClick={() => setViewMode(v.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                viewMode === v.key ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-foreground'
              }`}>
              <v.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{v.label}</span>
              {v.badge ? <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${viewMode === v.key ? 'bg-white/20' : 'bg-primary-100 text-primary'}`}>{v.badge}</span> : null}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isNl ? 'Zoek op gast, ref, caravan, camping...' : 'Search guest, ref, caravan, camping...'}
              className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-sm border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
          <button onClick={() => setShowDone(!showDone)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${showDone ? 'bg-primary text-white border-primary' : 'bg-white text-muted border-gray-200 hover:bg-gray-50'}`}>
            <Filter className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => fetchData()}
            className="px-3 py-2 rounded-xl text-xs font-medium border border-gray-200 bg-white text-muted hover:text-primary transition-colors cursor-pointer"
            title={isNl ? 'Vernieuwen' : 'Refresh'}>
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ===== TIMELINE VIEW ===== */}
      {viewMode === 'timeline' && (
        <div className="space-y-2">
          {filteredTrips.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <Calendar className="w-10 h-10 text-muted mx-auto mb-2" />
              <p className="text-sm text-muted">{isNl ? 'Geen boekingen gevonden' : 'No bookings found'}</p>
            </div>
          ) : (
            filteredTrips.map(trip => (
              <TripCard key={trip.bookingId} trip={trip} onToggleTask={handleToggle} onSelectTask={setSelectedTask}
                locale={locale} expanded={expandedTrips.has(trip.bookingId)} onToggleExpand={() => toggleTrip(trip.bookingId)} />
            ))
          )}
        </div>
      )}

      {/* ===== TRANSPORT VIEW ===== */}
      {viewMode === 'transport' && (
        <div className="space-y-2">
          {transportItems.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <Truck className="w-10 h-10 text-muted mx-auto mb-2" />
              <p className="text-sm text-muted">{isNl ? 'Geen openstaande transporten' : 'No pending transports'}</p>
            </div>
          ) : (
            transportItems.map((item, i) => {
              const caravan = getBookingCaravan({ caravan_id: item.trip.caravanId } as Booking);
              const camping = getBookingCamping({ camping_id: item.trip.campingId } as Booking);
              const daysUntil = getDaysUntil(item.date);
              const allDone = item.tasks.every(t => t.status === 'DONE');
              const borgForMoment = item.type === 'delivery'
                ? item.trip.borgChecklists.find(bc => bc.type === 'INCHECKEN')
                : item.trip.borgChecklists.find(bc => bc.type === 'UITCHECKEN');

              return (
                <motion.div key={`${item.trip.bookingId}-${item.type}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className={`bg-white rounded-xl p-3 sm:p-4 shadow-sm border-l-4 ${item.type === 'delivery' ? 'border-l-blue-500' : 'border-l-orange-500'} ${allDone ? 'opacity-50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl shrink-0 ${item.type === 'delivery' ? 'bg-blue-100' : 'bg-orange-100'}`}>
                      <Truck className={`w-5 h-5 ${item.type === 'delivery' ? 'text-blue-700' : 'text-orange-700'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.type === 'delivery' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                          {item.type === 'delivery' ? (isNl ? '📦 Bezorgen' : '📦 Deliver') : (isNl ? '🔙 Ophalen' : '🔙 Pick up')}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${getUrgencyBadge(daysUntil, allDone ? 'DONE' : 'TODO')}`}>
                          {getDueDateLabel(item.date, locale)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground mt-1">{caravan?.name || item.trip.caravanId}</p>
                      <p className="text-xs text-muted flex items-center gap-1">
                        {item.type === 'delivery' ? <ArrowRight className="w-3 h-3" /> : <ArrowRight className="w-3 h-3 rotate-180" />}
                        {camping?.name || item.trip.campingId}
                      </p>
                      <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3" />{item.trip.guestName} <span className="text-muted">({item.trip.bookingRef})</span>
                      </p>
                      {/* Driver display / quick assign */}
                      {(() => {
                        const transportTask = item.tasks.find(t => t.task_type === 'TRANSPORT' || t.task_type === 'PICKUP');
                        const assignedDriver = transportTask?.assigned_to;
                        if (assignedDriver) {
                          const driverInfo = drivers.find(d => d.name === assignedDriver);
                          return (
                            <div className="flex items-center gap-2 mt-1.5 bg-primary/5 rounded-lg px-2.5 py-1.5">
                              <User className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="text-xs font-semibold text-primary">{assignedDriver}</span>
                              {driverInfo?.phone && <span className="text-[10px] text-muted">({driverInfo.phone})</span>}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (transportTask) setSelectedTask(transportTask);
                                }}
                                className="ml-auto text-[10px] text-muted hover:text-foreground cursor-pointer"
                              >
                                ✏️
                              </button>
                            </div>
                          );
                        }
                        return (
                          <div className="mt-1.5">
                            {drivers.length > 0 ? (
                              <select
                                value=""
                                onChange={async (e) => {
                                  const driverName = e.target.value;
                                  if (!driverName || !transportTask) return;
                                  await handleSave(transportTask.id, { assignedTo: driverName, notes: transportTask.notes });
                                }}
                                className="w-full px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
                              >
                                <option value="">{isNl ? '⚠️ Geen chauffeur — wijs toe' : '⚠️ No driver — assign'}</option>
                                {drivers.map(d => (
                                  <option key={d.id} value={d.name}>{d.name}{d.phone ? ` (${d.phone})` : ''}</option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />{isNl ? 'Geen chauffeur toegewezen' : 'No driver assigned'}
                              </p>
                            )}
                          </div>
                        );
                      })()}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tasks.map(task => {
                          const locked = isTaskLocked(task, item.trip.tasks);
                          return (
                            <div key={task.id} className={`flex items-center gap-1.5 ${locked ? 'opacity-40' : ''}`}>
                              <TaskStatusButton task={task} onToggle={handleToggle} locked={locked} />
                              <button onClick={() => !locked && setSelectedTask(task)} disabled={locked}
                                className={`text-xs text-foreground-light hover:text-foreground ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                {getTaskLabel(task.task_type, locale)}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      {borgForMoment && (
                        <a href="/admin/borg" className="inline-flex items-center gap-1.5 mt-2 text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded-lg hover:bg-purple-100 transition-colors">
                          <Shield className="w-3 h-3" />
                          {borgForMoment.type === 'INCHECKEN' ? (isNl ? 'Borgchecklist' : 'Deposit checklist') : (isNl ? 'Borgchecklist' : 'Deposit checklist')}
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* ===== CARAVANS VIEW ===== */}
      {viewMode === 'caravans' && (
        <div className="space-y-3">
          {caravans.map(caravan => {
            const caravanTrips = filteredTrips.filter(t => t.caravanId === caravan.id);
            const now = new Date(); now.setHours(0, 0, 0, 0);
            const activeTrip = caravanTrips.find(t => new Date(t.checkIn) <= now && new Date(t.checkOut) >= now);
            const nextTrip = caravanTrips.find(t => new Date(t.checkIn) > now);
            const displayTrip = activeTrip || nextTrip;

            let status: 'available' | 'in-use' | 'prep-needed' = 'available';
            if (activeTrip) status = 'in-use';
            else if (nextTrip && getDaysUntil(nextTrip.checkIn) <= 7) status = 'prep-needed';

            const statusConfig = {
              'available': { label: isNl ? 'Beschikbaar' : 'Available', color: 'bg-green-100 text-green-700 border-green-200' },
              'in-use': { label: isNl ? 'In gebruik' : 'In use', color: 'bg-blue-100 text-blue-700 border-blue-200' },
              'prep-needed': { label: isNl ? 'Voorbereiden' : 'Prep needed', color: 'bg-amber-100 text-amber-700 border-amber-200' },
            };

            const completedTasks = displayTrip ? displayTrip.tasks.filter(t => t.status === 'DONE').length : 0;
            const totalTasks = displayTrip ? displayTrip.tasks.length : 0;

            return (
              <motion.div key={caravan.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-surface rounded-xl"><CarFront className="w-5 h-5 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground">{caravan.name}</h3>
                    <p className="text-xs text-muted">{caravan.maxPersons} pers.</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig[status].color}`}>{statusConfig[status].label}</span>
                </div>
                {displayTrip ? (
                  <div className="bg-surface rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{displayTrip.guestName}</p>
                        <p className="text-xs text-muted flex items-center gap-1"><MapPin className="w-3 h-3" />{getBookingCamping({ camping_id: displayTrip.campingId } as Booking)?.name}</p>
                        <p className="text-xs text-muted flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3" />{formatDate(displayTrip.checkIn)} → {formatDate(displayTrip.checkOut)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{completedTasks}/{totalTasks}</p>
                        <p className="text-[10px] text-muted">{isNl ? 'taken' : 'tasks'}</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: totalTasks > 0 ? `${(completedTasks / totalTasks) * 100}%` : '0%' }} />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {displayTrip.tasks.map(task => {
                        const TaskIcon = TASK_ICONS[task.task_type] || Wrench;
                        const locked = isTaskLocked(task, displayTrip.tasks);
                        return (
                          <button key={task.id} onClick={() => !locked && setSelectedTask(task)} disabled={locked}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                              locked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                              task.status === 'DONE' ? 'bg-green-100 text-green-700 line-through cursor-pointer' : task.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700 cursor-pointer' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer'
                            }`}>
                            {locked && <Lock className="w-2.5 h-2.5" />}
                            <TaskIcon className="w-3 h-3" />{getTaskLabel(task.task_type, locale)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted text-center py-2">{isNl ? 'Geen aankomende boekingen' : 'No upcoming bookings'}</p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Task detail / Check-in/out sheet */}
      <AnimatePresence>
        {selectedTask && (selectedTask.task_type === 'CHECKIN' || selectedTask.task_type === 'CHECKOUT') ? (
          <CheckInOutSheet
            key={selectedTask.id}
            task={selectedTask}
            trip={trips.find(tr => tr.bookingId === selectedTask.booking_id) || { bookingId: selectedTask.booking_id, guestName: selectedTask.guest_name, bookingRef: selectedTask.booking_ref, caravanId: selectedTask.caravan_id, campingId: selectedTask.camping_id, checkIn: selectedTask.check_in, checkOut: selectedTask.check_out, bookingStatus: selectedTask.booking_status, tasks: [], borgChecklists: [] }}
            onClose={() => setSelectedTask(null)}
            onComplete={handleCheckinCheckoutComplete}
            locale={locale}
          />
        ) : selectedTask ? (
          <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} onToggle={handleToggle} onSave={handleSave} locale={locale} drivers={drivers} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
