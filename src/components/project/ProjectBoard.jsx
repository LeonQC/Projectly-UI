import React, { useEffect, useRef, useState } from "react";

export const cardStatuses = [
  { label: "Todo", value: "todo" },
  { label: "In Progress", value: "in-progress" },
  { label: "Done", value: "done" },
];

export function formatStatus(status) {
  return cardStatuses.find((option) => option.value === status)?.label ?? "Todo";
}

export function WorkItemCard({
  card,
  draggable = false,
  hideStatus = false,
  onDragStart,
  onOpenCard,
  onStatusChange,
  statuses = cardStatuses,
}) {
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef(null);
  const status = card.status ?? "todo";

  useEffect(() => {
    function closeStatusMenuOnOutsideClick(event) {
      if (!statusMenuRef.current || statusMenuRef.current.contains(event.target)) {
        return;
      }

      setIsStatusMenuOpen(false);
    }

    document.addEventListener("mousedown", closeStatusMenuOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeStatusMenuOnOutsideClick);
    };
  }, []);

  return (
    <article
      className="work-item-card"
      draggable={draggable}
      onDragStart={onDragStart}
    >
      <label className="work-item-check">
        <input type="checkbox" defaultChecked={card.completed} />
        <span>{card.title}</span>
      </label>
      <div className="work-item-actions">
        {!hideStatus && (
          <div className="card-status-menu" ref={statusMenuRef}>
            <button
              className="status-pill status-pill-button"
              type="button"
              aria-label={`Change status for ${card.title}`}
              aria-expanded={isStatusMenuOpen}
              onClick={() => setIsStatusMenuOpen((isOpen) => !isOpen)}
            >
              Status: {statuses.find((option) => option.value === status)?.label ?? formatStatus(status)}
              <svg aria-hidden="true" fill="none" height="12" viewBox="0 0 24 24" width="12">
                <path
                  d="m6 9 6 6 6-6"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </button>
            {isStatusMenuOpen && (
              <div className="card-status-dropdown" role="menu">
                {statuses.map((option) => (
                  <button
                    className={status === option.value ? "is-active" : ""}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onStatusChange?.(card.id, option.value);
                      setIsStatusMenuOpen(false);
                    }}
                    key={option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <button
          className="card-edit-button"
          type="button"
          aria-label={`Open ${card.title} detail`}
          onClick={() => onOpenCard(card)}
        >
          <svg aria-hidden="true" fill="none" height="15" viewBox="0 0 24 24" width="15">
            <path
              d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>
      </div>
    </article>
  );
}

function BoardColumn({
  cards,
  onArchiveStatus,
  onCardDragStart,
  onDropCard,
  onEditStatus,
  onOpenCard,
  onStatusChange,
  status,
  statuses,
  title,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef(null);

  useEffect(() => {
    function closeStatusMenuOnOutsideClick(event) {
      if (!statusMenuRef.current || statusMenuRef.current.contains(event.target)) {
        return;
      }

      setIsStatusMenuOpen(false);
    }

    document.addEventListener("mousedown", closeStatusMenuOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeStatusMenuOnOutsideClick);
    };
  }, []);

  return (
    <section
      className={`board-column ${isDragOver ? "is-drag-over" : ""}`}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsDragOver(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragOver(false);
        onDropCard(event, status);
      }}
    >
      <header className="board-column-header">
        <h3>{title}</h3>
        <div className="board-column-header-actions">
          <span>{cards.length}</span>
          <div className="status-menu-wrapper" ref={statusMenuRef}>
            <button
              className="icon-button status-menu-button"
              type="button"
              aria-label={`Open ${title} status menu`}
              aria-expanded={isStatusMenuOpen}
              onClick={() => setIsStatusMenuOpen((isOpen) => !isOpen)}
            >
              ...
            </button>
            {isStatusMenuOpen && (
              <div className="sprint-menu status-column-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsStatusMenuOpen(false);
                    onEditStatus(status, title);
                  }}
                >
                  Edit status
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsStatusMenuOpen(false);
                    onArchiveStatus(status);
                  }}
                >
                  Archive status
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="board-column-cards">
        {cards.length > 0 ? (
          cards.map((card) => (
            <WorkItemCard
              card={card}
              draggable
              hideStatus
              onDragStart={(event) => onCardDragStart(event, card.id)}
              onOpenCard={onOpenCard}
              onStatusChange={onStatusChange}
              statuses={statuses}
              key={card.id}
            />
          ))
        ) : (
          <p className="empty-state">No cards yet.</p>
        )}
      </div>
    </section>
  );
}

function ProjectBoard({
  boardCards = [],
  boardColumns,
  onArchiveStatus,
  onCreateStatus,
  onEditStatus,
  onOpenCard,
  onStatusChange,
  statuses = cardStatuses,
}) {
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [newStatusTitle, setNewStatusTitle] = useState("");
  const boardColumnStatuses = boardColumns.map((column) => column.status);
  const extraStatuses = statuses.filter((status) => !boardColumnStatuses.includes(status.value));

  function createStatus(event) {
    event.preventDefault();

    if (!newStatusTitle.trim()) {
      return;
    }

    onCreateStatus(newStatusTitle.trim());
    setNewStatusTitle("");
    setIsStatusModalOpen(false);
  }

  function updateStatus(event) {
    event.preventDefault();

    if (!editingStatus || !newStatusTitle.trim()) {
      return;
    }

    onEditStatus(editingStatus.value, newStatusTitle.trim());
    setEditingStatus(null);
    setNewStatusTitle("");
  }

  function handleCardDragStart(event, cardId) {
    event.dataTransfer.setData("text/plain", cardId);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDropCard(event, status) {
    const cardId = event.dataTransfer.getData("text/plain");

    if (!cardId || !status) {
      return;
    }

    onStatusChange(cardId, status);
  }

  return (
    <div className="board-view-panel">
      <div className="board-toolbar">
        <button className="small-action-button" type="button" onClick={() => setIsStatusModalOpen(true)}>
          Create new status
        </button>
      </div>
      <div className="board-column-grid">
        {boardColumns.map((column) => (
          <BoardColumn
            cards={column.cards}
            onArchiveStatus={onArchiveStatus}
            onCardDragStart={handleCardDragStart}
            onDropCard={handleDropCard}
            onEditStatus={(statusValue, statusLabel) => {
              setEditingStatus({ value: statusValue, label: statusLabel });
              setNewStatusTitle(statusLabel);
            }}
            onOpenCard={onOpenCard}
            onStatusChange={onStatusChange}
            status={column.status}
            statuses={statuses}
            title={column.title}
            key={column.title}
          />
        ))}
        {extraStatuses.map((status) => (
          <BoardColumn
            cards={boardCards.filter((card) => card.status === status.value)}
            onArchiveStatus={onArchiveStatus}
            onCardDragStart={handleCardDragStart}
            onDropCard={handleDropCard}
            onEditStatus={(statusValue, statusLabel) => {
              setEditingStatus({ value: statusValue, label: statusLabel });
              setNewStatusTitle(statusLabel);
            }}
            onOpenCard={onOpenCard}
            onStatusChange={onStatusChange}
            status={status.value}
            statuses={statuses}
            title={status.label}
            key={status.value}
          />
        ))}
      </div>
      {isStatusModalOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="simple-modal" aria-labelledby="create-status-title" role="dialog" aria-modal="true">
            <header className="simple-modal-header">
              <h2 id="create-status-title">Create new status</h2>
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
      {editingStatus && (
        <div className="modal-backdrop" role="presentation">
          <section className="simple-modal" aria-labelledby="edit-status-title" role="dialog" aria-modal="true">
            <header className="simple-modal-header">
              <h2 id="edit-status-title">Edit status</h2>
              <button
                className="modal-close-button"
                type="button"
                aria-label="Close edit status modal"
                onClick={() => {
                  setEditingStatus(null);
                  setNewStatusTitle("");
                }}
              >
                <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                </svg>
              </button>
            </header>
            <form className="simple-modal-form" onSubmit={updateStatus}>
              <label className="modal-field">
                <strong>
                  Status name <span className="required-mark">*</span>
                </strong>
                <input
                  type="text"
                  value={newStatusTitle}
                  onChange={(event) => setNewStatusTitle(event.target.value)}
                  autoFocus
                />
              </label>
              <footer className="sprint-modal-footer">
                <button
                  className="modal-cancel-button"
                  type="button"
                  onClick={() => {
                    setEditingStatus(null);
                    setNewStatusTitle("");
                  }}
                >
                  Cancel
                </button>
                <button className="modal-update-button" type="submit">
                  Save
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default ProjectBoard;
