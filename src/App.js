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
  const [isUpdatingChild, setIsUpdatingChild] = React.useState(false);
  const [error, setError] = React.useState('');
  const [supabaseStatus, setSupabaseStatus] = React.useState('');
  const [view, setView] = React.useState('home');
  const [updateNotice, setUpdateNotice] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedChild, setSelectedChild] = React.useState(null);
  const [confirmAction, setConfirmAction] = React.useState(null);
  const [pendingScanId, setPendingScanId] = React.useState('');
  const [isScannerActive, setIsScannerActive] = React.useState(false);
  const [scanNotice, setScanNotice] = React.useState('');
  const birthdayAlertsRef = React.useRef(new Set());
  const lastScanRef = React.useRef({ value: '', timestamp: 0 });
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
    archiveMessage,
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
    setUpdateNotice('');
    setScanNotice('');
  }, [view]);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scanId = params.get('scan');
    if (scanId) {
      setPendingScanId(scanId);
    }
  }, []);

  const fetchChildren = React.useCallback(async () => {
    if (!isSupabaseEnabled) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSupabaseStatus('');
    const { data, error: fetchError } = await supabase
      .from('children')
      .select('*')
      .order('created_at', { ascending: false });

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

    const childrenWithQrCodes = childrenWithUpdatedAges.map((child) =>
      child.qrCode ? child : { ...child, qrCode: createId() }
    );

    setChildren(childrenWithQrCodes);
    setIsLoading(false);

    if (childrenWithUpdatedAges.length) {
      const seen = birthdayAlertsRef.current;
      childrenWithUpdatedAges.forEach((child) => {
        if (child.dateOfBirth && isBirthdayToday(child.dateOfBirth, today)) {
          seen.add(child.id);
        }
      });
    }

    const updates = childrenWithQrCodes.filter((child, index) => {
      const previous = mergedChildren[index];
      return child.age !== previous.age || child.qrCode !== previous.qrCode;
    });
    if (updates.length) {
      await Promise.all(
        updates.map((child) =>
          supabase
            .from('children')
            .update({
              age: child.age || null,
              qr_code: child.qrCode || null,
            })
            .eq('id', child.id)
        )
      );
    }
  }, []);

  React.useEffect(() => {
    if (!isSupabaseEnabled) {
      return undefined;
    }

    fetchChildren();
    return undefined;
  }, [fetchChildren]);

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
    const childrenWithQrCodes = updatedChildren.map((child) => {
      if (child.qrCode) {
        return child;
      }
      needsUpdate = true;
      return { ...child, qrCode: createId() };
    });
    if (needsUpdate) {
      setChildren(childrenWithQrCodes);
    }
    const seen = birthdayAlertsRef.current;
    childrenWithQrCodes.forEach((child) => {
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
      qrCode: createId(),
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
    setUpdateNotice('');
    const childId = selectedChild.id;
    const existingRecord = children.find((child) => child.id === childId);
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
      setUpdateNotice('');
      setView('details');
      return;
    }

    setUpdateNotice('Save updates...');
    setIsUpdatingChild(true);
    let resolvedChild = updatedChild;
    try {
      if (isSupabaseEnabled) {
        setSupabaseStatus('');
        const { data: updatedRows, error: updateError } = await supabase
          .from('children')
          .update(mapChildToDb(updatedChild))
          .eq('id', childId)
          .select('*');
        if (updateError) {
          setError(`Unable to update child details. ${updateError.message}`);
          setUpdateNotice('');
          return;
        }
        if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
          setError(
            'Supabase did not apply the update. Check that RLS policies allow updates on the children table.'
          );
          setUpdateNotice('');
          return;
        }
        resolvedChild = {
          ...existingRecord,
          ...mapChildFromDb(updatedRows[0]),
        };
        resolvedChild = {
          ...resolvedChild,
          lastStatus: resolvedChild.lastStatus || existingRecord.lastStatus,
          lastActionAt: resolvedChild.lastActionAt || existingRecord.lastActionAt,
          qrCode: resolvedChild.qrCode || existingRecord.qrCode,
        };
  setSupabaseStatus('Child details updated in Supabase.');
  await fetchChildren();
      } else {
        setSupabaseStatus('Child details updated.');
      }

      setChildren((prev) =>
        prev.map((record) => (record.id === childId ? resolvedChild : record))
      );
      setSelectedChild(resolvedChild);
      setUpdateNotice('Child details updated. Returning to details...');
      setTimeout(() => {
        setView('details');
      }, 1400);
    } finally {
      setIsUpdatingChild(false);
    }
  };

  const recordCheckin = React.useCallback(async (child, action, timestamp) => {
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
  }, []);

  React.useEffect(() => {
    if (!pendingScanId || children.length === 0) {
      return;
    }

    const child = children.find(
      (record) => record.qrCode === pendingScanId || record.id === pendingScanId
    );
    if (!child) {
      setError('Unable to find a child for this QR code.');
      setScanNotice('We could not find a child for this QR code.');
      setPendingScanId('');
      return;
    }

    const action = child.lastStatus === 'sign_in' ? 'sign_out' : 'sign_in';
    const handleScan = async () => {
      setIsScannerActive(false);
      setSelectedChild(child);
      const result = await recordCheckin(child, action);
      if (result.success) {
        setView('details');
      }
      const url = new URL(window.location.href);
      url.searchParams.delete('scan');
      window.history.replaceState({}, '', url.toString());
      setPendingScanId('');
    };

    handleScan();
  }, [pendingScanId, children, recordCheckin]);

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

  const parseScanValue = React.useCallback((value) => {
    if (!value) {
      return '';
    }
    try {
      const url = new URL(value);
      return url.searchParams.get('scan') || '';
    } catch (error) {
      const match = value.match(/scan=([^&]+)/i);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
      return value.trim();
    }
  }, []);

  const handleScannerToggle = () => {
    setScanNotice('');
    setIsScannerActive((prev) => !prev);
  };

  const handleScannerError = (scanError) => {
    if (!scanError) {
      return;
    }
    setScanNotice('Unable to access the camera. Check permissions and try again.');
  };

  const handleScanResult = (value) => {
    const trimmedValue = value?.trim();
    if (!trimmedValue) {
      return;
    }
    const now = Date.now();
    if (
      lastScanRef.current.value === trimmedValue
      && now - lastScanRef.current.timestamp < 4000
    ) {
      return;
    }
    lastScanRef.current = { value: trimmedValue, timestamp: now };
    const scanId = parseScanValue(trimmedValue);
    if (!scanId) {
      setScanNotice('We could not read that QR code. Try again.');
      return;
    }
    setScanNotice('QR code captured. Checking the child record...');
    setPendingScanId(scanId);
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
  const qrCodeValue = selectedChild
    ? `${window.location.origin}${process.env.PUBLIC_URL || ''}/?scan=${selectedChild.qrCode || selectedChild.id}`
    : '';

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
            isSaving={isUpdatingChild}
            successNotice={updateNotice}
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
            isScannerActive={isScannerActive}
            onToggleScanner={handleScannerToggle}
            scanNotice={scanNotice}
            onScan={handleScanResult}
            onScanError={handleScannerError}
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
            onArchiveMessage={archiveMessage}
            qrCodeValue={qrCodeValue}
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
