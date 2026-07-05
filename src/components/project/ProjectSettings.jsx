import React, { useState } from "react";

function ProjectSettings({ onArchiveProject, project }) {
  const [projectName, setProjectName] = useState(project.name);

  return (
    <div className="workspace-settings-page">
      <section className="settings-panel">
        <h2>Rename project</h2>
        <p>Update the project name shown in the workspace and project pages.</p>
        <label className="settings-field">
          <span>Project name</span>
          <input
            type="text"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
          />
        </label>
        <div className="settings-actions">
          <button className="settings-save-button" type="button">
            Save changes
          </button>
        </div>
      </section>

      <section className="settings-panel">
        <h2>Archive project</h2>
        <p>Archive this project and move it to the workspace archived projects list.</p>
        <button
          className="settings-save-button"
          type="button"
          onClick={() => onArchiveProject(project.id)}
        >
          Archive project
        </button>
      </section>
    </div>
  );
}

export default ProjectSettings;
