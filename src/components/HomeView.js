import React from 'react';

const HomeView = ({
  isLoading,
  onRegister,
  onCheckin,
  announcements,
  announcementsStatus,
  onSelectAnnouncement,
  truncateMessage,
}) => (
  <>
    <section className="card card--center">
      <div className="home-hero">
        <h2>Welcome, parents & guardians!</h2>
        <p className="home-hero__text">
          Start by registering your child, then come back here for drop-off and pick-up.
        </p>
      </div>
      <div className="home-actions">
        <button type="button" className="button--primary" onClick={onRegister}>
          Register your Child
        </button>
        <button type="button" className="button--secondary" onClick={onCheckin}>
          Drop off / Pick up
        </button>
      </div>
      {isLoading && <div className="empty">Connecting to Supabase…</div>}
    </section>
    <section className="card">
      <div className="card__header">
        <div>
          <h2>Announcements</h2>
          <p className="card__subtitle">Updates for parents and guardians.</p>
        </div>
      </div>
      {announcementsStatus && <div className="empty">{announcementsStatus}</div>}
      <ul className="list">
        {announcements.map((announcement) => (
          <li
            key={announcement.id}
            className="list__item list__item--clickable"
            onClick={() => onSelectAnnouncement(announcement)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                onSelectAnnouncement(announcement);
              }
            }}
          >
            <div>
              <h3>{announcement.title}</h3>
              <p className="list__notes">{truncateMessage(announcement.message)}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  </>
);

export default HomeView;
