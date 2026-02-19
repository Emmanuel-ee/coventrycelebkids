export type ChildId = string

export type ChildProfile = {
  id: ChildId
  childFirstName: string
  childLastName: string
  childDob?: string // yyyy-mm-dd
  allergiesNotes?: string
  knownAllergies?: string
  photoCaptureConsent?: boolean
  parentFullName: string
  parentPhone?: string
  parentEmail?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  createdAtISO: string
}

export type AttendanceEventType = 'SIGN_IN' | 'SIGN_OUT'

export type AttendanceEvent = {
  id: string
  type: AttendanceEventType
  childId: ChildId
  childName: string
  parentName: string
  timeISO: string
  notes?: string
}
