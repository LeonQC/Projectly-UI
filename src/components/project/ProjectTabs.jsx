import React from "react";

export const projectTabs = ["Backlog", "Board", "Members", "Archived Work Items", "Development", "Settings"];

function ProjectTab({ isActive = false, label, onClick }) {
  return (
    <button className={`workspace-tab ${isActive ? "is-active" : ""}`} type="button" onClick={onClick}>
      {label}
    </button>
  );
}

function ProjectTabs({ activeTab, onChangeTab, projectName }) {
  return (
    <nav className="workspace-tabs" aria-label={`${projectName} sections`}>
      {projectTabs.map((tab) => (
        <ProjectTab
          isActive={tab === activeTab}
          label={tab}
          key={tab}
          onClick={() => onChangeTab(tab)}
        />
      ))}
    </nav>
  );
}

export default ProjectTabs;
