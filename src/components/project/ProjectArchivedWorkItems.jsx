import React, { useEffect, useRef, useState } from "react";

function ArchivedItem({ deleteLabel, meta, onDelete, onRestore, restoreLabel, title, type }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function closeMenuOnOutsideClick(event) {
      if (!menuRef.current || menuRef.current.contains(event.target)) {
        return;
      }

      setIsMenuOpen(false);
    }

    document.addEventListener("mousedown", closeMenuOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeMenuOnOutsideClick);
    };
  }, []);

  return (
    <article className="archived-work-item">
      <div>
        <span className="archived-work-type">{type}</span>
        <h3>{title}</h3>
        {meta && <p>{meta}</p>}
      </div>
      <span className="project-tile-menu archived-work-item-menu" ref={menuRef}>
        <button
          className="board-menu archived-work-menu-button"
          type="button"
          aria-label={`Open ${title} archived ${type.toLowerCase()} menu`}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        >
          ...
        </button>
        {isMenuOpen && (
          <span className="project-dropdown-menu">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onRestore();
              }}
            >
              {restoreLabel}
            </button>
            <button
              className="danger"
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onDelete();
              }}
            >
              {deleteLabel}
            </button>
          </span>
        )}
      </span>
    </article>
  );
}

function ProjectArchivedWorkItems({
  archivedCards,
  archivedEpics,
  archivedSprints,
  onPermanentlyDeleteCard,
  onPermanentlyDeleteEpic,
  onPermanentlyDeleteSprint,
  onRestoreCard,
  onRestoreEpic,
  onRestoreSprint,
}) {
  return (
    <div className="archived-work-page">
      <section className="archived-work-section" aria-labelledby="archived-cards-title">
        <h2 id="archived-cards-title">Archived cards</h2>
        <div className="archived-work-list">
          {archivedCards.length > 0 ? (
            archivedCards.map((card) => (
              <ArchivedItem
                deleteLabel="Delete permanently"
                meta={card.source}
                onDelete={() => onPermanentlyDeleteCard(card.id)}
                onRestore={() => onRestoreCard(card.id)}
                restoreLabel="Restore card"
                title={card.title}
                type="Card"
                key={card.id}
              />
            ))
          ) : (
            <p className="empty-state">No archived cards yet.</p>
          )}
        </div>
      </section>

      <section className="archived-work-section" aria-labelledby="archived-epics-title">
        <h2 id="archived-epics-title">Archived epics</h2>
        <div className="archived-work-list">
          {archivedEpics.length > 0 ? (
            archivedEpics.map((epic) => (
              <ArchivedItem
                deleteLabel="Delete permanently"
                meta={`${epic.cards.length} cards, ${(epic.sprints ?? []).length} sprints`}
                onDelete={() => onPermanentlyDeleteEpic(epic.id)}
                onRestore={() => onRestoreEpic(epic.id)}
                restoreLabel="Restore epic"
                title={epic.name}
                type="Epic"
                key={epic.id}
              />
            ))
          ) : (
            <p className="empty-state">No archived epics yet.</p>
          )}
        </div>
      </section>

      <section className="archived-work-section" aria-labelledby="archived-sprints-title">
        <h2 id="archived-sprints-title">Archived sprints</h2>
        <div className="archived-work-list">
          {archivedSprints.length > 0 ? (
            archivedSprints.map((sprint) => (
              <ArchivedItem
                deleteLabel="Delete permanently"
                meta={`${sprint.epicName} · ${sprint.cards.length} cards`}
                onDelete={() => onPermanentlyDeleteSprint(sprint.id)}
                onRestore={() => onRestoreSprint(sprint.id)}
                restoreLabel="Restore sprint"
                title={sprint.title}
                type="Sprint"
                key={sprint.id}
              />
            ))
          ) : (
            <p className="empty-state">No archived sprints yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default ProjectArchivedWorkItems;
