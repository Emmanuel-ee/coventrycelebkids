import type { AttendanceEvent, ChildId, ChildProfile } from './types'

const CHILDREN_KEY = 'cck_children_v1'
const EVENTS_KEY = 'cck_events_v1'

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function getChildren(): ChildProfile[] {
  return safeJsonParse<ChildProfile[]>(localStorage.getItem(CHILDREN_KEY), [])
}

export function saveChildren(children: ChildProfile[]) {
  localStorage.setItem(CHILDREN_KEY, JSON.stringify(children))
}

export function upsertChild(profile: Omit<ChildProfile, 'createdAtISO'> & { createdAtISO?: string }): ChildProfile {
  const children = getChildren()
  const existingIndex = children.findIndex((c) => c.id === profile.id)

  const next: ChildProfile = {
    ...profile,
    createdAtISO: profile.createdAtISO ?? new Date().toISOString(),
  }

  if (existingIndex >= 0) {
    children[existingIndex] = next
  } else {
    children.unshift(next)
  }

  saveChildren(children)
  return next
}

export function findChildById(childId: ChildId): ChildProfile | undefined {
  return getChildren().find((c) => c.id === childId)
}

export function findChildrenByName(query: string): ChildProfile[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return getChildren()
    .filter((c) => `${c.childFirstName} ${c.childLastName}`.toLowerCase().includes(q))
    .slice(0, 20)
}

export function getEvents(): AttendanceEvent[] {
  return safeJsonParse<AttendanceEvent[]>(localStorage.getItem(EVENTS_KEY), [])
}

export function saveEvents(events: AttendanceEvent[]) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
}

export function addEvent(event: AttendanceEvent) {
  const events = getEvents()
  events.unshift(event)
  saveEvents(events)
}

export function clearAllData() {
  localStorage.removeItem(CHILDREN_KEY)
  localStorage.removeItem(EVENTS_KEY)
}
