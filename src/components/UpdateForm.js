import React from 'react';

const UpdateForm = ({
  updateForm,
  onChange,
  onSubmit,
  knownAllergies,
  getClassCategory,
  getAgeFromDob,
  onBack,
  isSaving,
  successNotice,
}) => (
  <section className="card">
    <div className="card__header">
      <div>
        <h2>Update child details</h2>
        <p className="card__subtitle">Add new information or request updates.</p>
      </div>
      <button className="ghost" type="button" onClick={onBack}>
        Back
      </button>
    </div>
    <form className="form" onSubmit={onSubmit}>
      {successNotice && <div className="status status--success">{successNotice}</div>}
      <label>
        Child's name
        <input
          type="text"
          name="name"
          value={updateForm.name}
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
          value={updateForm.dateOfBirth}
          onChange={onChange}
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
        <select name="sex" value={updateForm.sex} onChange={onChange}>
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
          value={updateForm.guardianName}
          onChange={onChange}
          placeholder="Parent/guardian name"
        />
      </label>
      <label>
        Guardian contact
        <input
          type="text"
          name="guardianContact"
          value={updateForm.guardianContact}
          onChange={onChange}
          placeholder="Phone number"
        />
      </label>
      <label>
        Allergies
        <select name="allergiesSelection" value={updateForm.allergiesSelection} onChange={onChange}>
          <option value="">Select an allergy</option>
          {knownAllergies.map((allergy) => (
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
            onChange={onChange}
            placeholder="Type the allergy"
          />
        </label>
      )}
      <label>
        Would you want your child's picture taken?
        <select
          name="allowPhotos"
          value={updateForm.allowPhotos ? 'yes' : 'no'}
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
          value={updateForm.notes}
          onChange={onChange}
          placeholder="Allergies, pickup notes, etc."
        />
      </label>
      <button type="submit" disabled={isSaving}>
        {isSaving ? 'Save updates' : 'Save updates'}
      </button>
    </form>
  </section>
);

export default UpdateForm;
