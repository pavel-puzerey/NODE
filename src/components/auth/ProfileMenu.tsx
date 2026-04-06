import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { User, LogOut, Check } from 'lucide-react'

interface ProfileMenuProps {
  onThemeChange: (theme: string, accent: string, darkMode: boolean) => void
  currentTheme: string
  currentAccent: string
  darkMode: boolean
}

export function ProfileMenu({ onThemeChange, currentTheme, currentAccent, darkMode }: ProfileMenuProps) {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState(profile?.username || '')
  const [editingPassword, setEditingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')  

  const displayName = profile?.username || user?.email?.split('@')[0] || 'Shooter'
  const initial = displayName.charAt(0).toUpperCase()

  const handleSaveName = async () => {
    if (!user) return
    await supabase.from('profiles').update({ username: newName }).eq('id', user.id)
    await refreshProfile()
    setEditingName(false)
  }

  const handleSavePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg('Min 6 characters')
      return
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setPasswordMsg(error.message)
    else {
      setPasswordMsg('Password updated')
      setTimeout(() => {
        setEditingPassword(false)
        setNewPassword('')
        setPasswordMsg('')
      }, 1500)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-sm hidden sm:block" style={{ color: '#f59e0b' }}>{displayName}</span>
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm" style={{ backgroundColor: '#f59e0b', color: '#1A1814' }}>
            {initial}
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56 border p-2" style={{ backgroundColor: '#242018', borderColor: '#3a3020', color: '#B8960C' }} align="end">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider px-2" style={{ color: '#7a6a30' }}>
          Profile
        </DropdownMenuLabel>

        <div className="px-2 py-2">
          {editingName ? (
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="h-8 text-sm border"
                style={{ backgroundColor: '#1A1814', borderColor: '#3a3020', color: '#B8960C' }}
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                autoFocus
              />
              <Button size="sm" onClick={handleSaveName} className="h-8 px-2" style={{ backgroundColor: '#B8960C', color: '#1A1814' }}>
                <Check className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => { setEditingName(true); setNewName(displayName) }}
              className="flex items-center gap-2 text-sm w-full text-left px-1 py-1 rounded transition-colors"
              style={{ color: '#B8960C' }}
            >
              <User className="w-4 h-4" style={{ color: '#7a6a30' }} />
              <span className="flex-1">{displayName}</span>
              <span className="text-xs" style={{ color: '#7a6a30' }}>edit</span>
            </button>
          )}
          <p className="text-xs px-1 mt-1" style={{ color: '#5a4a20' }}>{user?.email}</p>
        </div>
        <div className="px-2 py-2">
          {editingPassword ? (
            <div className="space-y-2">
              <Input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password"
                className="h-8 text-sm border"
                style={{ backgroundColor: '#1A1814', borderColor: '#3a3020', color: '#B8960C' }}
                onKeyDown={e => e.key === 'Enter' && handleSavePassword()}
                autoFocus
              />
              {passwordMsg && (
                <p className="text-xs px-1" style={{ color: passwordMsg === 'Password updated' ? '#4a9a4a' : '#c0392b' }}>
                  {passwordMsg}
                </p>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSavePassword} className="h-8 px-3 text-xs" style={{ backgroundColor: '#B8960C', color: '#1A1814' }}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditingPassword(false); setNewPassword(''); setPasswordMsg('') }} className="h-8 px-3 text-xs border" style={{ borderColor: '#3a3020', color: '#B8960C' }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditingPassword(true)}
              className="flex items-center gap-2 text-sm w-full text-left px-1 py-1 rounded transition-colors"
              style={{ color: '#B8960C' }}
            >
              <span className="w-4 h-4 flex items-center justify-center text-xs" style={{ color: '#7a6a30' }}>🔑</span>
              <span className="flex-1">Change password</span>
              <span className="text-xs" style={{ color: '#7a6a30' }}>edit</span>
            </button>
          )}
        </div>

        <DropdownMenuSeparator style={{ backgroundColor: '#3a3020' }} />

        <DropdownMenuItem
          onClick={signOut}
          className="cursor-pointer mt-1"
          style={{ color: '#c0392b' }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
