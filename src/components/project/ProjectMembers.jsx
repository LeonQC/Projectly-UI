import React, { useEffect, useState } from "react";

import { createProjectInvitation, deleteProjectMember, listProjectMembers } from "../../lib/api.js";

function ProjectMemberAvatar({ initials }) {
  return <span className="member-avatar">{initials}</span>;
}

function ProjectMemberRow({ actionLabel, actionTone = "default", member, memberType, onAction, role }) {
  return (
    <article className="member-row">
      <div className="member-profile">
        <ProjectMemberAvatar initials={member.initials} />
        <div>
          <div className="member-name-line">
            <strong>{member.name}</strong>
            <span>{member.username}</span>
          </div>
          {role && <span className={`member-role-badge ${role.toLowerCase()}`}>{role}</span>}
        </div>
      </div>
      <span className="member-type">{memberType}</span>
      {actionLabel ? (
        <button
          className={`member-row-action ${actionTone === "danger" ? "danger" : ""}`}
          type="button"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : (
        <span className="member-row-action-placeholder" />
      )}
    </article>
  );
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

function formatProjectMember(member, currentUserId, canRemoveProjectGuests) {
  const name = member.user?.username || member.user?.email || `User ${member.user?.id ?? ""}`.trim();
  const normalizedRole = member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : "Member";
  const role = member.membership_type === "project_guest" ? "Guest" : normalizedRole;
  const userId = member.user?.id ?? member.id;
  const isCurrentUser = String(userId) === String(currentUserId);
  const canActOnGuest = member.membership_type === "project_guest" && (isCurrentUser || canRemoveProjectGuests);

  return {
    id: userId,
    projectMemberId: member.id,
    initials: getInitials(name),
    name,
    username: member.user?.email ?? `@user-${member.user?.id ?? "unknown"}`,
    actionLabel: canActOnGuest ? (isCurrentUser ? "Leave" : "Remove") : "",
    actionTone: canActOnGuest ? "danger" : "default",
    memberType: member.membership_type === "project_guest" ? "Project guest" : "Workspace member",
    role,
  };
}

function ProjectMembers({ currentUserId, project }) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);
  const [canManageProjectGuests, setCanManageProjectGuests] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProjectMembers() {
      setIsLoadingMembers(true);
      setInviteError("");
      try {
        const members = await listProjectMembers(project.id);
        if (isMounted) {
          const currentMember = members.find(
            (member) => String(member.user?.id) === String(currentUserId)
          );
          const canRemoveProjectGuests =
            currentMember?.membership_type === "workspace" &&
            ["admin", "owner"].includes(currentMember.role);
          setCanManageProjectGuests(canRemoveProjectGuests);
          setProjectMembers(
            members.map((member) => formatProjectMember(member, currentUserId, canRemoveProjectGuests))
          );
        }
      } catch (error) {
        if (isMounted) {
          setInviteError(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoadingMembers(false);
        }
      }
    }

    loadProjectMembers();

    return () => {
      isMounted = false;
    };
  }, [currentUserId, project.id]);

  async function removeProjectMember(member) {
    if (!member.projectMemberId) {
      return;
    }

    setInviteMessage("");
    setInviteError("");
    try {
      await deleteProjectMember(member.projectMemberId);
      setProjectMembers((currentMembers) =>
        currentMembers.filter((currentMember) => currentMember.projectMemberId !== member.projectMemberId)
      );
      setInviteMessage(member.actionLabel === "Leave" ? "You left this project." : "Project guest removed.");
    } catch (error) {
      setInviteError(error.message);
    }
  }

  async function sendProjectInvitation(event) {
    event.preventDefault();
    const email = inviteEmail.trim();

    if (!email) {
      return;
    }

    setInviteMessage("");
    setInviteError("");
    setIsSendingInvite(true);
    try {
      await createProjectInvitation(project.id, { email });
      setInviteEmail("");
      setInviteMessage("Project invitation sent.");
    } catch (error) {
      setInviteError(error.message);
    } finally {
      setIsSendingInvite(false);
    }
  }

  return (
    <div className="workspace-members-page">
      <section className="member-section project-member-section" aria-label="Project members">
        <div className="project-member-header">
          <div>
            <h2>Project guests</h2>
            <p className="member-description">
              Manage all users who can access this project, including workspace members and single-board members.
            </p>
          </div>
          {canManageProjectGuests && (
            <form className="member-invite-form" onSubmit={sendProjectInvitation}>
              <input
                type="email"
                placeholder="Invite by email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
              <button className="invite-members-button" type="submit" disabled={isSendingInvite || !inviteEmail.trim()}>
                Invite user
              </button>
            </form>
          )}
        </div>
        {inviteMessage && <p className="member-form-message">{inviteMessage}</p>}
        {inviteError && <p className="app-error">{inviteError}</p>}

        <div className="member-list">
          {isLoadingMembers ? (
            <p className="empty-state">Loading project members...</p>
          ) : (
            projectMembers.map((member) => (
              <ProjectMemberRow
                actionLabel={member.actionLabel}
                actionTone={member.actionTone}
                member={member}
                memberType={member.memberType}
                onAction={() => removeProjectMember(member)}
                role={member.role}
                key={`${member.memberType}-${member.id}`}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default ProjectMembers;
