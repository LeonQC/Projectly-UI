import React, { useEffect, useRef, useState } from "react";

function ArchivedProjectTile({ onPermanentlyDeleteProject, onRestoreProject, project }) {
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
    <article className="board-tile archived-project-tile">
      <span>
        <strong>{project.name}</strong>
        {project.workspaceName && <small>{project.workspaceName}</small>}
      </span>
      <span className="project-tile-menu" ref={menuRef}>
        <button
          className="board-menu archived-project-menu-button"
          type="button"
          aria-label={`Open ${project.name} archived project menu`}
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
                onRestoreProject(project.id);
              }}
            >
              Restore project
            </button>
            <button
              className="danger"
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onPermanentlyDeleteProject(project.id);
              }}
            >
              Delete permanently
            </button>
          </span>
        )}
      </span>
    </article>
  );
}

function ArchivedWorkspaceTile({ onPermanentlyDeleteWorkspace, onRestoreWorkspace, workspace }) {
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
    <article className="board-tile archived-project-tile">
      <span>
        <strong>{workspace.name}</strong>
        <small>Archived workspace</small>
      </span>
      <span className="project-tile-menu" ref={menuRef}>
        <button
          className="board-menu archived-project-menu-button"
          type="button"
          aria-label={`Open ${workspace.name} archived workspace menu`}
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
                onRestoreWorkspace(workspace.id);
              }}
            >
              Restore workspace
            </button>
            <button
              className="danger"
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onPermanentlyDeleteWorkspace(workspace.id);
              }}
            >
              Delete permanently
            </button>
          </span>
        )}
      </span>
    </article>
  );
}

function ArchivedProjects({
  onPermanentlyDeleteProject,
  onPermanentlyDeleteWorkspace,
  onRestoreProject,
  onRestoreWorkspace,
  projects = [],
  workspaces = [],
}) {
  const hasArchivedItems = workspaces.length > 0 || projects.length > 0;

  return (
    <div className="workspace-board-grid">
      {hasArchivedItems ? (
        <>
          {workspaces.map((workspace) => (
            <ArchivedWorkspaceTile
              onPermanentlyDeleteWorkspace={onPermanentlyDeleteWorkspace}
              onRestoreWorkspace={onRestoreWorkspace}
              workspace={workspace}
              key={workspace.id}
            />
          ))}
          {projects.map((project) => (
            <ArchivedProjectTile
              onPermanentlyDeleteProject={onPermanentlyDeleteProject}
              onRestoreProject={onRestoreProject}
              project={project}
              key={project.id}
            />
          ))}
        </>
      ) : (
        <p className="empty-state">No archived workspace or projects yet.</p>
      )}
    </div>
  );
}

export default ArchivedProjects;
