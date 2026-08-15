import React, { useEffect, useRef, useState } from "react";

function ProjectTile({ canManageWorkspace = true, onArchiveProject, onOpenProject, project }) {
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
    <button className="board-tile" type="button" onClick={() => onOpenProject(project.id)}>
      <span>{project.name}</span>
      {canManageWorkspace && (
        <span className="project-tile-menu" ref={menuRef}>
          <span
            className="board-menu"
            role="button"
            tabIndex={0}
            aria-label={`Open ${project.name} menu`}
            aria-expanded={isMenuOpen}
            onClick={(event) => {
              event.stopPropagation();
              setIsMenuOpen((isOpen) => !isOpen);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                setIsMenuOpen((isOpen) => !isOpen);
              }
            }}
          >
            ...
          </span>
          {isMenuOpen && (
            <span className="project-dropdown-menu">
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  setIsMenuOpen(false);
                  onArchiveProject(project.id);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    setIsMenuOpen(false);
                    onArchiveProject(project.id);
                  }
                }}
              >
                Archive project
              </span>
            </span>
          )}
        </span>
      )}
    </button>
  );
}

export function CreateProjectButton({ onClick }) {
  return (
    <button className="create-action-button" type="button" onClick={onClick}>
      Create new project
    </button>
  );
}

function CreateProjectTile({ onClick }) {
  return (
    <button className="create-board-tile" type="button" onClick={onClick}>
      Create new project
    </button>
  );
}

function WorkspaceProjects({ canManageWorkspace = true, onArchiveProject, onCreateProject, onOpenProject, projects }) {
  return (
    <div className="workspace-board-grid">
      {projects.map((project) => (
        <ProjectTile
          canManageWorkspace={canManageWorkspace}
          onArchiveProject={onArchiveProject}
          onOpenProject={onOpenProject}
          project={project}
          key={project.id}
        />
      ))}
      {canManageWorkspace && <CreateProjectTile onClick={onCreateProject} />}
    </div>
  );
}

export default WorkspaceProjects;
