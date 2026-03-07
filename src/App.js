import React from 'react';
import './App.css';
import { isSupabaseEnabled, supabase, supabaseConfigMessage } from './lib/supabaseClient';
import {
  CHECKIN_KEY,
  DRAFT_KEY,
  DEFAULT_ANNOUNCEMENTS,
  KNOWN_ALLERGIES,
  MESSAGES_KEY,
  STORAGE_KEY,
} from './constants';
import {
  getAgeFromDob,
  getClassCategory,
  isBirthdayToday,
  normalizeValue,
  truncateMessage,
} from './utils/childUtils';
import {
  createId,
  getLatestCheckinsByChild,
  loadLocalCheckins,
  loadLocalChildren,
  mapChildFromDb,
  mapChildToDb,
} from './utils/childStorage';
import { buildFormFromChild } from './utils/formUtils';
import AppHeader from './components/AppHeader';
import HomeView from './components/HomeView';
import RegisterForm from './components/RegisterForm';
import UpdateForm from './components/UpdateForm';
import CheckinView from './components/CheckinView';
import DetailsView from './components/DetailsView';
import ConfirmModal from './components/ConfirmModal';
import AnnouncementModal from './components/AnnouncementModal';
import useAnnouncements from './hooks/useAnnouncements';
import useChildMessages from './hooks/useChildMessages';
import useDraftStorage from './hooks/useDraftStorage';


function App() {
  const [children, setChildren] = React.useState(() =>
    isSupabaseEnabled ? [] : loadLocalChildren(STORAGE_KEY)
  );
  const [checkins, setCheckins] = React.useState(() =>
    isSupabaseEnabled ? [] : loadLocalCheckins(CHECKIN_KEY)
  );
  const [isLoading, setIsLoading] = React.useState(isSupabaseEnabled);
  const [error, setError] = React.useState('');
  const [supabaseStatus, setSupabaseStatus] = React.useState('');
  const [view, setView] = React.useState('home');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedChild, setSelectedChild] = React.useState(null);
  const [confirmAction, setConfirmAction] = React.useState(null);
  const birthdayAlertsRef = React.useRef(new Set());
  const [selectedAnnouncement, setSelectedAnnouncement] = React.useState(null);
  const [childForm, setChildForm] = useDraftStorage(DRAFT_KEY, {
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

  const { announcements, status: announcementsStatus } = useAnnouncements({
    isSupabaseEnabled,
    supabase,
    defaultAnnouncements: DEFAULT_ANNOUNCEMENTS,
  });
  const {
    messages: childMessages,
    status: childMessagesStatus,
    draft: messageDraft,
    setDraft: setMessageDraft,
    sendMessage,
    isSending: isSendingMessage,
    typingUsers: childTypingUsers,
    broadcastTyping,
  } = useChildMessages({
    childId: selectedChild?.id,
    isSupabaseEnabled,
    supabase,
    storageKey: MESSAGES_KEY,
    defaultSender: selectedChild?.guardianName?.trim(),
  });

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
          if (child.dateOfBirth && isBirthdayToday(child.dateOfBirth, today)) {
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
      if (child.dateOfBirth && isBirthdayToday(child.dateOfBirth, today)) {
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
  setUpdateForm(buildFormFromChild(child, KNOWN_ALLERGIES));
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
    const existingRecord = children.find((child) => child.id === selectedChild.id);
    if (!existingRecord) {
      setError('Unable to update: child record was not found. Please search and try again.');
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
      ...existingRecord,
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

    const hasChanges = Object.keys(updatedChild).some(
      (key) => updatedChild[key] !== existingRecord[key]
    );
    if (!hasChanges) {
      setSupabaseStatus('No changes to update.');
      setView('details');
      return;
    }

    let resolvedChild = updatedChild;

    if (isSupabaseEnabled) {
      setSupabaseStatus('');
      const { error: updateError } = await supabase
        .from('children')
        .update(mapChildToDb(updatedChild))
        .eq('id', existingRecord.id);
      if (updateError) {
        setError(`Unable to update child details. ${updateError.message}`);
        return;
      }

      const { data: refreshedChild, error: refreshError } = await supabase
        .from('children')
        .select('*')
        .eq('id', existingRecord.id)
        .single();

      if (!refreshError && refreshedChild) {
        resolvedChild = mapChildFromDb(refreshedChild);
      }

      setSupabaseStatus('Child details updated in Supabase.');
    } else {
      setSupabaseStatus('Child details updated.');
    }

    setChildren((prev) =>
      prev.map((record) => (record.id === existingRecord.id ? resolvedChild : record))
    );
    setSelectedChild(resolvedChild);
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
  const birthdayChildren = children.filter(
    (child) => child.dateOfBirth && isBirthdayToday(child.dateOfBirth)
  );

  return (
    <div
      className="app"
      style={{
        '--app-bg-image': `url(${process.env.PUBLIC_URL}/background/DSC01081.jpg)`,
      }}
    >
      <AppHeader
        view={view}
        onNavigateHome={() => setView('home')}
        supabaseStatus={supabaseStatus}
        error={error}
        isSupabaseEnabled={isSupabaseEnabled}
        supabaseConfigMessage={supabaseConfigMessage}
      />
      <main className="app__grid">
        {view === 'home' && (
          <HomeView
            isLoading={isLoading}
            onRegister={() => setView('register')}
            onCheckin={() => setView('checkin')}
            announcements={announcements}
            announcementsStatus={announcementsStatus}
            birthdayChildren={birthdayChildren}
            onSelectAnnouncement={setSelectedAnnouncement}
            truncateMessage={truncateMessage}
          />
        )}

        {view === 'register' && (
          <RegisterForm
            childForm={childForm}
            onChange={handleChildChange}
            onSubmit={handleAddChild}
            knownAllergies={KNOWN_ALLERGIES}
            getClassCategory={getClassCategory}
            getAgeFromDob={getAgeFromDob}
            onBack={() => setView('home')}
          />
        )}

        {view === 'update' && selectedChild && (
          <UpdateForm
            updateForm={updateForm}
            onChange={handleUpdateChange}
            onSubmit={handleUpdateChild}
            knownAllergies={KNOWN_ALLERGIES}
            getClassCategory={getClassCategory}
            getAgeFromDob={getAgeFromDob}
            onBack={() => setView('details')}
          />
        )}

        {view === 'checkin' && (
          <CheckinView
            searchTerm={searchTerm}
            onSearchChange={(event) => setSearchTerm(event.target.value)}
            filteredChildren={filteredChildren}
            signedInChildren={signedInChildren}
            requestSignIn={requestSignIn}
            requestSignOut={requestSignOut}
            onSelectChild={(child) => {
              setSelectedChild(child);
              setView('details');
            }}
            isBirthdayToday={isBirthdayToday}
          />
        )}

        {view === 'details' && selectedChild && (
          <DetailsView
            selectedChild={selectedChild}
            onBack={() => setView('checkin')}
            onGoHome={() => setView('home')}
            onStartUpdate={() => handleStartUpdate(selectedChild)}
            requestSignIn={requestSignIn}
            requestSignOut={requestSignOut}
            isBirthdayToday={isBirthdayToday}
            messages={childMessages}
            messagesStatus={childMessagesStatus}
            messageDraft={messageDraft}
            onMessageDraftChange={setMessageDraft}
            onSendMessage={sendMessage}
            isSendingMessage={isSendingMessage}
            typingUsers={childTypingUsers}
            onTyping={broadcastTyping}
          />
        )}
      </main>
      <ConfirmModal
        confirmAction={confirmAction}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />
      <AnnouncementModal
        selectedAnnouncement={selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
      />
    </div>
  );
}

export default App;
