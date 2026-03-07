import React from 'react';

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
      <button className="ghost" type="button" onClick={onBack}>
        Back
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
        <input
          type="date"
          className="dob-picker"
          name="dateOfBirth"
          value={childForm.dateOfBirth}
          onChange={onChange}
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
      <label className="checkbox">
        <input
          type="checkbox"
          name="allowPhotos"
          checked={childForm.allowPhotos}
          onChange={onChange}
        />
        Would you want your child's picture captured?
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
