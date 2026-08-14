import React, { useCallback, useEffect, useState } from "react";
import { matchPath, useLocation, useNavigate } from "react-router-dom";
import {
  archiveProject as archiveProjectRequest,
  archiveWorkspace as archiveWorkspaceRequest,
  createProject as createProjectRequest,
  getProject as getProjectRequest,
  createWorkspace as createWorkspaceRequest,
  listArchivedProjects,
  listArchivedWorkspaces,
  listWorkspaceMembers,
  listWorkspaceProjects,
  listWorkspaces,
  permanentlyDeleteProject as permanentlyDeleteProjectRequest,
  permanentlyDeleteWorkspace as permanentlyDeleteWorkspaceRequest,
  restoreProject as restoreProjectRequest,
  restoreWorkspace as restoreWorkspaceRequest,
  updateProject as updateProjectRequest,
  updateWorkspace as updateWorkspaceRequest,
} from "../../lib/api.js";
import { guestWorkspaces, user } from "../../data/mockWorkspaceData.js";
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

function mapWorkspaceMember(member) {
  const name = member.user?.username || member.user?.email || `User ${member.user?.id ?? ""}`.trim();
  const role = member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : "Member";

  return {
    id: member.user?.id ?? member.id,
    workspaceMemberId: member.id,
    name,
    username: member.user?.email ? member.user.email : `@user-${member.user?.id ?? "unknown"}`,
    initials: getInitials(name),
    role,
    membership: "Workspace member",
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

const sidebarWidthStorageKey = "projectly-sidebar-width";
const minSidebarWidth = 180;
const maxSidebarWidth = 420;
const defaultSidebarWidth = 220;

function getStoredSidebarWidth() {
  const storedWidth = Number(window.localStorage.getItem(sidebarWidthStorageKey));

  if (!Number.isFinite(storedWidth)) {
    return defaultSidebarWidth;
  }

  return Math.min(maxSidebarWidth, Math.max(minSidebarWidth, storedWidth));
}

function AppShell({ currentUser, onLogout, onUserUpdated }) {
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
        theme: currentUser.theme,
      }
    : user;
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(getStoredSidebarWidth);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [activePage, setActivePage] = useState(() => getRoutePage(window.location.pathname));
  const [archivedProjects, setArchivedProjects] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [archivedWorkspaces, setArchivedWorkspaces] = useState([]);
  const [workspaceError, setWorkspaceError] = useState("");
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [pendingArchivedActionKey, setPendingArchivedActionKey] = useState("");
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

  const loadWorkspaceData = useCallback(async () => {
    setIsLoadingWorkspaces(true);
    setWorkspaceError("");
    try {
      const [activeWorkspaceData, archivedWorkspaceData, archivedProjectData] = await Promise.all([
        listWorkspaces(),
        listArchivedWorkspaces(),
        listArchivedProjects(),
      ]);
      const workspacesWithProjects = await Promise.all(
        activeWorkspaceData.map(async (workspace) => {
          const [projectData, memberData] = await Promise.all([
            listWorkspaceProjects(workspace.id),
            listWorkspaceMembers(workspace.id),
          ]);

          return {
            ...mapWorkspace(workspace),
            members: memberData.map(mapWorkspaceMember),
            projects: projectData.map(mapProject),
          };
        })
      );

      setWorkspaces(workspacesWithProjects);
      setArchivedWorkspaces(archivedWorkspaceData.map(mapWorkspace));
      setArchivedProjects(archivedProjectData.map(mapProject));
    } catch (error) {
      setWorkspaceError(error.message);
    } finally {
      setIsLoadingWorkspaces(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  useEffect(() => {
    if (!isResizingSidebar) {
      return undefined;
    }

    function resizeSidebar(event) {
      const nextWidth = Math.min(maxSidebarWidth, Math.max(minSidebarWidth, event.clientX));
      setSidebarWidth(nextWidth);
    }

    function stopResizingSidebar() {
      setIsResizingSidebar(false);
    }

    window.addEventListener("pointermove", resizeSidebar);
    window.addEventListener("pointerup", stopResizingSidebar);
    document.body.classList.add("is-resizing-sidebar");

    return () => {
      window.removeEventListener("pointermove", resizeSidebar);
      window.removeEventListener("pointerup", stopResizingSidebar);
      document.body.classList.remove("is-resizing-sidebar");
    };
  }, [isResizingSidebar]);

  useEffect(() => {
    window.localStorage.setItem(sidebarWidthStorageKey, String(sidebarWidth));
  }, [sidebarWidth]);

  async function archiveProject(projectId) {
    const projectWorkspace = workspaces.find((workspace) =>
      workspace.projects.some((project) => project.id === projectId)
    );

    if (!projectWorkspace) {
      return;
    }

    setWorkspaceError("");
    setPendingArchivedActionKey(`project:${projectId}`);
    try {
      await archiveProjectRequest(projectId);
      navigate(`/workspaces/${projectWorkspace.id}`);
      setActivePage({
        name: "workspace-projects",
        workspaceId: projectWorkspace.id,
        workspaceTab: "archived-projects",
      });
      await loadWorkspaceData();
    } catch (error) {
      setWorkspaceError(error.message);
    } finally {
      setPendingArchivedActionKey("");
    }
  }

  async function restoreProject(projectId) {
    setWorkspaceError("");
    setPendingArchivedActionKey(`project:${projectId}`);
    try {
      const project = mapProject(await restoreProjectRequest(projectId));
      navigate(`/workspaces/${project.workspace_id}`);
      setActivePage({
        name: "workspace-projects",
        workspaceId: project.workspace_id,
        workspaceTab: "projects",
      });
      await loadWorkspaceData();
    } catch (error) {
      setWorkspaceError(error.message);
    } finally {
      setPendingArchivedActionKey("");
    }
  }

  async function permanentlyDeleteProject(projectId) {
    setWorkspaceError("");
    setPendingArchivedActionKey(`project:${projectId}`);
    try {
      await permanentlyDeleteProjectRequest(projectId);
      await loadWorkspaceData();

      if (activePage.projectId === projectId) {
        navigate("/archived-workspace");
        setActivePage({ name: "archived-workspace" });
      }
    } catch (error) {
      setWorkspaceError(error.message);
    } finally {
      setPendingArchivedActionKey("");
    }
  }

  function openAllProjects() {
    navigate("/");
    setActivePage({ name: "all-projects" });
  }

  function openArchivedProjects() {
    navigate("/archived-workspace");
    setActivePage({ name: "archived-workspace" });
    loadWorkspaceData();
  }

  function openInbox() {
    navigate("/inbox");
    setActivePage({ name: "inbox" });
  }

  function openCardMention(target) {
    navigate(`/workspaces/${target.workspace_id}/projects/${target.project_id}/cards/${target.card_id}`);
    setActivePage({
      name: "project-backlog",
      workspaceId: target.workspace_id,
      projectId: target.project_id,
      cardId: target.card_id,
    });
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
    setPendingArchivedActionKey(`workspace:${workspaceId}`);
    try {
      await archiveWorkspaceRequest(workspaceId);
      navigate("/archived-workspace");
      setActivePage({ name: "archived-workspace" });
      await loadWorkspaceData();
    } catch (error) {
      setWorkspaceError(error.message);
    } finally {
      setPendingArchivedActionKey("");
    }
  }

  async function restoreWorkspace(workspaceId) {
    setWorkspaceError("");
    setPendingArchivedActionKey(`workspace:${workspaceId}`);
    try {
      const workspace = mapWorkspace(await restoreWorkspaceRequest(workspaceId));
      navigate(`/workspaces/${workspace.id}`);
      setActivePage({ name: "workspace-projects", workspaceId: workspace.id, workspaceTab: "projects" });
      await loadWorkspaceData();
    } catch (error) {
      setWorkspaceError(error.message);
    } finally {
      setPendingArchivedActionKey("");
    }
  }

  async function permanentlyDeleteWorkspace(workspaceId) {
    setWorkspaceError("");
    setPendingArchivedActionKey(`workspace:${workspaceId}`);
    try {
      await permanentlyDeleteWorkspaceRequest(workspaceId);
      await loadWorkspaceData();
    } catch (error) {
      setWorkspaceError(error.message);
    } finally {
      setPendingArchivedActionKey("");
    }
  }

  return (
    <main
      className={`app-layout ${isSidebarVisible ? "" : "is-sidebar-hidden"} ${
        isResizingSidebar ? "is-sidebar-resizing" : ""
      }`}
      style={
        isSidebarVisible
          ? {
              "--sidebar-width": `${sidebarWidth}px`,
              gridTemplateColumns: `${sidebarWidth}px minmax(0, 1fr)`,
            }
          : undefined
      }
    >
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
      {isSidebarVisible && (
        <button
          className="sidebar-resize-handle"
          type="button"
          aria-label="Resize sidebar"
          onPointerDown={(event) => {
            event.preventDefault();
            setIsResizingSidebar(true);
          }}
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
        <InboxPage onInvitationChanged={loadWorkspaceData} onOpenCardMention={openCardMention} />
      ) : activePage.name === "user-settings" ? (
        <UserSettingsPage onUserUpdated={onUserUpdated} user={sidebarUser} />
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
            pendingActionKey={pendingArchivedActionKey}
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
          onMembersChanged={loadWorkspaceData}
          onPermanentlyDeleteProject={permanentlyDeleteProject}
          onRestoreProject={restoreProject}
          pendingArchivedActionKey={pendingArchivedActionKey}
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
