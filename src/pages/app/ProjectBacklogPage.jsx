import React, { useEffect, useRef, useState } from "react";
import ProjectBacklog from "../../components/project/ProjectBacklog.jsx";
import ProjectBoard from "../../components/project/ProjectBoard.jsx";
import ProjectMembers from "../../components/project/ProjectMembers.jsx";
import ProjectSettings from "../../components/project/ProjectSettings.jsx";
import ProjectTabs from "../../components/project/ProjectTabs.jsx";
import SprintEditModal from "../../components/project/SprintEditModal.jsx";

function ProjectBacklogPage({ onArchiveProject, project, workspace }) {
  const [activeTab, setActiveTab] = useState("Backlog");
  const [isSprintExpanded, setIsSprintExpanded] = useState(true);
  const [isEditingSprint, setIsEditingSprint] = useState(false);
  const [isSprintMenuOpen, setIsSprintMenuOpen] = useState(false);
  const [sprintName, setSprintName] = useState("SCRUM Sprint 1");
  const [sprintDuration, setSprintDuration] = useState("custom");
  const [sprintStartDate, setSprintStartDate] = useState("");
  const [sprintEndDate, setSprintEndDate] = useState("");
  const [sprintStartTime, setSprintStartTime] = useState("00:00");
  const [sprintEndTime, setSprintEndTime] = useState("00:00");
  const [autoScheduleSprint, setAutoScheduleSprint] = useState(false);
  const [moveOpenWorkTo, setMoveOpenWorkTo] = useState("SCRUM Sprint 1");
  const [sprintGoal, setSprintGoal] = useState("");
  const sprintMenuRef = useRef(null);
  const epics = project.epics ?? [];
  const backlogCards = epics.flatMap((epic) =>
    epic.cards.filter((card) => card.status === "backlog")
  );
  const sprintCards = epics.flatMap((epic) =>
    epic.cards.filter((card) => card.status !== "backlog")
  );
  const sprintStatusCounts = {
    todo: sprintCards.filter((card) => card.status === "todo").length,
    inProgress: sprintCards.filter((card) => card.status === "in-progress").length,
    done: sprintCards.filter((card) => card.status === "done" || card.completed).length,
  };
  const boardColumns = [
    { title: "Todo", cards: sprintCards.filter((card) => card.status === "todo") },
    {
      title: "In Progress",
      cards: sprintCards.filter((card) => card.status === "in-progress"),
    },
    {
      title: "Done",
      cards: sprintCards.filter((card) => card.status === "done" || card.completed),
    },
  ];
  const sprintDateRange =
    sprintStartDate || sprintEndDate
      ? `${sprintStartDate || "No start date"} - ${sprintEndDate || "No end date"}`
      : "No dates set";
  const sprintIndex = 0;
  const sprintCount = 1;
  const sprintMoveActions = [
    ...(sprintIndex > 0 ? ["Move sprint up", "Move sprint to top"] : []),
    ...(sprintIndex < sprintCount - 1 ? ["Move sprint down", "Move sprint to bottom"] : []),
  ];

  useEffect(() => {
    function closeSprintMenuOnOutsideClick(event) {
      if (!sprintMenuRef.current || sprintMenuRef.current.contains(event.target)) {
        return;
      }

      setIsSprintMenuOpen(false);
    }

    document.addEventListener("mousedown", closeSprintMenuOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeSprintMenuOnOutsideClick);
    };
  }, []);

  return (
    <section className="app-content" aria-labelledby="project-title">
      <header className="page-header">
        <div>
          <h1 id="project-title">{project.name}</h1>
        </div>
      </header>

      <ProjectTabs activeTab={activeTab} onChangeTab={setActiveTab} projectName={project.name} />

      {activeTab === "Members" ? (
        <ProjectMembers project={project} workspace={workspace} />
      ) : activeTab === "Settings" ? (
        <ProjectSettings onArchiveProject={onArchiveProject} project={project} />
      ) : activeTab === "Board" ? (
        <ProjectBoard boardColumns={boardColumns} />
      ) : activeTab === "Backlog" ? (
        <ProjectBacklog
          backlogCards={backlogCards}
          epics={epics}
          isSprintExpanded={isSprintExpanded}
          isSprintMenuOpen={isSprintMenuOpen}
          onEditSprint={() => {
            setIsEditingSprint(true);
            setIsSprintMenuOpen(false);
          }}
          onStartSprint={() => {}}
          onToggleSprint={() => setIsSprintExpanded((isExpanded) => !isExpanded)}
          onToggleSprintMenu={() => setIsSprintMenuOpen((isOpen) => !isOpen)}
          sprintDateRange={sprintDateRange}
          sprintMenuRef={sprintMenuRef}
          sprintMoveActions={sprintMoveActions}
          sprintName={sprintName}
          sprintStatusCounts={sprintStatusCounts}
        />
      ) : (
        <div className="board-view-panel">
          <p className="empty-state">{activeTab} content will be added later.</p>
        </div>
      )}

      {isEditingSprint && (
        <SprintEditModal
          autoSchedule={autoScheduleSprint}
          duration={sprintDuration}
          endDate={sprintEndDate}
          endTime={sprintEndTime}
          goal={sprintGoal}
          moveOpenWorkTo={moveOpenWorkTo}
          name={sprintName}
          onAutoScheduleChange={setAutoScheduleSprint}
          onClose={() => setIsEditingSprint(false)}
          onDurationChange={setSprintDuration}
          onEndDateChange={setSprintEndDate}
          onEndTimeChange={setSprintEndTime}
          onGoalChange={setSprintGoal}
          onMoveOpenWorkToChange={setMoveOpenWorkTo}
          onNameChange={setSprintName}
          onStartDateChange={setSprintStartDate}
          onStartTimeChange={setSprintStartTime}
          onUpdate={() => setIsEditingSprint(false)}
          startDate={sprintStartDate}
          startTime={sprintStartTime}
        />
      )}
    </section>
  );
}

export default ProjectBacklogPage;
