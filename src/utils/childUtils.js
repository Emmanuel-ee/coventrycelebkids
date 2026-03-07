export const getClassCategory = (ageValue) => {
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

export const getAgeFromDob = (dateValue) => {
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

export const isBirthdayToday = (dateValue, today = new Date()) => {
  if (!dateValue) {
    return false;
  }
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }
  return parsed.getDate() === today.getDate() && parsed.getMonth() === today.getMonth();
};

export const normalizeValue = (value) => (value || '').trim().toLowerCase();

export const truncateMessage = (message, limit = 120) => {
  if (!message) {
    return '';
  }
  if (message.length <= limit) {
    return message;
  }
  return `${message.slice(0, limit - 1).trim()}…`;
};
