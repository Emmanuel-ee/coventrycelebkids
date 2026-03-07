import React from 'react';

const CheckinView = ({
  searchTerm,
  onSearchChange,
  filteredChildren,
  signedInChildren,
  requestSignIn,
  requestSignOut,
  onSelectChild,
  isBirthdayToday,
}) => (
  <>
    <section className="card">
      <div className="card__header">
        <div>
          <h2>Drop off / Pick up</h2>
          <p className="card__subtitle">
            Search by name and sign in at drop-off.
          </p>
        </div>
      </div>
      <div className="form">
        <label>
          Search child name
          <input
            type="search"
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Type a child name"
          />
        </label>
      </div>
      {searchTerm.trim() ? (
        filteredChildren.length === 0 ? (
          <div className="empty">No matching children found.</div>
        ) : (
          <ul className="list">
            {filteredChildren.map((child) => (
              <li
                key={child.id}
                className={`list__item${
                  child.dateOfBirth && isBirthdayToday(child.dateOfBirth)
                    ? ' list__item--birthday'
                    : ''
                }`}
              >
                <div>
                  <h3>{child.name}</h3>
                  {child.classCategory && (
                    <p className="list__notes">Class: {child.classCategory}</p>
                  )}
                  {child.guardianContact && (
                    <p className="list__notes">Contact: {child.guardianContact}</p>
                  )}
                  {child.lastStatus && (
                    <p className="list__notes">
                      Status: {child.lastStatus === 'sign_in' ? 'Signed in' : 'Signed out'}
                    </p>
                  )}
                </div>
                {child.lastStatus === 'sign_in' ? (
                  <button type="button" onClick={() => requestSignOut(child)}>
                    Sign out
                  </button>
                ) : (
                  <button type="button" onClick={() => requestSignIn(child)}>
                    Sign in
                  </button>
                )}
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="empty">Start typing to find a child.</div>
      )}
    </section>
    <section className="card">
      <div className="card__header">
        <div>
          <h2>Signed-in children</h2>
          <p className="card__subtitle">{signedInChildren.length} currently signed in</p>
        </div>
      </div>
      {signedInChildren.length === 0 ? (
        <div className="empty">No children are signed in yet.</div>
      ) : (
        <ul className="list">
            {signedInChildren.map((child) => (
            <li
              key={child.id}
                className={`list__item list__item--clickable${
                  child.dateOfBirth && isBirthdayToday(child.dateOfBirth)
                    ? ' list__item--birthday'
                    : ''
                }`}
              onClick={() => onSelectChild(child)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  onSelectChild(child);
                }
              }}
            >
              <div>
                <h3>{child.name}</h3>
                {child.classCategory && (
                  <p className="list__notes">Class: {child.classCategory}</p>
                )}
                {child.guardianContact && (
                  <p className="list__notes">Contact: {child.guardianContact}</p>
                )}
                {child.lastStatus && (
                  <p className="list__notes">
                    Last: {child.lastStatus === 'sign_in' ? 'Signed in' : 'Signed out'}
                    {child.lastActionAt ? ` • ${new Date(child.lastActionAt).toLocaleString()}` : ''}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  </>
);

export default CheckinView;
