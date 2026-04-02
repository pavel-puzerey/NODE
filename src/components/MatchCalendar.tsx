import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Trash2, Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';
import { MatchEvent } from '../types';
import { generateId } from '../utils/id';
import { format } from 'date-fns';

interface MatchCalendarProps {
  matches: MatchEvent[];
  setMatches: (matches: MatchEvent[] | ((prev: MatchEvent[]) => MatchEvent[])) => void;
}

export function MatchCalendar({ matches, setMatches }: MatchCalendarProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    isAllDay: true,
    reminder: 'none' as 'none' | '1day' | '1week' | '1month',
    notes: ''
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.date) return;
    
    const newMatch: MatchEvent = {
      id: generateId(),
      name: formData.name,
      date: formData.date,
      time: formData.isAllDay ? null : formData.time,
      isAllDay: formData.isAllDay,
      reminder: formData.reminder,
      notes: formData.notes || undefined,
    };

    setMatches([...matches, newMatch].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setFormData({ name: '', date: '', time: '', isAllDay: true, reminder: 'none', notes: '' });
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this match?')) setMatches(matches.filter(m => m.id !== id));
  };

  const sortedMatches = [...matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Match Calendar</h2>
          <p className="text-slate-400">Track upcoming competitions and events</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Match
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="bg-slate-900 border-slate-800 card-tactical">
          <CardHeader>
            <CardTitle className="text-white">Add New Match</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-300">Match Name</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder="e.g., Club Monthly Match"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Date</Label>
                <Input 
                  type="date" 
                  value={formData.date} 
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Time</Label>
                <Input 
                  type="time" 
                  value={formData.time} 
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  disabled={formData.isAllDay}
                  className="bg-slate-900 border-slate-700 text-white disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Reminder</Label>
                <Select value={formData.reminder} onValueChange={(val: any) => setFormData({ ...formData, reminder: val })}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="1day">1 Day Before</SelectItem>
                    <SelectItem value="1week">1 Week Before</SelectItem>
                    <SelectItem value="1month">1 Month Before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Notes</Label>
                <Input 
                  value={formData.notes} 
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder="Location, stages, fees..."
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="bg-amber-600 hover:bg-amber-700">Save Match</Button>
              <Button onClick={() => setIsAdding(false)} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {sortedMatches.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800 card-tactical">
            <CardContent className="py-12 text-center">
              <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No matches scheduled</p>
            </CardContent>
          </Card>
        ) : (
          sortedMatches.map((match) => (
            <Card key={match.id} className="bg-slate-900 border-slate-800 card-tactical">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white">{match.name}</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        {format(new Date(match.date), 'MMM dd, yyyy')}
                      </div>
                      {!match.isAllDay && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {match.time}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => handleDelete(match.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              {match.notes && (
                <CardContent>
                  <p className="text-slate-300 text-sm">{match.notes}</p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}