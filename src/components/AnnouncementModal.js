import React from 'react';

const AnnouncementModal = ({ selectedAnnouncement, onClose }) => {
  if (!selectedAnnouncement) {
    return null;
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <h3>{selectedAnnouncement.title}</h3>
        <p className="modal__subtitle">{selectedAnnouncement.message}</p>
        <div className="button-row">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;
