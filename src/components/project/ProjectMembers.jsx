import React, { useState } from "react";

import { createProjectInvitation } from "../../lib/api.js";

function ProjectMemberAvatar({ initials }) {
  return <span className="member-avatar">{initials}</span>;
}

function ProjectMemberRow({ actionLabel, actionTone = "default", member, memberType, role }) {
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
      <button className={`member-row-action ${actionTone === "danger" ? "danger" : ""}`} type="button">
        {actionLabel}
      </button>
    </article>
  );
}

function ProjectMembers({ project, workspace }) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const workspaceMembers = workspace.members ?? [];
  const singleProjectGuests = (workspace.singleBoardGuests ?? []).filter((guest) =>
    guest.projects.includes(project.name)
  );
  const projectGuests = [
    ...workspaceMembers.map((member) => ({
      ...member,
      actionLabel: member.role === "Owner" ? "Leave" : "Remove",
      actionTone: member.role === "Owner" ? "default" : "danger",
      memberType: "Workspace member",
      role: member.role,
    })),
    ...singleProjectGuests.map((guest) => ({
      ...guest,
      actionLabel: "Remove",
      actionTone: "danger",
      memberType: "Single-board member",
    })),
  ];

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
        </div>
        {inviteMessage && <p className="member-form-message">{inviteMessage}</p>}
        {inviteError && <p className="app-error">{inviteError}</p>}

        <div className="member-list">
          {projectGuests.map((guest) => (
            <ProjectMemberRow
              actionLabel={guest.actionLabel}
              actionTone={guest.actionTone}
              member={guest}
              memberType={guest.memberType}
              role={guest.role}
              key={`${guest.memberType}-${guest.id}`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default ProjectMembers;
