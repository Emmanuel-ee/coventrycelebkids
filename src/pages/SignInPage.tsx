import { useMemo, useState } from 'react'
import { addEvent, findChildById, findChildrenByName, getInstructorUpdates } from '../lib/storage'

function nowId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export default function SignInPage() {
  const updates = useMemo(() => getInstructorUpdates(), [])
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
      <h2>✅ Sign in (Drop-off)</h2>

      {updates?.message ? (
        <div className="teacherUpdates">
          <div className="teacherUpdatesHeader">
            <div className="teacherUpdatesIcon">📣</div>
            <div>
              <div className="teacherUpdatesTitle">Message from the teachers</div>
              {updates.updatedAtISO ? (
                <div className="teacherUpdatesMeta">Updated: {new Date(updates.updatedAtISO).toLocaleString()}</div>
              ) : null}
            </div>
          </div>
          <div className="teacherUpdatesBody">{updates.message}</div>
        </div>
      ) : null}

      <label style={{ display: 'block', marginTop: 12 }}>
        Child name (search)
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            if (!e.target.value.trim()) setChildId('')
          }}
          placeholder="Start typing a name…"
          inputMode="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="words"
        />
      </label>

      <div className="muted small" style={{ marginTop: 6 }}>
        Tip: If the first visit, use “First-time registration”.
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
                <div className="resultMeta">ID: {c.id}</div>
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
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything we should know?" />
        </label>

        {error ? <div className="alert error">{error}</div> : null}
        {message ? <div className="alert success">{message}</div> : null}

        <div className="actions">
          <button type="submit">Confirm sign in</button>
        </div>
      </form>
    </section>
  )
}
