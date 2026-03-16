import React from 'react';



// Example instructor data; in a real app, this would come from props or API
const instructors = [
  {
    id: 1,
    name: 'Lead Instructor',
    email: 'instructor@celebkids.com',
    avatar: '👩‍🏫',
  },
  // Add more instructors here in the future
];

const HomeView = ({
  isLoading,
  onRegister,
  onCheckin,
  announcements,
  announcementsStatus,
  birthdayChildren,
  onSelectAnnouncement,
  truncateMessage,
}) => (
  <>
    <section className="card card--center" style={{marginBottom: 24}}>
      <div className="home-hero" style={{marginBottom: 16}}>
        <h2 style={{fontWeight: 700, fontSize: '2rem', marginBottom: 8}}>Welcome!</h2>
        <p className="home-hero__text" style={{fontSize: '1.1rem', color: '#475467'}}>
          Register your child to get started. You can drop-off and pick-up using QR codes.
        </p>
      </div>
      <button
        type="button"
        className="button--primary button--bold"
        style={{fontSize: '1.15rem', padding: '1em 2em', marginBottom: 12}}
        onClick={onRegister}
      >
        Register your Child
      </button>
      <button
        type="button"
        className="button--secondary"
        style={{fontSize: '1.05rem', padding: '0.8em 2em'}}
        onClick={onCheckin}
      >
        Drop off / Pick up
      </button>
      {isLoading && <div className="empty" />}
    </section>


    <section className="card card--profile" style={{marginBottom: 24}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12}}>
        <h3 style={{margin: 0, fontWeight: 600}}>Instructors</h3>
        <button
          type="button"
          className="button--secondary"
          style={{fontSize: '0.95rem', padding: '0.5em 1.2em'}}
          // onClick: could open a modal or page for full instructor list in the future
          disabled
        >
          View All Instructors
        </button>
      </div>
      <div style={{display: 'flex', gap: 16, flexWrap: 'wrap'}}>
        {instructors.map((inst) => (
          <div key={inst.id} style={{
            flex: '1 1 180px',
            minWidth: 180,
            maxWidth: 220,
            background: '#f8fafc',
            border: '1px solid #e0e7ff',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 8,
          }}>
            <div style={{width: 48, height: 48, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#4859f0'}}>
              <span role="img" aria-label="Instructor">{inst.avatar}</span>
            </div>
            <div>
              <div style={{fontWeight: 600, fontSize: 16}}>{inst.name}</div>
              <div style={{fontSize: 13, color: '#475467'}}>{inst.email}</div>
            </div>
          </div>
        ))}
      </div>
    </section>

    <section className="card">
      <div className="card__header">
        <div>
          <h2>Announcements</h2>
          <p className="card__subtitle">Updates for parents and guardians.</p>
        </div>
      </div>
      {birthdayChildren.length > 0 && (
        <div className="birthday-announcement">
          {birthdayChildren.map((child, index) => (
            <span key={child.id}>
              🎉🎂 Today we celebrate {child.name}'s Birthday!
              {index < birthdayChildren.length - 1 ? ' • ' : ''}
            </span>
          ))}
        </div>
      )}
      {announcementsStatus && <div className="empty">{announcementsStatus}</div>}
      <ul className="list">
        {announcements.map((announcement, index) => (
          <li
            key={announcement.id}
            className={`list__item list__item--clickable${index === 0 ? ' list__item--featured' : ''}`}
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
