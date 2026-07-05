import React, { useEffect, useRef, useState } from "react";

function WorkspaceNavGroup({ activePage, onOpenWorkspaceProjects, title, workspaces, children }) {
  const [isExpanded, setIsExpanded] = useState(true);

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
              className={`workspace-item ${
                activePage.name === "workspace-projects" && activePage.workspaceId === workspace.id
                  ? "is-active"
                  : ""
              }`}
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

function Sidebar({ activePage, onOpenAllProjects, onOpenWorkspaceProjects, user, workspaces }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

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

        {isUserMenuOpen && (
          <div className="user-menu" role="menu">
            <button type="button" role="menuitem">
              Settings
            </button>
            <button type="button" role="menuitem">
              Log out
            </button>
          </div>
        )}
      </div>

      <nav className="sidebar-primary-nav" aria-label="Main navigation">
        <button className="sidebar-primary-item" type="button">
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
        <button className="create-workspace-button" type="button">
          + Create new workspace
        </button>
      </WorkspaceNavGroup>
    </aside>
  );
}

export default Sidebar;
