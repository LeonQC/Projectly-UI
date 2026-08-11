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
