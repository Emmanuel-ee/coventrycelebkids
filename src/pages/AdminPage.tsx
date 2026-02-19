import { useMemo, useState } from 'react'
import { clearAllData, getChildren, getEvents } from '../lib/storage'
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
  const children = useMemo(() => {
    void refresh
    return getChildren()
  }, [refresh])

  const events = useMemo(() => {
    void refresh
    return getEvents()
  }, [refresh])

  return (
    <section className="card">
      <h2>Admin</h2>
      <p className="muted">
        This page is stored only in this device’s browser (localStorage). Use Export to download CSV.
      </p>

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
