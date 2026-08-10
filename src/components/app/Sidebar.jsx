import React, { useEffect, useRef, useState } from "react";
import CreateWorkspaceModal from "../workspace/CreateWorkspaceModal.jsx";

function WorkspaceNavGroup({ activePage, onOpenWorkspaceProjects, title, workspaces, children }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const activeWorkspaceId = activePage.workspaceId;

  useEffect(() => {
    if (workspaces.some((workspace) => workspace.id === activeWorkspaceId)) {
      setIsExpanded(true);
    }
  }, [activeWorkspaceId, workspaces]);

  return (
    <section className="sidebar-section" aria-label={title}>
      <div className="sidebar-section-header">
        <h2 className="sidebar-section-title">{title}</h2>
        <button
          className="section-toggle-button"
          type="button"
          aria-label={`${isExpanded ? "Collapse" : "Expand"} ${title}`}
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          <svg
            aria-hidden="true"
            className={`chevron-icon ${isExpanded ? "is-expanded" : ""}`}
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
      </div>
      {isExpanded && (
        <div className="workspace-list">
          {workspaces.map((workspace) => (
            <button
              className={`workspace-item ${activeWorkspaceId === workspace.id ? "is-active" : ""}`}
              type="button"
              key={workspace.id}
              onClick={() => onOpenWorkspaceProjects(workspace.id)}
            >
              <span className="workspace-icon">{workspace.name.charAt(0)}</span>
              <span>{workspace.name}</span>
            </button>
          ))}
          {children}
        </div>
      )}
    </section>
  );
}

function Sidebar({
  activePage,
  guestWorkspaces = [],
  onOpenArchivedProjects,
  onOpenAllProjects,
  onOpenInbox,
  onOpenProject,
  onOpenUserSettings,
  onOpenWorkspaceProjects,
  onCreateWorkspace,
  user,
  workspaces,
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const workspaceResults = workspaces.filter((workspace) =>
    workspace.name.toLowerCase().includes(normalizedSearchQuery)
  );
  const projectResults = [...workspaces, ...guestWorkspaces].flatMap((workspace) =>
    (workspace.projects ?? [])
      .filter((project) =>
        `${project.name} ${workspace.name}`.toLowerCase().includes(normalizedSearchQuery)
      )
      .map((project) => ({
        ...project,
        workspaceName: workspace.name,
      }))
  );

  useEffect(() => {
    function closeMenuOnOutsideClick(event) {
      if (!userMenuRef.current || userMenuRef.current.contains(event.target)) {
        return;
      }

      setIsUserMenuOpen(false);
    }

    document.addEventListener("mousedown", closeMenuOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeMenuOnOutsideClick);
    };
  }, []);

  useEffect(() => {
    function closeSearchOnOutsideClick(event) {
      if (!searchRef.current || searchRef.current.contains(event.target)) {
        return;
      }

      setIsSearchOpen(false);
    }

    document.addEventListener("mousedown", closeSearchOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeSearchOnOutsideClick);
    };
  }, []);

  function closeSearch() {
    setIsSearchOpen(false);
    setSearchQuery("");
  }

  return (
    <aside className="app-sidebar">
      <div className="sidebar-user" ref={userMenuRef}>
        <span className="user-avatar">{user.initials}</span>
        <span className="user-name">{user.name}</span>
        <button
          className="icon-button"
          type="button"
          aria-label="Open user menu"
          aria-expanded={isUserMenuOpen}
          onClick={() => setIsUserMenuOpen((isOpen) => !isOpen)}
        >
          ...
        </button>
        <button
          className="icon-button sidebar-search-action"
          type="button"
          aria-label="Search workspaces and projects"
          aria-expanded={isSearchOpen}
          onClick={() => setIsSearchOpen((isOpen) => !isOpen)}
        >
          <svg
            aria-hidden="true"
            className="icon-svg"
            fill="none"
            height="16"
            viewBox="0 0 24 24"
            width="16"
          >
            <path
              d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>

        {isSearchOpen && (
          <div className="sidebar-search-panel" ref={searchRef}>
            <label className="sidebar-search-field">
              <span>Search</span>
              <input
                type="search"
                placeholder="Search workspaces or projects"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                autoFocus
              />
            </label>

            <div className="sidebar-search-results">
              <section>
                <h3>Workspaces</h3>
                {workspaceResults.length > 0 ? (
                  workspaceResults.map((workspace) => (
                    <button
                      type="button"
                      key={workspace.id}
                      onClick={() => {
                        onOpenWorkspaceProjects(workspace.id);
                        closeSearch();
                      }}
                    >
                      <span className="search-result-type">Workspace</span>
                      <strong>{workspace.name}</strong>
                    </button>
                  ))
                ) : (
                  <p>No matching workspaces.</p>
                )}
              </section>

              <section>
                <h3>Projects</h3>
                {projectResults.length > 0 ? (
                  projectResults.map((project) => (
                    <button
                      type="button"
                      key={project.id}
                      onClick={() => {
                        onOpenProject(project.id);
                        closeSearch();
                      }}
                    >
                      <span className="search-result-type">{project.workspaceName}</span>
                      <strong>{project.name}</strong>
                    </button>
                  ))
                ) : (
                  <p>No matching projects.</p>
                )}
              </section>
            </div>
          </div>
        )}

        {isUserMenuOpen && (
          <div className="user-menu" role="menu">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onOpenUserSettings();
                setIsUserMenuOpen(false);
              }}
            >
              Settings
            </button>
            <button type="button" role="menuitem">
              Log out
            </button>
          </div>
        )}
      </div>

      <nav className="sidebar-primary-nav" aria-label="Main navigation">
        <button
          className={`sidebar-primary-item ${activePage.name === "inbox" ? "is-active" : ""}`}
          type="button"
          onClick={onOpenInbox}
        >
          Inbox
        </button>

        <button
          className={`sidebar-primary-item ${activePage.name === "all-projects" ? "is-active" : ""}`}
          type="button"
          onClick={onOpenAllProjects}
        >
          All Projects
        </button>
      </nav>

      <WorkspaceNavGroup
        activePage={activePage}
        onOpenWorkspaceProjects={onOpenWorkspaceProjects}
        title="YOUR WORKSPACES"
        workspaces={workspaces}
      >
        <button
          className={`workspace-item archived-workspace-item ${activePage.name === "archived-workspace" ? "is-active" : ""}`}
          type="button"
          onClick={onOpenArchivedProjects}
        >
          <span className="workspace-icon">D</span>
          <span>Archived Workspace</span>
        </button>
        <button className="create-workspace-button" type="button" onClick={() => setIsCreatingWorkspace(true)}>
          + Create new workspace
        </button>
      </WorkspaceNavGroup>

      {isCreatingWorkspace && (
        <CreateWorkspaceModal
          onClose={() => setIsCreatingWorkspace(false)}
          onCreate={onCreateWorkspace}
        />
      )}
    </aside>
  );
}

export default Sidebar;
