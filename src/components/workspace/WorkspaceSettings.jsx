import React, { useEffect, useState } from "react";

function WorkspaceSettings({ onArchiveWorkspace, onRenameWorkspace, workspace }) {
  const [workspaceName, setWorkspaceName] = useState(workspace.name);

  useEffect(() => {
    setWorkspaceName(workspace.name);
  }, [workspace.name]);

  function saveWorkspaceName() {
    const normalizedName = workspaceName.trim();
    if (!normalizedName || normalizedName === workspace.name) {
      return;
    }

    onRenameWorkspace(workspace.id, { name: normalizedName });
  }

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
          <button className="settings-save-button" type="button" onClick={saveWorkspaceName}>
            Save changes
          </button>
        </div>
      </section>

      <section className="settings-panel">
        <h2>Archive workspace</h2>
        <p>Archive this workspace and hide it from the active workspace list.</p>
        <button
          className="settings-save-button"
          type="button"
          onClick={() => onArchiveWorkspace(workspace.id)}
        >
          Archive workspace
        </button>
      </section>
    </div>
  );
}

export default WorkspaceSettings;
