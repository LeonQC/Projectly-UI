import React from "react";

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

function WorkspaceActionButton({ label, children, onClick }) {
  return (
    <button className="workspace-action-button" type="button" onClick={onClick}>
      {children}
      <span>{label}</span>
    </button>
  );
}

function BoardsIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <rect height="14" rx="2" stroke="currentColor" strokeWidth="2" width="18" x="3" y="5" />
      <path d="M9 5v14M15 5v14" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function MembersIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .55V20a2 2 0 1 1-4 0v-.08a1.7 1.7 0 0 0-1-.55 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.55-1H4a2 2 0 1 1 0-4h.08a1.7 1.7 0 0 0 .55-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.55V4a2 2 0 1 1 4 0v.08a1.7 1.7 0 0 0 1 .55 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.33.38.66.55 1H20a2 2 0 1 1 0 4h-.08c-.15.34-.33.67-.52 1Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function CreateBoardTile() {
  return (
    <button className="create-board-tile" type="button">
      Create new board
    </button>
  );
}

function WorkspaceBoards({
  workspace,
  canCreateBoard = false,
  onOpenWorkspaceBoards,
  showActions = true,
}) {
  return (
    <section className="boards-group">
      <header className="workspace-board-header">
        <div className="workspace-board-title">
          <span className="workspace-board-avatar">{workspace.name.charAt(0)}</span>
          <h3>{workspace.name}</h3>
        </div>
        {showActions && (
          <div className="workspace-actions" aria-label={`${workspace.name} workspace actions`}>
            <WorkspaceActionButton
              label="Boards"
              onClick={() => onOpenWorkspaceBoards(workspace.id)}
            >
              <BoardsIcon />
            </WorkspaceActionButton>
            <WorkspaceActionButton label="Members">
              <MembersIcon />
            </WorkspaceActionButton>
            <WorkspaceActionButton label="Settings">
              <SettingsIcon />
            </WorkspaceActionButton>
          </div>
        )}
      </header>
      <div className="board-grid">
        {workspace.boards.map((board) => (
          <BoardTile board={board} key={board.id} />
        ))}
        {canCreateBoard && <CreateBoardTile />}
      </div>
    </section>
  );
}

function AllBoardsPage({ workspaces, guestWorkspaces, onOpenWorkspaceBoards }) {
  return (
    <section className="app-content" aria-labelledby="all-boards-title">
      <header className="page-header">
        <div>
          <h1 id="all-boards-title">All Boards</h1>
        </div>
      </header>

      <div className="boards-page">
        <section className="boards-section" aria-label="Your workspaces">
          <h2 className="boards-section-title">YOUR WORKSPACES</h2>
          {workspaces.map((workspace) => (
            <WorkspaceBoards
              canCreateBoard
              onOpenWorkspaceBoards={onOpenWorkspaceBoards}
              workspace={workspace}
              key={workspace.id}
            />
          ))}
        </section>

        <section className="boards-section" aria-label="Guest workspaces">
          <h2 className="boards-section-title">GUEST WORKSPACES</h2>
          {guestWorkspaces.map((workspace) => (
            <WorkspaceBoards showActions={false} workspace={workspace} key={workspace.id} />
          ))}
        </section>
      </div>
    </section>
  );
}

export default AllBoardsPage;
