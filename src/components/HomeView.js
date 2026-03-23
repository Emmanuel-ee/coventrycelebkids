import React from 'react';

const getInitials = (name) => {
  if (!name) {
    return 'IN';
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'IN';
  }
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] || '' : '';
  return `${first}${last}`.toUpperCase();
};

const HomeView = ({
  isLoading,
  onRegister,
  onCheckin,
  onViewInstructors,
  onSelectInstructor = () => {},
  instructors = [],
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
          Register your child to get started. You can drop-off and pick-up your child by scanning their unique QR codes from the instructors.
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
      <div className="instructors__header">
        <h3>Instructors</h3>
        <button
          type="button"
          className="button--secondary"
          style={{fontSize: '0.95rem', padding: '0.5em 1.2em'}}
          onClick={onViewInstructors}
        >
          View All Instructors
        </button>
      </div>
      <div className="instructors__grid">
        {instructors.map((inst) => (
          <button
            key={inst.id}
            type="button"
            onClick={() => onSelectInstructor(inst)}
            className="list__item list__item--clickable instructors__card"
          >
            <div className="instructors__avatar">
              {inst.photoUrl ? (
                <img
                  src={inst.photoUrl}
                  alt={inst.name}
                  className="instructors__photo"
                />
              ) : (
                <span aria-label="Instructor initials">
                  {getInitials(inst.name)}
                </span>
              )}
            </div>
            <div className="instructors__info">
              <div className="instructors__name">{inst.name}</div>
              <div className="instructors__role">{inst.role || 'Instructor'}</div>
              <div className="instructors__meta">{inst.email}</div>
            </div>
          </button>
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
