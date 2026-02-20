import { useMemo, useState } from 'react'
import { upsertChild } from '../lib/storage'

function makeId(first: string, last: string, dob?: string) {
  const f = first.trim().toLowerCase().replaceAll(/\s+/g, '-')
  const l = last.trim().toLowerCase().replaceAll(/\s+/g, '-')
  const d = (dob ?? '').trim()
  const suffix = d ? `-${d}` : ''
  return `${l}-${f}${suffix}`
}

export default function RegisterChildPage() {
  const [childFirstName, setChildFirstName] = useState('')
  const [childLastName, setChildLastName] = useState('')
  const [childDob, setChildDob] = useState('')
  const [allergiesNotes, setAllergiesNotes] = useState('')
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([])
  const [otherAllergy, setOtherAllergy] = useState('')
  const [photoCaptureConsent, setPhotoCaptureConsent] = useState(false)

  const [parentFullName, setParentFullName] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [parentEmail, setParentEmail] = useState('')

  const [emergencyContactName, setEmergencyContactName] = useState('')
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('')

  const [savedId, setSavedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generatedId = useMemo(
    () => makeId(childFirstName, childLastName, childDob || undefined),
    [childFirstName, childLastName, childDob],
  )

  const commonAllergies = useMemo(
    () => [
      // Food
      'Peanuts',
      'Tree nuts',
      'Milk / dairy',
      'Egg',
      'Wheat / gluten',
      'Soy',
      'Fish',
      'Shellfish',
      'Sesame',
      // Non-food
      'Latex',
      'Bee / wasp stings',
      'Pollen / hay fever',
      'Dust mites',
      'Pet dander',
      'Mould',
      'Medication (please specify)',
      'Skin products / fragrance',
    ],
    [],
  )

  const [allergyToAdd, setAllergyToAdd] = useState('')

  const computedKnownAllergies = useMemo(() => {
    const cleanedSelected = selectedAllergies.map((a) => a.trim()).filter(Boolean)
    const other = otherAllergy
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
    const all = [...cleanedSelected, ...other]
    // de-dupe (case-insensitive)
    const seen = new Set<string>()
    const deduped: string[] = []
    for (const a of all) {
      const key = a.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      deduped.push(a)
    }
    return deduped.join(', ')
  }, [selectedAllergies, otherAllergy])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSavedId(null)

    if (!childFirstName.trim() || !childLastName.trim()) {
      setError('Please enter the child’s first and last name.')
      return
    }
    if (!parentFullName.trim()) {
      setError('Please enter the parent/guardian full name.')
      return
    }

    const profile = upsertChild({
      id: generatedId,
      childFirstName: childFirstName.trim(),
      childLastName: childLastName.trim(),
      childDob: childDob || undefined,
      allergiesNotes: allergiesNotes.trim() || undefined,
      knownAllergies: computedKnownAllergies.trim() || undefined,
      photoCaptureConsent,
      parentFullName: parentFullName.trim(),
      parentPhone: parentPhone.trim() || undefined,
      parentEmail: parentEmail.trim() || undefined,
      emergencyContactName: emergencyContactName.trim() || undefined,
      emergencyContactPhone: emergencyContactPhone.trim() || undefined,
    })

    setSavedId(profile.id)
  }

  return (
    <section className="card">
      <h2>📝 First-time registration</h2>
      <p className="muted">
        Quick setup for first-time visitors. Next time, just use <b>Sign in</b> (drop-off) and <b>Sign out</b> (pick-up).
      </p>

      <form onSubmit={onSubmit} className="form">
        <div className="grid2">
          <label>
            Child first name
            <input value={childFirstName} onChange={(e) => setChildFirstName(e.target.value)} autoComplete="given-name" />
          </label>
          <label>
            Child last name
            <input value={childLastName} onChange={(e) => setChildLastName(e.target.value)} autoComplete="family-name" />
          </label>
        </div>

        <div className="grid2">
          <label>
            Date of birth (optional)
            <input type="date" value={childDob} onChange={(e) => setChildDob(e.target.value)} />
          </label>
          <label>
            Child ID (auto)
            <input value={generatedId} readOnly />
          </label>
        </div>

        <label>
          Allergies / medical notes (optional)
          <textarea value={allergiesNotes} onChange={(e) => setAllergiesNotes(e.target.value)} rows={3} />
        </label>

        <label>
          Known allergies (optional)
          <div className="muted small">
            Use the dropdown to add items. We’ll list your selected allergies below. If it’s not listed, type it into “Other allergy”.
          </div>

          <div className="allergyPicker" style={{ display: 'grid', gap: 10, marginTop: 8 }}>
            <div className="allergyPickerRow" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
              <label style={{ margin: 0 }}>
                Choose from the list
                <select value={allergyToAdd} onChange={(e) => setAllergyToAdd(e.target.value)}>
                  <option value="">Select an allergy…</option>
                  {commonAllergies.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => {
                  const val = allergyToAdd.trim()
                  if (!val) return
                  setSelectedAllergies((prev) => (prev.includes(val) ? prev : [...prev, val]))
                  setAllergyToAdd('')
                }}
                aria-label="Add selected allergy"
              >
                Add
              </button>
            </div>

            {selectedAllergies.length ? (
              <div className="allergyChips" aria-label="Selected allergies">
                {selectedAllergies.map((a) => (
                  <span key={a} className="chip">
                    {a}
                    <button
                      type="button"
                      className="chipX"
                      onClick={() => setSelectedAllergies((prev) => prev.filter((x) => x !== a))}
                      aria-label={`Remove ${a}`}
                      title={`Remove ${a}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="muted small">No allergies selected from the list yet.</div>
            )}

            <label>
              Other allergy (optional)
              <input
                value={otherAllergy}
                onChange={(e) => setOtherAllergy(e.target.value)}
                placeholder="e.g., strawberry, nickel, asthma (comma-separated)"
              />
            </label>

            {/* Backwards-compatible hidden field for any older flows and to keep a simple single string in storage */}
            <input type="hidden" value={computedKnownAllergies} readOnly />
          </div>
        </label>

        <label>
          Would you like your child’s picture to be captured?
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingTop: 6 }}>
            <input
              type="checkbox"
              checked={photoCaptureConsent}
              onChange={(e) => setPhotoCaptureConsent(e.target.checked)}
            />
            <span className="muted">Yes, I consent to photos being taken for class use.</span>
          </div>
        </label>

        <hr className="hr" />

        <label>
          Parent/guardian full name
          <input value={parentFullName} onChange={(e) => setParentFullName(e.target.value)} autoComplete="name" />
        </label>

        <div className="grid2">
          <label>
            Parent phone (optional)
            <input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} inputMode="tel" autoComplete="tel" />
          </label>
          <label>
            Parent email (optional)
            <input value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} inputMode="email" autoComplete="email" />
          </label>
        </div>

        <div className="grid2">
          <label>
            Emergency contact name (optional)
            <input value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} />
          </label>
          <label>
            Emergency contact phone (optional)
            <input value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} inputMode="tel" />
          </label>
        </div>

        {error ? <div className="alert error">{error}</div> : null}
        {savedId ? (
          <div className="alert success">
            Saved. Child ID: <b>{savedId}</b>. You can now use Sign in / Sign out.
          </div>
        ) : null}

        <div className="actions">
          <button type="submit">Save registration</button>
        </div>
      </form>
    </section>
  )
}
