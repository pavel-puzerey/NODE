import { useState, useEffect, useCallback } from 'react'
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
    ballisticCalc: r.ballistic_calc, notes: r.notes, createdAt: r.created_at }
}
function fromGlass(g: Partial<Glass>, userId: string) {
  return { user_id: userId, type: g.type, brand: g.brand, model: g.model,
    magnification: g.magnification, reticle: g.reticle, tube_size: g.tubeSize,
    turret_type: g.turretType, objective_lens: g.objectiveLens, eyepiece: g.eyepiece,
    has_reticle: g.hasReticle, prism_type: g.prismType, field_of_view: g.fieldOfView,
    weight: g.weight, max_range: g.maxRange, angle_comp: g.angleComp,
    ballistic_calc: g.ballisticCalc, notes: g.notes }
}

function toSession(r: any): RangeSession {
  return {
    id: r.id, rifleId: r.rifle_id, loadId: r.load_id,
    sessionDate: r.session_date, notes: r.notes,
    conditions: (r.temperature != null) ? {
      temperature: r.temperature, windSpeed: r.wind_speed,
      windDirection: r.wind_direction, humidity: r.humidity, pressure: r.pressure
    } : undefined,
    groups: (r.range_groups || []).map((g: any) => ({
      id: g.id, groupId: g.group_id, groupSize: g.group_size,
      extremeSpread: g.extreme_spread, groupSd: g.group_sd,
      rounds: g.rounds, velocityEs: g.velocity_es, velocitySd: g.velocity_sd
    })),
    createdAt: r.created_at
  }
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

  const setItemsWrapper = useCallback(async (value: T[] | ((prev: T[]) => T[])) => {
    if (!user) return
    const next = typeof value === 'function' ? value(items) : value

    // Diff: find added, removed, updated
    const prevIds = new Set(items.map(i => i.id))
    const nextIds = new Set(next.map(i => i.id))

    const added   = next.filter(i => !prevIds.has(i.id))
    const removed = items.filter(i => !nextIds.has(i.id))
    const updated = next.filter(i => prevIds.has(i.id) && JSON.stringify(i) !== JSON.stringify(items.find(p => p.id === i.id)))

    for (const item of added) {
      const row = { id: item.id, ...fromT(item, user.id) }
      await supabase.from(table).insert(row)
    }
    for (const item of removed) {
      await supabase.from(table).delete().eq('id', item.id)
    }
    for (const item of updated) {
      await supabase.from(table).update(fromT(item, user.id)).eq('id', item.id)
    }

    setItems(next)
  }, [user, items])

  return [items, setItemsWrapper, loading] as const
}

// ── Sessions (special — has child groups) ────────────────────────────────────

function useSessions() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<RangeSession[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
      if (!user) {
        setSessions([])
        setLoading(false)
        return
      }
      setLoading(true)
    const { data } = await supabase
      .from('range_sessions')
      .select('*, range_groups(*)')
      .eq('user_id', user.id)
      .order('session_date', { ascending: false })
    if (data) setSessions(data.map(toSession))
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const setSessionsWrapper = useCallback(async (value: RangeSession[] | ((prev: RangeSession[]) => RangeSession[])) => {
    if (!user) return
    const next = typeof value === 'function' ? value(sessions) : value

    const prevIds = new Set(sessions.map(s => s.id))
    const nextIds = new Set(next.map(s => s.id))

    // Handle deletions
    for (const s of sessions.filter(s => !nextIds.has(s.id))) {
      await supabase.from('range_sessions').delete().eq('id', s.id)
    }

    // Handle additions
    for (const s of next.filter(s => !prevIds.has(s.id))) {
      const { data: inserted } = await supabase.from('range_sessions').insert({
        id: s.id, user_id: user.id,
        rifle_id: s.rifleId || null, load_id: s.loadId || null,
        session_date: s.sessionDate, notes: s.notes,
        temperature: s.conditions?.temperature, wind_speed: s.conditions?.windSpeed,
        wind_direction: s.conditions?.windDirection, humidity: s.conditions?.humidity,
        pressure: s.conditions?.pressure,
      }).select().single()

      if (inserted && s.groups.length > 0) {
        await supabase.from('range_groups').insert(
          s.groups.map(g => ({
            id: g.id, session_id: inserted.id, group_id: g.groupId,
            group_size: g.groupSize, extreme_spread: g.extremeSpread,
            group_sd: g.groupSd, rounds: g.rounds,
            velocity_es: g.velocityEs, velocity_sd: g.velocitySd,
          }))
        )
      }
    }

    setSessions(next)
  }, [user, sessions])

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
