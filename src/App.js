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

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: 'welcome',
    title: 'Welcome to Celebkids',
    message: 'Please register once, then sign in/out each week.',
  },
  {
    id: 'safety',
    title: 'Safety reminders',
    message: 'Notify a leader about allergies or pickup changes.',
  },
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

const isBirthdayToday = (dateValue, today = new Date()) => {
  if (!dateValue) {
    return false;
  }
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }
  return parsed.getDate() === today.getDate() && parsed.getMonth() === today.getMonth();
};

const normalizeValue = (value) => (value || '').trim().toLowerCase();

const knownAllergyValues = new Set(KNOWN_ALLERGIES.map((value) => value.toLowerCase()));

const buildFormFromChild = (child) => {
  const normalizedSex = normalizeValue(child.sex);
  const isStandardSex = normalizedSex === 'female' || normalizedSex === 'male';
  const normalizedAllergies = normalizeValue(child.allergies);
  const allergiesSelection = normalizedAllergies && knownAllergyValues.has(normalizedAllergies)
    ? child.allergies
    : child.allergies
      ? 'Other'
      : '';
  return {
    name: child.name || '',
    dateOfBirth: child.dateOfBirth || '',
    sex: isStandardSex ? (normalizedSex === 'female' ? 'Female' : 'Male') : child.sex ? 'Other' : '',
    sexOther: isStandardSex ? '' : child.sex || '',
    guardianName: child.guardianName || '',
    guardianContact: child.guardianContact || '',
    allergiesSelection,
    allergiesOther: allergiesSelection === 'Other' ? child.allergies || '' : '',
    allowPhotos: Boolean(child.allowPhotos),
    notes: child.notes || '',
  };
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
  sex: child.sex || '',
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
  sex: child.sex || null,
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
  const birthdayAlertsRef = React.useRef(new Set());
  const [announcements, setAnnouncements] = React.useState(DEFAULT_ANNOUNCEMENTS);
  const [announcementsStatus, setAnnouncementsStatus] = React.useState('');
  const [childForm, setChildForm] = React.useState({
  name: '',
  dateOfBirth: '',
    sex: '',
    sexOther: '',
    guardianName: '',
    guardianContact: '',
    allergiesSelection: '',
    allergiesOther: '',
    allowPhotos: false,
    notes: '',
  });
  const [updateForm, setUpdateForm] = React.useState({
    name: '',
    dateOfBirth: '',
    sex: '',
    sexOther: '',
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
    setError('');
  }, [view]);

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
      const today = new Date();
      const childrenWithUpdatedAges = mergedChildren.map((child) => {
        const derivedAge = getAgeFromDob(child.dateOfBirth);
        if (derivedAge && derivedAge !== child.age) {
          return { ...child, age: derivedAge };
        }
        return child;
      });

      setChildren(childrenWithUpdatedAges);
      setIsLoading(false);

      if (childrenWithUpdatedAges.length) {
        const seen = birthdayAlertsRef.current;
        childrenWithUpdatedAges.forEach((child) => {
          if (child.dateOfBirth && isBirthdayToday(child.dateOfBirth, today) && !seen.has(child.id)) {
            alert(`Happy birthday ${child.name}!`);
            seen.add(child.id);
          }
        });
      }

      const updates = childrenWithUpdatedAges.filter(
        (child, index) => child.age !== mergedChildren[index].age
      );
      if (isSupabaseEnabled && updates.length) {
        await Promise.all(
          updates.map((child) =>
            supabase
              .from('children')
              .update({ age: child.age })
              .eq('id', child.id)
          )
        );
      }

      const { data: announcementData, error: announcementError } = await supabase
        .from('announcements')
        .select('id, title, message, created_at')
        .order('created_at', { ascending: false });
      if (announcementError) {
        setAnnouncementsStatus('Unable to load announcements from Supabase.');
      } else {
        const mappedAnnouncements = (announcementData || []).map((announcement) => ({
          id: announcement.id,
          title: announcement.title || 'Announcement',
          message: announcement.message || '',
          createdAt: announcement.created_at || '',
        }));
        setAnnouncements(mappedAnnouncements.length ? mappedAnnouncements : DEFAULT_ANNOUNCEMENTS);
        setAnnouncementsStatus('');
      }
    };

    fetchChildren();

    return () => {
      isActive = false;
    };
  }, []);

  React.useEffect(() => {
    if (isSupabaseEnabled || children.length === 0) {
      return;
    }
    const today = new Date();
    let needsUpdate = false;
    const updatedChildren = children.map((child) => {
      const derivedAge = getAgeFromDob(child.dateOfBirth);
      if (derivedAge && derivedAge !== child.age) {
        needsUpdate = true;
        return { ...child, age: derivedAge };
      }
      return child;
    });
    if (needsUpdate) {
      setChildren(updatedChildren);
    }
    const seen = birthdayAlertsRef.current;
    updatedChildren.forEach((child) => {
      if (child.dateOfBirth && isBirthdayToday(child.dateOfBirth, today) && !seen.has(child.id)) {
        alert(`Happy birthday ${child.name}!`);
        seen.add(child.id);
      }
    });
  }, [children]);

  const handleChildChange = (event) => {
    const { name, value, type, checked } = event.target;
    setError('');
    setChildForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleUpdateChange = (event) => {
    const { name, value, type, checked } = event.target;
    setError('');
    setUpdateForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleStartUpdate = (child) => {
    setUpdateForm(buildFormFromChild(child));
    setSelectedChild(child);
    setView('update');
  };

  const handleAddChild = async (event) => {
    event.preventDefault();
    setError('');
    if (!childForm.name.trim()) {
      setError("Child's name is required.");
      return;
    }
    if (!childForm.sex) {
      setError("Please select the child's sex.");
      return;
    }
    if (!childForm.guardianContact.trim()) {
      setError("Guardian contact is required.");
      return;
    }
    if (childForm.sex === 'Other' && !childForm.sexOther.trim()) {
      setError('Please specify the sex when selecting Other.');
      return;
    }
    const dateOfBirth = childForm.dateOfBirth;
    const derivedAge = getAgeFromDob(dateOfBirth);
    const derivedClassCategory = getClassCategory(derivedAge);
    const parsedAge = Number.parseInt(derivedAge, 10);
    if (!Number.isNaN(parsedAge) && parsedAge >= 13) {
      setError('Children aged 13 and above should register in Celeb Teens. Please inform the parent.');
      setSupabaseStatus('');
      return;
    }
    const formSex = childForm.sex === 'Other' ? childForm.sexOther.trim() : childForm.sex;
    const existingChild = children.find((child) =>
      normalizeValue(child.name) === normalizeValue(childForm.name)
      && normalizeValue(child.sex) === normalizeValue(formSex)
      && normalizeValue(child.guardianContact) === normalizeValue(childForm.guardianContact)
    );
    const matchesRegistrationDetails = existingChild
      && normalizeValue(existingChild.dateOfBirth) === normalizeValue(dateOfBirth)
      && normalizeValue(existingChild.guardianName) === normalizeValue(childForm.guardianName)
      && normalizeValue(existingChild.classCategory) === normalizeValue(derivedClassCategory);
    if (existingChild) {
      setError(
        matchesRegistrationDetails
          ? 'This child is already registered. Please sign in and use Update Details if you need to add new information.'
          : 'A child with this name is already registered. Please sign in and use Update Details if you need to add new information.'
      );
      setSupabaseStatus('');
      return;
    }

    const newChild = {
      id: createId(),
      name: childForm.name.trim(),
    age: derivedAge,
    dateOfBirth,
      sex: formSex,
      guardianName: childForm.guardianName.trim(),
      guardianContact: childForm.guardianContact.trim(),
      allergies:
        childForm.allergiesSelection === 'Other'
          ? childForm.allergiesOther.trim()
          : childForm.allergiesSelection.trim(),
      classCategory: derivedClassCategory,
      allowPhotos: childForm.allowPhotos,
      notes: childForm.notes.trim(),
      createdAt: new Date().toISOString(),
      lastStatus: '',
      lastActionAt: '',
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
    if (!isSupabaseEnabled) {
      setSupabaseStatus('Child registered locally.');
    }
    setChildForm({
      name: '',
  dateOfBirth: '',
      sex: '',
      sexOther: '',
      guardianName: '',
      guardianContact: '',
      allergiesSelection: '',
      allergiesOther: '',
      allowPhotos: false,
      notes: '',
    });
    localStorage.removeItem(DRAFT_KEY);
    setView('checkin');
  };

  const handleUpdateChild = async (event) => {
    event.preventDefault();
    if (!selectedChild) {
      return;
    }
    setError('');
    if (!updateForm.name.trim()) {
      setError("Child's name is required.");
      return;
    }
    if (!updateForm.sex) {
      setError("Please select the child's sex.");
      return;
    }
    if (!updateForm.guardianContact.trim()) {
      setError('Guardian contact is required.');
      return;
    }
    if (updateForm.sex === 'Other' && !updateForm.sexOther.trim()) {
      setError('Please specify the sex when selecting Other.');
      return;
    }

    const dateOfBirth = updateForm.dateOfBirth;
    const derivedAge = getAgeFromDob(dateOfBirth);
    const derivedClassCategory = getClassCategory(derivedAge);
    const parsedAge = Number.parseInt(derivedAge, 10);
    if (!Number.isNaN(parsedAge) && parsedAge >= 13) {
      setError('Children aged 13 and above should register in Celeb Teens. Please inform the parent.');
      setSupabaseStatus('');
      return;
    }

    const updatedChild = {
      ...selectedChild,
      name: updateForm.name.trim(),
      age: derivedAge,
      dateOfBirth,
      sex: updateForm.sex === 'Other' ? updateForm.sexOther.trim() : updateForm.sex,
      guardianName: updateForm.guardianName.trim(),
      guardianContact: updateForm.guardianContact.trim(),
      allergies:
        updateForm.allergiesSelection === 'Other'
          ? updateForm.allergiesOther.trim()
          : updateForm.allergiesSelection.trim(),
      classCategory: derivedClassCategory,
      allowPhotos: updateForm.allowPhotos,
      notes: updateForm.notes.trim(),
    };

    if (isSupabaseEnabled) {
      setSupabaseStatus('');
      const { error: updateError } = await supabase
        .from('children')
        .update(mapChildToDb(updatedChild))
        .eq('id', selectedChild.id);
      if (updateError) {
        setError(`Unable to update child details. ${updateError.message}`);
        return;
      }
      setSupabaseStatus('Child details updated in Supabase.');
    } else {
      setSupabaseStatus('Child details updated.');
    }

    setChildren((prev) =>
      prev.map((record) => (record.id === selectedChild.id ? updatedChild : record))
    );
    setSelectedChild(updatedChild);
    setView('details');
  };

  const recordCheckin = async (child, action, timestamp) => {
    const actionTimestamp = timestamp || new Date().toISOString();

    if (isSupabaseEnabled) {
      const { error: checkinError } = await supabase
        .from('checkins')
        .insert([
          {
            id: createId(),
            child_id: child.id,
            action,
            created_at: actionTimestamp,
          },
        ]);
      if (checkinError) {
        setError(`Unable to ${action === 'sign_in' ? 'sign in' : 'sign out'}. ${checkinError.message}`);
        return { success: false };
      }
      const { error: statusError } = await supabase
        .from('children')
  .update({ last_status: action, last_action_at: actionTimestamp })
        .eq('id', child.id);
      if (statusError) {
        setError(`Signed ${action === 'sign_in' ? 'in' : 'out'}, but status update failed. ${statusError.message}`);
        return { success: false };
      }
      setChildren((prev) =>
        prev.map((record) =>
          record.id === child.id
            ? { ...record, lastStatus: action, lastActionAt: actionTimestamp }
            : record
        )
      );
      setSelectedChild((prev) =>
        prev && prev.id === child.id
          ? { ...prev, lastStatus: action, lastActionAt: actionTimestamp }
          : prev
      );
    } else {
      setCheckins((prev) => [
        { id: createId(), childId: child.id, action, createdAt: actionTimestamp },
        ...prev,
      ]);
      setChildren((prev) =>
        prev.map((record) =>
          record.id === child.id
            ? { ...record, lastStatus: action, lastActionAt: actionTimestamp }
            : record
        )
      );
      setSelectedChild((prev) =>
        prev && prev.id === child.id
          ? { ...prev, lastStatus: action, lastActionAt: actionTimestamp }
          : prev
      );
    }

    setSupabaseStatus(
      `${child.name} ${action === 'sign_in' ? 'signed in' : 'signed out'} successfully.`
    );
    return { success: true, timestamp: actionTimestamp };
  };

  const requestSignIn = (child) => {
    setConfirmAction({ type: 'sign_in', child, timestamp: new Date().toISOString() });
  };

  const requestSignOut = (child) => {
    setConfirmAction({ type: 'sign_out', child, timestamp: new Date().toISOString() });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) {
      return;
    }
  const { type, child, timestamp } = confirmAction;
  const result = await recordCheckin(child, type, timestamp);
    if (result.success && type === 'sign_in') {
      setSelectedChild({
        ...child,
        lastStatus: type,
        lastActionAt: result.timestamp,
      });
      setView('details');
    }
    if (result.success && type === 'sign_out') {
      setSelectedChild((prev) =>
        prev && prev.id === child.id
          ? { ...prev, lastStatus: type, lastActionAt: result.timestamp }
          : prev
      );
      setView('home');
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
    <div
      className="app"
      style={{
        '--app-bg-image': `url(${process.env.PUBLIC_URL}/background/DSC01081.jpg)`,
      }}
    >
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
          {view === 'checkin' && (
            <button className="ghost" type="button" onClick={() => setView('home')}>
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
      <main className="app__grid">
        {view === 'home' && (
          <>
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
            <section className="card">
              <div className="card__header">
                <div>
                  <h2>Announcements</h2>
                  <p className="card__subtitle">Updates for parents and guardians.</p>
                </div>
              </div>
              {announcementsStatus && <div className="empty">{announcementsStatus}</div>}
              <ul className="list">
                {announcements.map((announcement) => (
                  <li key={announcement.id} className="list__item">
                    <div>
                      <h3>{announcement.title}</h3>
                      <p className="list__notes">{announcement.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
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
                Date of birth
                <input
                  type="date"
                  className="dob-picker"
                  name="dateOfBirth"
                  value={childForm.dateOfBirth}
                  onChange={handleChildChange}
                  max={new Date().toISOString().split('T')[0]}
                />
                {getClassCategory(getAgeFromDob(childForm.dateOfBirth)) && (
                  <span className="helper">
                    Class: {getClassCategory(getAgeFromDob(childForm.dateOfBirth))}
                  </span>
                )}
              </label>
              <label>
                Sex
                <select
                  name="sex"
                  value={childForm.sex}
                  onChange={handleChildChange}
                >
                  <option value="">Select</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              {childForm.sex === 'Other' && (
                <label>
                  Specify sex
                  <input
                    type="text"
                    name="sexOther"
                    value={childForm.sexOther}
                    onChange={handleChildChange}
                    placeholder="Type here"
                  />
                </label>
              )}
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

        {view === 'update' && selectedChild && (
          <section className="card">
            <div className="card__header">
              <div>
                <h2>Update child details</h2>
                <p className="card__subtitle">Add new information or request updates.</p>
              </div>
              <button className="ghost" type="button" onClick={() => setView('details')}>
                Back
              </button>
            </div>
            <form className="form" onSubmit={handleUpdateChild}>
              <label>
                Child's name
                <input
                  type="text"
                  name="name"
                  value={updateForm.name}
                  onChange={handleUpdateChange}
                  placeholder="e.g. Ada Johnson"
                  required
                />
              </label>
              <label>
                Date of birth
                <input
                  type="date"
                  className="dob-picker"
                  name="dateOfBirth"
                  value={updateForm.dateOfBirth}
                  onChange={handleUpdateChange}
                  max={new Date().toISOString().split('T')[0]}
                />
                {getClassCategory(getAgeFromDob(updateForm.dateOfBirth)) && (
                  <span className="helper">
                    Class: {getClassCategory(getAgeFromDob(updateForm.dateOfBirth))}
                  </span>
                )}
              </label>
              <label>
                Sex
                <select
                  name="sex"
                  value={updateForm.sex}
                  onChange={handleUpdateChange}
                >
                  <option value="">Select</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              {updateForm.sex === 'Other' && (
                <label>
                  Specify sex
                  <input
                    type="text"
                    name="sexOther"
                    value={updateForm.sexOther}
                    onChange={handleUpdateChange}
                    placeholder="Type here"
                  />
                </label>
              )}
              <label>
                Guardian name
                <input
                  type="text"
                  name="guardianName"
                  value={updateForm.guardianName}
                  onChange={handleUpdateChange}
                  placeholder="Parent/guardian name"
                />
              </label>
              <label>
                Guardian contact
                <input
                  type="text"
                  name="guardianContact"
                  value={updateForm.guardianContact}
                  onChange={handleUpdateChange}
                  placeholder="Phone number"
                />
              </label>
              <label>
                Allergies
                <select
                  name="allergiesSelection"
                  value={updateForm.allergiesSelection}
                  onChange={handleUpdateChange}
                >
                  <option value="">Select an allergy</option>
                  {KNOWN_ALLERGIES.map((allergy) => (
                    <option key={allergy} value={allergy}>
                      {allergy}
                    </option>
                  ))}
                </select>
              </label>
              {updateForm.allergiesSelection === 'Other' && (
                <label>
                  Specify allergy
                  <input
                    type="text"
                    name="allergiesOther"
                    value={updateForm.allergiesOther}
                    onChange={handleUpdateChange}
                    placeholder="Type the allergy"
                  />
                </label>
              )}
              <label className="checkbox">
                <input
                  type="checkbox"
                  name="allowPhotos"
                  checked={updateForm.allowPhotos}
                  onChange={handleUpdateChange}
                />
                Would you want your child's picture captured?
              </label>
              <label>
                Notes
                <textarea
                  name="notes"
                  value={updateForm.notes}
                  onChange={handleUpdateChange}
                  placeholder="Allergies, pickup notes, etc."
                />
              </label>
              <button type="submit">Save updates</button>
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
                <button type="button" className="ghost" onClick={() => handleStartUpdate(selectedChild)}>
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
