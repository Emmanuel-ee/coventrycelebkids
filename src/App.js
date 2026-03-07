import React from 'react';
import './App.css';
import { isSupabaseEnabled, supabase, supabaseConfigMessage } from './lib/supabaseClient';

const STORAGE_KEY = 'celebkids-children-v1';
const DRAFT_KEY = 'celebkids-child-draft-v1';
const CHECKIN_KEY = 'celebkids-checkins-v1';
const KNOWN_ALLERGIES = [
  'None',
  'Peanuts',
  'Tree nuts',
  'Dairy',
  'Eggs',
  'Wheat',
  'Soy',
  'Fish',
  'Shellfish',
  'Gluten',
  'Pollen',
  'Dust',
  'Other',
];

const getClassCategory = (ageValue) => {
  const parsedAge = Number.parseInt(ageValue, 10);
  if (Number.isNaN(parsedAge)) {
    return '';
  }
  if (parsedAge >= 0 && parsedAge <= 4) {
    return 'TenderFoot';
  }
  if (parsedAge >= 5 && parsedAge <= 7) {
    return 'Lighttroopers';
  }
  if (parsedAge >= 8 && parsedAge <= 12) {
    return 'Tribe of Truth';
  }
  if (parsedAge >= 13) {
    return 'Celeb Teens';
  }
  return '';
};

const getAgeFromDob = (dateValue) => {
  if (!dateValue) {
    return '';
  }
  const trimmed = dateValue.trim();
  let dob = null;
  const ddmmyyyyMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    dob = new Date(Number(year), Number(month) - 1, Number(day));
  } else {
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      dob = parsed;
    }
  }
  if (!dob || Number.isNaN(dob.getTime())) {
    return '';
  }
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 ? String(age) : '';
};

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const loadLocalChildren = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const loadLocalCheckins = () => {
  try {
    const stored = localStorage.getItem(CHECKIN_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const mapChildFromDb = (child) => ({
  id: child.id,
  name: child.name || '',
  age: child.age || '',
  dateOfBirth: child.date_of_birth || child.dateOfBirth || '',
  guardianName: child.guardian_name || child.guardianName || '',
  guardianContact: child.guardian_contact || child.guardianContact || '',
  allergies: child.allergies || '',
  classCategory: child.class_category || child.classCategory || '',
  lastStatus: child.last_status || child.lastStatus || '',
  lastActionAt: child.last_action_at || child.lastActionAt || '',
  allowPhotos:
    typeof child.allow_photos === 'boolean'
      ? child.allow_photos
      : Boolean(child.allowPhotos),
  notes: child.notes || '',
  createdAt: child.created_at || child.createdAt || new Date().toISOString(),
});

const mapChildToDb = (child) => ({
  id: child.id,
  name: child.name,
  age: child.age || null,
  date_of_birth: child.dateOfBirth || null,
  guardian_name: child.guardianName || null,
  guardian_contact: child.guardianContact || null,
  allergies: child.allergies || null,
  class_category: child.classCategory || null,
  last_status: child.lastStatus || null,
  last_action_at: child.lastActionAt || null,
  allow_photos: Boolean(child.allowPhotos),
  notes: child.notes || null,
  created_at: child.createdAt,
});

const getLatestCheckinsByChild = (checkinList) =>
  checkinList.reduce((accumulator, checkin) => {
    const childId = checkin.childId || checkin.child_id;
    if (!childId || accumulator[childId]) {
      return accumulator;
    }
    accumulator[childId] = {
      action: checkin.action,
      createdAt: checkin.createdAt || checkin.created_at || '',
    };
    return accumulator;
  }, {});

function App() {
  const [children, setChildren] = React.useState(() =>
    isSupabaseEnabled ? [] : loadLocalChildren()
  );
  const [checkins, setCheckins] = React.useState(() =>
    isSupabaseEnabled ? [] : loadLocalCheckins()
  );
  const [isLoading, setIsLoading] = React.useState(isSupabaseEnabled);
  const [error, setError] = React.useState('');
  const [supabaseStatus, setSupabaseStatus] = React.useState('');
  const [view, setView] = React.useState('home');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedChild, setSelectedChild] = React.useState(null);
  const [confirmAction, setConfirmAction] = React.useState(null);
  const [childForm, setChildForm] = React.useState({
    name: '',
    dateOfBirth: '',
    guardianName: '',
    guardianContact: '',
    allergiesSelection: '',
    allergiesOther: '',
    allowPhotos: false,
    notes: '',
  });

  React.useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        if (parsedDraft && typeof parsedDraft === 'object') {
          setChildForm((prev) => ({ ...prev, ...parsedDraft }));
        }
      }
    } catch (error) {
      // Ignore draft load errors.
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(childForm));
    } catch (error) {
      // Ignore draft save errors.
    }
  }, [childForm]);

  React.useEffect(() => {
    if (!isSupabaseEnabled) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(children));
    }
  }, [children]);

  React.useEffect(() => {
    if (!isSupabaseEnabled) {
      localStorage.setItem(CHECKIN_KEY, JSON.stringify(checkins));
    }
  }, [checkins]);

  React.useEffect(() => {
    if (!supabaseStatus) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setSupabaseStatus('');
    }, 4000);
    return () => clearTimeout(timer);
  }, [supabaseStatus]);

  React.useEffect(() => {
    if (!isSupabaseEnabled) {
      return undefined;
    }

    let isActive = true;

    const fetchChildren = async () => {
      setIsLoading(true);
      setError('');
      setSupabaseStatus('');
      const { data, error: fetchError } = await supabase
        .from('children')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isActive) {
        return;
      }

      if (fetchError) {
        setError(`Unable to load children from Supabase. ${fetchError.message}`);
        setIsLoading(false);
        return;
      }

      const mappedChildren = (data || []).map(mapChildFromDb);
      const { data: checkinData, error: checkinError } = await supabase
        .from('checkins')
        .select('child_id, action, created_at')
        .order('created_at', { ascending: false });

      if (checkinError) {
        setChildren(mappedChildren);
        setIsLoading(false);
        return;
      }

      const latestCheckins = getLatestCheckinsByChild(checkinData || []);
      const mergedChildren = mappedChildren.map((child) => {
        const latest = latestCheckins[child.id];
        if (!latest) {
          return child;
        }
        return {
          ...child,
          lastStatus: latest.action,
          lastActionAt: latest.createdAt,
        };
      });

      setCheckins(
        (checkinData || []).map((checkin) => ({
          id: checkin.id,
          childId: checkin.child_id,
          action: checkin.action,
          createdAt: checkin.created_at,
        }))
      );
      setChildren(mergedChildren);
      setIsLoading(false);
    };

    fetchChildren();

    return () => {
      isActive = false;
    };
  }, []);

  const handleChildChange = (event) => {
    const { name, value, type, checked } = event.target;
    setError('');
    setChildForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddChild = async (event) => {
    event.preventDefault();
    setError('');
    if (!childForm.name.trim()) {
      return;
    }
    const derivedAge = getAgeFromDob(childForm.dateOfBirth);
    const parsedAge = Number.parseInt(derivedAge, 10);
    if (!Number.isNaN(parsedAge) && parsedAge >= 13) {
      setError('Children aged 13 and above should register in Celeb Teens. Please inform the parent.');
      setSupabaseStatus('');
      return;
    }
    const newChild = {
      id: createId(),
      name: childForm.name.trim(),
      age: derivedAge,
      dateOfBirth: childForm.dateOfBirth,
      guardianName: childForm.guardianName.trim(),
      guardianContact: childForm.guardianContact.trim(),
      allergies:
        childForm.allergiesSelection === 'Other'
          ? childForm.allergiesOther.trim()
          : childForm.allergiesSelection.trim(),
      classCategory: getClassCategory(derivedAge),
      allowPhotos: childForm.allowPhotos,
      notes: childForm.notes.trim(),
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseEnabled) {
      setError('');
      setSupabaseStatus('');
      const { error: insertError } = await supabase
        .from('children')
        .insert([mapChildToDb(newChild)]);
      if (insertError) {
        setError(`Unable to register child. ${insertError.message}`);
        return;
      }
      setSupabaseStatus('Child registered in Supabase.');
    }

    setChildren((prev) => [newChild, ...prev]);
    setChildForm({
      name: '',
      dateOfBirth: '',
      guardianName: '',
      guardianContact: '',
      allergiesSelection: '',
      allergiesOther: '',
      allowPhotos: false,
      notes: '',
    });
    localStorage.removeItem(DRAFT_KEY);
  };

  const recordCheckin = async (child, action) => {
    const timestamp = new Date().toISOString();

    if (isSupabaseEnabled) {
      const { error: checkinError } = await supabase
        .from('checkins')
        .insert([
          {
            id: createId(),
            child_id: child.id,
            action,
            created_at: timestamp,
          },
        ]);
      if (checkinError) {
        setError(`Unable to ${action === 'sign_in' ? 'sign in' : 'sign out'}. ${checkinError.message}`);
        return { success: false };
      }
      const { error: statusError } = await supabase
        .from('children')
        .update({ last_status: action, last_action_at: timestamp })
        .eq('id', child.id);
      if (statusError) {
        setError(`Signed ${action === 'sign_in' ? 'in' : 'out'}, but status update failed. ${statusError.message}`);
        return { success: false };
      }
      setChildren((prev) =>
        prev.map((record) =>
          record.id === child.id
            ? { ...record, lastStatus: action, lastActionAt: timestamp }
            : record
        )
      );
      setSelectedChild((prev) =>
        prev && prev.id === child.id
          ? { ...prev, lastStatus: action, lastActionAt: timestamp }
          : prev
      );
    } else {
      setCheckins((prev) => [
        { id: createId(), childId: child.id, action, createdAt: timestamp },
        ...prev,
      ]);
      setChildren((prev) =>
        prev.map((record) =>
          record.id === child.id
            ? { ...record, lastStatus: action, lastActionAt: timestamp }
            : record
        )
      );
      setSelectedChild((prev) =>
        prev && prev.id === child.id
          ? { ...prev, lastStatus: action, lastActionAt: timestamp }
          : prev
      );
    }

    setSupabaseStatus(
      `${child.name} ${action === 'sign_in' ? 'signed in' : 'signed out'} successfully.`
    );
    return { success: true, timestamp };
  };

  const requestSignIn = (child) => {
    setConfirmAction({ type: 'sign_in', child });
  };

  const requestSignOut = (child) => {
    setConfirmAction({ type: 'sign_out', child });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) {
      return;
    }
    const { type, child } = confirmAction;
    const result = await recordCheckin(child, type);
    if (result.success && type === 'sign_in') {
      setSelectedChild({
        ...child,
        lastStatus: type,
        lastActionAt: result.timestamp,
      });
      setView('details');
    }
    setConfirmAction(null);
  };

  const handleCancelAction = () => {
    setConfirmAction(null);
  };


  const filteredChildren = children.filter((child) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return false;
    }
    return [child.name]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(term));
  });

  const signedInChildren = children.filter((child) => child.lastStatus === 'sign_in');

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>
            <button
              type="button"
              className="title-button"
              onClick={() => setView('home')}
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
      <main className="app__grid">
        {view === 'home' && (
          <section className="card card--center">
            <div className="home-hero">
              <h2>Welcome, parents & guardians!</h2>
              <p className="home-hero__text">
                Start by registering your child, then come back here for drop-off and pick-up.
              </p>
            </div>
            <div className="home-actions">
              <button
                type="button"
                className="button--primary"
                onClick={() => setView('register')}
              >
                Register your Child
              </button>
              <button
                type="button"
                className="button--secondary"
                onClick={() => setView('checkin')}
              >
                Drop off / Pick up
              </button>
            </div>
            {isLoading && <div className="empty">Connecting to Supabase…</div>}
          </section>
        )}

        {view === 'register' && (
          <section className="card">
            <div className="card__header">
              <div>
                <h2>Register a child</h2>
                <p className="card__subtitle">Complete the form to save the record.</p>
              </div>
              <button className="ghost" type="button" onClick={() => setView('home')}>
                Back
              </button>
            </div>
            <form className="form" onSubmit={handleAddChild}>
              <label>
                Child's name
                <input
                  type="text"
                  name="name"
                  value={childForm.name}
                  onChange={handleChildChange}
                  placeholder="e.g. Ada Johnson"
                  required
                />
              </label>
              <label>
                Date of birth (DD/MM/YYYY)
                <input
                  type="text"
                  name="dateOfBirth"
                  value={childForm.dateOfBirth}
                  onChange={handleChildChange}
                  placeholder="e.g. 01/05/2018"
                />
                {getClassCategory(getAgeFromDob(childForm.dateOfBirth)) && (
                  <span className="helper">
                    Class: {getClassCategory(getAgeFromDob(childForm.dateOfBirth))}
                  </span>
                )}
              </label>
              <label>
                Guardian name
                <input
                  type="text"
                  name="guardianName"
                  value={childForm.guardianName}
                  onChange={handleChildChange}
                  placeholder="Parent/guardian name"
                />
              </label>
              <label>
                Guardian contact
                <input
                  type="text"
                  name="guardianContact"
                  value={childForm.guardianContact}
                  onChange={handleChildChange}
                  placeholder="Phone number"
                />
              </label>
              <label>
                Allergies
                <select
                  name="allergiesSelection"
                  value={childForm.allergiesSelection}
                  onChange={handleChildChange}
                >
                  <option value="">Select an allergy</option>
                  {KNOWN_ALLERGIES.map((allergy) => (
                    <option key={allergy} value={allergy}>
                      {allergy}
                    </option>
                  ))}
                </select>
              </label>
              {childForm.allergiesSelection === 'Other' && (
                <label>
                  Specify allergy
                  <input
                    type="text"
                    name="allergiesOther"
                    value={childForm.allergiesOther}
                    onChange={handleChildChange}
                    placeholder="Type the allergy"
                  />
                </label>
              )}
              <label className="checkbox">
                <input
                  type="checkbox"
                  name="allowPhotos"
                  checked={childForm.allowPhotos}
                  onChange={handleChildChange}
                />
                Would you want your child's picture captured?
              </label>
              <label>
                Notes
                <textarea
                  name="notes"
                  value={childForm.notes}
                  onChange={handleChildChange}
                  placeholder="Allergies, pickup notes, etc."
                />
              </label>
              <button type="submit">Register child</button>
            </form>
          </section>
        )}

        {view === 'checkin' && (
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
                    onChange={(event) => setSearchTerm(event.target.value)}
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
                      <li key={child.id} className="list__item">
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
                      className="list__item list__item--clickable"
                      onClick={() => {
                        setSelectedChild(child);
                        setView('details');
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          setSelectedChild(child);
                          setView('details');
                        }
                      }}
                    >
                      <div>
                        <h3>{child.name}</h3>
                        {child.classCategory && (
                          <p className="list__notes">Class: {child.classCategory}</p>
                        )}
                        {child.guardianContact && (
                          <p className="list__notes">
                            Contact: {child.guardianContact}
                          </p>
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
        )}

        {view === 'details' && selectedChild && (
          <section className="card">
            <div className="card__header">
              <div>
                <h2>{selectedChild.name}</h2>
                <p className="card__subtitle">Here are the child details.</p>
              </div>
              <button className="ghost" type="button" onClick={() => setView('checkin')}>
                Drop-off / Pick up
              </button>
            </div>
            <div className="form">
              <div>
                <strong>Name:</strong> {selectedChild.name}
              </div>
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
              {selectedChild.allergies && (
                <div>
                  <strong>Allergies:</strong> {selectedChild.allergies}
                </div>
              )}
              <div>
                  <strong>Status:</strong> {selectedChild.lastStatus === 'sign_in' ? 'Signed in' : 'Signed out'}
              </div>
            </div>
              <div className="button-row">
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
        )}
      </main>
      {confirmAction && (
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
              <button type="button" onClick={handleConfirmAction}>
                Confirm
              </button>
              <button className="ghost" type="button" onClick={handleCancelAction}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
