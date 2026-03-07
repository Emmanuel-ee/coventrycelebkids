import React from 'react';

const DetailsView = ({ selectedChild, onBack, onStartUpdate, requestSignIn, requestSignOut }) => (
  <section className="card">
    <div className="card__header">
      <div>
        <h2>{selectedChild.name}</h2>
        <p className="card__subtitle">Here are the child details.</p>
      </div>
      <button className="ghost" type="button" onClick={onBack}>
        Drop-off / Pick up
      </button>
    </div>
    <div className="form">
      <div>
        <strong>Name:</strong> {selectedChild.name}
      </div>
      {selectedChild.age && (
        <div>
          <strong>Age:</strong> {selectedChild.age}
        </div>
      )}
      {selectedChild.classCategory && (
        <div>
          <strong>Class:</strong> {selectedChild.classCategory}
        </div>
      )}
      {selectedChild.guardianName && (
        <div>
          <strong>Guardian:</strong> {selectedChild.guardianName}
        </div>
      )}
      {selectedChild.guardianContact && (
        <div>
          <strong>Contact:</strong> {selectedChild.guardianContact}
        </div>
      )}
      {selectedChild.dateOfBirth && (
        <div>
          <strong>Date of birth:</strong> {selectedChild.dateOfBirth}
        </div>
      )}
      {selectedChild.sex && (
        <div>
          <strong>Sex:</strong> {selectedChild.sex}
        </div>
      )}
      {selectedChild.allergies && (
        <div>
          <strong>Allergies:</strong> {selectedChild.allergies}
        </div>
      )}
      <div>
        <strong>Photo consent:</strong> {selectedChild.allowPhotos ? 'Yes' : 'No'}
      </div>
      {selectedChild.notes && (
        <div>
          <strong>Notes:</strong> {selectedChild.notes}
        </div>
      )}
      {selectedChild.lastActionAt && (
        <div>
          <strong>Last activity:</strong> {new Date(selectedChild.lastActionAt).toLocaleString()}
        </div>
      )}
      {selectedChild.createdAt && (
        <div>
          <strong>Registered:</strong> {new Date(selectedChild.createdAt).toLocaleString()}
        </div>
      )}
      <div>
        <strong>Status:</strong> {selectedChild.lastStatus === 'sign_in' ? 'Signed in' : 'Signed out'}
      </div>
    </div>
    <div className="button-row">
      <button type="button" className="ghost" onClick={onStartUpdate}>
        Update details
      </button>
      {selectedChild.lastStatus === 'sign_in' ? (
        <button type="button" onClick={() => requestSignOut(selectedChild)}>
          Sign out
        </button>
      ) : (
        <button type="button" onClick={() => requestSignIn(selectedChild)}>
          Sign in
        </button>
      )}
    </div>
  </section>
);

export default DetailsView;
