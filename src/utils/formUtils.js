import { normalizeValue } from './childUtils';

const buildFormFromChild = (child, knownAllergies) => {
  const knownAllergyValues = new Set(
    (knownAllergies || []).map((value) => value.toLowerCase())
  );
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

export { buildFormFromChild };
