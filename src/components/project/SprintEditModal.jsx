import React from "react";

function SprintEditModal({
  autoSchedule,
  duration,
  endDate,
  endTime,
  goal,
  moveOpenWorkTo,
  name,
  onAutoScheduleChange,
  onClose,
  onDurationChange,
  onEndDateChange,
  onEndTimeChange,
  onGoalChange,
  onMoveOpenWorkToChange,
  onNameChange,
  onStartDateChange,
  onStartTimeChange,
  onUpdate,
  startDate,
  startTime,
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="sprint-modal" aria-labelledby="edit-sprint-title" role="dialog" aria-modal="true">
        <header className="sprint-modal-header">
          <h2 id="edit-sprint-title">Edit sprint: {name}</h2>
          <button className="modal-close-button" type="button" aria-label="Close edit sprint" onClick={onClose}>
            <svg aria-hidden="true" fill="none" height="28" viewBox="0 0 24 24" width="28">
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </header>

        <p className="required-note">
          Required fields are marked with an asterisk <span>*</span>
        </p>

        <div className="sprint-modal-form">
          <label className="modal-field">
            <span>
              Sprint name <strong>*</strong>
            </span>
            <input type="text" value={name} onChange={(event) => onNameChange(event.target.value)} />
          </label>

          <label className="modal-field">
            <span>Duration</span>
            <select value={duration} onChange={(event) => onDurationChange(event.target.value)}>
              <option value="custom">custom</option>
              <option value="1 week">1 week</option>
              <option value="2 weeks">2 weeks</option>
              <option value="4 weeks">4 weeks</option>
            </select>
          </label>

          <label className="modal-field">
            <span>Start date</span>
            <div className="date-time-row">
              <input type="date" value={startDate} onChange={(event) => onStartDateChange(event.target.value)} />
              <input type="time" value={startTime} onChange={(event) => onStartTimeChange(event.target.value)} />
            </div>
          </label>

          <label className="modal-field">
            <span>End date</span>
            <div className="date-time-row">
              <input type="date" value={endDate} onChange={(event) => onEndDateChange(event.target.value)} />
              <input type="time" value={endTime} onChange={(event) => onEndTimeChange(event.target.value)} />
            </div>
          </label>

          <label className="auto-sprint-row">
            <input
              type="checkbox"
              checked={autoSchedule}
              onChange={(event) => onAutoScheduleChange(event.target.checked)}
            />
            <span>Automatically start and complete sprint</span>
          </label>

          {autoSchedule && (
            <label className="modal-field">
              <span>When sprint completes, move open work to:</span>
              <select
                value={moveOpenWorkTo}
                onChange={(event) => onMoveOpenWorkToChange(event.target.value)}
              >
                <option value="SCRUM Sprint 1">SCRUM Sprint 1</option>
              </select>
            </label>
          )}

          <label className="modal-field modal-field-wide">
            <span>Sprint goal</span>
            <textarea value={goal} onChange={(event) => onGoalChange(event.target.value)} />
          </label>
        </div>

        <footer className="sprint-modal-footer">
          <button className="modal-cancel-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="modal-update-button" type="button" onClick={onUpdate}>
            Update
          </button>
        </footer>
      </section>
    </div>
  );
}

export default SprintEditModal;
