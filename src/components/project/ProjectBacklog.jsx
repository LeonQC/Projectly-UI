import React from "react";
import { WorkItemCard } from "./ProjectBoard.jsx";

function EpicSprint({
  epic,
  isSprintExpanded,
  isSprintMenuOpen,
  onArchiveSprint,
  onEditSprint,
  onCardDragStart,
  onDropCardToSprint,
  onMoveSprint,
  onOpenCard,
  onStartSprint,
  onStatusChange,
  onToggleSprint,
  onToggleSprintMenu,
  sprintMenuRef,
  sprintMoveActions,
  sprintStatusCounts,
  sprintStartDisabled,
  statuses,
}) {
  const sprint = epic.sprints?.find((epicSprint) => !epicSprint.archived) ?? null;
  const sprintCards = sprint?.cards ?? [];

  return (
    <section className="epic-sprint-section">
      {sprint ? (
        <section
          className="status-group epic-sprint-group drop-zone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => onDropCardToSprint(event, epic.id)}
        >
          <header className="sprint-header">
            <div className="sprint-title-group">
              <button
                className="sprint-expand-button"
                type="button"
                aria-label={isSprintExpanded ? "Collapse sprint cards" : "Expand sprint cards"}
                aria-expanded={isSprintExpanded}
                onClick={() => onToggleSprint(epic.id)}
              >
                <svg
                  aria-hidden="true"
                  className={`chevron-icon ${isSprintExpanded ? "is-expanded" : ""}`}
                  fill="none"
                  height="16"
                  viewBox="0 0 24 24"
                  width="16"
                >
                  <path
                    d="m9 6 6 6-6 6"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </button>
              <div>
                <h3>{sprint.title}</h3>
                <span>{sprint.startDate && sprint.endDate ? `${sprint.startDate} - ${sprint.endDate}` : "No dates set"}</span>
              </div>
            </div>

            <div className="sprint-header-actions">
              <div className="sprint-status-counts" aria-label="Sprint card status counts">
                <span title="Todo">{sprintStatusCounts.todo}</span>
                <span title="In Progress">{sprintStatusCounts.inProgress}</span>
                <span title="Done">{sprintStatusCounts.done}</span>
              </div>
              <button
                className="start-sprint-button"
                type="button"
                onClick={() => onStartSprint(epic.id)}
                disabled={sprintStartDisabled}
              >
                {sprint.isStarted ? "Started" : "Start sprint"}
              </button>
              <div className="sprint-menu-wrapper" ref={sprintMenuRef}>
                <button
                  className="icon-button sprint-menu-button"
                  type="button"
                  aria-label="Open sprint menu"
                  aria-expanded={isSprintMenuOpen}
                  onClick={() => onToggleSprintMenu(epic.id)}
                >
                  ...
                </button>

                {isSprintMenuOpen && (
                  <div className="sprint-menu" role="menu">
                    <button type="button" role="menuitem" onClick={() => onEditSprint(epic.id)}>
                      Edit sprint
                    </button>
                    {sprintMoveActions.map((action) => (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => onMoveSprint(epic.id, action)}
                        key={action}
                      >
                        {action}
                      </button>
                    ))}
                    <button type="button" role="menuitem" onClick={() => onArchiveSprint(epic.id)}>
                      Archive sprint
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {isSprintExpanded && (
            <div className="status-card-list">
              {sprintCards.length > 0 ? (
                sprintCards.map((card) => (
                  <WorkItemCard
                    card={card}
                    draggable
                    onDragStart={(event) => onCardDragStart(event, card.id)}
                    onOpenCard={onOpenCard}
                    onStatusChange={onStatusChange}
                    statuses={statuses}
                    key={card.id}
                  />
                ))
              ) : (
                <p className="empty-state">No cards in sprint yet.</p>
              )}
            </div>
          )}
        </section>
      ) : (
        <p className="empty-state">No sprint yet.</p>
      )}
    </section>
  );
}

function EpicBlock({
  epicActions,
  epic,
  isEpicMenuOpen,
  onArchiveEpic,
  onEditEpic,
  onMoveEpic,
  onOpenCard,
  onStatusChange,
  onSelectEpic,
  onToggleEpicMenu,
  epicMenuRef,
  selected,
  statuses,
}) {
  return (
    <article className={`epic-block ${selected ? "is-selected" : ""}`}>
      <header className="epic-header">
        <div>
          <h3>{epic.name}</h3>
          {epic.deadline && <span>Deadline {epic.deadline}</span>}
        </div>
        <div className="epic-header-actions">
          <button className="small-action-button" type="button" onClick={() => onSelectEpic(epic.id)}>
            View sprint
          </button>
          <div className="sprint-menu-wrapper" ref={isEpicMenuOpen ? epicMenuRef : null}>
            <button
              className="icon-button sprint-menu-button"
              type="button"
              aria-label={`Open ${epic.name} menu`}
              aria-expanded={isEpicMenuOpen}
              onClick={() => onToggleEpicMenu(epic.id)}
            >
              ...
            </button>
            {isEpicMenuOpen && (
              <div className="sprint-menu epic-menu" role="menu">
                <button type="button" role="menuitem" onClick={() => onEditEpic(epic.id)}>
                  Edit epic
                </button>
                {epicActions.includes("Move epic up") && (
                  <button type="button" role="menuitem" onClick={() => onMoveEpic(epic.id, "up")}>
                    Move up
                  </button>
                )}
                {epicActions.includes("Move epic down") && (
                  <button type="button" role="menuitem" onClick={() => onMoveEpic(epic.id, "down")}>
                    Move down
                  </button>
                )}
                {epicActions.includes("Move epic to top") && (
                  <button type="button" role="menuitem" onClick={() => onMoveEpic(epic.id, "top")}>
                    Move to the top
                  </button>
                )}
                {epicActions.includes("Move epic to bottom") && (
                  <button type="button" role="menuitem" onClick={() => onMoveEpic(epic.id, "bottom")}>
                    Move to the bottom
                  </button>
                )}
                <button type="button" role="menuitem" onClick={() => onArchiveEpic(epic.id)}>
                  Archive epic
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="epic-card-list">
        {epic.cards.map((card) => (
          <WorkItemCard
            card={card}
            onOpenCard={onOpenCard}
            onStatusChange={onStatusChange}
            statuses={statuses}
            key={card.id}
          />
        ))}
      </div>
    </article>
  );
}

function ProjectBacklog({
  backlogCards,
  epics,
  epicMenuRef,
  getSprintStartDisabled,
  getSprintStatusCounts,
  getEpicMoveActions,
  getSprintMoveActions,
  isEpicMenuOpen,
  isSprintExpanded,
  isSprintMenuOpen,
  onArchiveEpic,
  onArchiveSprint,
  onEditEpic,
  onEditSprint,
  onMoveEpic,
  onMoveSprint,
  onCardDragStart,
  onDropCardToBacklog,
  onDropCardToSprint,
  onOpenCard,
  onOpenCreateEpic,
  onOpenCreateSprint,
  onOpenCreateCard,
  onStartSprint,
  onStatusChange,
  onSelectEpic,
  onToggleEpicMenu,
  onToggleSprint,
  onToggleSprintMenu,
  selectedEpicId,
  sprintMenuRef,
  statuses,
}) {
  const selectedEpic = epics.find((epic) => epic.id === selectedEpicId) ?? null;

  return (
    <div className="project-backlog-layout">
      <section className="backlog-panel" aria-labelledby="epics-title">
        <header className="backlog-panel-header">
          <h2 id="epics-title">Epic</h2>
          <button className="small-action-button" type="button" onClick={onOpenCreateEpic}>
            Create new epic
          </button>
        </header>
        <div className="epic-list">
          {epics.length > 0 ? (
            epics.map((epic) => (
              <EpicBlock
                epicActions={getEpicMoveActions(epic)}
                epic={epic}
                epicMenuRef={epicMenuRef}
                isEpicMenuOpen={isEpicMenuOpen(epic.id)}
                onArchiveEpic={onArchiveEpic}
                onEditEpic={onEditEpic}
                onMoveEpic={onMoveEpic}
                onOpenCard={onOpenCard}
                onSelectEpic={onSelectEpic}
                onToggleEpicMenu={onToggleEpicMenu}
                onStatusChange={onStatusChange}
                statuses={statuses}
                selected={selectedEpicId === epic.id}
                key={epic.id}
              />
            ))
          ) : (
            <p className="empty-state">No epics yet.</p>
          )}
        </div>
      </section>

      <div className="planning-column">
        <section className="backlog-panel" aria-labelledby="sprint-title">
          <header className="backlog-panel-header">
            <h2 id="sprint-title">Sprint</h2>
            <button
              className="small-action-button"
              type="button"
              disabled={!selectedEpic}
              onClick={() => selectedEpic && onOpenCreateSprint(selectedEpic.id)}
            >
              Create sprint
            </button>
          </header>
          {selectedEpic ? (
            <EpicSprint
              epic={selectedEpic}
              isSprintExpanded={isSprintExpanded(selectedEpic.id)}
              isSprintMenuOpen={isSprintMenuOpen(selectedEpic.id)}
              onArchiveSprint={onArchiveSprint}
              onEditSprint={onEditSprint}
              onCardDragStart={onCardDragStart}
              onDropCardToSprint={onDropCardToSprint}
              onMoveSprint={onMoveSprint}
              onOpenCard={onOpenCard}
              onStatusChange={onStatusChange}
              onStartSprint={onStartSprint}
              onToggleSprint={onToggleSprint}
              onToggleSprintMenu={onToggleSprintMenu}
              sprintMenuRef={sprintMenuRef}
              sprintMoveActions={getSprintMoveActions(selectedEpic)}
              sprintStartDisabled={getSprintStartDisabled(selectedEpic)}
              sprintStatusCounts={getSprintStatusCounts(selectedEpic)}
              statuses={statuses}
            />
          ) : (
            <p className="empty-state">Select an epic to view its sprint.</p>
          )}
        </section>

        <section className="backlog-panel" aria-labelledby="backlog-title">
          <header className="backlog-panel-header">
            <h2 id="backlog-title">Backlog</h2>
            <div className="panel-header-actions">
              <span className="panel-count">{backlogCards.length} cards</span>
              <button className="small-action-button" type="button" onClick={onOpenCreateCard}>
                Create card
              </button>
            </div>
          </header>

          <div
            className="status-card-list drop-zone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDropCardToBacklog}
          >
            {backlogCards.length > 0 ? (
              backlogCards.map((card) => (
                <WorkItemCard
                  card={card}
                  draggable
                  onDragStart={(event) => onCardDragStart(event, card.id)}
                  onOpenCard={onOpenCard}
                  onStatusChange={onStatusChange}
                  statuses={statuses}
                  key={card.id}
                />
              ))
            ) : (
              <p className="empty-state">No backlog cards yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ProjectBacklog;
