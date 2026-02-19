import type { AttendanceEvent, ChildProfile } from './types'

function csvEscape(value: unknown): string {
  const s = String(value ?? '')
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`
  return s
}

export function toChildrenCsv(children: ChildProfile[]): string {
  const header = [
    'id',
    'childFirstName',
    'childLastName',
    'childDob',
    'allergiesNotes',
    'knownAllergies',
    'photoCaptureConsent',
    'parentFullName',
    'parentPhone',
    'parentEmail',
    'emergencyContactName',
    'emergencyContactPhone',
    'createdAtISO',
  ]
  const rows = children.map((c) => [
    c.id,
    c.childFirstName,
    c.childLastName,
    c.childDob ?? '',
    c.allergiesNotes ?? '',
    c.knownAllergies ?? '',
    c.photoCaptureConsent ? 'yes' : 'no',
    c.parentFullName,
    c.parentPhone ?? '',
    c.parentEmail ?? '',
    c.emergencyContactName ?? '',
    c.emergencyContactPhone ?? '',
    c.createdAtISO,
  ])
  return [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n')
}

export function toEventsCsv(events: AttendanceEvent[]): string {
  const header = ['id', 'type', 'childId', 'childName', 'parentName', 'timeISO', 'notes']
  const rows = events.map((e) => [e.id, e.type, e.childId, e.childName, e.parentName, e.timeISO, e.notes ?? ''])
  return [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n')
}

export function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
