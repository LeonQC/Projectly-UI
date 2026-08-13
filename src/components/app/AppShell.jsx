import React, { useEffect, useState } from "react";
import { matchPath, useLocation, useNavigate } from "react-router-dom";
import {
  archiveProject as archiveProjectRequest,
  archiveWorkspace as archiveWorkspaceRequest,
  createProject as createProjectRequest,
  getProject as getProjectRequest,
  createWorkspace as createWorkspaceRequest,
  listArchivedProjects,
  listArchivedWorkspaces,
  listWorkspaceProjects,
  listWorkspaces,
  permanentlyDeleteProject as permanentlyDeleteProjectRequest,
  permanentlyDeleteWorkspace as permanentlyDeleteWorkspaceRequest,
  restoreProject as restoreProjectRequest,
  restoreWorkspace as restoreWorkspaceRequest,
  updateProject as updateProjectRequest,
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

function mapProject(project) {
  return {
    ...project,
    id: project.id,
    workspaceId: project.workspace_id ?? project.workspaceId,
    workspace_id: project.workspace_id ?? project.workspaceId,
    name: project.name,
    description: project.description ?? "",
    epics: project.epics ?? [],
  };
}

function getRoutePage(pathname) {
  const cardMatch = matchPath(
    "/workspaces/:workspaceId/projects/:projectId/cards/:cardId",
    pathname
  );
  if (cardMatch) {
    return {
      name: "project-backlog",
      workspaceId: Number(cardMatch.params.workspaceId),
      projectId: Number(cardMatch.params.projectId),
      cardId: Number(cardMatch.params.cardId),
    };
  }

  const projectMatch = matchPath("/workspaces/:workspaceId/projects/:projectId", pathname);
  if (projectMatch) {
    return {
      name: "project-backlog",
      workspaceId: Number(projectMatch.params.workspaceId),
      projectId: Number(projectMatch.params.projectId),
    };
  }

  const workspaceMatch = matchPath("/workspaces/:workspaceId", pathname);
  if (workspaceMatch) {
    return {
      name: "workspace-projects",
      workspaceId: Number(workspaceMatch.params.workspaceId),
      workspaceTab: "projects",
    };
  }

  if (pathname === "/inbox") {
    return { name: "inbox" };
  }

  if (pathname === "/settings") {
    return { name: "user-settings" };
  }

  if (pathname === "/archived-workspace") {
    return { name: "archived-workspace" };
  }

  return { name: "all-projects" };
}

function AppShell({ currentUser, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
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
  const [activePage, setActivePage] = useState(() => getRoutePage(window.location.pathname));
  const [archivedProjects, setArchivedProjects] = useState([]);
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
  const archivedProjectsWithWorkspace = archivedProjects.map((project) => ({
    ...project,
    workspaceName:
      workspaces.find((workspace) => workspace.id === project.workspace_id)?.name ??
      archivedWorkspaces.find((workspace) => workspace.id === project.workspace_id)?.name,
  }));
  const activeWorkspaceArchivedProjects = archivedProjects.filter(
    (project) => project.workspace_id === activeWorkspace?.id
  );

  useEffect(() => {
    setActivePage(getRoutePage(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspaceData() {
      setIsLoadingWorkspaces(true);
      setWorkspaceError("");
      try {
        const [activeWorkspaceData, archivedWorkspaceData, archivedProjectData] = await Promise.all([
          listWorkspaces(),
          listArchivedWorkspaces(),
          listArchivedProjects(),
        ]);
        const workspacesWithProjects = await Promise.all(
          activeWorkspaceData.map(async (workspace) => ({
            ...mapWorkspace(workspace),
            projects: (await listWorkspaceProjects(workspace.id)).map(mapProject),
          }))
        );

        if (!isMounted) {
          return;
        }

        setWorkspaces(workspacesWithProjects);
        setArchivedWorkspaces(archivedWorkspaceData.map(mapWorkspace));
        setArchivedProjects(archivedProjectData.map(mapProject));
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

  async function archiveProject(projectId) {
    const projectWorkspace = workspaces.find((workspace) =>
      workspace.projects.some((project) => project.id === projectId)
    );
    const project = projectWorkspace?.projects.find((workspaceProject) => workspaceProject.id === projectId);

    if (!projectWorkspace || !project) {
      return;
    }

    setWorkspaceError("");
    try {
      await archiveProjectRequest(projectId);
      setWorkspaces((currentWorkspaces) =>
        currentWorkspaces.map((workspace) =>
          workspace.id === projectWorkspace.id
            ? {
                ...workspace,
                projects: workspace.projects.filter((workspaceProject) => workspaceProject.id !== projectId),
              }
            : workspace
        )
      );
      setArchivedProjects((currentProjects) => [{ ...project, archived: true }, ...currentProjects]);
      navigate(`/workspaces/${projectWorkspace.id}`);
      setActivePage({
        name: "workspace-projects",
        workspaceId: projectWorkspace.id,
        workspaceTab: "archived-projects",
      });
    } catch (error) {
      setWorkspaceError(error.message);
    }
  }

  async function restoreProject(projectId) {
    setWorkspaceError("");
    try {
      const project = mapProject(await restoreProjectRequest(projectId));
      setArchivedProjects((currentProjects) =>
        currentProjects.filter((currentProject) => currentProject.id !== projectId)
      );
      setWorkspaces((currentWorkspaces) =>
        currentWorkspaces.map((workspace) =>
          workspace.id === project.workspace_id
            ? { ...workspace, projects: [...workspace.projects, project] }
            : workspace
        )
      );
      navigate(`/workspaces/${project.workspace_id}`);
      setActivePage({
        name: "workspace-projects",
        workspaceId: project.workspace_id,
        workspaceTab: "projects",
      });
    } catch (error) {
      setWorkspaceError(error.message);
    }
  }

  async function permanentlyDeleteProject(projectId) {
    setWorkspaceError("");
    try {
      await permanentlyDeleteProjectRequest(projectId);
      setArchivedProjects((currentProjects) =>
        currentProjects.filter((currentProject) => currentProject.id !== projectId)
      );
      setWorkspaces((currentWorkspaces) =>
        currentWorkspaces.map((workspace) => ({
          ...workspace,
          projects: workspace.projects.filter((project) => project.id !== projectId),
        }))
      );

      if (activePage.projectId === projectId) {
        navigate("/archived-workspace");
        setActivePage({ name: "archived-workspace" });
      }
    } catch (error) {
      setWorkspaceError(error.message);
    }
  }

  function openAllProjects() {
    navigate("/");
    setActivePage({ name: "all-projects" });
  }

  function openArchivedProjects() {
    navigate("/archived-workspace");
    setActivePage({ name: "archived-workspace" });
  }

  function openInbox() {
    navigate("/inbox");
    setActivePage({ name: "inbox" });
  }

  function openUserSettings() {
    navigate("/settings");
    setActivePage({ name: "user-settings" });
  }

  function openWorkspaceProjects(workspaceId, workspaceTab = "projects", options = {}) {
    navigate(`/workspaces/${workspaceId}`);
    setActivePage({
      name: "workspace-projects",
      workspaceId,
      workspaceTab,
      openCreateProject: options.openCreateProject ?? false,
      createProjectRequestId: options.openCreateProject ? Date.now() : null,
    });
  }

  async function openProject(projectId) {
    const projectWorkspace = workspaces.find((workspace) =>
      workspace.projects.some((project) => project.id === projectId)
    );

    setWorkspaceError("");
    try {
      const project = mapProject(await getProjectRequest(projectId));
      setWorkspaces((currentWorkspaces) =>
        currentWorkspaces.map((workspace) =>
          workspace.id === project.workspace_id
            ? {
                ...workspace,
                projects: workspace.projects.map((currentProject) =>
                  currentProject.id === project.id
                    ? {
                        ...currentProject,
                        ...project,
                        epics: currentProject.epics,
                      }
                    : currentProject
                ),
              }
            : workspace
        )
      );

      setActivePage({
        name: "project-backlog",
        projectId,
        workspaceId: project.workspace_id,
      });
      navigate(`/workspaces/${project.workspace_id}/projects/${projectId}`);
    } catch (error) {
      setWorkspaceError(error.message);
      if (projectWorkspace) {
        setActivePage({
          name: "project-backlog",
          projectId,
          workspaceId: projectWorkspace.id,
        });
        navigate(`/workspaces/${projectWorkspace.id}/projects/${projectId}`);
      }
    }
  }

  async function createProject(workspaceId, projectInput) {
    setWorkspaceError("");
    try {
      const project = mapProject(await createProjectRequest(workspaceId, projectInput));
      setWorkspaces((currentWorkspaces) =>
        currentWorkspaces.map((workspace) =>
          workspace.id === workspaceId
            ? {
                ...workspace,
                projects: [...workspace.projects, project],
              }
            : workspace
        )
      );
    } catch (error) {
      setWorkspaceError(error.message);
    }
  }

  async function updateProject(projectId, projectInput) {
    setWorkspaceError("");
    try {
      const project = mapProject(await updateProjectRequest(projectId, projectInput));
      setWorkspaces((currentWorkspaces) =>
        currentWorkspaces.map((workspace) => ({
          ...workspace,
          projects: workspace.projects.map((currentProject) =>
            currentProject.id === projectId
              ? {
                  ...currentProject,
                  ...project,
                  epics: currentProject.epics,
                }
              : currentProject
          ),
        }))
      );
    } catch (error) {
      setWorkspaceError(error.message);
    }
  }

  async function createWorkspace(workspaceInput) {
    setWorkspaceError("");
    try {
      const workspace = mapWorkspace(await createWorkspaceRequest(workspaceInput));
      setWorkspaces((currentWorkspaces) => [...currentWorkspaces, workspace]);

      navigate(`/workspaces/${workspace.id}`);
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
      navigate("/archived-workspace");
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
      navigate(`/workspaces/${workspace.id}`);
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
            projects={archivedProjectsWithWorkspace}
            workspaces={archivedWorkspaces}
          />
        </section>
      ) : activePage.name === "project-backlog" && activeProject && activeProjectWorkspace ? (
        <ProjectBacklogPage
          initialCardId={activePage.cardId}
          onArchiveProject={archiveProject}
          onCloseCardRoute={() => navigate(`/workspaces/${activeProjectWorkspace.id}/projects/${activeProject.id}`)}
          onOpenCardRoute={(cardId) =>
            navigate(`/workspaces/${activeProjectWorkspace.id}/projects/${activeProject.id}/cards/${cardId}`)
          }
          onUpdateProject={updateProject}
          project={activeProject}
          workspace={activeProjectWorkspace}
        />
      ) : activePage.name === "workspace-projects" && activeWorkspace ? (
        <WorkspaceProjectsPage
          archivedProjects={activeWorkspaceArchivedProjects}
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
