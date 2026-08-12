import React, { useEffect, useState } from "react";
import ArchivedProjects from "../../components/workspace/ArchivedProjects.jsx";
import CreateProjectModal from "../../components/workspace/CreateProjectModal.jsx";
import WorkspaceMembers from "../../components/workspace/WorkspaceMembers.jsx";
import WorkspaceProjects, { CreateProjectButton } from "../../components/workspace/WorkspaceProjects.jsx";
import WorkspaceSettings from "../../components/workspace/WorkspaceSettings.jsx";
import WorkspaceTabs from "../../components/workspace/WorkspaceTabs.jsx";

function WorkspaceProjectsPage({
  archivedProjects = [],
  createProjectRequestId,
  initialTab = "projects",
  onArchiveProject,
  onArchiveWorkspace,
  onCreateProject,
  onOpenProject,
  onPermanentlyDeleteProject,
  onRenameWorkspace,
  onRestoreProject,
  shouldOpenCreateProject = false,
  workspace,
}) {
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState(initialTab ?? "projects");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const activeProjects = workspace.projects.filter((project) => !project.archived);

  useEffect(() => {
    if (shouldOpenCreateProject) {
      setIsCreatingProject(true);
    }
  }, [createProjectRequestId, shouldOpenCreateProject]);

  return (
    <section className="app-content" aria-labelledby="workspace-projects-title">
      <header className="page-header">
        <div className="workspace-page-title">
          <span className="workspace-board-avatar">{workspace.name.charAt(0)}</span>
          <h1 id="workspace-projects-title">{workspace.name}</h1>
        </div>
        {activeWorkspaceTab === "projects" && (
          <CreateProjectButton onClick={() => setIsCreatingProject(true)} />
        )}
      </header>

      <WorkspaceTabs
        activeTab={activeWorkspaceTab}
        onChangeTab={setActiveWorkspaceTab}
        workspaceName={workspace.name}
      />

      {activeWorkspaceTab === "members" ? (
        <WorkspaceMembers workspace={workspace} />
      ) : activeWorkspaceTab === "projects" ? (
        <WorkspaceProjects
          onArchiveProject={onArchiveProject}
          onCreateProject={() => setIsCreatingProject(true)}
          onOpenProject={onOpenProject}
          projects={activeProjects}
        />
      ) : activeWorkspaceTab === "settings" ? (
        <WorkspaceSettings
          onArchiveWorkspace={onArchiveWorkspace}
          onRenameWorkspace={onRenameWorkspace}
          workspace={workspace}
        />
      ) : activeWorkspaceTab === "archived-projects" ? (
        <ArchivedProjects
          onPermanentlyDeleteProject={onPermanentlyDeleteProject}
          onRestoreProject={onRestoreProject}
          projects={archivedProjects}
        />
      ) : null}

      {isCreatingProject && (
        <CreateProjectModal
          onClose={() => setIsCreatingProject(false)}
          onCreate={(projectInput) => onCreateProject(workspace.id, projectInput)}
        />
      )}
    </section>
  );
}

export default WorkspaceProjectsPage;
