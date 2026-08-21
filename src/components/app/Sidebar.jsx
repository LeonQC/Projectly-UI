import React, { useEffect, useRef, useState } from "react";

import { searchWorkspace } from "../../lib/api.js";
import CreateWorkspaceModal from "../workspace/CreateWorkspaceModal.jsx";

function WorkspaceNavGroup({
  activePage,
  onOpenWorkspaceProjects,
  title,
  workspaces,
  children,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const activeWorkspaceId = activePage.workspaceId;

  useEffect(() => {
    if (workspaces.some((workspace) => workspace.id === activeWorkspaceId)) {
      setIsExpanded(true);
    }
  }, [activeWorkspaceId, workspaces]);

  return (
    <section className="sidebar-section" aria-label={title}>
      <div className="sidebar-section-header">
        <h2 className="sidebar-section-title">{title}</h2>

        <button
          className="section-toggle-button"
          type="button"
          aria-label={`${isExpanded ? "Collapse" : "Expand"} ${title}`}
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          <svg
            aria-hidden="true"
            className={`chevron-icon ${isExpanded ? "is-expanded" : ""}`}
            fill="none"
            height="16"
            viewBox="0 0 24 24"
            width="16"
          >
            <path
              d="m9 6 6 6-6 6"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="workspace-list">
          {workspaces.map((workspace) => (
            <button
              className={`workspace-item ${
                activeWorkspaceId === workspace.id ? "is-active" : ""
              }`}
              type="button"
              key={workspace.id}
              onClick={() => onOpenWorkspaceProjects(workspace.id)}
            >
              <span className="workspace-icon">{workspace.name.charAt(0)}</span>

              <span>{workspace.name}</span>
            </button>
          ))}

          {children}
        </div>
      )}
    </section>
  );
}

function Sidebar({
  activePage,
  archivedWorkspaces = [],
  guestWorkspaces = [],
  inboxUnreadCount = 0,
  onCreateWorkspace,
  onLogout,
  onOpenAllProjects,
  onOpenArchivedProjects,
  onOpenCard,
  onOpenInbox,
  onOpenProject,
  onOpenUserSettings,
  onOpenWorkspaceProjects,
  showArchivedWorkspace = true,
  user,
  workspaces,
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState("workspace");
  const [includeArchivedSearch, setIncludeArchivedSearch] = useState(false);
  const [projectSearchResults, setProjectSearchResults] = useState([]);
  const [cardResults, setCardResults] = useState([]);
  const [commentSearchResults, setCommentSearchResults] = useState([]);
  const [githubEventSearchResults, setGithubEventSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  const activeWorkspaceId = activePage.workspaceId;

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const searchableWorkspaces = includeArchivedSearch
    ? [
        ...workspaces,
        ...archivedWorkspaces.map((workspace) => ({
          ...workspace,
          archived: true,
        })),
      ]
    : workspaces;

  const scopedWorkspaces =
    searchScope === "all"
      ? searchableWorkspaces
      : searchableWorkspaces.filter(
          (workspace) => String(workspace.id) === String(activeWorkspaceId),
        );

  const workspaceResults = scopedWorkspaces.filter((workspace) =>
    workspace.name.toLowerCase().includes(normalizedSearchQuery),
  );

  useEffect(() => {
    function closeMenuOnOutsideClick(event) {
      if (!userMenuRef.current || userMenuRef.current.contains(event.target)) {
        return;
      }

      setIsUserMenuOpen(false);
    }

    document.addEventListener("mousedown", closeMenuOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeMenuOnOutsideClick);
    };
  }, []);

  useEffect(() => {
    function closeSearchOnOutsideClick(event) {
      if (!searchRef.current || searchRef.current.contains(event.target)) {
        return;
      }

      setIsSearchOpen(false);
    }

    document.addEventListener("mousedown", closeSearchOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeSearchOnOutsideClick);
    };
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();

    if (!query || (searchScope === "workspace" && !activeWorkspaceId)) {
      setProjectSearchResults([]);
      setCardResults([]);
      setCommentSearchResults([]);
      setGithubEventSearchResults([]);
      setSearchError("");
      setIsSearching(false);
      return;
    }

    let isCancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        setSearchError("");

        const result = await searchWorkspace(
          searchScope === "all" ? null : activeWorkspaceId,
          query,
          10,
          searchScope,
          includeArchivedSearch,
        );

        if (isCancelled) {
          return;
        }

        setProjectSearchResults(result.projects ?? []);
        setCardResults(result.cards ?? []);
        setCommentSearchResults(result.comments ?? []);
        setGithubEventSearchResults(result.github_events ?? []);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setProjectSearchResults([]);
        setCardResults([]);
        setCommentSearchResults([]);
        setGithubEventSearchResults([]);

        setSearchError(
          error instanceof Error ? error.message : "Unable to search.",
        );
      } finally {
        if (!isCancelled) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [activeWorkspaceId, includeArchivedSearch, searchQuery, searchScope]);

  function closeSearch() {
    setIsSearchOpen(false);
    setSearchQuery("");
    setProjectSearchResults([]);
    setCardResults([]);
    setCommentSearchResults([]);
    setGithubEventSearchResults([]);
    setSearchError("");
    setIsSearching(false);
  }

  function formatSearchDate(value) {
    if (!value) {
      return "";
    }

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  function searchNeedsWorkspaceMessage() {
    return searchScope === "workspace" && !activeWorkspaceId;
  }

  return (
    <aside className="app-sidebar">
      <div className="sidebar-user" ref={userMenuRef}>
        <span className="user-avatar">{user.initials}</span>

        <span className="user-name">{user.name}</span>

        <button
          className="icon-button"
          type="button"
          aria-label="Open user menu"
          aria-expanded={isUserMenuOpen}
          onClick={() => setIsUserMenuOpen((isOpen) => !isOpen)}
        >
          ...
        </button>

        <button
          className="icon-button sidebar-search-action"
          type="button"
          aria-label="Search workspaces, projects, and cards"
          aria-expanded={isSearchOpen}
          onClick={() => setIsSearchOpen((isOpen) => !isOpen)}
        >
          <svg
            aria-hidden="true"
            className="icon-svg"
            fill="none"
            height="16"
            viewBox="0 0 24 24"
            width="16"
          >
            <path
              d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>

        {isSearchOpen && (
          <div className="sidebar-search-panel" ref={searchRef}>
            <label className="sidebar-search-field">
              <span>Search</span>

              <input
                type="search"
                placeholder="Search workspaces, projects, or cards"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                autoFocus
              />
            </label>

            <div className="sidebar-search-scope" aria-label="Search scope">
              <button
                className={searchScope === "workspace" ? "is-active" : ""}
                type="button"
                onClick={() => setSearchScope("workspace")}
              >
                Current workspace
              </button>

              <button
                className={searchScope === "all" ? "is-active" : ""}
                type="button"
                onClick={() => setSearchScope("all")}
              >
                All workspaces
              </button>
            </div>

            <label className="sidebar-search-archived-toggle">
              <input
                type="checkbox"
                checked={includeArchivedSearch}
                onChange={(event) =>
                  setIncludeArchivedSearch(event.target.checked)
                }
              />
              <span>Include archived</span>
            </label>

            <div className="sidebar-search-results">
              <section>
                <h3>Workspaces</h3>

                {workspaceResults.length > 0 ? (
                  workspaceResults.map((workspace) => (
                    <button
                      type="button"
                      key={workspace.id}
                      onClick={() => {
                        onOpenWorkspaceProjects(workspace.id);
                        closeSearch();
                      }}
                    >
                      <span className="search-result-type">Workspace</span>

                      <strong>{workspace.name}</strong>
                      {workspace.archived ? (
                        <span className="search-result-badge">Archived</span>
                      ) : null}
                    </button>
                  ))
                ) : (
                  <p>No matching workspaces.</p>
                )}
              </section>

              <section>
                <h3>Projects</h3>

                {searchNeedsWorkspaceMessage() ? (
                  <p>Open a workspace to search projects.</p>
                ) : !normalizedSearchQuery ? (
                  <p>Type to search projects.</p>
                ) : isSearching ? (
                  <p>Searching projects...</p>
                ) : searchError ? (
                  <p>{searchError}</p>
                ) : projectSearchResults.length > 0 ? (
                  projectSearchResults.map((project) => (
                    <button
                      type="button"
                      key={project.id}
                      onClick={() => {
                        onOpenProject(project.id);
                        closeSearch();
                      }}
                    >
                      <span className="search-result-type">
                        {project.workspace_name}
                      </span>

                      <strong>{project.name}</strong>
                      {project.archived || project.workspace_archived ? (
                        <span className="search-result-badge">Archived</span>
                      ) : null}
                      {project.description ? (
                        <span className="search-result-snippet">
                          {project.description}
                        </span>
                      ) : null}
                    </button>
                  ))
                ) : (
                  <p>No matching projects.</p>
                )}
              </section>

              <section>
                <h3>Cards</h3>

                {searchNeedsWorkspaceMessage() ? (
                  <p>Open a workspace to search cards.</p>
                ) : !normalizedSearchQuery ? (
                  <p>Type to search cards.</p>
                ) : isSearching ? (
                  <p>Searching cards...</p>
                ) : searchError ? (
                  <p>{searchError}</p>
                ) : cardResults.length > 0 ? (
                  cardResults.map((card) => (
                    <button
                      type="button"
                      key={card.id}
                      onClick={() => {
                        onOpenCard(card);
                        closeSearch();
                      }}
                    >
                      <span className="search-result-type">
                        {card.display_id ?? "Card"}
                      </span>

                      <strong>{card.title}</strong>
                      {card.archived ||
                      card.project_archived ||
                      card.workspace_archived ? (
                        <span className="search-result-badge">Archived</span>
                      ) : null}
                      {card.status ? (
                        <span className="search-result-snippet">
                          Status: {card.status}
                        </span>
                      ) : null}
                      {card.label_names ? (
                        <span className="search-result-snippet">
                          Labels: {card.label_names}
                        </span>
                      ) : null}
                    </button>
                  ))
                ) : (
                  <p>No matching cards.</p>
                )}
              </section>

              <section>
                <h3>Comments</h3>

                {searchNeedsWorkspaceMessage() ? (
                  <p>Open a workspace to search comments.</p>
                ) : !normalizedSearchQuery ? (
                  <p>Type to search comments.</p>
                ) : isSearching ? (
                  <p>Searching comments...</p>
                ) : searchError ? (
                  <p>{searchError}</p>
                ) : commentSearchResults.length > 0 ? (
                  commentSearchResults.map((comment) => (
                    <button
                      type="button"
                      key={comment.id}
                      onClick={() => {
                        onOpenCard({
                          id: comment.card_id,
                          workspace_id: comment.workspace_id,
                          project_id: comment.project_id,
                          focus: "comments",
                          commentId: comment.id,
                        });
                        closeSearch();
                      }}
                    >
                      <span className="search-result-type">
                        {comment.card_title}
                      </span>

                      <strong>{comment.body}</strong>
                      {comment.card_archived ||
                      comment.project_archived ||
                      comment.workspace_archived ? (
                        <span className="search-result-badge">Archived</span>
                      ) : null}
                      <span className="search-result-snippet">
                        {comment.author_name}
                        {comment.created_at
                          ? ` · ${formatSearchDate(comment.created_at)}`
                          : ""}
                      </span>
                    </button>
                  ))
                ) : (
                  <p>No matching comments.</p>
                )}
              </section>

              <section>
                <h3>GitHub Events</h3>

                {searchNeedsWorkspaceMessage() ? (
                  <p>Open a workspace to search GitHub events.</p>
                ) : !normalizedSearchQuery ? (
                  <p>Type to search GitHub events.</p>
                ) : isSearching ? (
                  <p>Searching GitHub events...</p>
                ) : searchError ? (
                  <p>{searchError}</p>
                ) : githubEventSearchResults.length > 0 ? (
                  githubEventSearchResults.map((event) => (
                    <button
                      type="button"
                      key={event.id}
                      onClick={() => {
                        onOpenCard({
                          id: event.card_id,
                          workspace_id: event.workspace_id,
                          project_id: event.project_id,
                          focus: "development",
                          githubEventId: event.id,
                        });
                        closeSearch();
                      }}
                    >
                      <span className="search-result-type">
                        {event.repo_full_name ??
                          [event.repo_owner, event.repo_name]
                            .filter(Boolean)
                            .join("/")}
                      </span>

                      <strong>
                        {event.title || event.message || event.event_type}
                      </strong>
                      {event.card_archived ||
                      event.project_archived ||
                      event.workspace_archived ? (
                        <span className="search-result-badge">Archived</span>
                      ) : null}
                      <span className="search-result-snippet">
                        {[
                          event.card_title,
                          event.sender_login,
                          event.created_at
                            ? formatSearchDate(event.created_at)
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </button>
                  ))
                ) : (
                  <p>No matching GitHub events.</p>
                )}
              </section>
            </div>
          </div>
        )}

        {isUserMenuOpen && (
          <div className="user-menu" role="menu">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onOpenUserSettings();
                setIsUserMenuOpen(false);
              }}
            >
              Settings
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onLogout();
                setIsUserMenuOpen(false);
              }}
            >
              Log out
            </button>
          </div>
        )}
      </div>

      <nav className="sidebar-primary-nav" aria-label="Main navigation">
        <button
          className={`sidebar-primary-item ${
            activePage.name === "inbox" ? "is-active" : ""
          }`}
          type="button"
          onClick={onOpenInbox}
        >
          <span>Inbox</span>

          {inboxUnreadCount > 0 && (
            <span
              className="sidebar-unread-badge"
              aria-label={`${inboxUnreadCount} unread notifications`}
            >
              {inboxUnreadCount > 99 ? "99+" : inboxUnreadCount}
            </span>
          )}
        </button>

        <button
          className={`sidebar-primary-item ${
            activePage.name === "all-projects" ? "is-active" : ""
          }`}
          type="button"
          onClick={onOpenAllProjects}
        >
          All Projects
        </button>
      </nav>

      <WorkspaceNavGroup
        activePage={activePage}
        onOpenWorkspaceProjects={onOpenWorkspaceProjects}
        title="YOUR WORKSPACES"
        workspaces={workspaces}
      >
        {showArchivedWorkspace && (
          <button
            className={`workspace-item archived-workspace-item ${
              activePage.name === "archived-workspace" ? "is-active" : ""
            }`}
            type="button"
            onClick={onOpenArchivedProjects}
          >
            <span className="workspace-icon">D</span>

            <span>Archived Workspace</span>
          </button>
        )}

        <button
          className="create-workspace-button"
          type="button"
          onClick={() => setIsCreatingWorkspace(true)}
        >
          + Create new workspace
        </button>
      </WorkspaceNavGroup>

      {isCreatingWorkspace && (
        <CreateWorkspaceModal
          onClose={() => setIsCreatingWorkspace(false)}
          onCreate={onCreateWorkspace}
        />
      )}
    </aside>
  );
}

export default Sidebar;
