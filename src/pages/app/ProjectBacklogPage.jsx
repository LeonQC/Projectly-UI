import React, { useEffect, useRef, useState } from "react";
import CardDetailModal from "../../components/project/CardDetailModal.jsx";
import CreateCardModal from "../../components/project/CreateCardModal.jsx";
import CreateEpicModal from "../../components/project/CreateEpicModal.jsx";
import CreateSprintModal from "../../components/project/CreateSprintModal.jsx";
import ProjectBacklog from "../../components/project/ProjectBacklog.jsx";
import ProjectArchivedWorkItems from "../../components/project/ProjectArchivedWorkItems.jsx";
import ProjectBoard, { cardStatuses } from "../../components/project/ProjectBoard.jsx";
import ProjectDevelopment from "../../components/project/ProjectDevelopment.jsx";
import ProjectMembers from "../../components/project/ProjectMembers.jsx";
import ProjectSettings from "../../components/project/ProjectSettings.jsx";
import ProjectSummary from "../../components/project/ProjectSummary.jsx";
import ProjectTabs from "../../components/project/ProjectTabs.jsx";
import SprintEditModal from "../../components/project/SprintEditModal.jsx";
import {
  archiveCard as archiveCardRequest,
  archiveEpic as archiveEpicRequest,
  archiveSprint as archiveSprintRequest,
  createCard as createCardRequest,
  createEpic as createEpicRequest,
  createSprint as createSprintRequest,
  getProjectDevelopmentEvents,
  listEpicSprints,
  listArchivedProjectCards,
  listProjectCards,
  listProjectEpics,
  moveCard as moveCardRequest,
  permanentlyDeleteCard as permanentlyDeleteCardRequest,
  permanentlyDeleteEpic as permanentlyDeleteEpicRequest,
  permanentlyDeleteSprint as permanentlyDeleteSprintRequest,
  restoreCard as restoreCardRequest,
  restoreEpic as restoreEpicRequest,
  restoreSprint as restoreSprintRequest,
  updateCard as updateCardRequest,
  updateSprint as updateSprintRequest,
  updateEpic as updateEpicRequest,
} from "../../lib/api.js";

function formatStatusLabel(status) {
  const labels = {
    todo: "Todo",
    "in-progress": "In Progress",
    done: "Done",
  };

  return labels[status] ?? "Todo";
}

function mapEpic(epic) {
  return {
    ...epic,
    id: epic.id,
    projectId: epic.project_id ?? epic.projectId,
    project_id: epic.project_id ?? epic.projectId,
    name: epic.title ?? epic.name,
    title: epic.title ?? epic.name,
    deadline: epic.deadline ?? "",
    cards: epic.cards ?? [],
    sprints: (epic.sprints ?? []).map(mapSprint),
  };
}

function mapSprint(sprint) {
  return {
    ...sprint,
    id: sprint.id,
    epicId: sprint.epic_id ?? sprint.epicId,
    epic_id: sprint.epic_id ?? sprint.epicId,
    title: sprint.name ?? sprint.title,
    name: sprint.name ?? sprint.title,
    goal: sprint.goal ?? "",
    startDate: sprint.start_date ?? sprint.startDate ?? "",
    start_date: sprint.start_date ?? sprint.startDate ?? "",
    endDate: sprint.end_date ?? sprint.endDate ?? "",
    end_date: sprint.end_date ?? sprint.endDate ?? "",
    isStarted: (sprint.status ?? "planned") === "active",
    cards: sprint.cards ?? [],
  };
}

function toApiCardStatus(status) {
  if (status === "in-progress") {
    return "in_progress";
  }

  return status;
}

function fromApiCardStatus(status) {
  if (status === "in_progress") {
    return "in-progress";
  }

  return status ?? "todo";
}

function mapCard(card) {
  const status = fromApiCardStatus(card.status);

  return {
    ...card,
    id: card.id,
    projectId: card.project_id ?? card.projectId,
    project_id: card.project_id ?? card.projectId,
    epicId: card.epic_id ?? card.epicId ?? null,
    epic_id: card.epic_id ?? card.epicId ?? null,
    sprintId: card.sprint_id ?? card.sprintId ?? null,
    sprint_id: card.sprint_id ?? card.sprintId ?? null,
    displayId: card.display_id ?? card.displayId ?? "",
    display_id: card.display_id ?? card.displayId ?? "",
    title: card.title,
    description: card.description ?? "",
    completed: status === "done",
    listName: formatStatusLabel(status),
    status,
  };
}

function isSameId(leftId, rightId) {
  return String(leftId) === String(rightId);
}

function ProjectBacklogPage({
  canManageWorkspace = true,
  currentUserId,
  initialCardId,
  initialCommentId,
  initialFocus,
  initialGithubEventId,
  onArchiveProject,
  onCloseCardRoute,
  onOpenCardRoute,
  onUpdateProject,
  project,
  workspace,
}) {
  const [activeTab, setActiveTab] = useState("Backlog");
  const [expandedEpicId, setExpandedEpicId] = useState(null);
  const [localEpics, setLocalEpics] = useState(project.epics ?? []);
  const [epicError, setEpicError] = useState("");
  const [isLoadingEpics, setIsLoadingEpics] = useState(true);
  const [isCreatingEpic, setIsCreatingEpic] = useState(false);
  const [editingEpicId, setEditingEpicId] = useState(null);
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);
  const [isEditingSprint, setIsEditingSprint] = useState(false);
  const [sprintMenuEpicId, setSprintMenuEpicId] = useState(null);
  const [epicMenuId, setEpicMenuId] = useState(null);
  const [activeSprintEpicId, setActiveSprintEpicId] = useState(null);
  const [sprintName, setSprintName] = useState("");
  const [sprintStartDate, setSprintStartDate] = useState("");
  const [sprintEndDate, setSprintEndDate] = useState("");
  const [sprintStartTime, setSprintStartTime] = useState("00:00");
  const [sprintEndTime, setSprintEndTime] = useState("00:00");
  const [autoScheduleSprint, setAutoScheduleSprint] = useState(false);
  const [moveOpenWorkTo, setMoveOpenWorkTo] = useState("SCRUM Sprint 1");
  const [sprintGoal, setSprintGoal] = useState("");
  const [createdCards, setCreatedCards] = useState([]);
  const [archivedCards, setArchivedCards] = useState([]);
  const [projectDevelopment, setProjectDevelopment] = useState(null);
  const [isLoadingDevelopment, setIsLoadingDevelopment] = useState(false);

  useEffect(() => {
    if (!canManageWorkspace && ["Archived Work Items", "Settings"].includes(activeTab)) {
      setActiveTab("Backlog");
    }
  }, [activeTab, canManageWorkspace]);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedCardFocus, setSelectedCardFocus] = useState(null);
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
  const archivedCardItems = archivedCards;
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
    startedSprintCards.length > 0 && startedSprintCards.every((card) => card.completed || card.status === "done");
  const sprintStats = {
    completed: sprintIsComplete ? 1 : 0,
    incomplete: startedSprintCards.length > 0 && !sprintIsComplete ? 1 : 0,
  };
  const sprintStartDisabled =
    !sprint || (!sprint.isStarted && (sprintCards.length === 0 || !sprint.startDate || !sprint.endDate));
  const sprintOptions = epics.flatMap((epic) =>
    (epic.sprints ?? [])
      .filter((epicSprint) => !epicSprint.archived)
      .map((epicSprint) => ({
        id: epicSprint.id,
        epicId: epic.id,
        title: epicSprint.title,
        epicName: epic.name,
      }))
  );
  const epicOptions = epics
    .filter((epic) => !epic.archived)
    .map((epic) => ({
      id: epic.id,
      title: epic.name,
    }));

  useEffect(() => {
    let isMounted = true;

    async function loadEpics() {
      setIsLoadingEpics(true);
      setEpicError("");
      setLocalEpics([]);
      try {
        const epicData = await listProjectEpics(project.id);
        const epicsWithSprints = await Promise.all(
          epicData.map(async (epic) => ({
            ...mapEpic(epic),
            sprints: (await listEpicSprints(epic.id)).map(mapSprint),
          }))
        );
        const cardData = (await listProjectCards(project.id)).map(mapCard);
        const archivedCardData = (await listArchivedProjectCards(project.id))
          .map(mapCard)
          .map((card) => {
            const sprintSource = epicsWithSprints
              .flatMap((epic) =>
                (epic.sprints ?? []).map((sprint) => ({
                  sprintId: sprint.id,
                  source: `${epic.name} · ${sprint.title}`,
                }))
              )
              .find((sprint) => isSameId(sprint.sprintId, card.sprintId))?.source;

            return {
              ...card,
              originalEpicId: card.epicId,
              originalSprintId: card.sprintId,
              originalStatus: card.status,
              source: sprintSource ?? "Backlog",
            };
          });
        const activeCardData = cardData.filter((card) => !card.archived);
        const backlogCards = activeCardData.filter((card) => !card.sprintId);
        const epicsWithCards = epicsWithSprints.map((epic) => ({
          ...epic,
          cards: [],
          sprints: (epic.sprints ?? []).map((sprint) => ({
            ...sprint,
            cards: activeCardData.filter((card) => isSameId(card.sprintId, sprint.id)),
          })),
        }));
        if (isMounted) {
          setCreatedCards(backlogCards);
          setArchivedCards(archivedCardData);
          setLocalEpics(epicsWithCards);
        }
      } catch (error) {
        if (isMounted) {
          setEpicError(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoadingEpics(false);
        }
      }
    }

    loadEpics();

    return () => {
      isMounted = false;
    };
  }, [project.id]);

  useEffect(() => {
    let isMounted = true;

    async function loadProjectDevelopment() {
      if (activeTab !== "Development") {
        return;
      }

      setIsLoadingDevelopment(true);
      setEpicError("");
      try {
        const developmentData = await getProjectDevelopmentEvents(project.id);
        if (isMounted) {
          setProjectDevelopment(developmentData);
        }
      } catch (error) {
        if (isMounted) {
          setEpicError(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoadingDevelopment(false);
        }
      }
    }

    loadProjectDevelopment();

    return () => {
      isMounted = false;
    };
  }, [activeTab, project.id]);

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

  async function archiveEpic(epicId) {
    setEpicError("");
    try {
      await archiveEpicRequest(epicId);
      setLocalEpics((currentEpics) =>
        currentEpics.map((epic) => (epic.id === epicId ? { ...epic, archived: true } : epic))
      );
      setEpicMenuId(null);
      setExpandedEpicId((currentEpicId) => (currentEpicId === epicId ? null : currentEpicId));
      setActiveSprintEpicId((currentEpicId) => (currentEpicId === epicId ? null : currentEpicId));
    } catch (error) {
      setEpicError(error.message);
    }
  }

  function editEpic(epicId) {
    setEditingEpicId(epicId);
    setEpicMenuId(null);
  }

  async function archiveSprint(epicId) {
    const epic = localEpics.find((currentEpic) => currentEpic.id === epicId);
    const activeSprint = epic?.sprints?.find((epicSprint) => !epicSprint.archived);

    if (!activeSprint) {
      return;
    }

    setEpicError("");
    try {
      await archiveSprintRequest(activeSprint.id);
      setLocalEpics((currentEpics) =>
        currentEpics.map((currentEpic) =>
          currentEpic.id === epicId
            ? {
                ...currentEpic,
                sprints: (currentEpic.sprints ?? []).map((epicSprint) =>
                  epicSprint.id === activeSprint.id ? { ...epicSprint, archived: true } : epicSprint
                ),
              }
            : currentEpic
        )
      );
      setSprintMenuEpicId(null);
      setExpandedEpicId((currentEpicId) => (currentEpicId === epicId ? null : currentEpicId));
    } catch (error) {
      setEpicError(error.message);
    }
  }

  async function archiveCard(cardId) {
    const card = findCardById(cardId);
    const source =
      createdCards.some((backlogCard) => isSameId(backlogCard.id, cardId))
        ? "Backlog"
        : localEpics.find((epic) => epic.cards.some((epicCard) => isSameId(epicCard.id, cardId)))?.name ??
          localEpics
            .flatMap((epic) =>
              (epic.sprints ?? []).map((epicSprint) => ({
                source: `${epic.name} · ${epicSprint.title}`,
                cards: epicSprint.cards,
              }))
            )
            .find((sprint) => sprint.cards.some((sprintCard) => isSameId(sprintCard.id, cardId)))?.source ??
          "Backlog";

    if (!card) {
      return;
    }

    setEpicError("");
    try {
      await archiveCardRequest(cardId);
      setArchivedCards((cards) => [
        {
          ...card,
          archived: true,
          originalEpicId: card.epicId,
          originalSprintId: card.sprintId,
          originalStatus: card.status,
          source,
        },
        ...cards.filter((archivedCard) => !isSameId(archivedCard.id, cardId)),
      ]);
      removeCardFromProject(cardId);
      setSelectedCard(null);
      onCloseCardRoute?.();
    } catch (error) {
      setEpicError(error.message);
    }
  }

  async function restoreEpic(epicId) {
    setEpicError("");
    try {
      const epic = mapEpic(await restoreEpicRequest(epicId));
      setLocalEpics((currentEpics) =>
        currentEpics.map((currentEpic) =>
          currentEpic.id === epicId
            ? {
                ...currentEpic,
                ...epic,
                cards: currentEpic.cards,
                sprints: currentEpic.sprints,
              }
            : currentEpic
        )
      );
    } catch (error) {
      setEpicError(error.message);
    }
  }

  async function restoreSprint(sprintId) {
    setEpicError("");
    try {
      const sprint = mapSprint(await restoreSprintRequest(sprintId));
      setLocalEpics((currentEpics) =>
        currentEpics.map((epic) => ({
          ...epic,
          sprints: (epic.sprints ?? []).map((epicSprint) =>
            epicSprint.id === sprintId
              ? {
                  ...epicSprint,
                  ...sprint,
                  cards: epicSprint.cards,
                }
              : epicSprint
          ),
        }))
      );
    } catch (error) {
      setEpicError(error.message);
    }
  }

  async function restoreCard(cardId) {
    const archivedCard = archivedCards.find((card) => isSameId(card.id, cardId));

    setEpicError("");
    try {
      let restoredCard = mapCard(await restoreCardRequest(cardId));
      const originalSprintId = archivedCard?.originalSprintId ?? archivedCard?.sprintId ?? null;

      if (originalSprintId) {
        restoredCard = mapCard(
          await moveCardRequest(cardId, {
            sprint_id: originalSprintId,
            status: toApiCardStatus(archivedCard?.originalStatus ?? restoredCard.status ?? "todo"),
          })
        );
      } else {
        restoredCard = mapCard(
          await moveCardRequest(cardId, {
            sprint_id: null,
            status: toApiCardStatus(archivedCard?.originalStatus ?? "backlog"),
          })
        );
      }

      setArchivedCards((cards) => cards.filter((card) => !isSameId(card.id, cardId)));
      removeCardFromProject(cardId);
      if (restoredCard.sprintId) {
        setLocalEpics((currentEpics) =>
          currentEpics.map((epic) => ({
            ...epic,
            sprints: (epic.sprints ?? []).map((epicSprint) =>
              epicSprint.id === restoredCard.sprintId
                ? {
                    ...epicSprint,
                    cards: [...epicSprint.cards.filter((card) => !isSameId(card.id, cardId)), restoredCard],
                  }
                : epicSprint
            ),
          }))
        );
      } else {
        setCreatedCards((cards) => [
          ...cards.filter((card) => !isSameId(card.id, cardId)),
          {
            ...restoredCard,
            sprintId: null,
            sprint_id: null,
            archived: false,
          },
        ]);
      }
    } catch (error) {
      setEpicError(error.message);
    }
  }

  async function permanentlyDeleteEpic(epicId) {
    setEpicError("");
    try {
      await permanentlyDeleteEpicRequest(epicId);
      setLocalEpics((currentEpics) => currentEpics.filter((epic) => epic.id !== epicId));
      setExpandedEpicId((currentEpicId) => (currentEpicId === epicId ? null : currentEpicId));
      setActiveSprintEpicId((currentEpicId) => (currentEpicId === epicId ? null : currentEpicId));
    } catch (error) {
      setEpicError(error.message);
    }
  }

  async function permanentlyDeleteSprint(sprintId) {
    setEpicError("");
    try {
      await permanentlyDeleteSprintRequest(sprintId);
      setLocalEpics((currentEpics) =>
        currentEpics.map((epic) => ({
          ...epic,
          sprints: (epic.sprints ?? []).filter((epicSprint) => epicSprint.id !== sprintId),
        }))
      );
    } catch (error) {
      setEpicError(error.message);
    }
  }

  async function permanentlyDeleteCard(cardId) {
    setEpicError("");
    try {
      await permanentlyDeleteCardRequest(cardId);
      setArchivedCards((cards) => cards.filter((card) => !isSameId(card.id, cardId)));
      removeCardFromProject(cardId);
      setSelectedCard((card) => (card?.id === cardId ? null : card));
      if (isSameId(selectedCard?.id, cardId)) {
        onCloseCardRoute?.();
      }
    } catch (error) {
      setEpicError(error.message);
    }
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
    const backlogCard = createdCards.find((card) => isSameId(card.id, cardId));

    if (backlogCard) {
      return backlogCard;
    }

    for (const epic of epics) {
      const epicCard = epic.cards.find((card) => isSameId(card.id, cardId));

      if (epicCard) {
        return epicCard;
      }

      for (const epicSprint of epic.sprints ?? []) {
        const sprintCard = epicSprint.cards.find((card) => isSameId(card.id, cardId));

        if (sprintCard) {
          return sprintCard;
        }
      }
    }

    return null;
  }

  function removeCardFromProject(cardId) {
    setCreatedCards((cards) => cards.filter((card) => !isSameId(card.id, cardId)));
    setLocalEpics((currentEpics) =>
      currentEpics.map((epic) => ({
        ...epic,
        cards: epic.cards.filter((card) => !isSameId(card.id, cardId)),
        sprints: (epic.sprints ?? []).map((epicSprint) => ({
          ...epicSprint,
          cards: epicSprint.cards.filter((card) => !isSameId(card.id, cardId)),
        })),
      }))
    );
  }

  function openCard(card) {
    setSelectedCard(card);
    setSelectedCardFocus(null);
    onOpenCardRoute?.(card.id);
  }

  function closeCard() {
    setSelectedCard(null);
    setSelectedCardFocus(null);
    onCloseCardRoute?.();
  }

  useEffect(() => {
    if (!initialCardId) {
      setSelectedCard(null);
      setSelectedCardFocus(null);
      return;
    }

    if (isLoadingEpics) {
      return;
    }

    const routeCard = findCardById(initialCardId);
    const routeFocus = initialFocus
      ? {
          section: initialFocus,
          commentId: initialCommentId,
          githubEventId: initialGithubEventId,
        }
      : null;

    const selectedFocusKey = JSON.stringify(selectedCardFocus);
    const routeFocusKey = JSON.stringify(routeFocus);

    if (
      routeCard &&
      (!isSameId(selectedCard?.id, routeCard.id) ||
        selectedFocusKey !== routeFocusKey)
    ) {
      setSelectedCard(routeCard);
      setSelectedCardFocus(routeFocus);
    }
  }, [
    createdCards,
    initialCardId,
    initialCommentId,
    initialFocus,
    initialGithubEventId,
    isLoadingEpics,
    localEpics,
    selectedCard?.id,
    selectedCardFocus,
  ]);

  function applyCardUpdate(cardId, updates) {
    setCreatedCards((cards) =>
      cards.map((card) => (isSameId(card.id, cardId) ? { ...card, ...updates } : card))
    );
    setLocalEpics((currentEpics) =>
      currentEpics.map((epic) => ({
        ...epic,
        cards: epic.cards.map((card) => (isSameId(card.id, cardId) ? { ...card, ...updates } : card)),
        sprints: (epic.sprints ?? []).map((epicSprint) => ({
          ...epicSprint,
          cards: epicSprint.cards.map((card) =>
            isSameId(card.id, cardId) ? { ...card, ...updates } : card
          ),
        })),
      }))
    );
    setSelectedCard((card) => (isSameId(card?.id, cardId) ? { ...card, ...updates } : card));
  }

  async function updateCardStatus(cardId, status) {
    const statusLabel = projectStatuses.find((option) => option.value === status)?.label ?? formatStatusLabel(status);

    setEpicError("");
    try {
      const card = mapCard(await updateCardRequest(cardId, { status: toApiCardStatus(status) }));
      applyCardUpdate(cardId, { ...card, listName: statusLabel, status });
    } catch (error) {
      setEpicError(error.message);
    }
  }

  async function updateCardDetails(cardId, updates) {
    const payload = {};
    if ("title" in updates) {
      payload.title = updates.title;
    }
    if ("description" in updates) {
      payload.description = updates.description;
    }
    if ("status" in updates) {
      payload.status = toApiCardStatus(updates.status);
    }
    if ("epicId" in updates) {
      payload.epic_id = updates.epicId ?? null;
    }

    setEpicError("");
    try {
      let card = findCardById(cardId);
      if (Object.keys(payload).length > 0) {
        card = mapCard(await updateCardRequest(cardId, payload));
      }

      if ("sprintId" in updates) {
        const nextSprintId = updates.sprintId ?? null;
        if (nextSprintId) {
          const targetEpic = localEpics.find((epic) =>
            epic.sprints?.some((epicSprint) => epicSprint.id === nextSprintId)
          );
          if (targetEpic && card?.epicId !== targetEpic.id) {
            card = mapCard(await updateCardRequest(cardId, { epic_id: targetEpic.id }));
          }
        }
        card = mapCard(await moveCardRequest(cardId, { sprint_id: nextSprintId }));
      }

      removeCardFromProject(cardId);
      if (card.sprintId) {
        setLocalEpics((currentEpics) =>
          currentEpics.map((epic) => ({
            ...epic,
            cards: epic.cards.filter((epicCard) => !isSameId(epicCard.id, cardId)),
            sprints: (epic.sprints ?? []).map((epicSprint) =>
              epicSprint.id === card.sprintId
                ? { ...epicSprint, cards: [...epicSprint.cards, card] }
                : {
                    ...epicSprint,
                    cards: epicSprint.cards.filter((sprintCard) => !isSameId(sprintCard.id, cardId)),
                  }
            ),
          }))
        );
      } else {
        setCreatedCards((cards) => [...cards.filter((currentCard) => !isSameId(currentCard.id, cardId)), card]);
      }
      setSelectedCard((currentCard) => (isSameId(currentCard?.id, cardId) ? { ...currentCard, ...card } : currentCard));
    } catch (error) {
      setEpicError(error.message);
    }
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

  async function moveCardToBacklog(event) {
    event.preventDefault();
    const cardId = event.dataTransfer.getData("text/plain");
    const card = findCardById(cardId);

    if (!card) {
      return;
    }

    setEpicError("");
    try {
      const movedCard = mapCard(await moveCardRequest(cardId, { sprint_id: null, status: "backlog" }));
      removeCardFromProject(cardId);
      setCreatedCards((cards) => [
        ...cards,
        {
          ...card,
          ...movedCard,
          sprintId: null,
          sprint_id: null,
        },
      ]);
    } catch (error) {
      setEpicError(error.message);
    }
  }

  async function moveCardToSprint(event, epicId) {
    event.preventDefault();
    const cardId = event.dataTransfer.getData("text/plain");
    const card = findCardById(cardId);

    if (!card) {
      return;
    }

    const targetEpic = localEpics.find((epic) => epic.id === epicId);
    const targetSprint = targetEpic?.sprints?.find((epicSprint) => !epicSprint.archived);

    if (!targetSprint) {
      return;
    }

    setEpicError("");
    try {
      let nextCard = card;
      if (card.epicId !== epicId) {
        nextCard = mapCard(await updateCardRequest(cardId, { epic_id: epicId, status: "todo" }));
      }
      const movedCard = mapCard(
        await moveCardRequest(cardId, {
          sprint_id: targetSprint.id,
          status: toApiCardStatus(nextCard.status ?? "todo"),
        })
      );

      removeCardFromProject(cardId);
      setLocalEpics((currentEpics) =>
        currentEpics.map((epic) =>
          epic.id === epicId
            ? {
                ...epic,
                sprints: epic.sprints.map((epicSprint) =>
                  epicSprint.id === targetSprint.id
                    ? {
                        ...epicSprint,
                        cards: [
                          ...epicSprint.cards,
                          {
                            ...card,
                            ...movedCard,
                            listName: "Todo",
                          },
                        ],
                      }
                    : epicSprint
                ),
              }
            : epic
        )
      );
    } catch (error) {
      setEpicError(error.message);
    }
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
      {epicError && <p className="app-error">{epicError}</p>}

      <ProjectTabs
        activeTab={activeTab}
        canManageWorkspace={canManageWorkspace}
        onChangeTab={setActiveTab}
        projectName={project.name}
      />

      {activeTab === "Summary" ? (
        <ProjectSummary
          cardStatusCounts={cardStatusCounts}
          epicStats={epicStats}
          sprintStats={sprintStats}
        />
      ) : activeTab === "Members" ? (
        <ProjectMembers currentUserId={currentUserId} project={project} workspace={workspace} />
      ) : canManageWorkspace && activeTab === "Settings" ? (
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
          onOpenCard={openCard}
          onStatusChange={updateCardStatus}
          statuses={statusOptions}
        />
      ) : activeTab === "Development" ? (
        <ProjectDevelopment
          development={projectDevelopment}
          isLoading={isLoadingDevelopment}
          onOpenCard={(developmentCard) => openCard(mapCard(developmentCard))}
        />
      ) : canManageWorkspace && activeTab === "Archived Work Items" ? (
        <ProjectArchivedWorkItems
          archivedCards={archivedCardItems}
          archivedEpics={archivedEpics}
          archivedSprints={archivedSprints}
          onPermanentlyDeleteCard={permanentlyDeleteCard}
          onPermanentlyDeleteEpic={permanentlyDeleteEpic}
          onPermanentlyDeleteSprint={permanentlyDeleteSprint}
          onRestoreCard={restoreCard}
          onRestoreEpic={restoreEpic}
          onRestoreSprint={restoreSprint}
        />
      ) : activeTab === "Backlog" ? (
        isLoadingEpics ? (
          <div className="board-view-panel">
            <p className="empty-state">Loading epics...</p>
          </div>
        ) : (
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
              setSprintGoal(selectedSprint.goal ?? "");
              setIsEditingSprint(true);
              setSprintMenuEpicId(null);
            }}
            onCardDragStart={handleCardDragStart}
            onDropCardToBacklog={moveCardToBacklog}
            onDropCardToSprint={moveCardToSprint}
            onMoveEpic={reorderVisibleEpics}
            onMoveSprint={moveSprint}
            onOpenCard={openCard}
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
            onStartSprint={async (epicId) => {
              const selectedEpic = epics.find((epic) => epic.id === epicId);
              const selectedSprint = selectedEpic?.sprints?.find((epicSprint) => !epicSprint.archived);
              const selectedSprintCards = selectedSprint?.cards ?? [];
              const selectedSprintStartDisabled =
                !selectedSprint ||
                (!selectedSprint.isStarted &&
                  (selectedSprintCards.length === 0 || !selectedSprint.startDate || !selectedSprint.endDate));

              if (selectedSprintStartDisabled) {
                return;
              }

              setEpicError("");
              try {
                const nextStatus = selectedSprint.isStarted ? "planned" : "active";
                const sprint = mapSprint(await updateSprintRequest(selectedSprint.id, { status: nextStatus }));
                setLocalEpics((currentEpics) =>
                  currentEpics.map((epic) =>
                    epic.id === epicId
                      ? {
                          ...epic,
                          sprints: epic.sprints.map((epicSprint) =>
                            epicSprint.id === selectedSprint.id
                              ? { ...epicSprint, ...sprint, cards: epicSprint.cards }
                              : epicSprint
                          ),
                        }
                      : epic
                  )
                );
                if (nextStatus === "active") {
                  setActiveTab("Board");
                }
              } catch (error) {
                setEpicError(error.message);
              }
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
                (!epicSprint.isStarted &&
                  (epicSprintCards.length === 0 || !epicSprint.startDate || !epicSprint.endDate))
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
        )
      ) : (
        <div className="board-view-panel">
          <p className="empty-state">{activeTab} content will be added later.</p>
        </div>
      )}

      {isEditingSprint && (
        <SprintEditModal
          autoSchedule={autoScheduleSprint}
          endDate={sprintEndDate}
          endTime={sprintEndTime}
          goal={sprintGoal}
          moveOpenWorkTo={moveOpenWorkTo}
          name={sprintName}
          onAutoScheduleChange={setAutoScheduleSprint}
          onClose={() => setIsEditingSprint(false)}
          onEndDateChange={setSprintEndDate}
          onEndTimeChange={setSprintEndTime}
          onGoalChange={setSprintGoal}
          onMoveOpenWorkToChange={setMoveOpenWorkTo}
          onNameChange={setSprintName}
          onStartDateChange={setSprintStartDate}
          onStartTimeChange={setSprintStartTime}
          onUpdate={async () => {
            if (!sprint) {
              return;
            }

            setEpicError("");
            try {
              const updatedSprint = mapSprint(
                await updateSprintRequest(sprint.id, {
                  name: sprintName,
                  goal: sprintGoal || null,
                  start_date: sprintStartDate || null,
                  end_date: sprintEndDate || null,
                })
              );
              setLocalEpics((currentEpics) =>
                currentEpics.map((epic) =>
                  epic.id === activeSprintEpicId
                    ? {
                        ...epic,
                        sprints: (epic.sprints ?? []).map((epicSprint) =>
                          epicSprint.id === sprint.id
                            ? {
                                ...epicSprint,
                                ...updatedSprint,
                                cards: epicSprint.cards,
                              }
                            : epicSprint
                        ),
                      }
                    : epic
                )
              );
              setIsEditingSprint(false);
            } catch (error) {
              setEpicError(error.message);
            }
          }}
          startDate={sprintStartDate}
          startTime={sprintStartTime}
        />
      )}

      {isCreatingEpic && (
        <CreateEpicModal
          onClose={() => setIsCreatingEpic(false)}
          onCreate={async ({ title, deadline }) => {
            setEpicError("");
            try {
              const epic = mapEpic(await createEpicRequest(project.id, { title, deadline }));
              setLocalEpics((currentEpics) => [...currentEpics, epic]);
              setIsCreatingEpic(false);
            } catch (error) {
              setEpicError(error.message);
            }
          }}
        />
      )}

      {editingEpic && (
        <CreateEpicModal
          initialDeadline={editingEpic.deadline ?? ""}
          initialTitle={editingEpic.name}
          mode="edit"
          onClose={() => setEditingEpicId(null)}
          onCreate={async ({ title, deadline }) => {
            setEpicError("");
            try {
              const epic = mapEpic(
                await updateEpicRequest(editingEpic.id, {
                  title,
                  deadline: deadline || null,
                })
              );
              setLocalEpics((currentEpics) =>
                currentEpics.map((currentEpic) =>
                  currentEpic.id === editingEpic.id
                    ? {
                        ...currentEpic,
                        ...epic,
                        cards: currentEpic.cards,
                        sprints: currentEpic.sprints,
                      }
                    : currentEpic
                )
              );
              setEditingEpicId(null);
            } catch (error) {
              setEpicError(error.message);
            }
          }}
        />
      )}

      {isCreatingSprint && (
        <CreateSprintModal
          onClose={() => setIsCreatingSprint(false)}
          onCreate={async ({ title, startDate, endDate }) => {
            setEpicError("");
            try {
              const sprint = mapSprint(
                await createSprintRequest(activeSprintEpicId, {
                  title,
                  startDate,
                  endDate,
                })
              );
              setLocalEpics((currentEpics) =>
                currentEpics.map((epic) =>
                  epic.id === activeSprintEpicId
                    ? {
                        ...epic,
                        sprints: [...(epic.sprints ?? []), sprint],
                      }
                    : epic
                )
              );
              setIsCreatingSprint(false);
            } catch (error) {
              setEpicError(error.message);
            }
          }}
        />
      )}

      {isCreatingCard && (
        <CreateCardModal
          onClose={() => setIsCreatingCard(false)}
          onCreate={async ({ title, description }) => {
            setEpicError("");
            try {
              const card = mapCard(
                await createCardRequest(project.id, {
                  title,
                  description,
                  status: "backlog",
                })
              );
              setCreatedCards((cards) => [...cards, card]);
            } catch (error) {
              setEpicError(error.message);
            }
          }}
        />
      )}

      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          focusTarget={selectedCardFocus}
          linkedWorkItemOptions={linkedWorkItemOptions}
          onArchiveCard={archiveCard}
          onClose={closeCard}
          onCreateStatus={createCustomStatus}
          onStatusChange={updateCardStatus}
          onUpdateCard={updateCardDetails}
          epicOptions={epicOptions}
          projectMembers={projectMembers}
          sprintOptions={sprintOptions}
          statuses={statusOptions}
        />
      )}
    </section>
  );
}

export default ProjectBacklogPage;
