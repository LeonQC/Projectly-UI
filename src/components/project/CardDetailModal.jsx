import React, { useEffect, useRef, useState } from "react";

const defaultCardStatuses = [
  { label: "Todo", value: "todo" },
  { label: "In Progress", value: "in-progress" },
  { label: "Done", value: "done" },
];
const cardTabs = ["Members", "Labels", "Attachments"];
const workItemRelations = [
  "is blocked by",
  "blocks",
  "is cloned by",
  "clones",
  "is duplicated by",
  "duplicates",
  "relates to",
];
const labelColors = [
  { name: "Purple", value: "purple" },
  { name: "Green", value: "green" },
  { name: "Blue", value: "blue" },
  { name: "Red", value: "red" },
  { name: "Gray", value: "gray" },
];

function CardDetailModal({
  card,
  linkedWorkItemOptions = [],
  onArchiveCard,
  onClose,
  onCreateStatus,
  onStatusChange,
  projectMembers = [],
  sprintOptions = [],
  statuses = defaultCardStatuses,
}) {
  const [activeTab, setActiveTab] = useState("Members");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sprintId, setSprintId] = useState(card.sprintId ?? "backlog");
  const [linkedRelation, setLinkedRelation] = useState(workItemRelations[0]);
  const [linkedCardId, setLinkedCardId] = useState("");
  const [linkedWorkItems, setLinkedWorkItems] = useState([]);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatusTitle, setNewStatusTitle] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMembers, setSelectedMembers] = useState(projectMembers.slice(0, 1));
  const [memberPendingRemoveId, setMemberPendingRemoveId] = useState(null);
  const [labelText, setLabelText] = useState("");
  const [labelColor, setLabelColor] = useState("purple");
  const [labelPendingRemoveId, setLabelPendingRemoveId] = useState(null);
  const [labels, setLabels] = useState([
    { id: "label-1", text: "Planning", color: "purple" },
    { id: "label-2", text: "Ready", color: "green" },
  ]);
  const cardMenuRef = useRef(null);
  const statusMenuRef = useRef(null);
  const memberRemoveRef = useRef(null);
  const labelRemoveRef = useRef(null);
  const filteredMembers = projectMembers.filter((member) => {
    const searchValue = `${member.name} ${member.username}`.toLowerCase();
    return searchValue.includes(memberSearch.toLowerCase());
  });
  const availableLinkedWorkItems = linkedWorkItemOptions.filter((workItem) => workItem.id !== card.id);
  const selectedLinkedCard = availableLinkedWorkItems.find((workItem) => workItem.id === linkedCardId);
  const hasDuplicateLinkedWorkItem =
    selectedLinkedCard &&
    linkedWorkItems.some(
      (linkedItem) =>
        linkedItem.cardId === selectedLinkedCard.id && linkedItem.relation === linkedRelation
    );

  function addLinkedWorkItem(event) {
    event.preventDefault();

    if (!selectedLinkedCard || hasDuplicateLinkedWorkItem) {
      return;
    }

    setLinkedWorkItems((currentItems) => [
      ...currentItems,
      {
        id: `linked-${Date.now()}`,
        cardId: selectedLinkedCard.id,
        relation: linkedRelation,
        title: selectedLinkedCard.title,
      },
    ]);
    setLinkedCardId("");
    setLinkedRelation(workItemRelations[0]);
  }

  function addMember(member) {
    setSelectedMembers((members) =>
      members.some((selectedMember) => selectedMember.id === member.id)
        ? members
        : [...members, member]
    );
  }

  function addLabel(event) {
    event.preventDefault();

    if (!labelText.trim()) {
      return;
    }

    setLabels((currentLabels) => [
      ...currentLabels,
      {
        id: `label-${Date.now()}`,
        text: labelText.trim(),
        color: labelColor,
      },
    ]);
    setLabelText("");
  }

  function removeMember(memberId) {
    setSelectedMembers((members) => members.filter((member) => member.id !== memberId));
    setMemberPendingRemoveId(null);
  }

  function removeLabel(labelId) {
    setLabels((currentLabels) => currentLabels.filter((label) => label.id !== labelId));
    setLabelPendingRemoveId(null);
  }

  function createStatus(event) {
    event.preventDefault();

    if (!newStatusTitle.trim()) {
      return;
    }

    const newStatus = onCreateStatus?.(newStatusTitle.trim());

    if (newStatus?.value) {
      onStatusChange?.(card.id, newStatus.value);
    }
    setNewStatusTitle("");
    setIsStatusMenuOpen(false);
    setIsStatusModalOpen(false);
  }

  useEffect(() => {
    function closeDropdownsOnOutsideClick(event) {
      if (cardMenuRef.current && !cardMenuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }

      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target)) {
        setIsStatusMenuOpen(false);
      }

      if (memberRemoveRef.current && !memberRemoveRef.current.contains(event.target)) {
        setMemberPendingRemoveId(null);
      }

      if (labelRemoveRef.current && !labelRemoveRef.current.contains(event.target)) {
        setLabelPendingRemoveId(null);
      }
    }

    document.addEventListener("mousedown", closeDropdownsOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeDropdownsOnOutsideClick);
    };
  }, []);

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="card-detail-modal" aria-labelledby="card-detail-title" role="dialog" aria-modal="true">
        <header className="card-detail-header">
          <div className="card-detail-meta">
            <div className="card-status-field" ref={statusMenuRef}>
              <span>Status</span>
              <button
                className="card-status-select"
                type="button"
                aria-expanded={isStatusMenuOpen}
                onClick={() => setIsStatusMenuOpen((isOpen) => !isOpen)}
              >
                {statuses.find((status) => status.value === card.status)?.label ?? "Todo"}
                <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
                  <path d="m6 9 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
              {isStatusMenuOpen && (
                <div className="card-status-dropdown card-detail-status-dropdown" role="menu">
                  {statuses.map((status) => (
                    <button
                      className={card.status === status.value ? "is-active" : ""}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onStatusChange?.(card.id, status.value);
                        setIsStatusMenuOpen(false);
                      }}
                      key={status.value}
                    >
                      {status.label}
                    </button>
                  ))}
                  <button
                    className="create-status-menu-item"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsStatusMenuOpen(false);
                      setIsStatusModalOpen(true);
                    }}
                  >
                    Create new status
                  </button>
                </div>
              )}
            </div>

            <label className="card-status-field">
              <span>Sprint</span>
              <span className="card-select-wrapper">
                <select
                  className="card-status-select"
                  value={sprintId}
                  onChange={(event) => setSprintId(event.target.value)}
                >
                  <option value="backlog">Backlog</option>
                  {sprintOptions.map((option) => (
                    <option value={option.id} key={option.id}>
                      {option.title} ({option.epicName})
                    </option>
                  ))}
                </select>
                <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
                  <path d="m6 9 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </span>
            </label>
          </div>

          <div className="card-detail-actions">
            <div className="card-menu-wrapper" ref={cardMenuRef}>
              <button
                className="icon-button"
                type="button"
                aria-label="Open card menu"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
              >
                ...
              </button>
              {isMenuOpen && (
                <div className="sprint-menu card-actions-menu" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onArchiveCard?.(card.id);
                      setIsMenuOpen(false);
                    }}
                  >
                    Archive card
                  </button>
                </div>
              )}
            </div>
            <button className="modal-close-button" type="button" aria-label="Close card detail" onClick={onClose}>
              <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </header>

        <div className="card-detail-body">
          <section className="card-detail-main">
            <label className="card-title-row">
              <input type="checkbox" defaultChecked={card.completed} />
              <h2 id="card-detail-title">{card.title}</h2>
            </label>

            <nav className="card-detail-tabs" aria-label="Card detail tabs">
              {cardTabs.map((tab) => (
                <button
                  className={`card-detail-tab ${activeTab === tab ? "is-active" : ""}`}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  key={tab}
                >
                  {tab}
                </button>
              ))}
            </nav>

            <div className="card-tab-panel">
              {activeTab === "Members" ? (
                <div className="card-member-editor">
                  <input
                    type="search"
                    placeholder="Search project members"
                    value={memberSearch}
                    onChange={(event) => setMemberSearch(event.target.value)}
                  />
                  <div className="selected-member-list">
                    {selectedMembers.map((member) => (
                      <span className="selected-member-chip" key={member.id} ref={memberPendingRemoveId === member.id ? memberRemoveRef : null}>
                        <button
                          className="selected-member-avatar-button"
                          type="button"
                          aria-label={`Show remove option for ${member.name}`}
                          onClick={() => setMemberPendingRemoveId(member.id)}
                        >
                          <span className="member-avatar">{member.initials}</span>
                        </button>
                        {member.name}
                        {memberPendingRemoveId === member.id && (
                          <span className="chip-remove-dropdown">
                            <button
                              type="button"
                              onClick={() => removeMember(member.id)}
                            >
                              Remove
                            </button>
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="member-search-results">
                    {filteredMembers.map((member) => (
                      <button type="button" onClick={() => addMember(member)} key={member.id}>
                        <span className="member-avatar">{member.initials}</span>
                        <span>{member.name}</span>
                        <small>{member.username}</small>
                      </button>
                    ))}
                  </div>
                </div>
              ) : activeTab === "Labels" ? (
                <div className="card-label-editor">
                  <form className="label-create-row" onSubmit={addLabel}>
                    <input
                      type="text"
                      placeholder="Label text"
                      value={labelText}
                      onChange={(event) => setLabelText(event.target.value)}
                    />
                    <select value={labelColor} onChange={(event) => setLabelColor(event.target.value)}>
                      {labelColors.map((color) => (
                        <option value={color.value} key={color.value}>
                          {color.name}
                        </option>
                      ))}
                    </select>
                    <button className="small-action-button" type="submit">
                      Add label
                    </button>
                  </form>
                  <div className="card-label-options">
                    {labels.map((label) => (
                      <span className="card-label-wrapper" key={label.id} ref={labelPendingRemoveId === label.id ? labelRemoveRef : null}>
                        <button
                          className={`card-label is-${label.color}`}
                          type="button"
                          onClick={() => setLabelPendingRemoveId(label.id)}
                        >
                          {label.text}
                        </button>
                        {labelPendingRemoveId === label.id && (
                          <span className="chip-remove-dropdown">
                            <button
                              type="button"
                              onClick={() => removeLabel(label.id)}
                            >
                              Remove
                            </button>
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <button className="small-action-button" type="button">
                  Add attachment
                </button>
              )}
            </div>

            <section className="linked-work-items-section">
              <header>
                <h3>Linked work items</h3>
              </header>

              <form className="linked-work-item-form" onSubmit={addLinkedWorkItem}>
                <label>
                  <span>Relationship</span>
                  <select
                    value={linkedRelation}
                    onChange={(event) => setLinkedRelation(event.target.value)}
                  >
                    {workItemRelations.map((relation) => (
                      <option value={relation} key={relation}>
                        {relation}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Card</span>
                  <select
                    value={linkedCardId}
                    onChange={(event) => setLinkedCardId(event.target.value)}
                  >
                    <option value="">Select card</option>
                    {availableLinkedWorkItems.map((workItem) => (
                      <option value={workItem.id} key={workItem.id}>
                        {workItem.title}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  className="small-action-button"
                  type="submit"
                  disabled={!selectedLinkedCard || hasDuplicateLinkedWorkItem}
                >
                  Add linked item
                </button>
              </form>

              <div className="linked-work-item-list">
                {linkedWorkItems.length > 0 ? (
                  linkedWorkItems.map((linkedItem) => (
                    <article className="linked-work-item" key={linkedItem.id}>
                      <div>
                        <span>{linkedItem.relation}</span>
                        <strong>{linkedItem.title}</strong>
                      </div>
                      <button
                        className="small-action-button"
                        type="button"
                        onClick={() =>
                          setLinkedWorkItems((currentItems) =>
                            currentItems.filter((item) => item.id !== linkedItem.id)
                          )
                        }
                      >
                        Remove
                      </button>
                    </article>
                  ))
                ) : (
                  <p className="linked-work-item-empty">No linked work items yet.</p>
                )}
              </div>
            </section>

            <section className="card-description-section">
              <header>
                <h3>Description</h3>
                <button className="small-action-button" type="button">
                  Edit
                </button>
              </header>
              <p>{card.description || "No description yet."}</p>
            </section>
          </section>

          <aside className="card-detail-side">
            <details open>
              <summary>Development</summary>
              <p className="empty-state">No development activity yet.</p>
            </details>
            <details open>
              <summary>Comments and activity</summary>
              <p className="empty-state">No comments or activity yet.</p>
            </details>
          </aside>
        </div>

        <footer className="card-detail-footer">
          <button className="modal-cancel-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="modal-update-button" type="button" onClick={onClose}>
            Save
          </button>
        </footer>
        {isStatusModalOpen && (
          <div className="modal-backdrop nested-modal-backdrop" role="presentation">
            <section className="simple-modal" aria-labelledby="card-create-status-title" role="dialog" aria-modal="true">
              <header className="simple-modal-header">
                <h2 id="card-create-status-title">Create new status</h2>
                <button
                  className="modal-close-button"
                  type="button"
                  aria-label="Close create status modal"
                  onClick={() => setIsStatusModalOpen(false)}
                >
                  <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
                    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                  </svg>
                </button>
              </header>
              <form className="simple-modal-form" onSubmit={createStatus}>
                <label className="modal-field">
                  <strong>
                    Title <span className="required-mark">*</span>
                  </strong>
                  <input
                    type="text"
                    value={newStatusTitle}
                    onChange={(event) => setNewStatusTitle(event.target.value)}
                    autoFocus
                  />
                </label>
                <footer className="sprint-modal-footer">
                  <button className="modal-cancel-button" type="button" onClick={() => setIsStatusModalOpen(false)}>
                    Cancel
                  </button>
                  <button className="modal-update-button" type="submit">
                    Create
                  </button>
                </footer>
              </form>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}

export default CardDetailModal;
