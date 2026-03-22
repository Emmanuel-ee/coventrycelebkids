import React from 'react';

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
              <span role="img" aria-label="Instructor">
                {instructor.avatar}
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