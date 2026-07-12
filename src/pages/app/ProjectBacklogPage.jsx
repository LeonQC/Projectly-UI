import React, { useEffect, useRef, useState } from "react";
import CardDetailModal from "../../components/project/CardDetailModal.jsx";
import CreateCardModal from "../../components/project/CreateCardModal.jsx";
import CreateEpicModal from "../../components/project/CreateEpicModal.jsx";
import CreateSprintModal from "../../components/project/CreateSprintModal.jsx";
import ProjectBacklog from "../../components/project/ProjectBacklog.jsx";
import ProjectArchivedWorkItems from "../../components/project/ProjectArchivedWorkItems.jsx";
import ProjectBoard, { cardStatuses } from "../../components/project/ProjectBoard.jsx";
import ProjectMembers from "../../components/project/ProjectMembers.jsx";
import ProjectSettings from "../../components/project/ProjectSettings.jsx";
import ProjectSummary from "../../components/project/ProjectSummary.jsx";
import ProjectTabs from "../../components/project/ProjectTabs.jsx";
import SprintEditModal from "../../components/project/SprintEditModal.jsx";

function formatStatusLabel(status) {
  const labels = {
    todo: "Todo",
    "in-progress": "In Progress",
    done: "Done",
  };

  return labels[status] ?? "Todo";
}

function ProjectBacklogPage({ onArchiveProject, onUpdateProject, project, workspace }) {
  const [activeTab, setActiveTab] = useState("Backlog");
  const [expandedEpicId, setExpandedEpicId] = useState(null);
  const [localEpics, setLocalEpics] = useState(project.epics ?? []);
  const [isCreatingEpic, setIsCreatingEpic] = useState(false);
  const [editingEpicId, setEditingEpicId] = useState(null);
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);
  const [isEditingSprint, setIsEditingSprint] = useState(false);
  const [sprintMenuEpicId, setSprintMenuEpicId] = useState(null);
  const [epicMenuId, setEpicMenuId] = useState(null);
  const [activeSprintEpicId, setActiveSprintEpicId] = useState(null);
  const [sprintName, setSprintName] = useState("");
  const [sprintDuration, setSprintDuration] = useState("custom");
  const [sprintStartDate, setSprintStartDate] = useState("");
  const [sprintEndDate, setSprintEndDate] = useState("");
  const [sprintStartTime, setSprintStartTime] = useState("00:00");
  const [sprintEndTime, setSprintEndTime] = useState("00:00");
  const [autoScheduleSprint, setAutoScheduleSprint] = useState(false);
  const [moveOpenWorkTo, setMoveOpenWorkTo] = useState("SCRUM Sprint 1");
  const [sprintGoal, setSprintGoal] = useState("");
  const [createdCards, setCreatedCards] = useState([]);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [projectStatuses, setProjectStatuses] = useState(cardStatuses);
  const [archivedStatusValues, setArchivedStatusValues] = useState([]);
  const sprintMenuRef = useRef(null);
  const epicMenuRef = useRef(null);
  const epics = localEpics.filter((epic) => !epic.archived);
  const archivedEpics = localEpics.filter((epic) => epic.archived);
  const archivedSprints = localEpics.flatMap((epic) =>
    (epic.sprints ?? [])
      .filter((epicSprint) => epicSprint.archived)
      .map((epicSprint) => ({
        ...epicSprint,
        epicName: epic.name,
      }))
  );
  const archivedCards = [
    ...createdCards.filter((card) => card.archived).map((card) => ({
      ...card,
      source: "Backlog",
    })),
    ...localEpics.flatMap((epic) => [
      ...epic.cards.filter((card) => card.archived).map((card) => ({
        ...card,
        source: epic.name,
      })),
      ...(epic.sprints ?? []).flatMap((epicSprint) =>
        epicSprint.cards.filter((card) => card.archived).map((card) => ({
          ...card,
          source: `${epic.name} · ${epicSprint.title}`,
        }))
      ),
    ]),
  ];
  const activeEpic = epics.find((epic) => epic.id === activeSprintEpicId) ?? null;
  const sprint = activeEpic?.sprints?.find((epicSprint) => !epicSprint.archived) ?? null;
  const editingEpic = localEpics.find((epic) => epic.id === editingEpicId) ?? null;
  const projectCards = [
    ...epics.flatMap((epic) => epic.cards.filter((card) => !card.archived)),
    ...createdCards.filter((card) => !card.archived),
  ];
  const backlogCards = projectCards.filter((card) => !card.sprintId);
  const allSprintCards = epics.flatMap((epic) =>
    epic.sprints
      ?.filter((epicSprint) => !epicSprint.archived)
      .flatMap((epicSprint) => epicSprint.cards.filter((card) => !card.archived)) ?? []
  );
  const linkedWorkItemOptions = [...projectCards, ...allSprintCards].filter(
    (card, index, cards) => cards.findIndex((currentCard) => currentCard.id === card.id) === index
  );
  const sprintCards = sprint?.cards.filter((card) => !card.archived) ?? [];
  const startedSprintCards = epics.flatMap((epic) =>
    epic.sprints?.flatMap((epicSprint) =>
      !epicSprint.archived && epicSprint.isStarted
        ? epicSprint.cards.filter((card) => !card.archived)
        : []
    ) ?? []
  );
  const cardStatusCounts = {
    todo: projectCards.filter((card) => card.status === "todo").length,
    inProgress: projectCards.filter((card) => card.status === "in-progress").length,
    done: projectCards.filter((card) => card.status === "done" || card.completed).length,
  };
  const sprintStatusCounts = {
    todo: sprintCards.filter((card) => card.status === "todo").length,
    inProgress: sprintCards.filter((card) => card.status === "in-progress").length,
    done: sprintCards.filter((card) => card.status === "done" || card.completed).length,
  };
  const statusOptions = projectStatuses.filter((status) => !archivedStatusValues.includes(status.value));
  const boardColumns = statusOptions
    .filter((status) => cardStatuses.some((defaultStatus) => defaultStatus.value === status.value))
    .map((status) => ({
      title: status.label,
      status: status.value,
      cards: startedSprintCards.filter((card) =>
        status.value === "done"
          ? card.status === status.value || card.completed
          : card.status === status.value
      ),
    }));
  const projectMembers = [
    ...(workspace.members ?? []),
    ...(workspace.singleBoardGuests ?? []).filter((guest) => guest.projects.includes(project.name)),
  ];
  const completedEpics = epics.filter(
    (epic) => epic.cards.length > 0 && epic.cards.every((card) => card.completed || card.status === "done")
  ).length;
  const epicStats = {
    completed: completedEpics,
    incomplete: epics.length - completedEpics,
  };
  const sprintIsComplete =
    allSprintCards.length > 0 && allSprintCards.every((card) => card.completed || card.status === "done");
  const sprintStats = {
    completed: sprintIsComplete ? 1 : 0,
    incomplete: allSprintCards.length > 0 && !sprintIsComplete ? 1 : 0,
  };
  const sprintStartDisabled =
    !sprint || sprint.isStarted || sprintCards.length === 0 || !sprint.startDate || !sprint.endDate;
  const sprintOptions = epics.flatMap((epic) =>
    (epic.sprints ?? [])
      .filter((epicSprint) => !epicSprint.archived)
      .map((epicSprint) => ({
        id: epicSprint.id,
        title: epicSprint.title,
        epicName: epic.name,
      }))
  );

  function getEpicMoveActions(epic) {
    const epicIndex = epics.findIndex((currentEpic) => currentEpic.id === epic.id);

    return [
      ...(epicIndex > 0 ? ["Move epic up", "Move epic to top"] : []),
      ...(epicIndex < epics.length - 1 ? ["Move epic down", "Move epic to bottom"] : []),
    ];
  }

  function getSprintMoveActions(epic) {
    const activeSprints = (epic.sprints ?? []).filter((epicSprint) => !epicSprint.archived);
    const sprintIndex = 0;

    return [
      ...(sprintIndex > 0 ? ["Move sprint up", "Move sprint to top"] : []),
      ...(sprintIndex < activeSprints.length - 1 ? ["Move sprint down", "Move sprint to bottom"] : []),
    ];
  }

  function reorderVisibleEpics(epicId, action) {
    setLocalEpics((currentEpics) => {
      const visibleEpics = currentEpics.filter((epic) => !epic.archived);
      const archivedEpics = currentEpics.filter((epic) => epic.archived);
      const fromIndex = visibleEpics.findIndex((epic) => epic.id === epicId);

      if (fromIndex === -1) {
        return currentEpics;
      }

      const nextVisibleEpics = [...visibleEpics];
      const [movedEpic] = nextVisibleEpics.splice(fromIndex, 1);
      let toIndex = fromIndex;

      if (action === "up") {
        toIndex = Math.max(0, fromIndex - 1);
      } else if (action === "down") {
        toIndex = Math.min(nextVisibleEpics.length, fromIndex + 1);
      } else if (action === "top") {
        toIndex = 0;
      } else if (action === "bottom") {
        toIndex = nextVisibleEpics.length;
      }

      nextVisibleEpics.splice(toIndex, 0, movedEpic);

      return [...nextVisibleEpics, ...archivedEpics];
    });
    setEpicMenuId(null);
  }

  function archiveEpic(epicId) {
    setLocalEpics((currentEpics) =>
      currentEpics.map((epic) => (epic.id === epicId ? { ...epic, archived: true } : epic))
    );
    setEpicMenuId(null);
    setExpandedEpicId((currentEpicId) => (currentEpicId === epicId ? null : currentEpicId));
    setActiveSprintEpicId((currentEpicId) => (currentEpicId === epicId ? null : currentEpicId));
  }

  function editEpic(epicId) {
    setEditingEpicId(epicId);
    setEpicMenuId(null);
  }

  function archiveSprint(epicId) {
    setLocalEpics((currentEpics) =>
      currentEpics.map((epic) => {
        if (epic.id !== epicId) {
          return epic;
        }

        const activeSprint = epic.sprints?.find((epicSprint) => !epicSprint.archived);

        return {
          ...epic,
          sprints: (epic.sprints ?? []).map((epicSprint) =>
            epicSprint.id === activeSprint?.id ? { ...epicSprint, archived: true } : epicSprint
          ),
        };
      })
    );
    setSprintMenuEpicId(null);
    setExpandedEpicId((currentEpicId) => (currentEpicId === epicId ? null : currentEpicId));
  }

  function archiveCard(cardId) {
    setCreatedCards((cards) =>
      cards.map((card) => (card.id === cardId ? { ...card, archived: true } : card))
    );
    setLocalEpics((currentEpics) =>
      currentEpics.map((epic) => ({
        ...epic,
        cards: epic.cards.map((card) => (card.id === cardId ? { ...card, archived: true } : card)),
        sprints: (epic.sprints ?? []).map((epicSprint) => ({
          ...epicSprint,
          cards: epicSprint.cards.map((card) => (card.id === cardId ? { ...card, archived: true } : card)),
        })),
      }))
    );
    setSelectedCard(null);
  }

  function restoreEpic(epicId) {
    setLocalEpics((currentEpics) =>
      currentEpics.map((epic) => (epic.id === epicId ? { ...epic, archived: false } : epic))
    );
  }

  function restoreSprint(sprintId) {
    setLocalEpics((currentEpics) =>
      currentEpics.map((epic) => ({
        ...epic,
        sprints: (epic.sprints ?? []).map((epicSprint) =>
          epicSprint.id === sprintId ? { ...epicSprint, archived: false } : epicSprint
        ),
      }))
    );
  }

  function restoreCard(cardId) {
    setCreatedCards((cards) =>
      cards.map((card) => (card.id === cardId ? { ...card, archived: false } : card))
    );
    setLocalEpics((currentEpics) =>
      currentEpics.map((epic) => ({
        ...epic,
        cards: epic.cards.map((card) => (card.id === cardId ? { ...card, archived: false } : card)),
        sprints: (epic.sprints ?? []).map((epicSprint) => ({
          ...epicSprint,
          cards: epicSprint.cards.map((card) =>
            card.id === cardId ? { ...card, archived: false } : card
          ),
        })),
      }))
    );
  }

  function moveSprint(epicId, action) {
    setLocalEpics((currentEpics) =>
      currentEpics.map((epic) => {
        if (epic.id !== epicId) {
          return epic;
        }

        const activeSprints = (epic.sprints ?? []).filter((epicSprint) => !epicSprint.archived);
        const archivedSprints = (epic.sprints ?? []).filter((epicSprint) => epicSprint.archived);
        const fromIndex = 0;

        if (activeSprints.length <= 1) {
          return epic;
        }

        const nextSprints = [...activeSprints];
        const [movedSprint] = nextSprints.splice(fromIndex, 1);
        let toIndex = fromIndex;

        if (action === "Move sprint up") {
          toIndex = Math.max(0, fromIndex - 1);
        } else if (action === "Move sprint down") {
          toIndex = Math.min(nextSprints.length, fromIndex + 1);
        } else if (action === "Move sprint to top") {
          toIndex = 0;
        } else if (action === "Move sprint to bottom") {
          toIndex = nextSprints.length;
        }

        nextSprints.splice(toIndex, 0, movedSprint);

        return {
          ...epic,
          sprints: [...nextSprints, ...archivedSprints],
        };
      })
    );
    setSprintMenuEpicId(null);
  }

  function findCardById(cardId) {
    const backlogCard = createdCards.find((card) => card.id === cardId);

    if (backlogCard) {
      return backlogCard;
    }

    for (const epic of epics) {
      const epicCard = epic.cards.find((card) => card.id === cardId);

      if (epicCard) {
        return epicCard;
      }

      for (const epicSprint of epic.sprints ?? []) {
        const sprintCard = epicSprint.cards.find((card) => card.id === cardId);

        if (sprintCard) {
          return sprintCard;
        }
      }
    }

    return null;
  }

  function removeCardFromProject(cardId) {
    setCreatedCards((cards) => cards.filter((card) => card.id !== cardId));
    setLocalEpics((currentEpics) =>
      currentEpics.map((epic) => ({
        ...epic,
        cards: epic.cards.filter((card) => card.id !== cardId),
        sprints: (epic.sprints ?? []).map((epicSprint) => ({
          ...epicSprint,
          cards: epicSprint.cards.filter((card) => card.id !== cardId),
        })),
      }))
    );
  }

  function updateCardStatus(cardId, status) {
    const statusLabel = projectStatuses.find((option) => option.value === status)?.label ?? formatStatusLabel(status);

    setCreatedCards((cards) =>
      cards.map((card) => (card.id === cardId ? { ...card, listName: statusLabel, status } : card))
    );
    setLocalEpics((currentEpics) =>
      currentEpics.map((epic) => ({
        ...epic,
        cards: epic.cards.map((card) =>
          card.id === cardId ? { ...card, listName: statusLabel, status } : card
        ),
        sprints: (epic.sprints ?? []).map((epicSprint) => ({
          ...epicSprint,
          cards: epicSprint.cards.map((card) =>
            card.id === cardId ? { ...card, listName: statusLabel, status } : card
          ),
        })),
      }))
    );
    setSelectedCard((card) =>
      card?.id === cardId ? { ...card, listName: statusLabel, status } : card
    );
  }

  function createCustomStatus(title) {
    const statusLabel = title.trim();

    if (!statusLabel) {
      return null;
    }

    const statusValue = statusLabel.toLowerCase().replace(/\s+/g, "-");
    const existingStatus = projectStatuses.find((status) => status.value === statusValue);

    if (existingStatus) {
      setArchivedStatusValues((currentValues) =>
        currentValues.filter((currentValue) => currentValue !== existingStatus.value)
      );
      return existingStatus;
    }

    const newStatus = {
      label: statusLabel,
      value: statusValue,
    };

    setProjectStatuses((currentStatuses) => [...currentStatuses, newStatus]);

    return newStatus;
  }

  function editStatus(statusValue, statusLabel) {
    setProjectStatuses((currentStatuses) =>
      currentStatuses.map((status) =>
        status.value === statusValue ? { ...status, label: statusLabel.trim() || status.label } : status
      )
    );
  }

  function archiveStatus(statusValue) {
    setArchivedStatusValues((currentValues) =>
      currentValues.includes(statusValue) ? currentValues : [...currentValues, statusValue]
    );
  }

  function handleCardDragStart(event, cardId) {
    event.dataTransfer.setData("text/plain", cardId);
    event.dataTransfer.effectAllowed = "move";
  }

  function moveCardToBacklog(event) {
    event.preventDefault();
    const cardId = event.dataTransfer.getData("text/plain");
    const card = findCardById(cardId);

    if (!card) {
      return;
    }

    removeCardFromProject(cardId);
    setCreatedCards((cards) => [
      ...cards,
      {
        ...card,
        sprintId: null,
        status: card.status ?? "todo",
      },
    ]);
  }

  function moveCardToSprint(event, epicId) {
    event.preventDefault();
    const cardId = event.dataTransfer.getData("text/plain");
    const card = findCardById(cardId);

    if (!card) {
      return;
    }

    removeCardFromProject(cardId);
    setLocalEpics((currentEpics) =>
      currentEpics.map((epic) => {
        if (epic.id !== epicId) {
          return epic;
        }

        const targetSprint = epic.sprints?.find((epicSprint) => !epicSprint.archived);

        if (!targetSprint) {
          return epic;
        }

        return {
          ...epic,
          sprints: epic.sprints.map((epicSprint) =>
            epicSprint.id === targetSprint.id
              ? {
                  ...epicSprint,
                  cards: [
                    ...epicSprint.cards,
                    {
                      ...card,
                      listName: "Todo",
                      sprintId: epicSprint.id,
                      status: card.status ?? "todo",
                    },
                  ],
                }
              : epicSprint
          ),
        };
      })
    );
  }

  useEffect(() => {
    function closeSprintMenuOnOutsideClick(event) {
      if (!sprintMenuRef.current || sprintMenuRef.current.contains(event.target)) {
        return;
      }

      setSprintMenuEpicId(null);
    }

    document.addEventListener("mousedown", closeSprintMenuOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeSprintMenuOnOutsideClick);
    };
  }, []);

  useEffect(() => {
    function closeEpicMenuOnOutsideClick(event) {
      if (!epicMenuRef.current || epicMenuRef.current.contains(event.target)) {
        return;
      }

      setEpicMenuId(null);
    }

    document.addEventListener("mousedown", closeEpicMenuOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeEpicMenuOnOutsideClick);
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

      {activeTab === "Summary" ? (
        <ProjectSummary
          cardStatusCounts={cardStatusCounts}
          epicStats={epicStats}
          sprintStats={sprintStats}
        />
      ) : activeTab === "Members" ? (
        <ProjectMembers project={project} workspace={workspace} />
      ) : activeTab === "Settings" ? (
        <ProjectSettings
          onArchiveProject={onArchiveProject}
          onUpdateProject={onUpdateProject}
          project={project}
        />
      ) : activeTab === "Board" ? (
        <ProjectBoard
          boardCards={startedSprintCards}
          boardColumns={boardColumns}
          onArchiveStatus={archiveStatus}
          onCreateStatus={createCustomStatus}
          onEditStatus={editStatus}
          onOpenCard={setSelectedCard}
          onStatusChange={updateCardStatus}
          statuses={statusOptions}
        />
      ) : activeTab === "Archived Work Items" ? (
        <ProjectArchivedWorkItems
          archivedCards={archivedCards}
          archivedEpics={archivedEpics}
          archivedSprints={archivedSprints}
          onRestoreCard={restoreCard}
          onRestoreEpic={restoreEpic}
          onRestoreSprint={restoreSprint}
        />
      ) : activeTab === "Backlog" ? (
        <ProjectBacklog
          backlogCards={backlogCards}
          epics={epics}
          epicMenuRef={epicMenuRef}
          getEpicMoveActions={getEpicMoveActions}
          isSprintExpanded={(epicId) => expandedEpicId === epicId}
          isEpicMenuOpen={(epicId) => epicMenuId === epicId}
          isSprintMenuOpen={(epicId) => sprintMenuEpicId === epicId}
          onArchiveEpic={archiveEpic}
          getSprintMoveActions={getSprintMoveActions}
          onArchiveSprint={archiveSprint}
          onEditEpic={editEpic}
          onEditSprint={(epicId) => {
            const selectedEpic = epics.find((epic) => epic.id === epicId);
            const selectedSprint = selectedEpic?.sprints?.find((epicSprint) => !epicSprint.archived);

            if (!selectedSprint) {
              return;
            }

            setActiveSprintEpicId(epicId);
            setSprintName(selectedSprint.title);
            setSprintStartDate(selectedSprint.startDate);
            setSprintEndDate(selectedSprint.endDate);
            setIsEditingSprint(true);
            setSprintMenuEpicId(null);
          }}
          onCardDragStart={handleCardDragStart}
          onDropCardToBacklog={moveCardToBacklog}
          onDropCardToSprint={moveCardToSprint}
          onMoveEpic={reorderVisibleEpics}
          onMoveSprint={moveSprint}
          onOpenCard={setSelectedCard}
          onOpenCreateEpic={() => setIsCreatingEpic(true)}
          onOpenCreateCard={() => setIsCreatingCard(true)}
          onOpenCreateSprint={(epicId) => {
            setActiveSprintEpicId(epicId);
            setIsCreatingSprint(true);
          }}
          onSelectEpic={(epicId) => {
            setActiveSprintEpicId(epicId);
            setExpandedEpicId(epicId);
          }}
          onStartSprint={(epicId) => {
            const selectedEpic = epics.find((epic) => epic.id === epicId);
            const selectedSprint = selectedEpic?.sprints?.find((epicSprint) => !epicSprint.archived);
            const selectedSprintCards = selectedSprint?.cards ?? [];
            const selectedSprintStartDisabled =
              !selectedSprint ||
              selectedSprint.isStarted ||
              selectedSprintCards.length === 0 ||
              !selectedSprint.startDate ||
              !selectedSprint.endDate;

            if (selectedSprintStartDisabled) {
              return;
            }

            setLocalEpics((currentEpics) =>
              currentEpics.map((epic) =>
                epic.id === epicId
                  ? {
                      ...epic,
                      sprints: epic.sprints.map((epicSprint) =>
                        epicSprint.id === selectedSprint.id ? { ...epicSprint, isStarted: true } : epicSprint
                      ),
                    }
                  : epic
              )
            );
            setActiveTab("Board");
          }}
          onStatusChange={updateCardStatus}
          onToggleEpicMenu={(epicId) => {
            setEpicMenuId((currentEpicId) => (currentEpicId === epicId ? null : epicId));
          }}
          onToggleSprint={(epicId) => {
            setExpandedEpicId((currentEpicId) => (currentEpicId === epicId ? null : epicId));
          }}
          onToggleSprintMenu={(epicId) => {
            setSprintMenuEpicId((currentEpicId) => (currentEpicId === epicId ? null : epicId));
          }}
          selectedEpicId={activeSprintEpicId}
          sprintMenuRef={sprintMenuRef}
          statuses={statusOptions}
          getSprintStartDisabled={(epic) => {
            const epicSprint = epic.sprints?.find((currentSprint) => !currentSprint.archived);
            const epicSprintCards = epicSprint?.cards ?? [];
            return (
              !epicSprint ||
              epicSprint.isStarted ||
              epicSprintCards.length === 0 ||
              !epicSprint.startDate ||
              !epicSprint.endDate
            );
          }}
          getSprintStatusCounts={(epic) => {
            const epicSprintCards =
              epic.sprints?.find((currentSprint) => !currentSprint.archived)?.cards.filter((card) => !card.archived) ??
              [];
            return {
              todo: epicSprintCards.filter((card) => card.status === "todo").length,
              inProgress: epicSprintCards.filter((card) => card.status === "in-progress").length,
              done: epicSprintCards.filter((card) => card.status === "done" || card.completed).length,
            };
          }}
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
          onUpdate={() => {
            setLocalEpics((currentEpics) =>
              currentEpics.map((epic) =>
                epic.id === activeSprintEpicId
                  ? {
                      ...epic,
                      sprints: (epic.sprints ?? []).map((epicSprint) =>
                        epicSprint.id === sprint?.id
                          ? {
                              ...epicSprint,
                              title: sprintName,
                              startDate: sprintStartDate,
                              endDate: sprintEndDate,
                            }
                          : epicSprint
                      ),
                    }
                  : epic
              )
            );
            setIsEditingSprint(false);
          }}
          startDate={sprintStartDate}
          startTime={sprintStartTime}
        />
      )}

      {isCreatingEpic && (
        <CreateEpicModal
          onClose={() => setIsCreatingEpic(false)}
          onCreate={({ title, deadline }) => {
            setLocalEpics((currentEpics) => [
              ...currentEpics,
              {
                id: `epic-${Date.now()}`,
                name: title,
                deadline,
                cards: [],
                sprints: [],
              },
            ]);
            setIsCreatingEpic(false);
          }}
        />
      )}

      {editingEpic && (
        <CreateEpicModal
          initialDeadline={editingEpic.deadline ?? ""}
          initialTitle={editingEpic.name}
          mode="edit"
          onClose={() => setEditingEpicId(null)}
          onCreate={({ title, deadline }) => {
            setLocalEpics((currentEpics) =>
              currentEpics.map((epic) =>
                epic.id === editingEpic.id
                  ? {
                      ...epic,
                      name: title,
                      deadline,
                    }
                  : epic
              )
            );
            setEditingEpicId(null);
          }}
        />
      )}

      {isCreatingSprint && (
        <CreateSprintModal
          onClose={() => setIsCreatingSprint(false)}
          onCreate={({ title, startDate, endDate }) => {
            setLocalEpics((currentEpics) =>
              currentEpics.map((epic) =>
                epic.id === activeSprintEpicId
                  ? {
                      ...epic,
                      sprints: [
                        ...(epic.sprints ?? []),
                        {
                          id: `sprint-${Date.now()}`,
                          title,
                          startDate,
                          endDate,
                          archived: false,
                          isStarted: false,
                          cards: [],
                        },
                      ],
                    }
                  : epic
              )
            );
            setIsCreatingSprint(false);
          }}
        />
      )}

      {isCreatingCard && (
        <CreateCardModal
          onClose={() => setIsCreatingCard(false)}
          onCreate={({ title, description }) => {
            setCreatedCards((cards) => [
              ...cards,
              {
                id: `created-card-${Date.now()}`,
                title,
                description,
                completed: false,
                listName: "Todo",
                sprintId: null,
                status: "todo",
              },
            ]);
          }}
        />
      )}

      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          linkedWorkItemOptions={linkedWorkItemOptions}
          onArchiveCard={archiveCard}
          onClose={() => setSelectedCard(null)}
          onCreateStatus={createCustomStatus}
          onStatusChange={updateCardStatus}
          projectMembers={projectMembers}
          sprintOptions={sprintOptions}
          statuses={statusOptions}
        />
      )}
    </section>
  );
}

export default ProjectBacklogPage;
