import React from "react";

export const projectTabs = [
  "Summary",
  "Backlog",
  "Board",
  "Development",
  "Archived Work Items",
  "Members",
  "Settings",
];

function ProjectTab({ isActive = false, label, onClick }) {
  return (
    <button className={`workspace-tab ${isActive ? "is-active" : ""}`} type="button" onClick={onClick}>
      {label}
    </button>
  );
}

function ProjectTabs({ activeTab, canManageWorkspace = true, onChangeTab, projectName }) {
  const visibleTabs = canManageWorkspace
    ? projectTabs
    : projectTabs.filter((tab) => !["Archived Work Items", "Settings"].includes(tab));

  return (
    <nav className="workspace-tabs" aria-label={`${projectName} sections`}>
      {visibleTabs.map((tab) => (
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
