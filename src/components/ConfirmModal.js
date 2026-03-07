import React from 'react';

const ConfirmModal = ({ confirmAction, onConfirm, onCancel }) => {
  if (!confirmAction) {
    return null;
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <h3>
          {confirmAction.type === 'sign_in'
            ? `Sign in ${confirmAction.child.name}?`
            : `Sign out ${confirmAction.child.name}?`}
        </h3>
        <p className="modal__subtitle">
          {confirmAction.type === 'sign_in'
            ? 'Confirm drop-off for this child.'
            : 'Confirm pick-up for this child.'}
        </p>
        <div className="button-row">
          <button type="button" onClick={onConfirm}>
            Confirm
          </button>
          <button className="ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
