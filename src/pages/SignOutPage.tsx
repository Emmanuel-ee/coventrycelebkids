import { useMemo, useState } from 'react'
import { addEvent, findChildById, findChildrenByName, getInstructorUpdates, getInstructors } from '../lib/storage'

function nowId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export default function SignOutPage() {
  const updates = useMemo(() => getInstructorUpdates(), [])
  const instructors = useMemo(() => getInstructors().filter((i) => i.active), [])
  const [search, setSearch] = useState('')
  const matches = useMemo(() => findChildrenByName(search), [search])

  const [childId, setChildId] = useState('')
  const selected = useMemo(() => findChildById(childId.trim()) ?? null, [childId])

  const [parentName, setParentName] = useState('')
  const [notes, setNotes] = useState('')

  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)

    const id = childId.trim()
    const child = findChildById(id)
    if (!id || !child) {
      setError('Child not found. Please select a registered child.')
      return
    }

    const parent = parentName.trim() || child.parentFullName

    addEvent({
      id: nowId(),
      type: 'SIGN_OUT',
      childId: child.id,
      childName: `${child.childFirstName} ${child.childLastName}`,
      parentName: parent,
      timeISO: new Date().toISOString(),
      notes: notes.trim() || undefined,
    })

    setMessage(`Signed out: ${child.childFirstName} ${child.childLastName}`)
    setNotes('')
    setParentName('')
  }

  return (
    <section className="card">
      <h2>🏁 Sign out (Pick-up)</h2>

      {updates?.message ? (
        <div className="teacherUpdates">
          <div className="teacherUpdatesHeader">
            <div className="teacherUpdatesIcon">📣</div>
            <div>
              <div className="teacherUpdatesTitle">Message from the Instructors</div>
              {updates.updatedAtISO ? (
                <div className="teacherUpdatesMeta">(updated {new Date(updates.updatedAtISO).toLocaleDateString()})</div>
              ) : null}
            </div>
          </div>
          <div className="teacherUpdatesBody">{updates.message}</div>
        </div>
      ) : null}

      {instructors.length ? (
        <div className="instructorsSection">
          <div className="instructorsTitle">🧑🏽‍🏫 Today’s instructors</div>
          <div className="instructorGrid">
            {instructors.map((i) => (
              <div key={i.id} className="instructorMiniCard">
                <div className="strong">{i.fullName}</div>
                <div className="muted small">{i.role || 'Instructor'}</div>
                {i.bio ? <div className="muted" style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{i.bio}</div> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid2">
        <label>
          Child’s name
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Start typing…" />
        </label>
        <label>
          Child code (optional)
          <input value={childId} onChange={(e) => setChildId(e.target.value)} placeholder="Only if needed" />
        </label>
      </div>

      {search.trim() ? (
        <div className="results">
          {matches.length ? (
            matches.map((c) => (
              <button
                key={c.id}
                type="button"
                className={c.id === childId ? 'result selected' : 'result'}
                onClick={() => setChildId(c.id)}
              >
                <div className="resultTitle">{c.childFirstName} {c.childLastName}</div>
                <div className="resultMeta">Tap to choose</div>
              </button>
            ))
          ) : (
            <div className="muted">No matches.</div>
          )}
        </div>
      ) : null}

      <form onSubmit={submit} className="form">
        <div className="grid2">
          <label>
            Parent/guardian name (optional)
            <input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder={selected?.parentFullName ?? 'Full name'} />
          </label>
          <label>
            Selected child
            <input value={selected ? `${selected.childFirstName} ${selected.childLastName}` : ''} readOnly placeholder="Select from search results" />
          </label>
        </div>

        <label>
          Notes (optional)
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes (early pick-up etc.)" />
        </label>

        {error ? <div className="alert error">{error}</div> : null}
        {message ? <div className="alert success">{message}</div> : null}

        <div className="actions">
          <button type="submit">Confirm sign out</button>
        </div>
      </form>
    </section>
  )
}
