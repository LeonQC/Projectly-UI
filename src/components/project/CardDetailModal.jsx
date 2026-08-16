import React, { useEffect, useRef, useState } from "react";
import {
  createCardAttachment,
  createCardComment,
  createCardGitHubLink,
  createCardLabel,
  createCardLink,
  createCardMember,
  deleteCardAttachment,
  deleteCardComment,
  deleteCardGitHubLink,
  deleteCardLabel,
  deleteCardLink,
  deleteCardMember,
  getCardDevelopment,
  getCardDetail,
  listCommentMentionUsers,
  listProjectMembers,
  updateCardComment,
  updateCardGitHubLink,
} from "../../lib/api.js";

const defaultCardStatuses = [
  { label: "Todo", value: "todo" },
  { label: "In Progress", value: "in-progress" },
  { label: "Done", value: "done" },
];
const cardTabs = ["Members", "Labels", "Attachments"];
const workItemRelations = [
  "is blocked by",
  "blocks",
  "is cloned by",
  "clones",
  "is duplicated by",
  "duplicates",
  "relates to",
];
const labelColors = [
  { name: "Purple", value: "purple" },
  { name: "Green", value: "green" },
  { name: "Blue", value: "blue" },
  { name: "Red", value: "red" },
  { name: "Gray", value: "gray" },
];

function getInitials(name) {
  return (name || "User")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDateTime(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatRelationship(relationship) {
  return relationship.replaceAll("_", " ");
}

function shortenSha(sha) {
  return sha ? sha.slice(0, 7) : "";
}

function toApiRelationship(relationship) {
  return relationship.replaceAll(" ", "_");
}

function fromApiCardStatus(status) {
  return status === "in_progress" ? "in-progress" : status;
}

function mapUser(user) {
  const name = user?.username || user?.email || `User ${user?.id ?? ""}`.trim();
  const username = user?.username ? user.username.replace(/\s+/g, "") : `user-${user?.id ?? "unknown"}`;

  return {
    id: user?.id,
    email: user?.email ?? "",
    initials: getInitials(name),
    name,
    username: `@${username}`,
  };
}

function mapDetailLabel(label) {
  return {
    id: label.id,
    text: label.name,
    color: label.color || "gray",
  };
}

function mapDetailMember(member) {
  return {
    ...mapUser(member.user),
    cardMemberId: member.id,
  };
}

function mapProjectMember(member) {
  return {
    ...mapUser(member.user),
    membershipType: member.membership_type,
    role: member.role,
  };
}

function mapDetailAttachment(attachment) {
  return {
    id: attachment.id,
    name: attachment.file_name,
    size: attachment.file_size ?? 0,
    url: attachment.file_url,
    type: attachment.file_type,
  };
}

function mapDetailComment(comment, projectMembers) {
  const author = projectMembers.find((member) => String(member.id) === String(comment.author_id)) ?? {
    id: comment.author_id,
    initials: getInitials(`User ${comment.author_id}`),
    name: `User ${comment.author_id}`,
    username: `@user-${comment.author_id}`,
  };

  return {
    id: comment.id,
    author,
    body: comment.body,
    attachments: (comment.attachments ?? []).map(mapDetailAttachment),
    createdAt: formatDateTime(comment.created_at),
    editedAt: comment.updated_at !== comment.created_at ? `Edited ${formatDateTime(comment.updated_at)}` : "",
  };
}

function mapDetailLink(link, cardId) {
  const linkedCard = String(link.source_card_id) === String(cardId) ? link.target_card : link.source_card;

  return {
    id: link.id,
    cardId: linkedCard.id,
    relation: formatRelationship(link.relationship),
    title: linkedCard.title,
  };
}

function CardDetailModal({
  card,
  linkedWorkItemOptions = [],
  onArchiveCard,
  onClose,
  onCreateStatus,
  onStatusChange,
  onUpdateCard,
  epicOptions = [],
  projectMembers = [],
  sprintOptions = [],
  statuses = defaultCardStatuses,
}) {
  const [activeTab, setActiveTab] = useState("Members");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [detailCard, setDetailCard] = useState(card);
  const [detailError, setDetailError] = useState("");
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  const [isSavingDetail, setIsSavingDetail] = useState(false);
  const [titleDraft, setTitleDraft] = useState(card.title ?? "");
  const [descriptionDraft, setDescriptionDraft] = useState(card.description ?? "");
  const initialSprintOption = sprintOptions.find((option) => String(option.id) === String(card.sprintId));
  const [epicId, setEpicId] = useState(card.epicId ?? initialSprintOption?.epicId ?? "backlog");
  const [sprintId, setSprintId] = useState(card.sprintId ?? "");
  const [linkedRelation, setLinkedRelation] = useState(workItemRelations[0]);
  const [linkedCardId, setLinkedCardId] = useState("");
  const [linkedWorkItems, setLinkedWorkItems] = useState([]);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatusTitle, setNewStatusTitle] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);
  const [projectAccessMembers, setProjectAccessMembers] = useState(projectMembers);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberPendingRemoveId, setMemberPendingRemoveId] = useState(null);
  const [labelText, setLabelText] = useState("");
  const [labelColor, setLabelColor] = useState("purple");
  const [labelPendingRemoveId, setLabelPendingRemoveId] = useState(null);
  const [labels, setLabels] = useState([]);
  const [cardAttachments, setCardAttachments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [comments, setComments] = useState([]);
  const [development, setDevelopment] = useState(null);
  const [githubRepo, setGithubRepo] = useState("");
  const [githubBranch, setGithubBranch] = useState("");
  const [githubPullRequest, setGithubPullRequest] = useState("");
  const [githubCommit, setGithubCommit] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [editingGitHubLinkId, setEditingGitHubLinkId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [isMentionMenuOpen, setIsMentionMenuOpen] = useState(false);
  const [mentionUsers, setMentionUsers] = useState([]);
  const cardMenuRef = useRef(null);
  const statusMenuRef = useRef(null);
  const memberPickerRef = useRef(null);
  const memberRemoveRef = useRef(null);
  const labelRemoveRef = useRef(null);
  const commentInputRef = useRef(null);
  const commentEditorRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const cardAttachmentInputRef = useRef(null);
  const displayCard = detailCard ?? card;
  const selectedEpicSprints =
    epicId === "backlog"
      ? []
      : sprintOptions.filter((option) => String(option.epicId) === String(epicId));
  const normalizedMemberSearch = memberSearch.trim().replace(/^@/, "").toLowerCase();
  const filteredMembers = projectAccessMembers.filter((member) => {
    const searchValue = [
      member.name,
      member.username,
      member.username?.replace(/^@/, ""),
      member.email,
      member.role,
      member.membershipType,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return (
      searchValue.includes(normalizedMemberSearch) &&
      !selectedMembers.some((selectedMember) => String(selectedMember.id) === String(member.id))
    );
  });
  const currentUser = projectAccessMembers[0] ?? {
    id: "current-user",
    initials: "ME",
    name: "You",
    username: "@you",
  };
  const mentionMatch = commentText.match(/(?:^|\s)@([\w-]*)$/);
  const mentionSearch = mentionMatch?.[1].toLowerCase() ?? "";
  const mentionOptions = isMentionMenuOpen && mentionMatch
    ? mentionUsers.filter((member) => {
        const username = member.username.replace(/^@/, "").toLowerCase();
        return username.includes(mentionSearch) || member.name.toLowerCase().includes(mentionSearch);
      })
    : [];
  const availableLinkedWorkItems = linkedWorkItemOptions.filter((workItem) => String(workItem.id) !== String(card.id));
  const selectedLinkedCard = availableLinkedWorkItems.find((workItem) => String(workItem.id) === String(linkedCardId));
  const hasDuplicateLinkedWorkItem =
    selectedLinkedCard &&
    linkedWorkItems.some(
      (linkedItem) =>
        linkedItem.cardId === selectedLinkedCard.id && linkedItem.relation === linkedRelation
    );

  async function addLinkedWorkItem(event) {
    event.preventDefault();

    if (!selectedLinkedCard || hasDuplicateLinkedWorkItem) {
      return;
    }

    setDetailError("");
    setIsSavingDetail(true);
    try {
      const link = await createCardLink(card.id, {
        relationship: toApiRelationship(linkedRelation),
        targetCardId: Number(selectedLinkedCard.id),
      });
      setLinkedWorkItems((currentItems) => [
        ...currentItems,
        mapDetailLink(link, card.id),
      ]);
      setLinkedCardId("");
      setLinkedRelation(workItemRelations[0]);
    } catch (error) {
      setDetailError(error.message);
    } finally {
      setIsSavingDetail(false);
    }
  }

  function resetGitHubLinkForm() {
    setGithubRepo("");
    setGithubBranch("");
    setGithubPullRequest("");
    setGithubCommit("");
    setGithubUrl("");
    setEditingGitHubLinkId(null);
  }

  function editGitHubLink(link) {
    setDetailError("");
    setGithubRepo(`${link.repo_owner}/${link.repo_name}`);
    setGithubBranch(link.branch_name ?? "");
    setGithubPullRequest(link.pull_request_number ? String(link.pull_request_number) : "");
    setGithubCommit(link.commit_sha ?? "");
    setGithubUrl(link.url ?? "");
    setEditingGitHubLinkId(link.id);
  }

  async function saveGitHubLink(event) {
    event.preventDefault();

    const normalizedRepo = githubRepo.trim().replace(/^https:\/\/github\.com\//, "").replace(/\/$/, "");
    const [repoOwner, repoName] = normalizedRepo.split("/");

    if (!repoOwner || !repoName) {
      setDetailError("GitHub repo must use owner/repo format");
      return;
    }

    if (!githubUrl.trim()) {
      setDetailError("GitHub URL is required");
      return;
    }

    setDetailError("");
    setIsSavingDetail(true);
    try {
      const payload = {
        repo_owner: repoOwner,
        repo_name: repoName,
        branch_name: githubBranch.trim() || null,
        pull_request_number: githubPullRequest ? Number(githubPullRequest) : null,
        commit_sha: githubCommit.trim() || null,
        url: githubUrl.trim() || null,
      };

      if (editingGitHubLinkId) {
        await updateCardGitHubLink(editingGitHubLinkId, payload);
      } else {
        await createCardGitHubLink(card.id, payload);
      }

      const developmentData = await getCardDevelopment(card.id);
      setDevelopment(developmentData);
      resetGitHubLinkForm();
    } catch (error) {
      setDetailError(error.message);
    } finally {
      setIsSavingDetail(false);
    }
  }

  async function removeGitHubLink(githubLinkId) {
    setDetailError("");
    setIsSavingDetail(true);
    try {
      await deleteCardGitHubLink(githubLinkId);
      const developmentData = await getCardDevelopment(card.id);
      setDevelopment(developmentData);
      if (editingGitHubLinkId === githubLinkId) {
        resetGitHubLinkForm();
      }
    } catch (error) {
      setDetailError(error.message);
    } finally {
      setIsSavingDetail(false);
    }
  }

  async function addMember(member) {
    if (selectedMembers.some((selectedMember) => String(selectedMember.id) === String(member.id))) {
      return;
    }

    setDetailError("");
    setIsSavingDetail(true);
    try {
      const cardMember = await createCardMember(card.id, member.id);
      setSelectedMembers((members) => [...members, mapDetailMember(cardMember)]);
      setMemberSearch("");
      setIsMemberPickerOpen(false);
    } catch (error) {
      setDetailError(error.message);
    } finally {
      setIsSavingDetail(false);
    }
  }

  async function addLabel(event) {
    event.preventDefault();

    const normalizedLabel = labelText.trim();

    if (!normalizedLabel) {
      return;
    }

    setDetailError("");
    setIsSavingDetail(true);
    try {
      const label = await createCardLabel(card.id, {
        name: normalizedLabel,
        color: labelColor,
      });
      setLabels((currentLabels) => [...currentLabels, mapDetailLabel(label)]);
      setLabelText("");
    } catch (error) {
      setDetailError(error.message);
    } finally {
      setIsSavingDetail(false);
    }
  }

  async function removeMember(memberId) {
    const member = selectedMembers.find((selectedMember) => String(selectedMember.id) === String(memberId));

    if (!member?.cardMemberId) {
      return;
    }

    setDetailError("");
    setIsSavingDetail(true);
    try {
      await deleteCardMember(member.cardMemberId);
      setSelectedMembers((members) => members.filter((currentMember) => String(currentMember.id) !== String(memberId)));
      setMemberPendingRemoveId(null);
    } catch (error) {
      setDetailError(error.message);
    } finally {
      setIsSavingDetail(false);
    }
  }

  async function removeLabel(labelId) {
    setDetailError("");
    setIsSavingDetail(true);
    try {
      await deleteCardLabel(labelId);
      setLabels((currentLabels) => currentLabels.filter((label) => String(label.id) !== String(labelId)));
      setLabelPendingRemoveId(null);
    } catch (error) {
      setDetailError(error.message);
    } finally {
      setIsSavingDetail(false);
    }
  }

  function createStatus(event) {
    event.preventDefault();

    if (!newStatusTitle.trim()) {
      return;
    }

    const newStatus = onCreateStatus?.(newStatusTitle.trim());

    if (newStatus?.value) {
      onStatusChange?.(card.id, newStatus.value);
    }
    setNewStatusTitle("");
    setIsStatusMenuOpen(false);
    setIsStatusModalOpen(false);
  }

  function addCommentAttachments(event) {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    setCommentAttachments((currentAttachments) => [
      ...currentAttachments,
      ...selectedFiles.map((file) => ({
        id: `attachment-${file.name}-${file.lastModified}-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type || null,
        url: URL.createObjectURL(file),
      })),
    ]);
    event.target.value = "";
  }

  async function addCardAttachments(event) {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    setDetailError("");
    setIsSavingDetail(true);
    try {
      const savedAttachments = await Promise.all(
        selectedFiles.map((file) =>
          createCardAttachment(card.id, {
            fileName: file.name,
            fileUrl: URL.createObjectURL(file),
            fileType: file.type || null,
            fileSize: file.size,
          })
        )
      );
      setCardAttachments((currentAttachments) => [
        ...currentAttachments,
        ...savedAttachments.map(mapDetailAttachment),
      ]);
    } catch (error) {
      setDetailError(error.message);
    } finally {
      event.target.value = "";
      setIsSavingDetail(false);
    }
  }

  async function removeCardAttachment(attachmentId) {
    setDetailError("");
    setIsSavingDetail(true);
    try {
      await deleteCardAttachment(attachmentId);
      setCardAttachments((attachments) =>
        attachments.filter((attachment) => String(attachment.id) !== String(attachmentId))
      );
    } catch (error) {
      setDetailError(error.message);
    } finally {
      setIsSavingDetail(false);
    }
  }

  async function removeLinkedWorkItem(linkId) {
    setDetailError("");
    setIsSavingDetail(true);
    try {
      await deleteCardLink(linkId);
      setLinkedWorkItems((currentItems) =>
        currentItems.filter((item) => String(item.id) !== String(linkId))
      );
    } catch (error) {
      setDetailError(error.message);
    } finally {
      setIsSavingDetail(false);
    }
  }

  function formatAttachmentSize(size) {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${Math.round(size / 1024)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  function insertMention(member) {
    const mentionLabel = member.username.startsWith("@") ? member.username : `@${member.username}`;
    const nextText = mentionMatch
      ? `${commentText.slice(0, mentionMatch.index)} ${mentionLabel} `
      : `${commentText}${commentText.endsWith(" ") || commentText.length === 0 ? "" : " "}${mentionLabel} `;

    setCommentText(nextText.replace(/^\s+/, ""));
    setIsMentionMenuOpen(false);
    window.requestAnimationFrame(() => commentInputRef.current?.focus());
  }

  function openMentionMenu() {
    if (mentionMatch) {
      setIsMentionMenuOpen(true);
      window.requestAnimationFrame(() => commentInputRef.current?.focus());
      return;
    }

    setCommentText((currentText) => `${currentText}${currentText.endsWith(" ") || currentText.length === 0 ? "" : " "}@`);
    setIsMentionMenuOpen(true);
    window.requestAnimationFrame(() => commentInputRef.current?.focus());
  }

  async function publishComment(event) {
    event.preventDefault();

    const trimmedComment = commentText.trim();

    if (!trimmedComment) {
      return;
    }

    setDetailError("");
    setIsSavingDetail(true);
    try {
      const comment = await createCardComment(card.id, {
        body: trimmedComment,
        attachments: commentAttachments,
      });
      setComments((currentComments) => [
        mapDetailComment(comment, projectAccessMembers),
        ...currentComments,
      ]);
      setCommentText("");
      setCommentAttachments([]);
      setIsMentionMenuOpen(false);
    } catch (error) {
      setDetailError(error.message);
    } finally {
      setIsSavingDetail(false);
    }
  }

  function startEditingComment(comment) {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.body);
  }

  function cancelEditingComment() {
    setEditingCommentId(null);
    setEditingCommentText("");
  }

  async function saveEditedComment(comment) {
    const trimmedComment = editingCommentText.trim();

    if (!trimmedComment) {
      return;
    }

    setDetailError("");
    setIsSavingDetail(true);
    try {
      const updatedComment = await updateCardComment(comment.id, { body: trimmedComment });
      setComments((currentComments) =>
        currentComments.map((currentComment) =>
          currentComment.id === comment.id
            ? mapDetailComment(updatedComment, projectAccessMembers)
            : currentComment
        )
      );
      cancelEditingComment();
    } catch (error) {
      setDetailError(error.message);
    } finally {
      setIsSavingDetail(false);
    }
  }

  async function removeComment(commentId) {
    setDetailError("");
    setIsSavingDetail(true);
    try {
      await deleteCardComment(commentId);
      setComments((currentComments) =>
        currentComments.filter((comment) => String(comment.id) !== String(commentId))
      );
    } catch (error) {
      setDetailError(error.message);
    } finally {
      setIsSavingDetail(false);
    }
  }

  function saveCardDetails() {
    const trimmedTitle = titleDraft.trim();

    if (!trimmedTitle) {
      return;
    }

    onUpdateCard?.(card.id, {
      description: descriptionDraft.trim(),
      epicId: epicId === "backlog" ? null : epicId,
      title: trimmedTitle,
      sprintId: sprintId || null,
    });
    onClose();
  }

  useEffect(() => {
    let isMounted = true;

    async function loadCardDetail() {
      setIsLoadingDetail(true);
      setDetailError("");
      setDetailCard(card);
      setTitleDraft(card.title ?? "");
      setDescriptionDraft(card.description ?? "");
      const cardSprintOption = sprintOptions.find((option) => String(option.id) === String(card.sprintId));
      setEpicId(card.epicId ?? cardSprintOption?.epicId ?? "backlog");
      setSprintId(card.sprintId ?? "");
      setLabels([]);
      setSelectedMembers([]);
      setCardAttachments([]);
      setComments([]);
      setLinkedWorkItems([]);
      setMentionUsers([]);
      setDevelopment(null);

      try {
        const [detail, developmentData] = await Promise.all([
          getCardDetail(card.id),
          getCardDevelopment(card.id),
        ]);

        if (!isMounted) {
          return;
        }

        const nextCard = {
          ...card,
          ...detail.card,
          status: fromApiCardStatus(detail.card.status) ?? card.status,
          sprintId: detail.card.sprint_id ?? card.sprintId ?? null,
          sprint_id: detail.card.sprint_id ?? card.sprintId ?? null,
          epicId: detail.card.epic_id ?? card.epicId ?? null,
          epic_id: detail.card.epic_id ?? card.epicId ?? null,
        };
        const [projectMemberData, mentionUserData] = await Promise.all([
          listProjectMembers(nextCard.project_id),
          listCommentMentionUsers(card.id),
        ]);
        const mappedProjectMembers = (projectMemberData ?? []).map(mapProjectMember);

        setDetailCard(nextCard);
        setTitleDraft(nextCard.title ?? "");
        setDescriptionDraft(nextCard.description ?? "");
        const nextSprintOption = sprintOptions.find((option) => String(option.id) === String(nextCard.sprintId));
        setEpicId(nextCard.epicId ?? nextSprintOption?.epicId ?? "backlog");
        setSprintId(nextCard.sprintId ?? "");
        setProjectAccessMembers(mappedProjectMembers);
        setMentionUsers((mentionUserData ?? []).map(mapUser));
        setLabels((detail.labels ?? []).map(mapDetailLabel));
        setSelectedMembers((detail.members ?? []).map(mapDetailMember));
        setCardAttachments((detail.attachments ?? []).map(mapDetailAttachment));
        setComments((detail.comments ?? []).map((comment) => mapDetailComment(comment, mappedProjectMembers)));
        setLinkedWorkItems((detail.links ?? []).map((link) => mapDetailLink(link, card.id)));
        setDevelopment(developmentData);
      } catch (error) {
        if (isMounted) {
          setDetailError(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoadingDetail(false);
        }
      }
    }

    loadCardDetail();

    return () => {
      isMounted = false;
    };
  }, [card.id]);

  useEffect(() => {
    function closeDropdownsOnOutsideClick(event) {
      if (cardMenuRef.current && !cardMenuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }

      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target)) {
        setIsStatusMenuOpen(false);
      }

      if (memberRemoveRef.current && !memberRemoveRef.current.contains(event.target)) {
        setMemberPendingRemoveId(null);
      }

      if (memberPickerRef.current && !memberPickerRef.current.contains(event.target)) {
        setIsMemberPickerOpen(false);
      }

      if (labelRemoveRef.current && !labelRemoveRef.current.contains(event.target)) {
        setLabelPendingRemoveId(null);
      }

      if (commentEditorRef.current && !commentEditorRef.current.contains(event.target)) {
        setIsMentionMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeDropdownsOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeDropdownsOnOutsideClick);
    };
  }, []);

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="card-detail-modal" aria-labelledby="card-detail-title" role="dialog" aria-modal="true">
        <header className="card-detail-header">
          <div className="card-detail-meta">
            <div className="card-status-field" ref={statusMenuRef}>
              <span>Status</span>
              <button
                className="card-status-select"
                type="button"
                aria-expanded={isStatusMenuOpen}
                onClick={() => setIsStatusMenuOpen((isOpen) => !isOpen)}
              >
                {statuses.find((status) => status.value === displayCard.status)?.label ?? "Todo"}
                <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
                  <path d="m6 9 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
              {isStatusMenuOpen && (
                <div className="card-status-dropdown card-detail-status-dropdown" role="menu">
                  {statuses.map((status) => (
                    <button
                      className={displayCard.status === status.value ? "is-active" : ""}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onStatusChange?.(card.id, status.value);
                        setIsStatusMenuOpen(false);
                      }}
                      key={status.value}
                    >
                      {status.label}
                    </button>
                  ))}
                  <button
                    className="create-status-menu-item"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsStatusMenuOpen(false);
                      setIsStatusModalOpen(true);
                    }}
                  >
                    Create new status
                  </button>
                </div>
              )}
            </div>

            <label className="card-status-field">
              <span>Epic</span>
              <span className="card-select-wrapper">
                <select
                  className="card-status-select"
                  value={epicId}
                  onChange={(event) => {
                    const nextEpicId = event.target.value;
                    setEpicId(nextEpicId);
                    setSprintId("");
                  }}
                >
                  <option value="backlog">Backlog</option>
                  {epicOptions.map((option) => (
                    <option value={option.id} key={option.id}>
                      {option.title}
                    </option>
                  ))}
                </select>
                <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
                  <path d="m6 9 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </span>
            </label>

            <label className="card-status-field">
              <span>Sprint</span>
              <span className="card-select-wrapper">
                <select
                  className="card-status-select"
                  value={sprintId}
                  onChange={(event) => setSprintId(event.target.value)}
                  disabled={epicId === "backlog"}
                >
                  <option value="">No sprint</option>
                  {selectedEpicSprints.map((option) => (
                    <option value={option.id} key={option.id}>
                      {option.title}
                    </option>
                  ))}
                </select>
                <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
                  <path d="m6 9 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </span>
            </label>
          </div>

          <div className="card-detail-actions">
            <div className="card-menu-wrapper" ref={cardMenuRef}>
              <button
                className="icon-button"
                type="button"
                aria-label="Open card menu"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
              >
                ...
              </button>
              {isMenuOpen && (
                <div className="sprint-menu card-actions-menu" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onArchiveCard?.(card.id);
                      setIsMenuOpen(false);
                    }}
                  >
                    Archive card
                  </button>
                </div>
              )}
            </div>
            <button className="modal-close-button" type="button" aria-label="Close card detail" onClick={onClose}>
              <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </header>

        <div className="card-detail-body">
          <section className="card-detail-main">
            <label className="card-title-row">
              <input type="checkbox" defaultChecked={displayCard.completed} />
              <input
                className="card-title-input"
                id="card-detail-title"
                type="text"
                value={titleDraft}
                aria-label="Card title"
                onChange={(event) => setTitleDraft(event.target.value)}
              />
            </label>
            {isLoadingDetail && <p className="empty-state">Loading card details...</p>}
            {detailError && <p className="app-error">{detailError}</p>}

            <nav className="card-detail-tabs" aria-label="Card detail tabs">
              {cardTabs.map((tab) => (
                <button
                  className={`card-detail-tab ${activeTab === tab ? "is-active" : ""}`}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  key={tab}
                >
                  {tab}
                </button>
              ))}
            </nav>

            <div className="card-tab-panel">
              {activeTab === "Members" ? (
                <div className="card-member-editor">
                  <div className="member-picker" ref={memberPickerRef}>
                    <input
                      type="search"
                      placeholder="Search project members"
                      value={memberSearch}
                      onFocus={() => setIsMemberPickerOpen(true)}
                      onChange={(event) => {
                        setMemberSearch(event.target.value);
                        setIsMemberPickerOpen(true);
                      }}
                    />
                    {isMemberPickerOpen && (
                      <div className="member-search-dropdown" role="listbox" aria-label="Project members">
                        {filteredMembers.map((member) => (
                          <button
                            type="button"
                            disabled={isSavingDetail}
                            onClick={() => addMember(member)}
                            key={member.id}
                          >
                            <span className="member-avatar">{member.initials}</span>
                            <span>{member.name}</span>
                            <small>{member.email || member.username}</small>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="selected-member-list">
                    {selectedMembers.map((member) => (
                      <span
                        className="selected-member-chip"
                        key={member.id}
                        ref={memberPendingRemoveId === member.id ? memberRemoveRef : null}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          setMemberPendingRemoveId(member.id);
                        }}
                      >
                        <button
                          className="selected-member-avatar-button"
                          type="button"
                          aria-label={member.name}
                        >
                          <span className="member-avatar">{member.initials}</span>
                        </button>
                        {member.name}
                        {memberPendingRemoveId === member.id && (
                          <span className="chip-remove-dropdown">
                            <button
                              type="button"
                              onClick={() => removeMember(member.id)}
                            >
                              Remove
                            </button>
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ) : activeTab === "Labels" ? (
                <div className="card-label-editor">
                  <form className="label-create-row" onSubmit={addLabel}>
                    <input
                      type="text"
                      placeholder="Label text"
                      value={labelText}
                      onChange={(event) => setLabelText(event.target.value)}
                    />
                    <select value={labelColor} onChange={(event) => setLabelColor(event.target.value)}>
                      {labelColors.map((color) => (
                        <option value={color.value} key={color.value}>
                          {color.name}
                        </option>
                      ))}
                    </select>
                    <button className="small-action-button" type="submit" disabled={isSavingDetail || !labelText.trim()}>
                      Add label
                    </button>
                  </form>
                  <div className="card-label-options">
                    {labels.map((label) => (
                      <span className="card-label-wrapper" key={label.id} ref={labelPendingRemoveId === label.id ? labelRemoveRef : null}>
                        <button
                          className={`card-label is-${label.color}`}
                          type="button"
                          onClick={() => setLabelPendingRemoveId(label.id)}
                        >
                          {label.text}
                        </button>
                        {labelPendingRemoveId === label.id && (
                          <span className="chip-remove-dropdown">
                            <button
                              type="button"
                              onClick={() => removeLabel(label.id)}
                            >
                              Remove
                            </button>
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="card-attachment-panel">
                  <input
                    ref={cardAttachmentInputRef}
                    className="visually-hidden"
                    type="file"
                    multiple
                    onChange={addCardAttachments}
                  />
                  <button
                    className="small-action-button"
                    type="button"
                    disabled={isSavingDetail}
                    onClick={() => cardAttachmentInputRef.current?.click()}
                  >
                    Add attachment
                  </button>
                  <div className="comment-item-attachments">
                    {cardAttachments.map((attachment) => (
                      <span className="card-attachment-item" key={attachment.id}>
                        <a href={attachment.url} target="_blank" rel="noreferrer">
                          <svg aria-hidden="true" fill="none" height="13" viewBox="0 0 24 24" width="13">
                            <path d="m21.4 11.6-8.8 8.8a6 6 0 0 1-8.5-8.5l9.4-9.4a4 4 0 0 1 5.7 5.7L9.7 17.7a2 2 0 1 1-2.8-2.8l8.8-8.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          </svg>
                          {attachment.name}
                        </a>
                        <button type="button" disabled={isSavingDetail} onClick={() => removeCardAttachment(attachment.id)}>
                          Remove
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <section className="linked-work-items-section">
              <header>
                <h3>Linked work items</h3>
              </header>

              <form className="linked-work-item-form" onSubmit={addLinkedWorkItem}>
                <label>
                  <span>Relationship</span>
                  <select
                    value={linkedRelation}
                    onChange={(event) => setLinkedRelation(event.target.value)}
                  >
                    {workItemRelations.map((relation) => (
                      <option value={relation} key={relation}>
                        {relation}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Card</span>
                  <select
                    value={linkedCardId}
                    onChange={(event) => setLinkedCardId(event.target.value)}
                  >
                    <option value="">Select card</option>
                    {availableLinkedWorkItems.map((workItem) => (
                      <option value={workItem.id} key={workItem.id}>
                        {workItem.title}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  className="small-action-button"
                  type="submit"
                  disabled={!selectedLinkedCard || hasDuplicateLinkedWorkItem || isSavingDetail}
                >
                  Add linked item
                </button>
              </form>

              <div className="linked-work-item-list">
                {linkedWorkItems.length > 0 ? (
                  linkedWorkItems.map((linkedItem) => (
                    <article className="linked-work-item" key={linkedItem.id}>
                      <div>
                        <span>{linkedItem.relation}</span>
                        <strong>{linkedItem.title}</strong>
                      </div>
                      <button
                        className="small-action-button"
                        type="button"
                        disabled={isSavingDetail}
                        onClick={() => removeLinkedWorkItem(linkedItem.id)}
                      >
                        Remove
                      </button>
                    </article>
                  ))
                ) : (
                  <p className="linked-work-item-empty">No linked work items yet.</p>
                )}
              </div>
            </section>

            <section className="card-description-section">
              <header>
                <h3>Description</h3>
              </header>
              <textarea
                value={descriptionDraft}
                rows="5"
                aria-label="Card description"
                placeholder="Add a description."
                onChange={(event) => setDescriptionDraft(event.target.value)}
              />
            </section>

            <section className="card-development-section">
              <header>
                <h3>Development</h3>
              </header>
              <form className="github-link-form" onSubmit={saveGitHubLink}>
                <label>
                  <span className="field-label-text">
                    Repository <span className="required-mark">*</span>
                  </span>
                  <input
                    type="text"
                    placeholder="owner/repo"
	            required
	            value={githubRepo}
	            onChange={(event) => setGithubRepo(event.target.value)}
	          />
                </label>
                <label>
                  Branch
                  <input
                    type="text"
                    placeholder="main"
                    value={githubBranch}
                    onChange={(event) => setGithubBranch(event.target.value)}
                  />
                </label>
                <label>
                  Pull Request
                  <input
                    type="number"
                    min="1"
                    placeholder="12"
                    value={githubPullRequest}
                    onChange={(event) => setGithubPullRequest(event.target.value)}
                  />
                </label>
                <label>
                  Commit
                  <input
                    type="text"
                    placeholder="commit sha"
                    value={githubCommit}
                    onChange={(event) => setGithubCommit(event.target.value)}
                  />
                </label>
                <label className="github-link-url-field">
                  <span className="field-label-text">
                    URL <span className="required-mark">*</span>
                  </span>
                  <input
                    type="url"
                    placeholder="https://github.com/owner/repo"
	            required
	            value={githubUrl}
	            onChange={(event) => setGithubUrl(event.target.value)}
	          />
	        </label>
	        <button
	          className="small-action-button"
	          type="submit"
	          disabled={!githubRepo.trim() || !githubUrl.trim() || isSavingDetail}
	        >
                  {editingGitHubLinkId ? "Save GitHub Link" : "Link GitHub"}
                </button>
                {editingGitHubLinkId && (
                  <button
                    className="small-action-button"
                    type="button"
                    disabled={isSavingDetail}
                    onClick={resetGitHubLinkForm}
                  >
                    Cancel Edit
                  </button>
                )}
              </form>

              {development?.development_status?.has_github_links ? (
                <div className="github-development-panel">
                  <div className="github-development-summary">
                    <span>{development.development_status.link_count} links</span>
                    <span>{development.development_status.branch_count} branches</span>
                    <span>{development.development_status.pull_request_count} pull requests</span>
                    <span>{development.development_status.commit_count} commits</span>
                  </div>

                  <div className="github-link-list">
                    {development.github_links.map((link) => (
                      <article className="github-link-item" key={link.id}>
                        <div>
                          <strong>{link.repo_owner}/{link.repo_name}</strong>
                          <span>
                            {[
                              link.branch_name ? `branch ${link.branch_name}` : "",
                              link.pull_request_number ? `pull request #${link.pull_request_number}` : "",
                              link.commit_sha ? `commit ${shortenSha(link.commit_sha)}` : "",
                            ].filter(Boolean).join(" · ") || "Repository link"}
                          </span>
                        </div>
                        <div className="github-link-actions">
                          <button
                            className="small-action-button"
                            type="button"
                            disabled={isSavingDetail}
                            onClick={() => editGitHubLink(link)}
                          >
                            Edit
                          </button>
                          <button
                            className="small-action-button"
                            type="button"
                            disabled={isSavingDetail}
                            onClick={() => removeGitHubLink(link.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>

                  {development.branches.length > 0 && (
                    <div className="github-development-list">
                      <h4>Branches</h4>
                      {development.branches.map((branch) => (
                        <a
                          href={branch.latest_commit_url}
                          target="_blank"
                          rel="noreferrer"
                          key={`${branch.repo_owner}/${branch.repo_name}/${branch.name}`}
                        >
                          <strong>{branch.name}</strong>
                          <span>{shortenSha(branch.latest_commit_sha)}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {development.pull_requests.length > 0 && (
                    <div className="github-development-list">
                      <h4>Pull requests</h4>
                      {development.pull_requests.map((pullRequest) => (
                        <a
                          href={pullRequest.url}
                          target="_blank"
                          rel="noreferrer"
                          key={`${pullRequest.repo_owner}/${pullRequest.repo_name}/${pullRequest.number}`}
                        >
                          <strong>#{pullRequest.number} {pullRequest.title}</strong>
                          <span>{pullRequest.merged ? "merged" : pullRequest.state}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {[...(development.linked_commits ?? []), ...(development.recent_commits ?? [])].length > 0 && (
                    <div className="github-development-list">
                      <h4>Commits</h4>
                      {[...(development.linked_commits ?? []), ...(development.recent_commits ?? [])]
                        .slice(0, 6)
                        .map((commit) => (
                          <a href={commit.url} target="_blank" rel="noreferrer" key={`${commit.repo_owner}/${commit.repo_name}/${commit.sha}`}>
                            <strong>{commit.message.split("\n")[0]}</strong>
                            <span>{shortenSha(commit.sha)} · {commit.author_name ?? "Unknown author"}</span>
                          </a>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="github-development-empty">No GitHub links yet.</p>
              )}
            </section>
          </section>

          <aside className="card-detail-side">
            <section className="comments-activity-panel">
              <header>
                <h3>Comments</h3>
              </header>
              <form className="comment-composer" onSubmit={publishComment}>
                <div className="comment-composer-header">
                  <span className="member-avatar">{currentUser.initials}</span>
                  <strong>{currentUser.name}</strong>
                </div>
                <div className="comment-editor" ref={commentEditorRef}>
                  <textarea
                    ref={commentInputRef}
                    value={commentText}
                    placeholder="Write a comment. Type @ to mention someone."
                    rows="4"
                    onChange={(event) => {
                      const nextValue = event.target.value;

                      setCommentText(nextValue);
                      setIsMentionMenuOpen(/(?:^|\s)@[\w-]*$/.test(nextValue));
                    }}
                  />
                  {mentionOptions.length > 0 && (
                    <div className="mention-menu" role="listbox" aria-label="Mention users">
                      {mentionOptions.map((member) => (
                        <button type="button" role="option" onClick={() => insertMention(member)} key={member.id}>
                          <span className="member-avatar">{member.initials}</span>
                          <span>
                            <strong>{member.name}</strong>
                            <small>{member.username}</small>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {commentAttachments.length > 0 && (
                  <div className="comment-attachment-list" aria-label="Selected attachments">
                    {commentAttachments.map((attachment) => (
                      <span className="comment-attachment-chip" key={attachment.id}>
                        <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
                          <path d="m21.4 11.6-8.8 8.8a6 6 0 0 1-8.5-8.5l9.4-9.4a4 4 0 0 1 5.7 5.7L9.7 17.7a2 2 0 1 1-2.8-2.8l8.8-8.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                        <span>
                          {attachment.name}
                          <small>{formatAttachmentSize(attachment.size)}</small>
                        </span>
                        <button
                          type="button"
                          aria-label={`Remove ${attachment.name}`}
                          onClick={() =>
                            setCommentAttachments((currentAttachments) =>
                              currentAttachments.filter((item) => item.id !== attachment.id)
                            )
                          }
                        >
                          <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
                            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="comment-composer-actions">
                  <div className="comment-tool-actions">
                    <button
                      className="small-action-button"
                      type="button"
                      disabled={isSavingDetail}
                      onClick={openMentionMenu}
                    >
                      @user
                    </button>
                    <input
                      ref={attachmentInputRef}
                      className="visually-hidden"
                      type="file"
                      multiple
                      onChange={addCommentAttachments}
                    />
                    <button
                      className="small-action-button"
                      type="button"
                      disabled={isSavingDetail}
                      onClick={() => attachmentInputRef.current?.click()}
                    >
                      <svg aria-hidden="true" fill="none" height="15" viewBox="0 0 24 24" width="15">
                        <path d="m21.4 11.6-8.8 8.8a6 6 0 0 1-8.5-8.5l9.4-9.4a4 4 0 0 1 5.7 5.7L9.7 17.7a2 2 0 1 1-2.8-2.8l8.8-8.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                      Attach
                    </button>
                  </div>
                  <button
                    className="modal-update-button"
                    type="submit"
                    disabled={isSavingDetail || !commentText.trim()}
                  >
                    Comment
                  </button>
                </div>
              </form>

              <div className="comment-feed">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <article className="comment-item" key={comment.id}>
                      <span className="member-avatar">{comment.author.initials}</span>
                      <div>
                        <header>
                          <div>
                            <strong>{comment.author.name}</strong>
                            <span>{comment.createdAt}</span>
                            {comment.editedAt && <span>{comment.editedAt}</span>}
                          </div>
                          {editingCommentId !== comment.id && (
                            <div className="comment-header-actions">
                              <button
                                className="comment-edit-button"
                                type="button"
                                disabled={isSavingDetail}
                                onClick={() => startEditingComment(comment)}
                              >
                                Edit
                              </button>
                              <button
                                className="comment-edit-button"
                                type="button"
                                disabled={isSavingDetail}
                                onClick={() => removeComment(comment.id)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </header>
                        {editingCommentId === comment.id ? (
                          <div className="comment-edit-form">
                            <textarea
                              value={editingCommentText}
                              rows="3"
                              aria-label="Edit comment"
                              onChange={(event) => setEditingCommentText(event.target.value)}
                            />
                            <div className="comment-edit-actions">
                              <button
                                className="modal-cancel-button"
                                type="button"
                                onClick={cancelEditingComment}
                              >
                                Cancel
                              </button>
                              <button
                                className="modal-update-button"
                                type="button"
                                disabled={isSavingDetail || !editingCommentText.trim()}
                                onClick={() => saveEditedComment(comment)}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          comment.body && <p>{comment.body}</p>
                        )}
                        {comment.attachments.length > 0 && (
                          <div className="comment-item-attachments">
                            {comment.attachments.map((attachment) => (
                              <span key={attachment.id}>
                                <svg aria-hidden="true" fill="none" height="13" viewBox="0 0 24 24" width="13">
                                  <path d="m21.4 11.6-8.8 8.8a6 6 0 0 1-8.5-8.5l9.4-9.4a4 4 0 0 1 5.7 5.7L9.7 17.7a2 2 0 1 1-2.8-2.8l8.8-8.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                </svg>
                                {attachment.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="empty-state">No comments yet.</p>
                )}
              </div>
            </section>
          </aside>
        </div>

        <footer className="card-detail-footer">
          <button className="modal-cancel-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="modal-update-button"
            type="button"
            disabled={!titleDraft.trim()}
            onClick={saveCardDetails}
          >
            Save
          </button>
        </footer>
        {isStatusModalOpen && (
          <div className="modal-backdrop nested-modal-backdrop" role="presentation">
            <section className="simple-modal" aria-labelledby="card-create-status-title" role="dialog" aria-modal="true">
              <header className="simple-modal-header">
                <h2 id="card-create-status-title">Create new status</h2>
                <button
                  className="modal-close-button"
                  type="button"
                  aria-label="Close create status modal"
                  onClick={() => setIsStatusModalOpen(false)}
                >
                  <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
                    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                  </svg>
                </button>
              </header>
              <form className="simple-modal-form" onSubmit={createStatus}>
                <label className="modal-field">
                  <strong>
                    Title <span className="required-mark">*</span>
                  </strong>
                  <input
                    type="text"
                    value={newStatusTitle}
                    onChange={(event) => setNewStatusTitle(event.target.value)}
                    autoFocus
                  />
                </label>
                <footer className="sprint-modal-footer">
                  <button className="modal-cancel-button" type="button" onClick={() => setIsStatusModalOpen(false)}>
                    Cancel
                  </button>
                  <button className="modal-update-button" type="submit">
                    Create
                  </button>
                </footer>
              </form>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}

export default CardDetailModal;
