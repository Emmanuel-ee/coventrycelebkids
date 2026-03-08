const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const loadLocalChildren = (storageKey) => {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const loadLocalCheckins = (storageKey) => {
  try {
    const stored = localStorage.getItem(storageKey);
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
  qrCode: child.qr_code || child.qrCode || '',
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
  signedIn:
    typeof child.signed_in === 'boolean'
      ? child.signed_in
      : typeof child.signedIn === 'boolean'
        ? child.signedIn
        : child.last_status === 'sign_in' || child.lastStatus === 'sign_in',
  signedInUserId: child.signed_in_user_id || child.signedInUserId || '',
  allowPhotos:
    typeof child.allow_photos === 'boolean'
      ? child.allow_photos
      : Boolean(child.allowPhotos),
  notes: child.notes || '',
  createdAt: child.created_at || child.createdAt || new Date().toISOString(),
});

const mapChildToDb = (child) => ({
  id: child.id,
  qr_code: child.qrCode || null,
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
  signed_in: typeof child.signedIn === 'boolean' ? child.signedIn : null,
  signed_in_user_id: child.signedInUserId || null,
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

export {
  createId,
  getLatestCheckinsByChild,
  loadLocalChildren,
  loadLocalCheckins,
  mapChildFromDb,
  mapChildToDb,
};
