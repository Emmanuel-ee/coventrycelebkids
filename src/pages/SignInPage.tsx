import { useEffect, useMemo, useState } from 'react'
import { addEvent, findChildById, findChildrenByName, getEvents, getInstructorUpdates, getInstructors } from '../lib/storage'
import { initials, publicAssetUrl } from '../lib/publicPhotos'

function nowId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export default function SignInPage() {
  const updates = useMemo(() => getInstructorUpdates(), [])
  const instructors = useMemo(() => getInstructors().filter((i) => i.active), [])
  const [eventsRefresh, setEventsRefresh] = useState(0)
  const [search, setSearch] = useState('')
  const matches = useMemo(() => findChildrenByName(search), [search])

  // Poll localStorage-backed events so this screen reflects sign-ins promptly.
  // (Also catches changes if another tab/device updates localStorage.)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return
      if (e.key.includes('cck_events_v1')) setEventsRefresh((x) => x + 1)
    }

    window.addEventListener('storage', onStorage)
    const t = window.setInterval(() => setEventsRefresh((x) => x + 1), 2000)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.clearInterval(t)
    }
  }, [])

  const signedInNow = useMemo(() => {
    void eventsRefresh
    const events = getEvents()
    const lastByChild = new Map<string, (typeof events)[number]>()
    for (const ev of events) {
      if (!lastByChild.has(ev.childId)) lastByChild.set(ev.childId, ev)
    }

    return Array.from(lastByChild.values())
      .filter((ev) => ev.type === 'SIGN_IN')
      .sort((a, b) => (a.timeISO < b.timeISO ? 1 : -1))
  }, [eventsRefresh])

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

    setEventsRefresh((x) => x + 1)

    setMessage(`Signed in: ${child.childFirstName} ${child.childLastName}`)
    setNotes('')
    setParentName('')
  }

  return (
    <section className="card">
      <h2>✅ Check-in (Drop-off)</h2>

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
                <div className="instructorMiniHeader">
                  {i.photoUrl ? (
                    <img className="avatar" src={i.photoUrl} alt={i.fullName} loading="lazy" />
                  ) : (
                    <div className="avatar avatarFallback" aria-hidden="true">{initials(i.fullName)}</div>
                  )}
                  <div>
                    <div className="strong">{i.fullName}</div>
                    <div className="muted small">{i.role || 'Instructor'}</div>
                  </div>
                </div>
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
                <div className="resultRow">
                  {c.photoUrl ? (
                    <img className="avatar childAvatar" src={publicAssetUrl(c.photoUrl)} alt={`${c.childFirstName} ${c.childLastName}`} loading="lazy" />
                  ) : (
                    <div className="avatar avatarFallback childAvatar" aria-hidden="true">
                      {initials(`${c.childFirstName} ${c.childLastName}`)}
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div className="resultTitle">{c.childFirstName} {c.childLastName}</div>
                    <div className="resultMeta">Tap to choose</div>
                  </div>
                </div>
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

      <div className="signedInNow" style={{ marginTop: 14 }}>
        <div className="signedInNowHeader">
          <div className="signedInNowTitle">Children currently checked-in</div>
          <div className="muted small">Today</div>
        </div>

        {signedInNow.length ? (
          <div className="signedInNowList">
            {signedInNow.map((ev) => (
              <div key={ev.childId} className="signedInNowRow">
                <div className="signedInNowLeft">
                  {/* Try to pull a photo from the child profile if available */}
                  {(() => {
                    const child = findChildById(ev.childId)
                    if (child?.photoUrl) {
                      return (
                        <img className="avatar childAvatar" src={publicAssetUrl(child.photoUrl)} alt={ev.childName} loading="lazy" />
                      )
                    }
                    return (
                      <div className="avatar avatarFallback childAvatar" aria-hidden="true">{initials(ev.childName)}</div>
                    )
                  })()}
                  <div className="signedInNowName">{ev.childName}</div>
                </div>
                <div className="signedInNowMeta">
                  {new Date(ev.timeISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="muted">No children checked-in yet.</div>
        )}
      </div>
    </section>
  )
}
