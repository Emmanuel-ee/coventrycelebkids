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

const InstructorProfileModal = ({ instructor, onClose }) => {
  if (!instructor) {
    return null;
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#e0e7ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 700,
              color: '#4859f0',
              overflow: 'hidden',
            }}
          >
            {instructor.photoUrl ? (
              <img
                src={instructor.photoUrl}
                alt={instructor.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span aria-label="Instructor initials">
                {getInitials(instructor.name)}
              </span>
            )}
          </div>
          <div>
            <h3 style={{ margin: 0 }}>{instructor.name}</h3>
            <p className="modal__subtitle" style={{ margin: '4px 0 0' }}>
              {instructor.role || 'Instructor'}
            </p>
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'grid', gap: 6 }}>
          <p className="list__notes" style={{ margin: 0 }}>
            Email: {instructor.email || 'Not provided'}
          </p>
          <p className="list__notes" style={{ margin: 0 }}>
            Phone: {instructor.phone || 'Not provided'}
          </p>
          <p className="list__notes" style={{ margin: 0 }}>
            Verification: {instructor.verified ? 'Verified' : 'Pending'}
          </p>
        </div>
        <div className="button-row" style={{ marginTop: 20 }}>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructorProfileModal;