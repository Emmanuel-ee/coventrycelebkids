import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { clearAllData, clearInstructorUpdates, getChildren, getEvents, getInstructorUpdates, setInstructorUpdates } from '../lib/storage'
import { downloadTextFile, toChildrenCsv, toEventsCsv } from '../lib/csv'

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export default function AdminPage() {
  const [refresh, setRefresh] = useState(0)

  const savedUpdates = useMemo(() => {
    void refresh
    return getInstructorUpdates()
  }, [refresh])

  const [updatesDraft, setUpdatesDraft] = useState('')

  const children = useMemo(() => {
    void refresh
    return getChildren()
  }, [refresh])

  const events = useMemo(() => {
    void refresh
    return getEvents()
  }, [refresh])

  const url = 'https://emmanuel-ee.github.io/coventrycelebkids/'

  return (
    <section className="card">
      <h2>Admin</h2>
      <p className="muted">
        This page is stored only in this device’s browser (localStorage). Use Export to download CSV.
      </p>

      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>📣 Instructor updates (shown to parents)</h3>
        <p className="muted small" style={{ marginTop: 6 }}>
          This message will appear on the Sign in and Sign out pages.
        </p>

        {savedUpdates?.message ? (
          <div className="alert" style={{ marginTop: 10 }}>
            <div className="strong">Current message</div>
            <div style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{savedUpdates.message}</div>
            <div className="muted small" style={{ marginTop: 6 }}>
              Updated: {formatTime(savedUpdates.updatedAtISO)}
            </div>
          </div>
        ) : (
          <div className="muted" style={{ marginTop: 10 }}>No update message set yet.</div>
        )}

        <label style={{ display: 'block', marginTop: 10 }}>
          New / edit message
          <textarea
            value={updatesDraft}
            onChange={(e) => setUpdatesDraft(e.target.value)}
            placeholder="e.g., ‘Parents: please pick up by 12:30 today. Memory verse: John 3:16.’"
            rows={4}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </label>

        <div className="actions wrap">
          <button
            type="button"
            onClick={() => {
              const msg = updatesDraft.trim()
              if (!msg) {
                alert('Please type a message (or use Clear).')
                return
              }
              setInstructorUpdates(msg)
              setUpdatesDraft('')
              setRefresh((x) => x + 1)
            }}
          >
            Save update
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setUpdatesDraft(savedUpdates?.message ?? '')
            }}
          >
            Load current into editor
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => {
              const ok = confirm('Clear the update message for parents?')
              if (!ok) return
              clearInstructorUpdates()
              setRefresh((x) => x + 1)
            }}
          >
            Clear update
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>🪧 QR code for parents</h3>
        <p className="muted small" style={{ marginTop: 6 }}>
          Parents can scan this to open the sign in/out page.
        </p>

        <div style={{ display: 'grid', placeItems: 'center', padding: 10 }}>
          <a href={url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
            <img
              src={`${import.meta.env.BASE_URL}qr-coventrycelebkids.png`}
              alt="QR code to open the sign in/out site"
              style={{ width: 260, maxWidth: '70vw', background: 'white', padding: 12, borderRadius: 12 }}
            />
          </a>
          <div className="muted small" style={{ marginTop: 8, textAlign: 'center' }}>{url}</div>
        </div>

        <div className="actions wrap">
          <Link
            to="/qr"
            className="navLink"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            Open print view
          </Link>
        </div>
      </div>

      <div className="actions wrap">
        <button
          type="button"
          onClick={() => {
            const csv = toChildrenCsv(children)
            downloadTextFile(`children-${new Date().toISOString().slice(0, 10)}.csv`, csv)
          }}
        >
          Export children CSV
        </button>
        <button
          type="button"
          onClick={() => {
            const csv = toEventsCsv(events)
            downloadTextFile(`attendance-${new Date().toISOString().slice(0, 10)}.csv`, csv)
          }}
        >
          Export attendance CSV
        </button>
        <button type="button" className="secondary" onClick={() => setRefresh((x) => x + 1)}>
          Refresh
        </button>
        <button
          type="button"
          className="danger"
          onClick={() => {
            const ok = confirm('This will delete ALL saved children and attendance events on this device. Continue?')
            if (!ok) return
            clearAllData()
            setRefresh((x) => x + 1)
          }}
        >
          Clear all data (this device)
        </button>
      </div>

      <hr className="hr" />

      <h3>Registered children ({children.length})</h3>
      {children.length ? (
        <div className="table">
          <div className="row head">
            <div>Child</div>
            <div>Parent</div>
            <div>Allergies / Photo</div>
            <div>Created</div>
          </div>
          {children.map((c) => (
            <div key={c.id} className="row">
              <div>
                <div className="strong">{c.childFirstName} {c.childLastName}</div>
                <div className="muted small">DOB: {c.childDob || '—'}</div>
              </div>
              <div>
                <div className="strong">{c.parentFullName}</div>
                <div className="muted small">{c.parentPhone || c.parentEmail || '—'}</div>
              </div>
              <div>
                <div className="muted small">Known allergies: {c.knownAllergies || '—'}</div>
                <div className="muted small">Photo consent: {c.photoCaptureConsent ? 'Yes' : 'No'}</div>
                <div className="muted small mono">ID: {c.id}</div>
              </div>
              <div className="muted small">{formatTime(c.createdAtISO)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="muted">No children registered yet.</div>
      )}

      <hr className="hr" />

      <h3>Attendance events ({events.length})</h3>
      {events.length ? (
        <div className="table">
          <div className="row head">
            <div>Time</div>
            <div>Type</div>
            <div>Child</div>
            <div>Parent</div>
            <div>Notes</div>
          </div>
          {events.slice(0, 200).map((e) => (
            <div key={e.id} className="row">
              <div className="muted small">{formatTime(e.timeISO)}</div>
              <div className={e.type === 'SIGN_IN' ? 'badge in' : 'badge out'}>{e.type === 'SIGN_IN' ? 'Sign in' : 'Sign out'}</div>
              <div>
                <div className="strong">{e.childName}</div>
                <div className="muted small mono">{e.childId}</div>
              </div>
              <div>{e.parentName}</div>
              <div className="muted small">{e.notes || '—'}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="muted">No attendance events yet.</div>
      )}

      <p className="muted small">Showing up to the latest 200 events.</p>
    </section>
  )
}
