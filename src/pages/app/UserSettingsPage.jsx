import React, { useEffect, useRef, useState } from "react";

import {
  claimGitHubAppInstallation,
  disconnectGitHubAppInstallation,
  listGitHubAppInstallations,
  updateEmail,
  updateUsername,
  updateUserTheme,
} from "../../lib/api.js";

const themeOptions = ["Light mode", "Dark mode", "System preference"];
const themeStorageKey = "projectly-theme";
const githubAppInstallUrl = import.meta.env.VITE_GITHUB_APP_INSTALL_URL ?? "";
const themeLabels = {
  light: "Light mode",
  dark: "Dark mode",
  system: "System preference",
};
const themeValues = {
  "Light mode": "light",
  "Dark mode": "dark",
  "System preference": "system",
};

function getStoredTheme(fallbackTheme) {
  const storedTheme = window.localStorage.getItem(themeStorageKey);

  return themeOptions.includes(storedTheme) ? storedTheme : fallbackTheme;
}

function getUserThemeLabel(theme) {
  return themeLabels[theme] ?? theme;
}

function UserSettingsPage({ onUserUpdated, user }) {
  const [username, setUsername] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [selectedTheme, setSelectedTheme] = useState(() =>
    getStoredTheme(getUserThemeLabel(user.theme ?? "system"))
  );
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const [themeMessage, setThemeMessage] = useState("");
  const [themeError, setThemeError] = useState("");
  const [githubInstallations, setGithubInstallations] = useState([]);
  const [githubMessage, setGithubMessage] = useState("");
  const [githubError, setGithubError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [isLoadingGithub, setIsLoadingGithub] = useState(false);
  const [disconnectingGithubInstallationId, setDisconnectingGithubInstallationId] = useState(null);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef(null);

  useEffect(() => {
    setUsername(user.name ?? "");
    setEmail(user.email ?? "");
    setSelectedTheme(getStoredTheme(getUserThemeLabel(user.theme ?? "system")));
  }, [user.email, user.name, user.theme]);

  useEffect(() => {
    const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme() {
      const resolvedTheme =
        selectedTheme === "System preference"
          ? systemThemeQuery.matches
            ? "dark"
            : "light"
          : selectedTheme === "Dark mode"
            ? "dark"
            : "light";

      document.documentElement.dataset.theme = resolvedTheme;
    }

    applyTheme();
    window.localStorage.setItem(themeStorageKey, selectedTheme);
    systemThemeQuery.addEventListener("change", applyTheme);

    return () => {
      systemThemeQuery.removeEventListener("change", applyTheme);
    };
  }, [selectedTheme]);

  useEffect(() => {
    function closeThemeMenu(event) {
      if (!themeMenuRef.current || themeMenuRef.current.contains(event.target)) {
        return;
      }

      setIsThemeMenuOpen(false);
    }

    document.addEventListener("mousedown", closeThemeMenu);

    return () => {
      document.removeEventListener("mousedown", closeThemeMenu);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadGithubInstallations() {
      setIsLoadingGithub(true);
      setGithubError("");
      try {
        const installations = await listGitHubAppInstallations();
        if (isMounted) {
          setGithubInstallations(installations ?? []);
        }
      } catch (error) {
        if (isMounted) {
          setGithubError(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoadingGithub(false);
        }
      }
    }

    async function claimInstallationIfNeeded() {
      const searchParams = new URLSearchParams(window.location.search);
      const installationId = searchParams.get("github_installation_id");

      if (!installationId) {
        await loadGithubInstallations();
        return;
      }

      setIsLoadingGithub(true);
      setGithubMessage("");
      setGithubError("");
      try {
        await claimGitHubAppInstallation(installationId);
        const installations = await listGitHubAppInstallations();
        if (isMounted) {
          setGithubInstallations(installations ?? []);
          setGithubMessage("GitHub connected.");
          window.history.replaceState({}, "", "/settings");
        }
      } catch (error) {
        if (isMounted) {
          setGithubError(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoadingGithub(false);
        }
      }
    }

    claimInstallationIfNeeded();

    return () => {
      isMounted = false;
    };
  }, []);

  async function saveProfile() {
    const nextUsername = username.trim();

    if (!nextUsername) {
      setProfileError("Username is required");
      return;
    }

    setProfileMessage("");
    setProfileError("");
    setIsSavingProfile(true);
    try {
      const updatedUser = await updateUsername(nextUsername);
      onUserUpdated?.(updatedUser);
      setProfileMessage("Profile saved.");
    } catch (error) {
      setProfileError(error.message);
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function saveEmail() {
    const nextEmail = email.trim();

    if (!nextEmail) {
      setEmailError("Email is required");
      return;
    }

    setEmailMessage("");
    setEmailError("");
    setIsSavingEmail(true);
    try {
      const updatedUser = await updateEmail(nextEmail);
      onUserUpdated?.(updatedUser);
      setEmailMessage("Email updated.");
    } catch (error) {
      setEmailError(error.message);
    } finally {
      setIsSavingEmail(false);
    }
  }

  async function saveTheme(themeOption) {
    setSelectedTheme(themeOption);
    setIsThemeMenuOpen(false);
    setThemeMessage("");
    setThemeError("");
    setIsSavingTheme(true);
    try {
      const updatedUser = await updateUserTheme(themeValues[themeOption]);
      onUserUpdated?.(updatedUser);
      setThemeMessage("Theme saved.");
    } catch (error) {
      setThemeError(error.message);
    } finally {
      setIsSavingTheme(false);
    }
  }

  function connectGithubApp() {
    if (!githubAppInstallUrl) {
      setGithubError("GitHub App install URL is not configured.");
      return;
    }

    window.location.href = githubAppInstallUrl;
  }

  async function disconnectGithubApp(installationId) {
    setGithubMessage("");
    setGithubError("");
    setDisconnectingGithubInstallationId(installationId);
    try {
      await disconnectGitHubAppInstallation(installationId);
      const installations = await listGitHubAppInstallations();
      setGithubInstallations(installations ?? []);
      setGithubMessage("GitHub disconnected.");
    } catch (error) {
      setGithubError(error.message);
    } finally {
      setDisconnectingGithubInstallationId(null);
    }
  }

  return (
    <section className="app-content" aria-labelledby="user-settings-title">
      <header className="page-header">
        <div>
          <h1 id="user-settings-title">User Settings</h1>
        </div>
      </header>

      <div className="user-settings-page">
        <section className="settings-panel">
          <h2>Profile</h2>
          <p>Update your avatar and username shown across workspaces and projects.</p>

          <div className="profile-avatar-row">
            <span className="profile-avatar">{user.initials}</span>
          </div>

          <label className="settings-field">
            Username
            <input type="text" value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>

          {profileMessage && <p className="member-form-message">{profileMessage}</p>}
          {profileError && <p className="app-error">{profileError}</p>}
          <div className="settings-actions">
            <button className="settings-save-button" type="button" disabled={isSavingProfile} onClick={saveProfile}>
              {isSavingProfile ? "Saving..." : "Save profile"}
            </button>
          </div>
        </section>

        <section className="settings-panel user-email-panel">
          <div>
            <h2>Email</h2>
            <p>Used for login, notifications, and workspace invitations.</p>
            <label className="settings-field user-email-field">
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            {emailMessage && <p className="member-form-message">{emailMessage}</p>}
            {emailError && <p className="app-error">{emailError}</p>}
          </div>
          <button className="settings-save-button" type="button" disabled={isSavingEmail} onClick={saveEmail}>
            {isSavingEmail ? "Saving..." : "Change email"}
          </button>
        </section>

        <section className="settings-panel">
          <h2>Theme</h2>
          <p>Choose how the app should appear.</p>

          <div className="theme-dropdown" ref={themeMenuRef}>
            <button
              className="settings-save-button theme-dropdown-trigger"
              type="button"
              aria-expanded={isThemeMenuOpen}
              onClick={() => setIsThemeMenuOpen((isOpen) => !isOpen)}
            >
              {selectedTheme}
              <svg
                aria-hidden="true"
                className="theme-dropdown-chevron"
                fill="none"
                height="14"
                viewBox="0 0 24 24"
                width="14"
              >
                <path
                  d="m6 9 6 6 6-6"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </button>

            {isThemeMenuOpen && (
              <div className="theme-dropdown-menu" role="menu">
                {themeOptions.map((themeOption) => (
                  <button
                    className={selectedTheme === themeOption ? "is-selected" : ""}
                    key={themeOption}
                    type="button"
                    role="menuitem"
                    disabled={isSavingTheme}
                    onClick={() => saveTheme(themeOption)}
                  >
                    <span>{themeOption}</span>
                    {selectedTheme === themeOption && (
                      <svg
                        aria-hidden="true"
                        className="theme-option-check"
                        fill="none"
                        height="16"
                        viewBox="0 0 24 24"
                        width="16"
                      >
                        <path
                          d="m5 12 4 4 10-10"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.4"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {themeMessage && <p className="member-form-message">{themeMessage}</p>}
          {themeError && <p className="app-error">{themeError}</p>}
        </section>

        <section className="settings-panel">
          <h2>GitHub Integration</h2>
          <p>Connect GitHub so Projectly can show repository, pull request, commit, and webhook event data.</p>

          {isLoadingGithub ? (
            <p>Checking GitHub connection...</p>
          ) : githubInstallations.length > 0 ? (
            <div className="github-installation-list">
              {githubInstallations.map((installation) => (
                <article className="github-installation-item" key={installation.id}>
                  <div>
                    <strong>{installation.account_login || "GitHub account"}</strong>
                    <span>{installation.account_type || "GitHub App installation"}</span>
                  </div>
                  <div className="github-installation-actions">
                    <span className="github-installation-status">Connected</span>
                    <button
                      className="settings-disconnect-button"
                      type="button"
                      disabled={disconnectingGithubInstallationId === installation.installation_id}
                      onClick={() => disconnectGithubApp(installation.installation_id)}
                    >
                      {disconnectingGithubInstallationId === installation.installation_id ? "Disconnecting..." : "Disconnect"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="github-connect-settings">
              <p>No GitHub App installation connected yet.</p>
              {!githubAppInstallUrl && <p className="app-error">Missing VITE_GITHUB_APP_INSTALL_URL.</p>}
            </div>
          )}

          {githubMessage && <p className="member-form-message">{githubMessage}</p>}
          {githubError && <p className="app-error">{githubError}</p>}
          <div className="settings-actions">
            <button
              className="settings-save-button"
              type="button"
              disabled={!githubAppInstallUrl || isLoadingGithub}
              onClick={connectGithubApp}
            >
              {githubInstallations.length > 0 ? "Connect another GitHub account" : "Connect GitHub"}
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}

export default UserSettingsPage;
