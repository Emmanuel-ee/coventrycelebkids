import { useMemo, useState } from 'react'
import { addEvent, findChildById, findChildrenByName, getInstructorUpdates, getInstructors } from '../lib/storage'

function nowId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export default function SignInPage() {
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
      setError('Child not found. If this is the first visit, please register first.')
      return
    }

    const parent = parentName.trim() || child.parentFullName

    addEvent({
      id: nowId(),
      type: 'SIGN_IN',
      childId: child.id,
      childName: `${child.childFirstName} ${child.childLastName}`,
      parentName: parent,
      timeISO: new Date().toISOString(),
      notes: notes.trim() || undefined,
    })

    setMessage(`Signed in: ${child.childFirstName} ${child.childLastName}`)
    setNotes('')
    setParentName('')
  }

  return (
    <section className="card">
      <h2>✅ Check-in (Drop-off)</h2>

      <div className="muted" style={{ marginTop: 8 }}>
        We’ll take great care of your child. If there are any allergies, medical needs, or worries today, add a quick note below.
      </div>

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

      <label style={{ display: 'block', marginTop: 12 }}>
        Child’s name
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            if (!e.target.value.trim()) setChildId('')
          }}
          placeholder="Start typing…"
          inputMode="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="words"
        />
      </label>

      <div className="muted small" style={{ marginTop: 6 }}>
        First time here? Tap “New here?” above.
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

      <form onSubmit={submit} className="form" style={{ marginTop: 12 }}>
        <div className="grid2">
          <label>
            Selected child
            <input value={selected ? `${selected.childFirstName} ${selected.childLastName}` : ''} readOnly placeholder="Tap a child from results" />
          </label>
          <label>
            Parent/guardian name (optional)
            <input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder={selected?.parentFullName ?? 'Full name'} />
          </label>
        </div>

        <label>
          Notes (optional)
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything we should know today?" />
        </label>

        {error ? <div className="alert error">{error}</div> : null}
        {message ? <div className="alert success">{message}</div> : null}

        <div className="actions">
          <button type="submit">Finish check-in</button>
        </div>
      </form>
    </section>
  )
}
