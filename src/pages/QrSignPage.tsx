export default function QrSignPage() {
  const url = 'https://emmanuel-ee.github.io/coventrycelebkids/'

  return (
    <section className="card">
      <h2>Children’s Class Sign In/Out</h2>
      <p className="muted">Scan the QR code to open the sign in / sign out page.</p>

      <div style={{ display: 'grid', placeItems: 'center', padding: 16 }}>
        <a href={url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
          <img
            src={`${import.meta.env.BASE_URL}qr-coventrycelebkids.png`}
            alt="QR code to open the sign in/out site"
            style={{ width: 320, maxWidth: '80vw', background: 'white', padding: 12, borderRadius: 12 }}
          />
        </a>

        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <div className="strong" style={{ fontSize: 18 }}>Children’s Class Sign In/Out</div>
          <div className="muted small">{url}</div>
          <div className="muted small" style={{ marginTop: 6 }}>
            Tip: print this page and place it by the entrance.
          </div>
        </div>
      </div>
    </section>
  )
}
