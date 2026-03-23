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

const InstructorModal = ({ instructors, onClose, onSelectInstructor }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredInstructors = normalizedSearch
    ? instructors.filter((inst) =>
        (inst.name || '').toLowerCase().includes(normalizedSearch)
      )
    : instructors;

  if (!instructors || instructors.length === 0) {
    return null;
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <h3>All instructors</h3>
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            Search by name
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Type a name"
              style={{ width: '100%' }}
            />
          </label>
        </div>
        <div className="list" style={{ marginTop: 12 }}>
          {filteredInstructors.length === 0 && (
            <div className="empty">No instructors match that name.</div>
          )}
          {filteredInstructors.map((inst) => (
            <button
              key={inst.id}
              type="button"
              className="list__item list__item--clickable"
              style={{ border: '1px solid #e4e7ec', width: '100%', textAlign: 'left' }}
              onClick={() => {
                if (onSelectInstructor) {
                  onSelectInstructor(inst);
                }
              }}
            >
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
                    <span aria-label="Instructor initials">
                      {getInitials(inst.name)}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="instructors__modal-name">{inst.name}</h4>
                  <p className="list__notes">{inst.email}</p>
                </div>
              </div>
            </button>
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
