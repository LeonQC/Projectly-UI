import React from "react";

function WorkspaceTab({ isActive = false, label }) {
  return (
    <button className={`workspace-tab ${isActive ? "is-active" : ""}`} type="button">
      {label}
    </button>
  );
}

function BoardTile({ board }) {
  return (
    <button className="board-tile" type="button">
      <span>{board.name}</span>
      <span className="board-menu" aria-hidden="true">
        ...
      </span>
    </button>
  );
}

function CreateBoardButton() {
  return (
    <button className="create-action-button" type="button">
      Create new board
    </button>
  );
}

function CreateBoardTile() {
  return (
    <button className="create-board-tile" type="button">
      Create new board
    </button>
  );
}

function WorkspaceBoardsPage({ workspace }) {
  return (
    <section className="app-content" aria-labelledby="workspace-boards-title">
      <header className="page-header">
        <div className="workspace-page-title">
          <span className="workspace-board-avatar">{workspace.name.charAt(0)}</span>
          <h1 id="workspace-boards-title">{workspace.name}</h1>
        </div>
        <CreateBoardButton />
      </header>

      <nav className="workspace-tabs" aria-label={`${workspace.name} sections`}>
        <WorkspaceTab isActive label="Boards" />
        <WorkspaceTab label="Members" />
        <WorkspaceTab label="Archived Boards" />
        <WorkspaceTab label="Settings" />
      </nav>

      <div className="workspace-board-grid">
        {workspace.boards.map((board) => (
          <BoardTile board={board} key={board.id} />
        ))}
        <CreateBoardTile />
      </div>
    </section>
  );
}

export default WorkspaceBoardsPage;
