import { useMemo, useState } from 'react'
import { addEvent, findChildById, findChildrenByName } from '../lib/storage'

function nowId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export default function SignInPage() {
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
      <h2>✅ Drop-off sign in</h2>
      <p className="muted">Find the child’s name, tap it, then confirm.</p>

      <div className="grid2">
        <label>
          Search by child name
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g., Sarah" />
        </label>
        <label>
          Or enter Child ID
          <input value={childId} onChange={(e) => setChildId(e.target.value)} placeholder="e.g., smith-sarah-2019-06-01" />
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
                <div className="resultMeta">ID: {c.id}</div>
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
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes for teachers" />
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
