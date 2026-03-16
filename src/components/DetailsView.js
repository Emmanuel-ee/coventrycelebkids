import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const DetailsView = ({
  selectedChild,
  onBack,
  onGoHome,
  onStartUpdate,
  requestSignIn,
  requestSignOut,
  isBirthdayToday,
  messages,
  messagesStatus,
  messageDraft,
  onMessageDraftChange,
  onSendMessage,
  isSendingMessage,
  typingUsers,
  onTyping,
  onArchiveMessage,
  qrCodeValue,
  onGoToScanner,
}) => (
  <section
    className={`card${
      selectedChild.dateOfBirth && isBirthdayToday(selectedChild.dateOfBirth)
        ? ' card--birthday'
        : ''
    }`}
  >
    <div className="card__header">
      <div>
        <h2>{selectedChild.name}</h2>
      </div>
      <div className="button-row">
        <button className="ghost back-arrow" type="button" onClick={onBack} aria-label="Back">
          ←
        </button>
        <button className="ghost" type="button" onClick={onGoHome}>
          Home
        </button>
      </div>
    </div>
    <div className="form">
      <div>
        <strong>Name:</strong> {selectedChild.name}
      </div>
      {selectedChild.dateOfBirth && isBirthdayToday(selectedChild.dateOfBirth) && (
        <div className="birthday-banner">🎉 Happy Birthday {selectedChild.name}</div>
      )}
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
        <button type="button" onClick={() => onGoToScanner && onGoToScanner()}>
          Sign out (Scan QR)
        </button>
      ) : (
        <button type="button" onClick={() => requestSignIn(selectedChild)}>
          Sign in
        </button>
      )}
    </div>
    {selectedChild.lastStatus !== 'sign_in' && (
      <>
        <div className="divider" />
        <div className="qr-section">
          <h3>Child QR code</h3>
          <p className="card__subtitle">Scan to sign in or sign out this child.</p>
          <div className="qr-card">
            <QRCodeCanvas value={qrCodeValue} size={160} includeMargin />
          </div>
        </div>
        <div className="divider" />
      </>
    )}
    <div className="message-section">
      <h3>Messages</h3>
      <p className="card__subtitle">Recent notes for this child.</p>
      {messagesStatus && <div className="empty">{messagesStatus}</div>}
      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          {typingUsers.map((user, index) => (
            <span key={user.sender}>
              {user.sender} is typing
              {index < typingUsers.length - 1 ? ' • ' : ''}
            </span>
          ))}
        </div>
      )}
      {messages.length === 0 ? (
        <div className="empty">No messages yet. Start a conversation below.</div>
      ) : (
        <ul className="message-list">
          {messages.map((message) => (
            <li key={message.id} className="message-item">
              <div className="message-item__header">
                <strong>{message.sender}</strong>
                <div className="message-item__meta">
                  {message.createdAt && (
                    <span>{new Date(message.createdAt).toLocaleString()}</span>
                  )}
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => onArchiveMessage(message.id)}
                  >
                    Archive
                  </button>
                </div>
              </div>
              <p>{message.message}</p>
            </li>
          ))}
        </ul>
      )}
      <form
        className="message-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSendMessage();
        }}
      >
        <label>
          Sender name (optional)
          <input
            type="text"
            value={messageDraft.sender}
            onChange={(event) =>
              onMessageDraftChange((prev) => ({ ...prev, sender: event.target.value }))
            }
            placeholder="Only needed if not the guardian"
          />
          {selectedChild.guardianName && (
            <span className="helper">Default: {selectedChild.guardianName}</span>
          )}
        </label>
        <label>
          Message
          <textarea
            value={messageDraft.message}
            onChange={(event) =>
              onMessageDraftChange((prev) => ({ ...prev, message: event.target.value }))
            }
            onInput={onTyping}
            placeholder="Share a note for the team or guardian..."
            required
          />
        </label>
        <button type="submit" disabled={isSendingMessage}>
          {isSendingMessage ? 'Sending...' : 'Send message'}
        </button>
      </form>
    </div>
  </section>
);

export default DetailsView;
