import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Trash2, MapPin, Clock, ChevronLeft, ChevronRight, X, Save } from 'lucide-react';
import { MatchEvent } from '../types';
import { generateId } from '../utils/id';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, parse } from 'date-fns';

interface MatchCalendarProps {
  matches: MatchEvent[];
  setMatches: (matches: MatchEvent[] | ((prev: MatchEvent[]) => MatchEvent[])) => void;
}

const EMPTY_FORM = { name: '', date: '', time: '', isAllDay: false, reminder: 'none' as const, notes: '', location: '', eventUrl: '' };

function formatTime(time: string | null | undefined): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h)) return time;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function MatchCalendar({ matches, setMatches }: MatchCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<typeof EMPTY_FORM & { reminder: 'none'|'1day'|'1week'|'1month' }>(EMPTY_FORM as any);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const monthMatches = matches
    .filter(m => {
      const d = new Date(m.date + 'T12:00:00');
      return isSameMonth(d, currentMonth);
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const openAdd = (date?: string) => {
    setEditingId(null);
    setFormData({ ...EMPTY_FORM as any, date: date || '' });
    setModalOpen(true);
  };

  const openEdit = (match: MatchEvent) => {
    setEditingId(match.id);
    setFormData({
      name: match.name,
      date: match.date,
      time: match.time || '',
      isAllDay: match.isAllDay || false,
      reminder: (match.reminder as any) || 'none',
      notes: match.notes || '',
      location: (match as any).location || '',
      eventUrl: (match as any).eventUrl || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.date) return;
    if (editingId) {
      setMatches(matches.map(m => m.id === editingId ? {
        ...m, name: formData.name, date: formData.date,
        time: formData.isAllDay ? null : formData.time,
        isAllDay: formData.isAllDay, reminder: formData.reminder,
        notes: formData.notes || undefined,
        location: formData.location || undefined,
        eventUrl: formData.eventUrl || undefined,
      } as any : m));
    } else {
      const newMatch: any = {
        id: generateId(), name: formData.name, date: formData.date,
        time: formData.isAllDay ? null : formData.time,
        isAllDay: formData.isAllDay, reminder: formData.reminder,
        notes: formData.notes || undefined,
        location: formData.location || undefined,
        eventUrl: formData.eventUrl || undefined,
      };
      setMatches([...matches, newMatch].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this match?')) {
      setMatches(matches.filter(m => m.id !== id));
      setModalOpen(false);
    }
  };

  const getMatchesForDay = (day: Date) =>
    matches.filter(m => isSameDay(new Date(m.date + 'T12:00:00'), day));

  const totalCells = startPad + days.length;
  const trailingPad = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Match Calendar</h2>
        </div>
        <button
          onClick={() => openAdd()}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white border border-slate-600 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />Add Match
        </button>
      </div>

      <div className="flex gap-4 items-start">

        {/* ── Calendar ── */}
        <div className="flex-1 min-w-0">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-white">{format(currentMonth, 'MMMM yyyy')}</span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div
                key={d}
                style={{ textAlign: 'center' }}
                className="text-xs text-slate-600 font-semibold py-1.5 border-b border-slate-800"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
            className="border-l border-slate-800"
          >
            {/* Leading padding */}
            {Array.from({ length: startPad }).map((_, i) => (
              <div
                key={`pad-s-${i}`}
                style={{ minHeight: '80px' }}
                className="border-r border-b border-slate-800 bg-slate-950/40"
              />
            ))}

            {/* Actual days */}
            {days.map(day => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayMatches = getMatchesForDay(day);
              const isToday = isSameDay(day, new Date());
              const isHovered = hoveredDay === dayStr;

              return (
                <div
                  key={dayStr}
                  style={{ minHeight: '80px', minWidth: 0, overflow: 'hidden' }}
                  className="border-r border-b border-slate-800 bg-slate-950 p-1.5 relative"
                  onMouseEnter={() => setHoveredDay(dayStr)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {/* Date number + add button */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-amber-500 text-slate-900'
                          : 'text-slate-500'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {isHovered && dayMatches.length === 0 && (
                      <button
                        onClick={() => openAdd(dayStr)}
                        className="w-4 h-4 rounded-full bg-amber-700/70 hover:bg-amber-500 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-2.5 h-2.5 text-white" />
                      </button>
                    )}
                  </div>

                  {/* Events */}
                  <div className="space-y-0.5">
                    {dayMatches.map(m => (
                      <button
                        key={m.id}
                        onClick={() => openEdit(m)}
                        className="w-full text-left text-[10px] px-1.5 py-1 rounded truncate font-semibold transition-colors leading-tight block"
                        style={{ backgroundColor: 'rgba(245,158,11,0.18)', color: '#fbbf24' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(245,158,11,0.35)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(245,158,11,0.18)')}
                        title={m.name}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Trailing padding */}
            {Array.from({ length: trailingPad }).map((_, i) => (
              <div
                key={`pad-e-${i}`}
                style={{ minHeight: '80px' }}
                className="border-r border-b border-slate-800 bg-slate-950/40"
              />
            ))}
          </div>
        </div>

        {/* ── Event sidebar ── */}
        <div className="w-48 flex-shrink-0">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
            {format(currentMonth, 'MMMM')}
          </p>
          {monthMatches.length === 0 ? (
            <div className="text-center py-8 px-4 border-2 border-dashed border-slate-800 rounded-lg">
              <p className="text-slate-600 text-xs">No events this month</p>
            </div>
          ) : (
            <div className="space-y-2">
              {monthMatches.map(match => (
                <button
                  key={match.id}
                  onClick={() => openEdit(match)}
                  className="w-full text-left p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-900/50 rounded-md transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="flex flex-col items-center rounded px-1 py-0.5 flex-shrink-0"
                      style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}
                    >
                      <span className="text-amber-400 text-[9px] font-bold uppercase leading-none">
                        {format(new Date(match.date + 'T12:00:00'), 'MMM')}
                      </span>
                      <span className="text-white text-sm font-bold leading-none">
                        {format(new Date(match.date + 'T12:00:00'), 'd')}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-xs font-medium truncate">{match.name}</p>
                      {!match.isAllDay && match.time && (
                        <p className="text-slate-500 text-[10px] flex items-center gap-0.5 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />{formatTime(match.time)}
                        </p>
                      )}
                      {(match as any).location && (
                        <p className="text-slate-500 text-[10px] flex items-center gap-0.5 truncate mt-0.5">
                          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />{(match as any).location}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={e => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-700 overflow-hidden"
            style={{ backgroundColor: '#111' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="text-white font-semibold">{editingId ? 'Edit Match' : 'Add Match'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Match Name *</Label>
                <Input value={formData.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })} className="bg-slate-900 border-slate-700 text-white h-9" placeholder="e.g., Club Monthly Match" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Date *</Label>
                  <Input type="date" value={formData.date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, date: e.target.value })} className="bg-slate-900 border-slate-700 text-white h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Time</Label>
                  <Input type="time" value={formData.time} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, time: e.target.value })} className="bg-slate-900 border-slate-700 text-white h-9" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Location</Label>
                <Input value={formData.location} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, location: e.target.value })} className="bg-slate-900 border-slate-700 text-white h-9" placeholder="e.g., Ridgeline Rifle Club" />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Event URL</Label>
                <Input value={formData.eventUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, eventUrl: e.target.value })} className="bg-slate-900 border-slate-700 text-white h-9" placeholder="https://practiscore.com/..." />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Notes</Label>
                <Input value={formData.notes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, notes: e.target.value })} className="bg-slate-900 border-slate-700 text-white h-9" placeholder="Stages, fees, gear notes…" />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Reminder</Label>
                <Select value={formData.reminder} onValueChange={(v: any) => setFormData({ ...formData, reminder: v })}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-9"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="1day">1 Day Before</SelectItem>
                    <SelectItem value="1week">1 Week Before</SelectItem>
                    <SelectItem value="1month">1 Month Before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                {editingId && (
                  <button
                    onClick={() => handleDelete(editingId)}
                    className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />Delete
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setModalOpen(false)} variant="outline" className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 h-9 text-xs">Cancel</Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.name || !formData.date}
                  className="bg-amber-600 hover:bg-amber-700 text-white h-9 text-xs disabled:opacity-40"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />{editingId ? 'Save Changes' : 'Add Match'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
