import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Rifle, Load, GearItem, Accessory, Glass, RangeSession, MatchEvent } from '../types'

// ── helpers ──────────────────────────────────────────────────────────────────

function toRifle(r: any): Rifle {
  return { id: r.id, userId: r.user_id, action: r.action, caliber: r.caliber,
    barrelBrand: r.barrel_brand, barrelLength: r.barrel_length, chassis: r.chassis,
    trigger: r.trigger, createdAt: r.created_at }
}
function fromRifle(r: Partial<Rifle>, userId: string) {
  return { user_id: userId, action: r.action, caliber: r.caliber,
    barrel_brand: r.barrelBrand, barrel_length: r.barrelLength,
    chassis: r.chassis, trigger: r.trigger }
}

function toLoad(r: any): Load {
  return { id: r.id, userId: r.user_id, bulletId: r.bullet_id, caseId: r.case_id,
    powderId: r.powder_id, primerId: r.primer_id, charge: r.charge, oal: r.oal,
    seatingDepthIn: r.seating_depth_in, neckTensionIn: r.neck_tension_in,
    notes: r.notes, createdAt: r.created_at }
}
function fromLoad(l: Partial<Load>, userId: string) {
  return { user_id: userId, bullet_id: l.bulletId, case_id: l.caseId,
    powder_id: l.powderId, primer_id: l.primerId, charge: l.charge, oal: l.oal,
    seating_depth_in: l.seatingDepthIn, neck_tension_in: l.neckTensionIn, notes: l.notes }
}

function toGear(r: any): GearItem {
  return { id: r.id, userId: r.user_id, gearType: r.gear_type, brand: r.brand,
    model: r.model, weight: r.weight, diameter: r.diameter, lot: r.lot,
    primerSize: r.primer_size, notes: r.notes, createdAt: r.created_at }
}
function fromGear(g: Partial<GearItem>, userId: string) {
  return { user_id: userId, gear_type: g.gearType, brand: g.brand, model: g.model,
    weight: g.weight, diameter: g.diameter, lot: g.lot,
    primer_size: g.primerSize, notes: g.notes }
}

function toAccessory(r: any): Accessory {
  return { id: r.id, userId: r.user_id, accessoryType: r.accessory_type,
    brand: r.brand, model: r.model, weight: r.weight,
    notes: r.notes, createdAt: r.created_at }
}
function fromAccessory(a: Partial<Accessory>, userId: string) {
  return { user_id: userId, accessory_type: a.accessoryType, brand: a.brand,
    model: a.model, weight: a.weight, notes: a.notes }
}

function toGlass(r: any): Glass {
  return { id: r.id, userId: r.user_id, type: r.type, brand: r.brand, model: r.model,
    magnification: r.magnification, reticle: r.reticle, tubeSize: r.tube_size,
    turretType: r.turret_type, objectiveLens: r.objective_lens, eyepiece: r.eyepiece,
    hasReticle: r.has_reticle, prismType: r.prism_type, fieldOfView: r.field_of_view,
    weight: r.weight, maxRange: r.max_range, angleComp: r.angle_comp,
    ballisticCalc: r.ballistic_calc, notes: r.notes, createdAt: r.created_at,
    reticleImageUrl: r.reticle_image_url || undefined } as any
}
function fromGlass(g: Partial<Glass>, userId: string) {
  return { user_id: userId, type: g.type, brand: g.brand, model: g.model,
    magnification: g.magnification, reticle: g.reticle, tube_size: g.tubeSize,
    turret_type: g.turretType, objective_lens: g.objectiveLens, eyepiece: g.eyepiece,
    has_reticle: g.hasReticle, prism_type: g.prismType, field_of_view: g.fieldOfView,
    weight: g.weight, max_range: g.maxRange, angle_comp: g.angleComp,
    ballistic_calc: g.ballisticCalc, notes: g.notes,
    reticle_image_url: (g as any).reticleImageUrl || null }
}

function toSession(r: any): RangeSession {
  return {
    id: r.id,
    rifleId: r.rifle_id,
    loadId: r.load_id,
    sessionDate: r.session_date,
    notes: r.notes || undefined,
    conditions: (r.temperature != null) ? {
      temperature: r.temperature, windSpeed: r.wind_speed,
      windDirection: r.wind_direction, humidity: r.humidity, pressure: r.pressure
    } : undefined,
    groups: (r.range_groups || []).map((g: any) => ({
      id: g.id, groupId: g.group_id, groupSize: g.group_size ?? 0,
      extremeSpread: g.extreme_spread ?? 0, groupSd: g.group_sd ?? 0,
      rounds: g.rounds ?? 0, velocityEs: g.velocity_es ?? 0, velocitySd: g.velocity_sd ?? 0,
      velocities: g.velocities || undefined,
      velocityTimes: g.velocity_times || undefined,
      distance: g.distance || undefined,
      targetPhotoUrl: g.target_photo_url || undefined,
    })),
    zeroDrift: r.zero_drift || undefined,
    zeroDriftUnit: r.zero_drift_unit || undefined,
    ammoType: r.ammo_type || undefined,
    ammoUsageId: r.ammo_usage_id || undefined,
    shotsFired: r.shots_fired ?? undefined,
    createdAt: r.created_at,
  } as any
}

function toMatch(r: any): MatchEvent {
  return { id: r.id, name: r.name, date: r.date, time: r.time,
    isAllDay: r.is_all_day, reminder: r.reminder, notes: r.notes }
}
function fromMatch(m: Partial<MatchEvent>, userId: string) {
  return { user_id: userId, name: m.name, date: m.date, time: m.time,
    is_all_day: m.isAllDay, reminder: m.reminder, notes: m.notes }
}

// ── generic CRUD hook factory ─────────────────────────────────────────────────

function useTable<T extends { id: string }>(
  table: string,
  toT: (r: any) => T,
  fromT: (item: Partial<T>, userId: string) => any,
  orderBy = 'created_at',
  extraSelect = ''
) {
  const { user } = useAuth()
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from(table)
      .select(`*${extraSelect}`)
      .eq('user_id', user.id)
      .order(orderBy, { ascending: false })
    if (data) setItems(data.map(toT))
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const itemsRef = useRef<T[]>([])
  itemsRef.current = items

  const setItemsWrapper = useCallback(async (value: T[] | ((prev: T[]) => T[])) => {
    if (!user) return
    const prev = itemsRef.current
    const next = typeof value === 'function' ? value(prev) : value

    const prevIds = new Set(prev.map(i => i.id))
    const nextIds = new Set(next.map(i => i.id))

    const added   = next.filter(i => !prevIds.has(i.id))
    const removed = prev.filter(i => !nextIds.has(i.id))
    const updated = next.filter(i => prevIds.has(i.id) && JSON.stringify(i) !== JSON.stringify(prev.find(p => p.id === i.id)))

    for (const item of added) {
      const row = { id: item.id, ...fromT(item, user.id) }
      const { error } = await supabase.from(table).insert(row)
      if (error) console.error(`insert ${table}:`, error.message, row)
    }
    for (const item of removed) {
      const { error } = await supabase.from(table).delete().eq('id', item.id)
      if (error) console.error(`delete ${table}:`, error.message)
    }
    for (const item of updated) {
      const updateRow = fromT(item, user.id)
      const { error } = await supabase.from(table).update(updateRow).eq('id', item.id)
      if (error) console.error(`update ${table}:`, error.message)
    }

    setItems(next)
  }, [user])

  return [items, setItemsWrapper, loading] as const
}

// ── Sessions (special — has child groups) ────────────────────────────────────

const sessionRow = (s: RangeSession, userId: string) => ({
  id: s.id, user_id: userId,
  rifle_id: (s as any).rifleId || null,
  load_id: (s as any).loadId || null,
  session_date: s.sessionDate,
  notes: (s as any).notes || null,
  temperature: s.conditions?.temperature ?? null,
  wind_speed: s.conditions?.windSpeed ?? null,
  wind_direction: s.conditions?.windDirection ?? null,
  humidity: s.conditions?.humidity ?? null,
  pressure: s.conditions?.pressure ?? null,
  zero_drift: (s as any).zeroDrift ?? null,
  zero_drift_unit: (s as any).zeroDriftUnit ?? null,
  ammo_type: (s as any).ammoType ?? null,
  ammo_usage_id: (s as any).ammoUsageId ?? null,
  shots_fired: (s as any).shotsFired ?? null,
})

const groupRows = (s: RangeSession, sessionId: string) =>
  s.groups.map(g => ({
    id: g.id, session_id: sessionId, group_id: g.groupId,
    group_size: g.groupSize ?? null,
    extreme_spread: g.extremeSpread ?? null,
    group_sd: g.groupSd ?? null,
    rounds: g.rounds ?? null,
    velocity_es: g.velocityEs ?? null,
    velocity_sd: g.velocitySd ?? null,
    velocities: (g as any).velocities ?? null,
    velocity_times: (g as any).velocityTimes ?? null,
    distance: (g as any).distance ?? null,
    target_photo_url: (g as any).targetPhotoUrl ?? null,
  }))

function useSessions() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<RangeSession[]>([])
  const sessionsRef = useRef<RangeSession[]>([])
  sessionsRef.current = sessions
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) { setSessions([]); setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('range_sessions')
      .select('*, range_groups(*)')
      .eq('user_id', user.id)
      .order('session_date', { ascending: false })
    if (error) console.error('fetch sessions:', error)
    if (data) setSessions(data.map(toSession))
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const setSessionsWrapper = useCallback(async (value: RangeSession[] | ((prev: RangeSession[]) => RangeSession[])) => {
    if (!user) return
    const prev = sessionsRef.current
    const next = typeof value === 'function' ? value(prev) : value

    const prevIds = new Set(prev.map(s => s.id))
    const nextIds = new Set(next.map(s => s.id))


    // Deletions
    const toDelete = prev.filter(s => !nextIds.has(s.id))
    for (const s of toDelete) {
      const { error } = await supabase.from('range_sessions').delete().eq('id', s.id)
      if (error) console.error('delete session:', error)
    }

    // Additions
    const toAdd = next.filter(s => !prevIds.has(s.id))
    for (const s of toAdd) {
      const row = sessionRow(s, user.id)
        const { error: se } = await supabase.from('range_sessions').insert(row)
      if (se) { console.error('insert session:', se); continue }
      if (s.groups.length > 0) {
        const gRows = groupRows(s, s.id)
            const { error: ge } = await supabase.from('range_groups').insert(gRows)
        if (ge) console.error('insert groups:', ge)
      }
    }

    // Updates
    for (const s of next.filter(s => prevIds.has(s.id))) {
      const old = prev.find(p => p.id === s.id)!
      const sRow = sessionRow(s, user.id)
      const oldRow = sessionRow(old, user.id)
      const sessionChanged = JSON.stringify(sRow) !== JSON.stringify(oldRow)
      const groupsChanged = JSON.stringify(groupRows(s, s.id)) !== JSON.stringify(groupRows(old, s.id))

      if (sessionChanged) {
        const { error } = await supabase.from('range_sessions').update(sRow).eq('id', s.id)
        if (error) console.error('update session:', error)
      }
      if (groupsChanged) {
        await supabase.from('range_groups').delete().eq('session_id', s.id)
        if (s.groups.length > 0) {
          const { error } = await supabase.from('range_groups').insert(groupRows(s, s.id))
          if (error) console.error('update groups:', error)
        }
      }
    }

    setSessions(next)
  }, [user])  // NOTE: no sessions in deps — uses sessionsRef to avoid stale closure

  return [sessions, setSessionsWrapper, loading] as const
}

// ── Exported hooks ────────────────────────────────────────────────────────────

export function useRifles()      { return useTable<Rifle>     ('rifles',      toRifle,     fromRifle)      }
export function useLoads()       { return useTable<Load>      ('loads',       toLoad,      fromLoad)       }
export function useGear()        { return useTable<GearItem>  ('gear',        toGear,      fromGear)       }
export function useAccessories() { return useTable<Accessory> ('accessories', toAccessory, fromAccessory)  }
export function useGlass()       { return useTable<Glass>     ('glass',       toGlass,     fromGlass)      }
export function useMatches()     { return useTable<MatchEvent>('match_events',toMatch,     fromMatch, 'date') }
export { useSessions }
