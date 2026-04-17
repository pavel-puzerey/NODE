import { useState } from 'react';
import { X, Send, CheckCircle, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/button';

interface FeedbackModalProps {
  onClose: () => void;
}

const CATEGORIES = ['Bug Report', 'Feature Request', 'UI Improvement', 'General Feedback'];

export function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [category, setCategory] = useState('General Feedback');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setStatus('sending');
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('message', message);
      formData.append('email', email || 'Not provided');
      const res = await fetch('https://formspree.io/f/xvzdaalo', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData,
      });
      if (res.ok) {
        setStatus('sent');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border"
        style={{ backgroundColor: '#111111', borderColor: '#2a2a2a', boxShadow: '0 0 60px rgba(245,158,11,0.08)' }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-600 hover:text-slate-300 transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="px-6 pt-6 pb-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <MessageSquare className="w-5 h-5" style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.05em' }}>
              Submit Feedback
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Help us improve NODE</p>
          </div>
        </div>

        {status === 'sent' ? (
          <div className="px-6 py-10 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: '#22c55e' }} />
            <p className="text-white font-semibold text-lg">Thank you!</p>
            <p className="text-slate-400 text-sm mt-1">Your feedback has been received.</p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 rounded-lg text-sm font-semibold text-slate-900"
              style={{ backgroundColor: '#f59e0b' }}
            >
              Close
            </button>
          </div>
        ) : (
          <div className="px-6 pb-6 pt-4 space-y-4">
            {/* Category */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase tracking-widest">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className="text-xs px-3 py-1.5 rounded-full border transition-colors"
                    style={category === c
                      ? { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: '#f59e0b', color: '#f59e0b' }
                      : { backgroundColor: 'transparent', borderColor: '#2a2a2a', color: '#64748b' }
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase tracking-widest">Message *</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe the bug, feature, or improvement..."
                rows={4}
                className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none resize-none"
                style={{ backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' }}
                onFocus={e => (e.target.style.borderColor = '#f59e0b')}
                onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
              />
            </div>

            {/* Email (optional) */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase tracking-widest">Your Email <span className="text-slate-600 normal-case">(optional — for follow-up)</span></label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
                style={{ backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' }}
                onFocus={e => (e.target.style.borderColor = '#f59e0b')}
                onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
              />
            </div>

            {status === 'error' && (
              <p className="text-xs text-red-400">Something went wrong. Please try again.</p>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleSubmit}
                disabled={!message.trim() || status === 'sending'}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40"
              >
                <Send className="w-4 h-4 mr-2" />
                {status === 'sending' ? 'Sending…' : 'Send Feedback'}
              </Button>
              <Button onClick={onClose} variant="outline" className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
