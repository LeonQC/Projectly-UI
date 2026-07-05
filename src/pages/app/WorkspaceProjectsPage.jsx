import React, { useState } from "react";

function WorkspaceTab({ isActive = false, label, onClick }) {
  return (
    <button className={`workspace-tab ${isActive ? "is-active" : ""}`} type="button" onClick={onClick}>
      {label}
    </button>
  );
}

function ProjectTile({ onArchiveProject, onOpenProject, project }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <button className="board-tile" type="button" onClick={() => onOpenProject(project.id)}>
      <span>{project.name}</span>
      <span className="project-tile-menu">
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
    </button>
  );
}

function CreateProjectButton() {
  return (
    <button className="create-action-button" type="button">
      Create new project
    </button>
  );
}

function CreateProjectTile() {
  return (
    <button className="create-board-tile" type="button">
      Create new project
    </button>
  );
}

function MemberAvatar({ initials }) {
  return <span className="member-avatar">{initials}</span>;
}

function RoleBadge({ role }) {
  return <span className={`member-role-badge ${role.toLowerCase()}`}>{role}</span>;
}

function WorkspaceMemberRow({ member }) {
  const isOwner = member.role === "Owner";

  return (
    <article className="member-row">
      <div className="member-profile">
        <MemberAvatar initials={member.initials} />
        <div>
          <div className="member-name-line">
            <strong>{member.name}</strong>
            <span>{member.username}</span>
          </div>
          <RoleBadge role={member.role} />
        </div>
      </div>
      <span className="member-type">{member.membership}</span>
      <button className={`member-row-action ${isOwner ? "" : "danger"}`} type="button">
        {isOwner ? "Leave" : "Remove"}
      </button>
    </article>
  );
}

function SingleBoardGuestRow({ guest }) {
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);

  return (
    <article className="member-row guest-row">
      <div className="member-profile">
        <MemberAvatar initials={guest.initials} />
        <div className="member-name-line">
          <strong>{guest.name}</strong>
          <span>{guest.username}</span>
        </div>
      </div>
      <span className="member-type">Last active {guest.lastActive}</span>
      <div className="guest-actions">
        <div className="guest-project-menu">
          <button
            className="member-row-action"
            type="button"
            aria-expanded={isProjectMenuOpen}
            onClick={() => setIsProjectMenuOpen((isOpen) => !isOpen)}
          >
            Projects ({guest.projects.length})
            <svg
              aria-hidden="true"
              className={`chevron-icon ${isProjectMenuOpen ? "is-expanded" : ""}`}
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
          {isProjectMenuOpen && (
            <div className="guest-project-dropdown">
              {guest.projects.map((project) => (
                <button type="button" key={project}>
                  {project}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="add-to-workspace-button" type="button">
          Add to Workspace
        </button>
        <button className="member-row-action danger" type="button">
          Remove
        </button>
      </div>
    </article>
  );
}

function WorkspaceMembersPage({ workspace }) {
  const [activeMemberTab, setActiveMemberTab] = useState("workspace-members");
  const members = workspace.members ?? [];
  const guests = workspace.singleBoardGuests ?? [];

  return (
    <div className="workspace-members-page">
      <nav className="member-tabs" aria-label="Workspace member sections">
        <button
          className={`member-tab ${activeMemberTab === "workspace-members" ? "is-active" : ""}`}
          type="button"
          onClick={() => setActiveMemberTab("workspace-members")}
        >
          Workspace members
        </button>
        <button
          className={`member-tab ${activeMemberTab === "single-project-guests" ? "is-active" : ""}`}
          type="button"
          onClick={() => setActiveMemberTab("single-project-guests")}
        >
          Single-project guests
        </button>
      </nav>

      {activeMemberTab === "workspace-members" ? (
        <section className="member-section" aria-label="Workspace members">
          <p className="member-description">
            Workspace members can access this workspace and manage projects according to their role.
          </p>
          <div className="member-toolbar">
            <input type="search" placeholder="Filter by name" aria-label="Filter workspace members by name" />
            <button className="invite-members-button" type="button">
              Invite workspace members
            </button>
          </div>
          <div className="member-list">
            {members.map((member) => (
              <WorkspaceMemberRow member={member} key={member.id} />
            ))}
          </div>
        </section>
      ) : (
        <section className="member-section" aria-label="Single-project guests">
          <p className="member-description">
            Single-project guests are members of only one Workspace project. Guests can only view and edit
            the projects to which they've been added.
          </p>
          <div className="member-toolbar">
            <input type="search" placeholder="Filter by name" aria-label="Filter single-project guests by name" />
          </div>
          <div className="member-list">
            {guests.map((guest) => (
              <SingleBoardGuestRow guest={guest} key={guest.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function WorkspaceSettingsPage({ workspace }) {
  const [workspaceName, setWorkspaceName] = useState(workspace.name);

  return (
    <div className="workspace-settings-page">
      <section className="settings-panel">
        <h2>Rename workspace</h2>
        <p>Update the workspace name shown in the sidebar and workspace pages.</p>
        <label className="settings-field">
          <span>Workspace name</span>
          <input
            type="text"
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
          />
        </label>
        <div className="settings-actions">
          <button className="settings-save-button" type="button">
            Save changes
          </button>
        </div>
      </section>

      <section className="settings-panel">
        <h2>Delete workspace</h2>
        <p>Delete this workspace and its projects. This is a destructive action.</p>
        <button className="settings-delete-button" type="button">
          Delete workspace
        </button>
      </section>
    </div>
  );
}

function WorkspaceProjectsPage({
  archivedProjectIds = [],
  initialTab = "projects",
  onArchiveProject,
  onOpenProject,
  workspace,
}) {
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState(initialTab ?? "projects");
  const activeProjects = workspace.projects.filter((project) => !archivedProjectIds.includes(project.id));
  const archivedProjects = workspace.projects.filter((project) => archivedProjectIds.includes(project.id));

  return (
    <section className="app-content" aria-labelledby="workspace-projects-title">
      <header className="page-header">
        <div className="workspace-page-title">
          <span className="workspace-board-avatar">{workspace.name.charAt(0)}</span>
          <h1 id="workspace-projects-title">{workspace.name}</h1>
        </div>
        {activeWorkspaceTab === "projects" && <CreateProjectButton />}
      </header>

      <nav className="workspace-tabs" aria-label={`${workspace.name} sections`}>
        <WorkspaceTab
          isActive={activeWorkspaceTab === "projects"}
          label="Projects"
          onClick={() => setActiveWorkspaceTab("projects")}
        />
        <WorkspaceTab
          isActive={activeWorkspaceTab === "members"}
          label="Members"
          onClick={() => setActiveWorkspaceTab("members")}
        />
        <WorkspaceTab
          isActive={activeWorkspaceTab === "archived-projects"}
          label="Archived Projects"
          onClick={() => setActiveWorkspaceTab("archived-projects")}
        />
        <WorkspaceTab
          isActive={activeWorkspaceTab === "settings"}
          label="Settings"
          onClick={() => setActiveWorkspaceTab("settings")}
        />
      </nav>

      {activeWorkspaceTab === "members" ? (
        <WorkspaceMembersPage workspace={workspace} />
      ) : activeWorkspaceTab === "projects" ? (
        <div className="workspace-board-grid">
          {activeProjects.map((project) => (
            <ProjectTile
              onArchiveProject={onArchiveProject}
              onOpenProject={onOpenProject}
              project={project}
              key={project.id}
            />
          ))}
          <CreateProjectTile />
        </div>
      ) : activeWorkspaceTab === "settings" ? (
        <WorkspaceSettingsPage workspace={workspace} />
      ) : (
        <div className="workspace-board-grid">
          {archivedProjects.length > 0 ? (
            archivedProjects.map((project) => (
              <button className="board-tile archived-project-tile" type="button" key={project.id}>
                <span>{project.name}</span>
              </button>
            ))
          ) : (
            <p className="empty-state">No archived projects yet.</p>
          )}
        </div>
      )}
    </section>
  );
}

export default WorkspaceProjectsPage;
