import React from "react";

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
          <button className="invite-members-button" type="button">
            Invite user
          </button>
        </div>

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
