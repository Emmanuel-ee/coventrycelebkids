import React from 'react';

const InstructorModal = ({ instructors, onClose }) => {
  if (!instructors || instructors.length === 0) {
    return null;
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <h3>All instructors</h3>
        <p className="modal__subtitle">Meet the team leading today&apos;s session.</p>
        <div className="list" style={{ marginTop: 12 }}>
          {instructors.map((inst) => (
            <div key={inst.id} className="list__item" style={{ border: '1px solid #e4e7ec' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#e0e7ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4859f0',
                    fontWeight: 700,
                    overflow: 'hidden',
                  }}
                >
                  {inst.photoUrl ? (
                    <img
                      src={inst.photoUrl}
                      alt={inst.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span>{inst.avatar}</span>
                  )}
                </div>
                <div>
                  <h4>{inst.name}</h4>
                  <p className="list__notes">{inst.email}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="button-row" style={{ marginTop: 16 }}>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructorModal;
