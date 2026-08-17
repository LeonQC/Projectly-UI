const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";
const AUTH_TOKEN_KEY = "projectly_access_token";

export function getAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function apiFetch(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("You do not have permission to perform this action.");
    }

    const detail = payload?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg).join(" ")
      : detail ?? payload?.message ?? "Request failed";
    throw new Error(message);
  }

  return payload;
}

export async function loginUser({ email, password }) {
  const payload = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return payload.data;
}

export async function registerUser({ username, email, password }) {
  const payload = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
  return payload.data;
}

export async function googleAuth(idToken) {
  const payload = await apiFetch("/auth/google", {
    method: "POST",
    body: JSON.stringify({ id_token: idToken }),
  });
  return payload.data;
}

export async function getCurrentUser() {
  const payload = await apiFetch("/auth/me");
  return payload.data;
}

export async function getUserSettings() {
  const payload = await apiFetch("/user-settings");
  return payload.data;
}

export async function updateUsername(username) {
  const payload = await apiFetch("/user-settings/username", {
    method: "PATCH",
    body: JSON.stringify({ username }),
  });
  return payload.data;
}

export async function updateEmail(email) {
  const payload = await apiFetch("/user-settings/email", {
    method: "PATCH",
    body: JSON.stringify({ email }),
  });
  return payload.data;
}

export async function updateUserTheme(theme) {
  const payload = await apiFetch("/user-settings/theme", {
    method: "PATCH",
    body: JSON.stringify({ theme }),
  });
  return payload.data;
}

export async function listWorkspaces() {
  const payload = await apiFetch("/workspaces");
  return payload.data;
}

export async function listArchivedWorkspaces() {
  const payload = await apiFetch("/workspaces/deleted");
  return payload.data;
}

export async function createWorkspace({ name }) {
  const payload = await apiFetch("/workspaces", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return payload.data;
}

export async function updateWorkspace(workspaceId, updates) {
  const payload = await apiFetch(`/workspaces/${workspaceId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return payload.data;
}

export async function archiveWorkspace(workspaceId) {
  const payload = await apiFetch(`/workspaces/${workspaceId}`, {
    method: "DELETE",
  });
  return payload;
}

export async function restoreWorkspace(workspaceId) {
  const payload = await apiFetch(`/workspaces/${workspaceId}/restore`, {
    method: "PATCH",
  });
  return payload.data;
}

export async function permanentlyDeleteWorkspace(workspaceId) {
  return apiFetch(`/workspaces/${workspaceId}/permanent`, {
    method: "DELETE",
  });
}

export async function listWorkspaceProjects(workspaceId) {
  const payload = await apiFetch(`/workspaces/${workspaceId}/projects`);
  return payload.data;
}

export async function listWorkspaceMembers(workspaceId) {
  const payload = await apiFetch(`/workspaces/${workspaceId}/members`);
  return payload.data;
}

export async function deleteWorkspaceMember(memberId) {
  return apiFetch(`/workspaces/members/${memberId}`, {
    method: "DELETE",
  });
}

export async function listArchivedProjects() {
  const payload = await apiFetch("/projects/deleted");
  return payload.data;
}

export async function listGuestProjects() {
  const payload = await apiFetch("/projects/guest");
  return payload.data;
}

export async function createProject(workspaceId, { description, title }) {
  const payload = await apiFetch(`/workspaces/${workspaceId}/projects`, {
    method: "POST",
    body: JSON.stringify({
      name: title,
      description,
    }),
  });
  return payload.data;
}

export async function getProject(projectId) {
  const payload = await apiFetch(`/projects/${projectId}`);
  return payload.data;
}

export async function listProjectMembers(projectId) {
  const payload = await apiFetch(`/projects/${projectId}/members`);
  return payload.data;
}

export async function deleteProjectMember(memberId) {
  return apiFetch(`/projects/members/${memberId}`, {
    method: "DELETE",
  });
}

export async function updateProject(projectId, updates) {
  const payload = await apiFetch(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return payload.data;
}

export async function archiveProject(projectId) {
  return apiFetch(`/projects/${projectId}`, {
    method: "DELETE",
  });
}

export async function restoreProject(projectId) {
  const payload = await apiFetch(`/projects/${projectId}/restore`, {
    method: "PATCH",
  });
  return payload.data;
}

export async function permanentlyDeleteProject(projectId) {
  return apiFetch(`/projects/${projectId}/permanent`, {
    method: "DELETE",
  });
}

export async function listProjectEpics(projectId) {
  const payload = await apiFetch(`/projects/${projectId}/epics`);
  return payload.data;
}

export async function createEpic(projectId, { deadline, title }) {
  const payload = await apiFetch(`/projects/${projectId}/epics`, {
    method: "POST",
    body: JSON.stringify({
      title,
      deadline: deadline || null,
    }),
  });
  return payload.data;
}

export async function getEpic(epicId) {
  const payload = await apiFetch(`/epics/${epicId}`);
  return payload.data;
}

export async function updateEpic(epicId, updates) {
  const payload = await apiFetch(`/epics/${epicId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return payload.data;
}

export async function archiveEpic(epicId) {
  return apiFetch(`/epics/${epicId}`, {
    method: "DELETE",
  });
}

export async function restoreEpic(epicId) {
  const payload = await apiFetch(`/epics/${epicId}/restore`, {
    method: "PATCH",
  });
  return payload.data;
}

export async function permanentlyDeleteEpic(epicId) {
  return apiFetch(`/epics/${epicId}/permanent`, {
    method: "DELETE",
  });
}

export async function listEpicSprints(epicId) {
  const payload = await apiFetch(`/epics/${epicId}/sprints`);
  return payload.data;
}

export async function createSprint(epicId, { endDate, goal, startDate, title }) {
  const payload = await apiFetch(`/epics/${epicId}/sprints`, {
    method: "POST",
    body: JSON.stringify({
      name: title,
      goal: goal || null,
      start_date: startDate || null,
      end_date: endDate || null,
      status: "planned",
    }),
  });
  return payload.data;
}

export async function updateSprint(sprintId, updates) {
  const payload = await apiFetch(`/sprints/${sprintId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return payload.data;
}

export async function archiveSprint(sprintId) {
  return apiFetch(`/sprints/${sprintId}`, {
    method: "DELETE",
  });
}

export async function restoreSprint(sprintId) {
  const payload = await apiFetch(`/sprints/${sprintId}/restore`, {
    method: "PATCH",
  });
  return payload.data;
}

export async function permanentlyDeleteSprint(sprintId) {
  return apiFetch(`/sprints/${sprintId}/permanent`, {
    method: "DELETE",
  });
}

export async function listProjectCards(projectId) {
  const payload = await apiFetch(`/projects/${projectId}/cards`);
  return payload.data;
}

export async function listArchivedProjectCards(projectId) {
  const payload = await apiFetch(`/projects/${projectId}/cards/archived`);
  return payload.data;
}

export async function createCard(projectId, { description, epicId, position = 0, status = "backlog", title }) {
  const payload = await apiFetch(`/projects/${projectId}/cards`, {
    method: "POST",
    body: JSON.stringify({
      title,
      description,
      epic_id: epicId ?? null,
      status,
      position,
    }),
  });
  return payload.data;
}

export async function getCard(cardId) {
  const payload = await apiFetch(`/cards/${cardId}`);
  return payload.data;
}

export async function getCardDetail(cardId) {
  const payload = await apiFetch(`/cards/${cardId}/detail`);
  return payload.data;
}

export async function listCommentMentionUsers(cardId) {
  const payload = await apiFetch(`/cards/${cardId}/comments/mention-users`);
  return payload.data;
}

export async function createCardComment(cardId, { attachments = [], body }) {
  const payload = await apiFetch(`/cards/${cardId}/comments`, {
    method: "POST",
    body: JSON.stringify({
      body,
      attachments: attachments.map((attachment) => ({
        file_name: attachment.name,
        file_url: attachment.url,
        file_type: attachment.type || null,
        file_size: attachment.size ?? null,
      })),
    }),
  });
  return payload.data;
}

export async function updateCardComment(commentId, { body }) {
  const payload = await apiFetch(`/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify({ body }),
  });
  return payload.data;
}

export async function deleteCardComment(commentId) {
  return apiFetch(`/comments/${commentId}`, {
    method: "DELETE",
  });
}

export async function createCardLabel(cardId, { color, name }) {
  const payload = await apiFetch(`/cards/${cardId}/labels`, {
    method: "POST",
    body: JSON.stringify({
      name,
      color,
    }),
  });
  return payload.data;
}

export async function deleteCardLabel(labelId) {
  return apiFetch(`/card-labels/${labelId}`, {
    method: "DELETE",
  });
}

export async function createCardMember(cardId, userId) {
  const payload = await apiFetch(`/cards/${cardId}/members`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
  return payload.data;
}

export async function deleteCardMember(memberId) {
  return apiFetch(`/card-members/${memberId}`, {
    method: "DELETE",
  });
}

export async function createCardAttachment(cardId, { fileName, fileSize, fileType, fileUrl }) {
  const payload = await apiFetch(`/cards/${cardId}/attachments`, {
    method: "POST",
    body: JSON.stringify({
      file_name: fileName,
      file_url: fileUrl,
      file_type: fileType || null,
      file_size: fileSize ?? null,
    }),
  });
  return payload.data;
}

export async function deleteCardAttachment(attachmentId) {
  return apiFetch(`/attachments/${attachmentId}`, {
    method: "DELETE",
  });
}

export async function createCardLink(cardId, { relationship, targetCardId }) {
  const payload = await apiFetch(`/cards/${cardId}/links`, {
    method: "POST",
    body: JSON.stringify({
      relationship,
      target_card_id: targetCardId,
    }),
  });
  return payload.data;
}

export async function deleteCardLink(linkId) {
  return apiFetch(`/card-links/${linkId}`, {
    method: "DELETE",
  });
}

export async function updateCard(cardId, updates) {
  const payload = await apiFetch(`/cards/${cardId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return payload.data;
}

export async function moveCard(cardId, updates) {
  const payload = await apiFetch(`/cards/${cardId}/move`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return payload.data;
}

export async function archiveCard(cardId) {
  return apiFetch(`/cards/${cardId}`, {
    method: "DELETE",
  });
}

export async function restoreCard(cardId) {
  const payload = await apiFetch(`/cards/${cardId}/restore`, {
    method: "PATCH",
  });
  return payload.data;
}

export async function permanentlyDeleteCard(cardId) {
  return apiFetch(`/cards/${cardId}/permanent`, {
    method: "DELETE",
  });
}

export async function getProjectDevelopment(projectId) {
  const payload = await apiFetch(`/projects/${projectId}/development`);
  return payload.data;
}

export async function getCardDevelopment(cardId) {
  const payload = await apiFetch(`/cards/${cardId}/development`);
  return payload.data;
}

export async function createCardGitHubLink(cardId, link) {
  const payload = await apiFetch(`/cards/${cardId}/development/github-links`, {
    method: "POST",
    body: JSON.stringify(link),
  });
  return payload.data;
}

export async function updateCardGitHubLink(githubLinkId, link) {
  const payload = await apiFetch(`/development/github-links/${githubLinkId}`, {
    method: "PATCH",
    body: JSON.stringify(link),
  });
  return payload.data;
}

export async function deleteCardGitHubLink(githubLinkId) {
  return apiFetch(`/development/github-links/${githubLinkId}`, {
    method: "DELETE",
  });
}

export async function listGitHubAppInstallations() {
  const payload = await apiFetch("/github/app/installations");
  return payload.data;
}

export async function claimGitHubAppInstallation(installationId) {
  const payload = await apiFetch(`/github/app/installations/${installationId}/claim`, {
    method: "POST",
  });
  return payload.data;
}

export async function disconnectGitHubAppInstallation(installationId) {
  return apiFetch(`/github/app/installations/${installationId}`, {
    method: "DELETE",
  });
}

export async function listNotifications() {
  const payload = await apiFetch("/notifications");
  return payload.data;
}

export async function markNotificationRead(notificationId) {
  const payload = await apiFetch(`/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
  return payload.data;
}

export async function acceptInvitation(invitationId) {
  const payload = await apiFetch(`/invitations/${invitationId}/accept`, {
    method: "PATCH",
  });
  return payload.data;
}

export async function declineInvitation(invitationId) {
  const payload = await apiFetch(`/invitations/${invitationId}/decline`, {
    method: "PATCH",
  });
  return payload.data;
}

export async function createWorkspaceInvitation(workspaceId, { email, role = "member" }) {
  const payload = await apiFetch(`/workspaces/${workspaceId}/invitations`, {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
  return payload.data;
}

export async function createProjectInvitation(projectId, { email }) {
  const payload = await apiFetch(`/projects/${projectId}/invitations`, {
    method: "POST",
    body: JSON.stringify({ email, role: "guest" }),
  });
  return payload.data;
}
