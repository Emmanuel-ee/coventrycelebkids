import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const toDateValue = (value) => (value ? new Date(value) : null);
const toIsoDate = (value) => (value ? value.toISOString().split('T')[0] : '');

const RegisterForm = ({
  childForm,
  onChange,
  onSubmit,
  knownAllergies,
  getClassCategory,
  getAgeFromDob,
  onBack,
}) => (
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
      <label>
        Child's name
        <input
          type="text"
          name="name"
          value={childForm.name}
          onChange={onChange}
          placeholder="e.g. Ada Johnson"
          required
        />
      </label>
      <label>
        Date of birth
        <div className="dob-picker">
          <DatePicker
            selected={toDateValue(childForm.dateOfBirth)}
            onChange={(date) =>
              onChange({
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
        <select name="sex" value={childForm.sex} onChange={onChange}>
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
            onChange={onChange}
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
          onChange={onChange}
          placeholder="Parent/guardian name"
        />
      </label>
      <label>
        Guardian contact
        <input
          type="text"
          name="guardianContact"
          value={childForm.guardianContact}
          onChange={onChange}
          placeholder="Phone number"
        />
      </label>
      <label>
        Allergies
        <select name="allergiesSelection" value={childForm.allergiesSelection} onChange={onChange}>
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
            onChange={onChange}
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
            onChange({
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
          onChange={onChange}
          placeholder="Allergies, pickup notes, etc."
        />
      </label>
      <button type="submit">Register child</button>
    </form>
  </section>
);

export default RegisterForm;
