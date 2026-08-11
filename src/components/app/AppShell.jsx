import React, { useState } from "react";
import { guestWorkspaces, inboxItems, user, workspaces as initialWorkspaces } from "../../data/mockWorkspaceData.js";
import AllProjectsPage from "../../pages/app/AllProjectsPage.jsx";
import InboxPage from "../../pages/app/InboxPage.jsx";
import ProjectBacklogPage from "../../pages/app/ProjectBacklogPage.jsx";
import UserSettingsPage from "../../pages/app/UserSettingsPage.jsx";
import ArchivedProjects from "../workspace/ArchivedProjects.jsx";
import WorkspaceProjectsPage from "../../pages/app/WorkspaceProjectsPage.jsx";
import Sidebar from "./Sidebar.jsx";

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function AppShell({ currentUser, onLogout }) {
  const sidebarUser = currentUser
    ? {
        ...user,
        id: currentUser.id,
        name: currentUser.username,
        email: currentUser.email,
        avatarUrl: currentUser.avatar_url,
        initials: getInitials(currentUser.username || currentUser.email),
      }
    : user;
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [activePage, setActivePage] = useState({ name: "all-projects" });
  const [archivedProjectIds, setArchivedProjectIds] = useState([]);
  const [workspaces, setWorkspaces] = useState(initialWorkspaces);
  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activePage.workspaceId) ?? workspaces[0];
  const allProjects = workspaces.flatMap((workspace) => workspace.projects);
  const activeProject =
    allProjects.find((project) => project.id === activePage.projectId) ?? allProjects[0];
  const activeProjectWorkspace =
    workspaces.find((workspace) =>
      workspace.projects.some((project) => project.id === activeProject.id)
    ) ?? workspaces[0];
  const archivedProjects = workspaces.flatMap((workspace) =>
    workspace.projects
      .filter((project) => archivedProjectIds.includes(project.id))
      .map((project) => ({
        ...project,
        workspaceName: workspace.name,
      }))
  );

  function archiveProject(projectId) {
    setArchivedProjectIds((projectIds) =>
      projectIds.includes(projectId) ? projectIds : [...projectIds, projectId]
    );

    const projectWorkspace = workspaces.find((workspace) =>
      workspace.projects.some((project) => project.id === projectId)
    );

    if (projectWorkspace) {
      setActivePage({
        name: "workspace-projects",
        workspaceId: projectWorkspace.id,
        workspaceTab: "archived-projects",
      });
    }
  }

  function restoreProject(projectId) {
    setArchivedProjectIds((projectIds) => projectIds.filter((archivedProjectId) => archivedProjectId !== projectId));
  }

  function permanentlyDeleteProject(projectId) {
    setArchivedProjectIds((projectIds) => projectIds.filter((archivedProjectId) => archivedProjectId !== projectId));
    setWorkspaces((currentWorkspaces) =>
      currentWorkspaces.map((workspace) => ({
        ...workspace,
        projects: workspace.projects.filter((project) => project.id !== projectId),
      }))
    );

    if (activePage.projectId === projectId) {
      setActivePage({ name: "archived-workspace" });
    }
  }

  function openAllProjects() {
    setActivePage({ name: "all-projects" });
  }

  function openArchivedProjects() {
    setActivePage({ name: "archived-workspace" });
  }

  function openInbox() {
    setActivePage({ name: "inbox" });
  }

  function openUserSettings() {
    setActivePage({ name: "user-settings" });
  }

  function openWorkspaceProjects(workspaceId, workspaceTab = "projects", options = {}) {
    setActivePage({
      name: "workspace-projects",
      workspaceId,
      workspaceTab,
      openCreateProject: options.openCreateProject ?? false,
      createProjectRequestId: options.openCreateProject ? Date.now() : null,
    });
  }

  function openProject(projectId) {
    const projectWorkspace = workspaces.find((workspace) =>
      workspace.projects.some((project) => project.id === projectId)
    );

    setActivePage({
      name: "project-backlog",
      projectId,
      workspaceId: projectWorkspace?.id,
    });
  }

  function createProject(workspaceId, projectInput) {
    const projectId = `project-${Date.now()}`;

    setWorkspaces((currentWorkspaces) =>
      currentWorkspaces.map((workspace) =>
        workspace.id === workspaceId
          ? {
              ...workspace,
              projects: [
                ...workspace.projects,
                {
                  id: projectId,
                  name: projectInput.title,
                  description: projectInput.description,
                },
              ],
            }
          : workspace
      )
    );
  }

  function updateProject(projectId, projectInput) {
    setWorkspaces((currentWorkspaces) =>
      currentWorkspaces.map((workspace) => ({
        ...workspace,
        projects: workspace.projects.map((project) =>
          project.id === projectId
            ? {
                ...project,
                ...projectInput,
              }
            : project
        ),
      }))
    );
  }

  function createWorkspace(workspaceInput) {
    const workspaceId = `workspace-${Date.now()}`;

    setWorkspaces((currentWorkspaces) => [
      ...currentWorkspaces,
      {
        id: workspaceId,
        name: workspaceInput.name,
        members: [user],
        singleBoardGuests: [],
        projects: [],
      },
    ]);

    setActivePage({
      name: "workspace-projects",
      workspaceId,
      workspaceTab: "projects",
    });
  }

  return (
    <main className={`app-layout ${isSidebarVisible ? "" : "is-sidebar-hidden"}`}>
      {isSidebarVisible && (
        <Sidebar
          activePage={activePage}
          onOpenArchivedProjects={openArchivedProjects}
          onOpenAllProjects={openAllProjects}
          onOpenInbox={openInbox}
          onOpenProject={openProject}
          onOpenUserSettings={openUserSettings}
          onOpenWorkspaceProjects={openWorkspaceProjects}
          onCreateWorkspace={createWorkspace}
          onLogout={onLogout}
          user={sidebarUser}
          guestWorkspaces={guestWorkspaces}
          workspaces={workspaces}
        />
      )}
      <button
        className="sidebar-toggle-button"
        type="button"
        aria-label={isSidebarVisible ? "Hide sidebar" : "Show sidebar"}
        aria-pressed={!isSidebarVisible}
        onClick={() => setIsSidebarVisible((isVisible) => !isVisible)}
      >
        <svg
          aria-hidden="true"
          className="icon-svg"
          fill="none"
          height="18"
          viewBox="0 0 24 24"
          width="18"
        >
          <rect
            height="16"
            rx="3"
            stroke="currentColor"
            strokeWidth="2"
            width="18"
            x="3"
            y="4"
          />
          <path d="M9 5v14" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </svg>
      </button>
      {activePage.name === "inbox" ? (
        <InboxPage inboxItems={inboxItems} />
      ) : activePage.name === "user-settings" ? (
        <UserSettingsPage user={sidebarUser} />
      ) : activePage.name === "archived-workspace" ? (
        <section className="app-content" aria-labelledby="archived-workspace-title">
          <header className="page-header">
            <div>
              <h1 id="archived-workspace-title">Archived Workspace</h1>
            </div>
          </header>
          <ArchivedProjects
            onPermanentlyDeleteProject={permanentlyDeleteProject}
            onRestoreProject={restoreProject}
            projects={archivedProjects}
          />
        </section>
      ) : activePage.name === "project-backlog" ? (
        <ProjectBacklogPage
          onArchiveProject={archiveProject}
          onUpdateProject={updateProject}
          project={activeProject}
          workspace={activeProjectWorkspace}
        />
      ) : activePage.name === "workspace-projects" ? (
        <WorkspaceProjectsPage
          archivedProjectIds={archivedProjectIds}
          createProjectRequestId={activePage.createProjectRequestId}
          initialTab={activePage.workspaceTab}
          onCreateProject={createProject}
          shouldOpenCreateProject={activePage.openCreateProject}
          onArchiveProject={archiveProject}
          onOpenProject={openProject}
          onPermanentlyDeleteProject={permanentlyDeleteProject}
          onRestoreProject={restoreProject}
          workspace={activeWorkspace}
        />
      ) : (
        <AllProjectsPage
          guestWorkspaces={guestWorkspaces}
          archivedProjectIds={archivedProjectIds}
          onOpenProject={openProject}
          onOpenWorkspaceProjects={openWorkspaceProjects}
          workspaces={workspaces}
        />
      )}
    </main>
  );
}

export default AppShell;
