import React from "react";

function shortenSha(sha) {
  return sha ? sha.slice(0, 7) : "";
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

function getEventTitle(event) {
  if (event.title) {
    return event.title;
  }

  if (event.message) {
    return event.message.split("\n")[0];
  }

  return event.event_type === "pull_request" ? "Pull request event" : "GitHub event";
}

function getEventLabel(event) {
  if (event.event_type === "pull_request") {
    return event.action ? `Pull request ${event.action}` : "Pull request";
  }

  if (event.event_type === "push") {
    return "Push";
  }

  return event.event_type.replaceAll("_", " ");
}

function getEventMeta(event) {
  return [
    event.repo_owner && event.repo_name ? `${event.repo_owner}/${event.repo_name}` : "",
    event.branch_name ? `branch ${event.branch_name}` : "",
    event.pull_request_number ? `pull request #${event.pull_request_number}` : "",
    event.commit_sha ? `commit ${shortenSha(event.commit_sha)}` : "",
    event.sender_login ? `by ${event.sender_login}` : "",
    formatDateTime(event.created_at),
  ].filter(Boolean).join(" · ");
}

function ProjectDevelopmentCard({ item, onOpenCard }) {
  const { card, events = [] } = item;

  return (
    <article className="project-development-card">
      <header>
        <button type="button" onClick={() => onOpenCard(card)}>
          {card.title}
        </button>
        <span>{card.status.replaceAll("_", " ")}</span>
      </header>

      <div className="project-development-content">
        <div className="project-development-summary">
          <span>{events.length} events</span>
        </div>

        {events.length > 0 ? (
          <div className="project-development-list">
            <h3>GitHub events</h3>
            {events.map((event) => (
              <a
                href={event.url || `https://github.com/${event.repo_owner}/${event.repo_name}`}
                target="_blank"
                rel="noreferrer"
                key={event.id}
              >
                <strong>{getEventLabel(event)} · {getEventTitle(event)}</strong>
                <span>{getEventMeta(event)}</span>
              </a>
            ))}
          </div>
        ) : (
          <p className="project-development-empty">No GitHub events for this card yet.</p>
        )}
      </div>
    </article>
  );
}

function ProjectDevelopment({ development, isLoading, onOpenCard }) {
  const cards = development?.cards ?? [];

  if (isLoading) {
    return (
      <div className="project-development-page">
        <p className="empty-state">Loading GitHub events...</p>
      </div>
    );
  }

  return (
    <div className="project-development-page">
      {cards.length > 0 ? (
        cards.map((item) => (
          <ProjectDevelopmentCard item={item} onOpenCard={onOpenCard} key={item.card.id} />
        ))
      ) : (
        <p className="empty-state">No GitHub events for this project yet.</p>
      )}
    </div>
  );
}

export default ProjectDevelopment;
