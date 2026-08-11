import React, { useEffect, useState } from "react";
import {
  archiveWorkspace as archiveWorkspaceRequest,
  createWorkspace as createWorkspaceRequest,
  listArchivedWorkspaces,
  listWorkspaces,
  permanentlyDeleteWorkspace as permanentlyDeleteWorkspaceRequest,
  restoreWorkspace as restoreWorkspaceRequest,
  updateWorkspace as updateWorkspaceRequest,
} from "../../lib/api.js";
import { guestWorkspaces, inboxItems, user } from "../../data/mockWorkspaceData.js";
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

function mapWorkspace(workspace) {
  return {
    ...workspace,
    id: workspace.id,
    name: workspace.name,
    members: workspace.members ?? [],
    singleBoardGuests: workspace.singleBoardGuests ?? [],
    projects: workspace.projects ?? [],
  };
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
  const [workspaces, setWorkspaces] = useState([]);
  const [archivedWorkspaces, setArchivedWorkspaces] = useState([]);
  const [workspaceError, setWorkspaceError] = useState("");
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activePage.workspaceId) ?? workspaces[0] ?? null;
  const allProjects = workspaces.flatMap((workspace) => workspace.projects);
  const activeProject =
    allProjects.find((project) => project.id === activePage.projectId) ?? allProjects[0] ?? null;
  const activeProjectWorkspace =
    workspaces.find((workspace) =>
      workspace.projects.some((project) => project.id === activeProject?.id)
    ) ?? workspaces[0] ?? null;
  const archivedProjects = workspaces.flatMap((workspace) =>
    workspace.projects
      .filter((project) => archivedProjectIds.includes(project.id))
      .map((project) => ({
        ...project,
        workspaceName: workspace.name,
      }))
  );

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspaceData() {
      setIsLoadingWorkspaces(true);
      setWorkspaceError("");
      try {
        const [activeWorkspaceData, archivedWorkspaceData] = await Promise.all([
          listWorkspaces(),
          listArchivedWorkspaces(),
        ]);

        if (!isMounted) {
          return;
        }

        setWorkspaces(activeWorkspaceData.map(mapWorkspace));
        setArchivedWorkspaces(archivedWorkspaceData.map(mapWorkspace));
      } catch (error) {
        if (isMounted) {
          setWorkspaceError(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoadingWorkspaces(false);
        }
      }
    }

    loadWorkspaceData();

    return () => {
      isMounted = false;
    };
  }, []);

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

  async function createWorkspace(workspaceInput) {
    setWorkspaceError("");
    try {
      const workspace = mapWorkspace(await createWorkspaceRequest(workspaceInput));
      setWorkspaces((currentWorkspaces) => [...currentWorkspaces, workspace]);

      setActivePage({
        name: "workspace-projects",
        workspaceId: workspace.id,
        workspaceTab: "projects",
      });
    } catch (error) {
      setWorkspaceError(error.message);
    }
  }

  async function renameWorkspace(workspaceId, workspaceInput) {
    setWorkspaceError("");
    try {
      const workspace = mapWorkspace(await updateWorkspaceRequest(workspaceId, workspaceInput));
      setWorkspaces((currentWorkspaces) =>
        currentWorkspaces.map((currentWorkspace) =>
          currentWorkspace.id === workspace.id
            ? { ...currentWorkspace, ...workspace, projects: currentWorkspace.projects }
            : currentWorkspace
        )
      );
    } catch (error) {
      setWorkspaceError(error.message);
    }
  }

  async function archiveWorkspace(workspaceId) {
    const workspace = workspaces.find((currentWorkspace) => currentWorkspace.id === workspaceId);
    if (!workspace) {
      return;
    }

    setWorkspaceError("");
    try {
      await archiveWorkspaceRequest(workspaceId);
      setWorkspaces((currentWorkspaces) =>
        currentWorkspaces.filter((currentWorkspace) => currentWorkspace.id !== workspaceId)
      );
      setArchivedWorkspaces((currentWorkspaces) => [
        { ...workspace, archived: true, projects: [] },
        ...currentWorkspaces,
      ]);
      setActivePage({ name: "archived-workspace" });
    } catch (error) {
      setWorkspaceError(error.message);
    }
  }

  async function restoreWorkspace(workspaceId) {
    setWorkspaceError("");
    try {
      const workspace = mapWorkspace(await restoreWorkspaceRequest(workspaceId));
      setArchivedWorkspaces((currentWorkspaces) =>
        currentWorkspaces.filter((currentWorkspace) => currentWorkspace.id !== workspaceId)
      );
      setWorkspaces((currentWorkspaces) => [...currentWorkspaces, workspace]);
      setActivePage({ name: "workspace-projects", workspaceId: workspace.id, workspaceTab: "projects" });
    } catch (error) {
      setWorkspaceError(error.message);
    }
  }

  async function permanentlyDeleteWorkspace(workspaceId) {
    setWorkspaceError("");
    try {
      await permanentlyDeleteWorkspaceRequest(workspaceId);
      setArchivedWorkspaces((currentWorkspaces) =>
        currentWorkspaces.filter((currentWorkspace) => currentWorkspace.id !== workspaceId)
      );
    } catch (error) {
      setWorkspaceError(error.message);
    }
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
          {workspaceError && <p className="app-error">{workspaceError}</p>}
          <ArchivedProjects
            onPermanentlyDeleteProject={permanentlyDeleteProject}
            onPermanentlyDeleteWorkspace={permanentlyDeleteWorkspace}
            onRestoreProject={restoreProject}
            onRestoreWorkspace={restoreWorkspace}
            projects={archivedProjects}
            workspaces={archivedWorkspaces}
          />
        </section>
      ) : activePage.name === "project-backlog" && activeProject && activeProjectWorkspace ? (
        <ProjectBacklogPage
          onArchiveProject={archiveProject}
          onUpdateProject={updateProject}
          project={activeProject}
          workspace={activeProjectWorkspace}
        />
      ) : activePage.name === "workspace-projects" && activeWorkspace ? (
        <WorkspaceProjectsPage
          archivedProjectIds={archivedProjectIds}
          createProjectRequestId={activePage.createProjectRequestId}
          initialTab={activePage.workspaceTab}
          onArchiveWorkspace={archiveWorkspace}
          onCreateProject={createProject}
          onRenameWorkspace={renameWorkspace}
          shouldOpenCreateProject={activePage.openCreateProject}
          onArchiveProject={archiveProject}
          onOpenProject={openProject}
          onPermanentlyDeleteProject={permanentlyDeleteProject}
          onRestoreProject={restoreProject}
          workspace={activeWorkspace}
        />
      ) : (
        <>
          {workspaceError && <p className="app-error">{workspaceError}</p>}
          {isLoadingWorkspaces ? (
            <section className="app-content" aria-label="Loading workspaces">
              <p className="empty-state">Loading workspaces...</p>
            </section>
          ) : (
            <AllProjectsPage
              guestWorkspaces={guestWorkspaces}
              archivedProjectIds={archivedProjectIds}
              onOpenProject={openProject}
              onOpenWorkspaceProjects={openWorkspaceProjects}
              workspaces={workspaces}
            />
          )}
        </>
      )}
    </main>
  );
}

export default AppShell;
