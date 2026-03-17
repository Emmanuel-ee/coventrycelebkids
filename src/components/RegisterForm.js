import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const toDateValue = (value) => (value ? new Date(value) : null);
const toIsoDate = (value) => (value ? value.toISOString().split('T')[0] : '');

const RegisterForm = ({
  childForms,
  onChange,
  onSubmit,
  onAddAnother,
  onRemoveChild,
  focusedChildIndex,
  knownAllergies,
  getClassCategory,
  getAgeFromDob,
  onBack,
}) => {
  const nameInputRefs = React.useRef([]);

  React.useEffect(() => {
    if (Number.isInteger(focusedChildIndex)) {
      nameInputRefs.current[focusedChildIndex]?.focus();
    }
  }, [focusedChildIndex, childForms.length]);

  return (
    <section className="card">
      <div className="card__header">
        <div>
          <h2>Register a child</h2>
          <p className="card__subtitle">Complete the form to save the record.</p>
        </div>
        <button className="ghost back-arrow" type="button" onClick={onBack} aria-label="Back">
          ←
        </button>
      </div>
      <form className="form" onSubmit={onSubmit}>
        {childForms.map((childForm, index) => (
          <div className="register-child" key={`child-form-${index + 1}`}>
            <div className="register-child__header">
              <div>
                <h3>Child {index + 1}</h3>
                <p className="card__subtitle">Fill in the details for this child.</p>
              </div>
              {index > 0 && (
                <button
                  type="button"
                  className="ghost register-child__remove"
                  onClick={() => onRemoveChild(index)}
                >
                  Remove child
                </button>
              )}
            </div>
            <label>
              Child's name
              <input
                type="text"
                name="name"
                value={childForm.name}
                onChange={(event) => onChange(index, event)}
                placeholder="e.g. Ada Johnson"
                ref={(input) => {
                  nameInputRefs.current[index] = input;
                }}
                required
              />
            </label>
          <label>
            Date of birth
            <div className="dob-picker">
              <DatePicker
                selected={toDateValue(childForm.dateOfBirth)}
                onChange={(date) =>
                  onChange(index, {
                    target: {
                      name: 'dateOfBirth',
                      value: toIsoDate(date),
                      type: 'text',
                    },
                  })
                }
                maxDate={new Date()}
                placeholderText="Select date"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                isClearable
                shouldCloseOnSelect
              />
            </div>
            <span className="helper">Tap to open the calendar and choose a date.</span>
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
              onChange={(event) => onChange(index, event)}
            >
              <option value="">Select</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
          </label>
          <label>
            Guardian name
            <input
              type="text"
              name="guardianName"
              value={childForm.guardianName}
              onChange={(event) => onChange(index, event)}
              placeholder="Parent/guardian name"
            />
          </label>
          <label>
            Guardian contact
            <input
              type="text"
              name="guardianContact"
              value={childForm.guardianContact}
              onChange={(event) => onChange(index, event)}
              placeholder="Phone number"
            />
          </label>
          <label>
            Allergies
            <select
              name="allergiesSelection"
              value={childForm.allergiesSelection}
              onChange={(event) => onChange(index, event)}
            >
              <option value="">Select an allergy</option>
              {knownAllergies.map((allergy) => (
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
                onChange={(event) => onChange(index, event)}
                placeholder="Type the allergy"
              />
            </label>
          )}
          <label>
            Would you want your child's picture taken?
            <select
              name="allowPhotos"
              value={childForm.allowPhotos ? 'yes' : 'no'}
              onChange={(event) =>
                onChange(index, {
                  target: {
                    name: 'allowPhotos',
                    type: 'checkbox',
                    checked: event.target.value === 'yes',
                  },
                })
              }
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label>
            Notes
            <textarea
              name="notes"
              value={childForm.notes}
              onChange={(event) => onChange(index, event)}
              placeholder="Allergies, pickup notes, etc."
            />
          </label>
          {index < childForms.length - 1 && <div className="divider" />}
          </div>
        ))}
        <div className="button-row">
          <button type="button" className="ghost" onClick={onAddAnother}>
            Add another child
          </button>
  <button type="submit">Register Child(ren)</button>
        </div>
      </form>
    </section>
  );
};

export default RegisterForm;
