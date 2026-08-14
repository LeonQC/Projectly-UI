import React, { useEffect, useRef, useState } from "react";

import { createWorkspaceInvitation, deleteWorkspaceMember, listProjectMembers } from "../../lib/api.js";

function MemberAvatar({ initials }) {
  return <span className="member-avatar">{initials}</span>;
}

function RoleBadge({ role }) {
  return <span className={`member-role-badge ${role.toLowerCase()}`}>{role}</span>;
}

function getInitials(name) {
  return (name || "User")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function WorkspaceMemberRow({ actionLabel, isRemoving, member, onRemove }) {

  return (
    <article className="member-row">
      <div className="member-profile">
        <MemberAvatar initials={member.initials} />
        <div>
          <div className="member-name-line">
            <strong>{member.name}</strong>
            <span>{member.username}</span>
          </div>
          <RoleBadge role={member.role} />
        </div>
      </div>
      <span className="member-type">{member.membership}</span>
      {actionLabel ? (
        <button
          className={`member-row-action ${["Leave", "Remove"].includes(actionLabel) ? "danger" : ""}`}
          type="button"
          disabled={isRemoving}
          onClick={() => onRemove(member)}
        >
          {actionLabel}
        </button>
      ) : (
        <span className="member-row-action-placeholder" />
      )}
    </article>
  );
}

function SingleBoardGuestRow({ guest }) {
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const projectMenuRef = useRef(null);

  useEffect(() => {
    function closeProjectMenuOnOutsideClick(event) {
      if (!projectMenuRef.current || projectMenuRef.current.contains(event.target)) {
        return;
      }

      setIsProjectMenuOpen(false);
    }

    document.addEventListener("mousedown", closeProjectMenuOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeProjectMenuOnOutsideClick);
    };
  }, []);

  return (
    <article className="member-row guest-row">
      <div className="member-profile">
        <MemberAvatar initials={guest.initials} />
        <div className="member-name-line">
          <strong>{guest.name}</strong>
          <span>{guest.username}</span>
        </div>
      </div>
      <span className="member-type">Project guest</span>
      <div className="guest-actions">
        <div className="guest-project-menu" ref={projectMenuRef}>
          <button
            className="member-row-action"
            type="button"
            aria-expanded={isProjectMenuOpen}
            onClick={() => setIsProjectMenuOpen((isOpen) => !isOpen)}
          >
            Projects ({guest.projects.length})
            <svg
              aria-hidden="true"
              className={`chevron-icon ${isProjectMenuOpen ? "is-expanded" : ""}`}
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
          {isProjectMenuOpen && (
            <div className="guest-project-dropdown">
              {guest.projects.map((project) => (
                <button type="button" key={project}>
                  {project}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="add-to-workspace-button" type="button">
          Add to Workspace
        </button>
        <button className="member-row-action danger" type="button">
          Remove
        </button>
      </div>
    </article>
  );
}

function WorkspaceMembers({ currentUserId, onMembersChanged, workspace }) {
  const [activeMemberTab, setActiveMemberTab] = useState("workspace-members");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [removeError, setRemoveError] = useState("");
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [projectGuests, setProjectGuests] = useState([]);
  const [guestError, setGuestError] = useState("");
  const [isLoadingGuests, setIsLoadingGuests] = useState(false);
  const members = workspace.members ?? [];
  const currentMember = members.find((member) => String(member.id) === String(currentUserId));
  const currentUserIsOwner = currentMember?.role?.toLowerCase() === "owner";

  useEffect(() => {
    let isMounted = true;

    async function loadProjectGuests() {
      if (activeMemberTab !== "single-project-guests") {
        return;
      }

      setIsLoadingGuests(true);
      setGuestError("");
      try {
        const projectMemberGroups = await Promise.all(
          (workspace.projects ?? []).map(async (project) => ({
            project,
            members: await listProjectMembers(project.id),
          }))
        );
        const guestsByUserId = new Map();

        projectMemberGroups.forEach(({ project, members: projectMembers }) => {
          projectMembers
            .filter((member) => member.membership_type === "project_guest")
            .forEach((member) => {
              const userId = member.user?.id ?? member.id;
              const name = member.user?.username || member.user?.email || `User ${userId ?? ""}`.trim();
              const existingGuest = guestsByUserId.get(userId);
              const projectName = project.name;

              if (existingGuest) {
                existingGuest.projects.push(projectName);
                return;
              }

              guestsByUserId.set(userId, {
                id: userId,
                initials: getInitials(name),
                name,
                username: member.user?.email ?? `@user-${userId ?? "unknown"}`,
                projects: [projectName],
              });
            });
        });

        if (isMounted) {
          setProjectGuests(Array.from(guestsByUserId.values()));
        }
      } catch (error) {
        if (isMounted) {
          setGuestError(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoadingGuests(false);
        }
      }
    }

    loadProjectGuests();

    return () => {
      isMounted = false;
    };
  }, [activeMemberTab, workspace.projects]);

  function getMemberActionLabel(member) {
    const isCurrentUser = String(member.id) === String(currentUserId);

    if (currentUserIsOwner) {
      return isCurrentUser ? "" : "Remove";
    }

    return isCurrentUser ? "Leave" : "";
  }

  async function sendWorkspaceInvitation(event) {
    event.preventDefault();
    const email = inviteEmail.trim();

    if (!email) {
      return;
    }

    setInviteMessage("");
    setInviteError("");
    setIsSendingInvite(true);
    try {
      await createWorkspaceInvitation(workspace.id, { email });
      setInviteEmail("");
      setInviteMessage("Workspace invitation sent.");
    } catch (error) {
      setInviteError(error.message);
    } finally {
      setIsSendingInvite(false);
    }
  }

  async function removeWorkspaceMember(member) {
    const memberId = member.workspaceMemberId ?? member.id;

    if (!memberId) {
      setRemoveError("Workspace member id is missing");
      return;
    }

    setInviteMessage("");
    setInviteError("");
    setRemoveError("");
    setRemovingMemberId(memberId);
    try {
      await deleteWorkspaceMember(memberId);
      await onMembersChanged?.();
    } catch (error) {
      setRemoveError(error.message);
    } finally {
      setRemovingMemberId(null);
    }
  }

  return (
    <div className="workspace-members-page">
      <nav className="member-tabs" aria-label="Workspace member sections">
        <button
          className={`member-tab ${activeMemberTab === "workspace-members" ? "is-active" : ""}`}
          type="button"
          onClick={() => setActiveMemberTab("workspace-members")}
        >
          Workspace members
        </button>
        <button
          className={`member-tab ${activeMemberTab === "single-project-guests" ? "is-active" : ""}`}
          type="button"
          onClick={() => setActiveMemberTab("single-project-guests")}
        >
          Single-project guests
        </button>
      </nav>

      {activeMemberTab === "workspace-members" ? (
        <section className="member-section" aria-label="Workspace members">
          <p className="member-description">
            Workspace members can access this workspace and manage projects according to their role.
          </p>
          <div className="member-toolbar">
            <input type="search" placeholder="Filter by name" aria-label="Filter workspace members by name" />
            <form className="member-invite-form" onSubmit={sendWorkspaceInvitation}>
              <input
                type="email"
                placeholder="Invite by email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
              <button className="invite-members-button" type="submit" disabled={isSendingInvite || !inviteEmail.trim()}>
                Invite workspace members
              </button>
            </form>
          </div>
          {inviteMessage && <p className="member-form-message">{inviteMessage}</p>}
          {inviteError && <p className="app-error">{inviteError}</p>}
          {removeError && <p className="app-error">{removeError}</p>}
          <div className="member-list">
            {members.map((member) => (
              <WorkspaceMemberRow
                actionLabel={getMemberActionLabel(member)}
                isRemoving={removingMemberId === (member.workspaceMemberId ?? member.id)}
                member={member}
                key={member.workspaceMemberId ?? member.id}
                onRemove={removeWorkspaceMember}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="member-section" aria-label="Single-project guests">
          <p className="member-description">
            Single-project guests are members of only one Workspace project. Guests can only view and edit
            the projects to which they've been added.
          </p>
          <div className="member-toolbar">
            <input type="search" placeholder="Filter by name" aria-label="Filter single-project guests by name" />
          </div>
          {guestError && <p className="app-error">{guestError}</p>}
          <div className="member-list">
            {isLoadingGuests ? (
              <p className="empty-state">Loading project guests...</p>
            ) : projectGuests.length > 0 ? (
              projectGuests.map((guest) => (
                <SingleBoardGuestRow guest={guest} key={guest.id} />
              ))
            ) : (
              <p className="empty-state">No single-project guests yet.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default WorkspaceMembers;
