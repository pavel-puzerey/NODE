import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Eye, EyeOff } from 'lucide-react'

type Mode = 'login' | 'signup' | 'forgot'

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null)

  const handleLogin = async () => {
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage({ text: error.message, type: 'error' })
    setLoading(false)
  }

  const handleSignup = async () => {
    if (!username.trim()) {
      setMessage({ text: 'Please enter a display name.', type: 'error' })
      return
    }
    setLoading(true)
    setMessage(null)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setMessage({ text: error.message, type: 'error' })
    } else if (data.user) {
      await supabase.from('profiles').update({ username }).eq('id', data.user.id)
      setMessage({ text: 'Account created! Check your email to confirm, then log in.', type: 'success' })
      setMode('login')
    }
    setLoading(false)
  }

  const handleForgot = async () => {
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) setMessage({ text: error.message, type: 'error' })
    else setMessage({ text: 'Password reset email sent. Check your inbox.', type: 'success' })
    setLoading(false)
  }

  const handleSubmit = () => {
    if (mode === 'login') handleLogin()
    else if (mode === 'signup') handleSignup()
    else handleForgot()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Banner */}
        <div className="flex flex-col items-center gap-3">
          <img
            src="/node-banner.jpg"
            alt="NODE"
            className="w-full max-h-40 object-contain rounded-xl opacity-90"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <p style={{ fontFamily: 'Oswald, sans-serif' }} className="text-2xl tracking-widest uppercase font-semibold">
            <span style={{ color: '#f59e0b' }}>N</span><span style={{ color: 'white' }}>otebook </span>
            <span style={{ color: '#f59e0b' }}>O</span><span style={{ color: 'white' }}>n </span>
            <span style={{ color: '#f59e0b' }}>D</span><span style={{ color: 'white' }}>ata & </span>
            <span style={{ color: '#f59e0b' }}>E</span><span style={{ color: 'white' }}>quipment</span>
          </p>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">
              {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {mode === 'login' ? 'Enter your credentials to access NODE' :
               mode === 'signup' ? 'Create your NODE account' :
               'Enter your email to receive a reset link'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label className="text-slate-300">Display Name</Label>
                <Input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="bg-slate-950 border-slate-700 text-white"
                  placeholder="e.g. Pavel"
                  autoComplete="off"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-slate-300">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white"
                placeholder="you@example.com"
                autoComplete="off"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-2">
                <Label className="text-slate-300">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="bg-slate-950 border-slate-700 text-white pr-10"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {message && (
              <div className={`text-sm px-3 py-2 rounded ${
                message.type === 'error'
                  ? 'bg-red-900/30 text-red-400 border border-red-800'
                  : 'bg-emerald-900/30 text-emerald-400 border border-emerald-800'
              }`}>
                {message.text}
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              {loading ? 'Please wait...' :
               mode === 'login' ? 'Sign in' :
               mode === 'signup' ? 'Create account' : 'Send reset email'}
            </Button>

            <div className="flex flex-col gap-2 pt-2 text-sm text-center">
              {mode === 'login' && (
                <>
                  <button onClick={() => { setMode('forgot'); setMessage(null) }} className="text-slate-400 hover:text-amber-400 transition-colors">
                    Forgot password?
                  </button>
                  <button onClick={() => { setMode('signup'); setMessage(null) }} className="text-slate-400 hover:text-amber-400 transition-colors">
                    Don't have an account? Sign up
                  </button>
                </>
              )}
              {mode === 'signup' && (
                <button onClick={() => { setMode('login'); setMessage(null) }} className="text-slate-400 hover:text-amber-400 transition-colors">
                  Already have an account? Sign in
                </button>
              )}
              {mode === 'forgot' && (
                <button onClick={() => { setMode('login'); setMessage(null) }} className="text-slate-400 hover:text-amber-400 transition-colors">
                  Back to sign in
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
