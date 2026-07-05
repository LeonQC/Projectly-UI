import React from "react";
import { WorkItemCard } from "./ProjectBoard.jsx";

function EpicBlock({ epic }) {
  return (
    <article className="epic-block">
      <header className="epic-header">
        <h3>{epic.name}</h3>
        <span>{epic.cards.length} cards</span>
      </header>
      <div className="epic-card-list">
        {epic.cards.map((card) => (
          <WorkItemCard card={card} key={card.id} />
        ))}
      </div>
    </article>
  );
}

function ProjectBacklog({
  backlogCards,
  epics,
  isSprintExpanded,
  isSprintMenuOpen,
  onEditSprint,
  onStartSprint,
  onToggleSprint,
  onToggleSprintMenu,
  sprintDateRange,
  sprintMenuRef,
  sprintMoveActions,
  sprintName,
  sprintStatusCounts,
}) {
  return (
    <div className="project-backlog-layout">
      <section className="backlog-panel" aria-labelledby="epics-title">
        <header className="backlog-panel-header">
          <h2 id="epics-title">Epic</h2>
          <button className="small-action-button" type="button">
            Add epic
          </button>
        </header>
        <div className="epic-list">
          {epics.length > 0 ? (
            epics.map((epic) => <EpicBlock epic={epic} key={epic.id} />)
          ) : (
            <p className="empty-state">No epics yet.</p>
          )}
        </div>
      </section>

      <div className="planning-column">
        <section className="backlog-panel" aria-labelledby="sprint-title">
          <header className="backlog-panel-header">
            <h2 id="sprint-title">Sprint</h2>
            <button className="small-action-button" type="button">
              Create sprint
            </button>
          </header>

          <section className="status-group">
            <header className="sprint-header">
              <div className="sprint-title-group">
                <button
                  className="sprint-expand-button"
                  type="button"
                  aria-label={isSprintExpanded ? "Collapse sprint cards" : "Expand sprint cards"}
                  aria-expanded={isSprintExpanded}
                  onClick={onToggleSprint}
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
                  <h3>{sprintName}</h3>
                  <span>{sprintDateRange}</span>
                </div>
              </div>

              <div className="sprint-header-actions">
                <div className="sprint-status-counts" aria-label="Sprint card status counts">
                  <span title="Todo">{sprintStatusCounts.todo}</span>
                  <span title="In Progress">{sprintStatusCounts.inProgress}</span>
                  <span title="Done">{sprintStatusCounts.done}</span>
                </div>
                <button className="start-sprint-button" type="button" onClick={onStartSprint}>
                  Start sprint
                </button>
                <div className="sprint-menu-wrapper" ref={sprintMenuRef}>
                  <button
                    className="icon-button sprint-menu-button"
                    type="button"
                    aria-label="Open sprint menu"
                    aria-expanded={isSprintMenuOpen}
                    onClick={onToggleSprintMenu}
                  >
                    ...
                  </button>

                  {isSprintMenuOpen && (
                    <div className="sprint-menu" role="menu">
                      <button type="button" role="menuitem" onClick={onEditSprint}>
                        Edit sprint
                      </button>
                      {sprintMoveActions.map((action) => (
                        <button type="button" role="menuitem" key={action}>
                          {action}
                        </button>
                      ))}
                      <button type="button" role="menuitem">
                        Delete sprint
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {isSprintExpanded && <p className="empty-state">No cards in sprint yet.</p>}
          </section>
        </section>

        <section className="backlog-panel" aria-labelledby="backlog-title">
          <header className="backlog-panel-header">
            <h2 id="backlog-title">Backlog</h2>
            <div className="panel-header-actions">
              <span className="panel-count">{backlogCards.length} cards</span>
              <button className="small-action-button" type="button">
                Create card
              </button>
            </div>
          </header>

          <section className="status-group">
            <header className="status-group-header">
              <h3>Backlog</h3>
              <span>{backlogCards.length} cards</span>
            </header>
            <div className="status-card-list">
              {backlogCards.length > 0 ? (
                backlogCards.map((card) => <WorkItemCard card={card} key={card.id} />)
              ) : (
                <p className="empty-state">No backlog cards yet.</p>
              )}
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}

export default ProjectBacklog;
