import React, { useState } from "react";
import { guestWorkspaces, user, workspaces } from "../../data/mockWorkspaceData.js";
import AllBoardsPage from "../../pages/app/AllBoardsPage.jsx";
import WorkspaceBoardsPage from "../../pages/app/WorkspaceBoardsPage.jsx";
import Sidebar from "./Sidebar.jsx";

function AppShell() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [activePage, setActivePage] = useState({ name: "all-boards" });
  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activePage.workspaceId) ?? workspaces[0];

  function openAllBoards() {
    setActivePage({ name: "all-boards" });
  }

  function openWorkspaceBoards(workspaceId) {
    setActivePage({ name: "workspace-boards", workspaceId });
  }

  return (
    <main className={`app-layout ${isSidebarVisible ? "" : "is-sidebar-hidden"}`}>
      {isSidebarVisible && (
        <Sidebar
          activePage={activePage}
          onOpenAllBoards={openAllBoards}
          onOpenWorkspaceBoards={openWorkspaceBoards}
          user={user}
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
      {activePage.name === "workspace-boards" ? (
        <WorkspaceBoardsPage workspace={activeWorkspace} />
      ) : (
        <AllBoardsPage
          guestWorkspaces={guestWorkspaces}
          onOpenWorkspaceBoards={openWorkspaceBoards}
          workspaces={workspaces}
        />
      )}
    </main>
  );
}

export default AppShell;
