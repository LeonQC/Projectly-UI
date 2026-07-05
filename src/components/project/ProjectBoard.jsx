import React from "react";

export function WorkItemCard({ card }) {
  return (
    <article className="work-item-card">
      <label className="work-item-check">
        <input type="checkbox" defaultChecked={card.completed} />
        <span>{card.title}</span>
      </label>
      <span className="status-pill">{card.status}</span>
    </article>
  );
}

function BoardColumn({ cards, title }) {
  return (
    <section className="board-column">
      <header className="board-column-header">
        <h3>{title}</h3>
        <span>{cards.length}</span>
      </header>
      <div className="board-column-cards">
        {cards.length > 0 ? (
          cards.map((card) => <WorkItemCard card={card} key={card.id} />)
        ) : (
          <p className="empty-state">No cards yet.</p>
        )}
      </div>
    </section>
  );
}

function ProjectBoard({ boardColumns }) {
  return (
    <div className="board-view-panel">
      <div className="board-column-grid">
        {boardColumns.map((column) => (
          <BoardColumn cards={column.cards} title={column.title} key={column.title} />
        ))}
      </div>
    </div>
  );
}

export default ProjectBoard;
