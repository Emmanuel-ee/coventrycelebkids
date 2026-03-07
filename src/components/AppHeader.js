import React from 'react';

const AppHeader = ({
  view,
  onNavigateHome,
  supabaseStatus,
  error,
  isSupabaseEnabled,
  supabaseConfigMessage,
}) => (
  <header className="app__header">
    <div>
      <h1>
        <button
          type="button"
          className="title-button"
          onClick={onNavigateHome}
        >
          <img
            src={`${process.env.PUBLIC_URL}/logo/Asset%20203.svg`}
            alt="Coventry Celebkids"
            className="app__logo"
          />
          Coventry Celebkids
        </button>
        <p className="app__eyebrow">In Christ For Christ With Joy</p>
      </h1>
      {view === 'checkin' && (
        <button className="ghost" type="button" onClick={onNavigateHome}>
          Home
        </button>
      )}
    </div>
    <div className="app__status">
      {!isSupabaseEnabled && (
        <div className="status status--warning">
          {supabaseConfigMessage || 'Supabase is not configured. Using local storage only.'}
        </div>
      )}
      {supabaseStatus && <div className="status status--success">{supabaseStatus}</div>}
      {error && <div className="status status--error">{error}</div>}
    </div>
  </header>
);

export default AppHeader;
